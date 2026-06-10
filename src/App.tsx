/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Printer,
  RotateCcw,
  Check,
  CheckCircle2,
  Circle,
  AlertTriangle,
  FileText,
  BarChart3,
  PieChart,
  Activity,
  UserCheck,
  Trash2,
  Milestone,
  RefreshCw,
  Clock,
  CheckSquare,
  ShieldCheck,
  Building2,
  AlertCircle,
  Upload,
  Paperclip,
  SkipForward,
  Globe,
  LogIn,
  LogOut,
  Lock,
  User
} from "lucide-react";
import {
  FullDashboardState,
  MonthlyStatisticRow,
  PROJECT_NAMES,
  MONTH_NAMES,
  SVR_CATEGORIES,
  ProjectId
} from "./types";
import { defaultDashboardState, emptyDashboardState } from "./initialData";

const translateViToEn = async (text: string): Promise<string> => {
  if (!text.trim()) return "";
  // Check if it contains Vietnamese accents/diacritics or non-english chars
  const hasViAccents = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text);
  if (!hasViAccents) return text; // already english or no accents
  
  try {
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=vi|en`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.responseData && data.responseData.translatedText) {
        return data.responseData.translatedText;
      }
    }
  } catch (error) {
    console.error("Translation error:", error);
  }
  return text;
};

interface TranslateButtonProps {
  value: string;
  onTranslated: (newValue: string) => void;
  className?: string;
}

const TranslateButton: React.FC<TranslateButtonProps> = ({ value, onTranslated, className = "" }) => {
  const [translating, setTranslating] = useState(false);
  
  const handleTranslate = async () => {
    if (!value.trim()) return;
    setTranslating(true);
    const translated = await translateViToEn(value);
    onTranslated(translated);
    setTranslating(false);
  };

  const hasViAccents = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(value);
  if (!hasViAccents || !value.trim()) return null;

  return (
    <button
      type="button"
      onClick={handleTranslate}
      disabled={translating}
      className={`inline-flex items-center gap-1 text-[10px] font-bold text-brand-blue hover:text-[#152e74] bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded cursor-pointer transition ${className}`}
      title="Dịch nội dung sang tiếng Anh / Translate wordings to English"
    >
      <Globe className="w-3 h-3 text-brand-blue" />
      <span>{translating ? "Translating..." : "Translate to EN / Dịch Anh"}</span>
    </button>
  );
};

declare global {
  interface Window {
    Chart: any;
  }
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<{ username: string; role: "admin" | "reporter" } | null>(() => {
    const savedUser = localStorage.getItem("handong_hse_user_v1");
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        console.error("Failed to parse cached user session", e);
      }
    }
    return null;
  });

  const [adminComments, setAdminComments] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem("handong_hse_admin_comments_v1");
    try {
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [approvedProjects, setApprovedProjects] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem("handong_hse_approved_projects_v1");
    try {
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [synthesizerName, setSynthesizerName] = useState<string>(() => {
    return localStorage.getItem("handong_hse_synthesizer_name_v1") || "GENERAL HSE MANAGER (ADMIN)";
  });

  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    const savedActive = localStorage.getItem("handong_hse_active_project_v3");
    return savedActive || "GP";
  });

  // Dynamic Projects list state
  const [projects, setProjects] = useState<{ id: string; name: string; status: "On-going" | "Pending" | "Finish" }[]>(() => {
    const saved = localStorage.getItem("handong_hse_projects_v4");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse cached projects list", e);
      }
    }
    // Default initial projects from static PROJECT_NAMES with "On-going" status
    return PROJECT_NAMES.map(p => ({
      id: p.id,
      name: p.name,
      status: "On-going" as "On-going" | "Pending" | "Finish"
    }));
  });

  // State to manage new project addition form
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProjId, setNewProjId] = useState("");
  const [newProjName, setNewProjName] = useState("");
  const [projToAddError, setProjToAddError] = useState("");

  // Login screen form states
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const activeBoardProjects = projects.filter(p => p.status !== "Finish");

  const handleAddProject = () => {
    setProjToAddError("");
    const cleanedId = newProjId.trim().toUpperCase();
    const cleanedName = newProjName.trim();

    if (!cleanedId) {
      setProjToAddError("Project code / Mã dự án cannot be empty.");
      return;
    }
    if (!cleanedName) {
      setProjToAddError("Project name / Tên dự án cannot be empty.");
      return;
    }
    if (projects.some(p => p.id === cleanedId)) {
      setProjToAddError(`Project code "${cleanedId}" already exists / Mã dự án đã tồn tại.`);
      return;
    }

    const newProj = {
      id: cleanedId,
      name: cleanedName,
      status: "On-going" as const
    };

    const updatedProjects = [...projects, newProj];
    setProjects(updatedProjects);
    localStorage.setItem("handong_hse_projects_v4", JSON.stringify(updatedProjects));

    setProjectStates(prevAll => {
      const copy = JSON.parse(JSON.stringify(emptyDashboardState));
      copy.header.projectName = cleanedName;
      
      // Synchronize latest consolidated data from active project
      const activeState = prevAll[activeProjectId] || emptyDashboardState;
      copy.svrAnalysis.projectCounts = { ...(activeState.svrAnalysis?.projectCounts || {}) };
      copy.svrAnalysis.categoryCounts = { ...(activeState.svrAnalysis?.categoryCounts || {}) };
      copy.manhourStats.monthlyData = JSON.parse(JSON.stringify(activeState.manhourStats?.monthlyData || emptyDashboardState.manhourStats.monthlyData));
      
      return {
        ...prevAll,
        [cleanedId]: copy
      };
    });

    setActiveProjectId(cleanedId);
    setNewProjId("");
    setNewProjName("");
    setShowAddProject(false);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    const user = loginUsername.trim();
    const pass = loginPassword.trim();

    if (!user || !pass) {
      setLoginError("Please enter both username and password. / Vui lòng nhập cả tài khoản và mật khẩu.");
      return;
    }

    const userLower = user.toLowerCase();
    if (
      (userLower === "hd ho hsse" || userLower === "admin") &&
      (pass === "HSSE@2026" || pass === "admin")
    ) {
      const session = { username: "HD HO HSSE", role: "admin" as const };
      localStorage.setItem("handong_hse_user_v1", JSON.stringify(session));
      setCurrentUser(session);
      setLoginUsername("");
      setLoginPassword("");
    } else if (
      (userLower === "hd site safety team" || userLower === "reporter") &&
      (pass === "HD@2026" || pass === "reporter")
    ) {
      const session = { username: "HD Site Safety Team", role: "reporter" as const };
      localStorage.setItem("handong_hse_user_v1", JSON.stringify(session));
      setCurrentUser(session);
      setLoginUsername("");
      setLoginPassword("");
    } else {
      setLoginError("Invalid username or password. / Tài khoản hoặc mật khẩu không đúng.");
    }
  };

  const handleQuickLogin = (role: "admin" | "reporter") => {
    setLoginError("");
    if (role === "admin") {
      setLoginUsername("HD HO HSSE");
      setLoginPassword("HSSE@2026");
      const session = { username: "HD HO HSSE", role: "admin" as const };
      localStorage.setItem("handong_hse_user_v1", JSON.stringify(session));
      setCurrentUser(session);
    } else {
      setLoginUsername("HD Site Safety Team");
      setLoginPassword("HD@2026");
      const session = { username: "HD Site Safety Team", role: "reporter" as const };
      localStorage.setItem("handong_hse_user_v1", JSON.stringify(session));
      setCurrentUser(session);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("handong_hse_user_v1");
    setCurrentUser(null);
    setViewMode("edit");
  };

  const [projectStates, setProjectStates] = useState<Record<string, FullDashboardState>>(() => {
    const saved = localStorage.getItem("handong_hse_multi_project_data_v3");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          const keys = Object.keys(parsed);
          if (keys.length > 0 && parsed[keys[0]].header && parsed[keys[0]].kpis) {
            return parsed;
          }
        }
      } catch (e) {
        console.error("Failed to parse cached multi-project state", e);
      }
    }

    // Seed multi project state with realistic initial metrics for key projects so the master table is live
    const initialStates: Record<string, FullDashboardState> = {};
    PROJECT_NAMES.forEach((p) => {
      if (p.id === "GP") {
        initialStates[p.id] = JSON.parse(JSON.stringify(defaultDashboardState));
      } else if (p.id === "DC") {
        const copy = JSON.parse(JSON.stringify(emptyDashboardState));
        copy.header.projectName = p.name;
        copy.header.completed = true;
        copy.header.reporterName = "Tran Minh DC";
        copy.kpis = {
          totalSafeHoursFromStart: 1250000,
          totalSafeHoursYTD: 520000,
          totalSafeHoursMonth: 120000,
          nearmiss: 3,
          firstAid: 1,
          accidents: 0,
          fatalities: 0,
          reporterName: "Tran Minh DC",
          completed: true,
        };
        copy.safetyPractices = {
          images: [
            {
              id: "img-dc-1",
              title: "Scaffolding Safety Standards / Kỹ thuật giàn giáo an toàn tốt",
              projectName: p.name,
              imageUrl: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=600&q=80",
              description: "Double safety harness hooked securely to dynamic lifelines during active structural inspection.",
              date: "2026-04-14",
              category: "measures"
            },
            {
              id: "img-dc-2",
              title: "Inspection Walkthrough with Subcontractors / Tuần tra giám sát",
              projectName: p.name,
              imageUrl: "https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?auto=format&fit=crop&w=600&q=80",
              description: "HSE officers inspecting base support brackets of exterior cranes.",
              date: "2026-04-15",
              category: "inspection"
            }
          ],
          completed: true
        };
        initialStates[p.id] = copy;
      } else if (p.id === "BEN_TRE_HOSPITAL") {
        const copy = JSON.parse(JSON.stringify(emptyDashboardState));
        copy.header.projectName = p.name;
        copy.header.completed = true;
        copy.header.reporterName = "Le Van Tre";
        copy.kpis = {
          totalSafeHoursFromStart: 890000,
          totalSafeHoursYTD: 310000,
          totalSafeHoursMonth: 78000,
          nearmiss: 2,
          firstAid: 1,
          accidents: 1,
          fatalities: 0,
          reporterName: "Le Van Tre",
          completed: true,
        };
        copy.safetyPractices = {
          images: [
            {
              id: "img-bt-1",
              title: "Fire Safety Audit / Phòng cháy chữa cháy đạt chuẩn",
              projectName: p.name,
              imageUrl: "https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=600&q=80",
              description: "Checking pressure metrics and deployment stations regularly inside temporary warehouse zones.",
              date: "2026-04-20",
              category: "inspection"
            },
            {
              id: "img-bt-2",
              title: "On-Site HSE First Aid Drill / Diễn tập sơ cấp cứu",
              projectName: p.name,
              imageUrl: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80",
              description: "Practicing fast heat-stroke recovery protocols and temporary splints for deep basement teams.",
              date: "2026-04-22",
              category: "training"
            }
          ],
          completed: true
        };
        initialStates[p.id] = copy;
      } else {
        const copy = JSON.parse(JSON.stringify(emptyDashboardState));
        copy.header.projectName = p.name;
        initialStates[p.id] = copy;
      }
    });

    // Synchronize initial projectCounts across all projects so they can immediately see each other's SVR numbers
    const gpProjectCounts = initialStates["GP"]?.svrAnalysis?.projectCounts || {};
    Object.keys(initialStates).forEach(projId => {
      if (initialStates[projId]) {
        if (!initialStates[projId].svrAnalysis) {
          initialStates[projId].svrAnalysis = {
            categoryCounts: {
              behaviorsPpe: 0, lifting: 0, excavation: 0, workingAtHeight: 0, scaffoldStructure: 0,
              housekeeping: 0, electrical: 0, equipment: 0, fireExplosion: 0, permitToWork: 0,
              management: 0, others: 0
            },
            projectCounts: {},
            reporterName: "",
            completed: false
          };
        }
        initialStates[projId].svrAnalysis.projectCounts = { ...gpProjectCounts };
      }
    });

    return initialStates;
  });

  // Get active project state
  const state = projectStates[activeProjectId] || emptyDashboardState;

  // Active project pictures metrics for Section 5 validation
  const activeProjectName = projects.find(p => p.id === activeProjectId)?.name || activeProjectId;
  const activeProjectStatus = projects.find(p => p.id === activeProjectId)?.status || "On-going";
  const activeProjectImages = (state.safetyPractices?.images || []).filter(img => {
    return img.projectName.toUpperCase().includes(activeProjectId.toUpperCase()) ||
           img.projectName.toUpperCase().includes(activeProjectName.toUpperCase());
  });
  const activeProjectImagesCount = activeProjectImages.length;
  const hasRequiredImages = activeProjectImagesCount >= 1;
  const isSkipped = !!state.safetyPractices?.skipped;
  const isPendingOrFinished = activeProjectStatus === "Pending" || activeProjectStatus === "Finish";
  const canSignOff = hasRequiredImages || isSkipped || isPendingOrFinished;

  // Custom proxy setState to preserve compatibility with existing inputs
  const setState = (updater: FullDashboardState | ((prev: FullDashboardState) => FullDashboardState)) => {
    setProjectStates((prevAll) => {
      const current = prevAll[activeProjectId] || JSON.parse(JSON.stringify(emptyDashboardState));
      const next = typeof updater === "function" ? updater(current) : updater;
      
      const newStates = {
        ...prevAll,
        [activeProjectId]: next,
      };

      // Propagate consolidated fields: manhourStats.monthlyData, svrAnalysis.projectCounts, svrAnalysis.categoryCounts to ALL other project states
      Object.keys(newStates).forEach((projId) => {
        if (projId !== activeProjectId && newStates[projId]) {
          newStates[projId] = {
            ...newStates[projId],
            manhourStats: {
              ...(newStates[projId].manhourStats || { completed: false, reporterName: "" }),
              monthlyData: JSON.parse(JSON.stringify(next.manhourStats.monthlyData))
            },
            svrAnalysis: {
              ...(newStates[projId].svrAnalysis || { categoryCounts: {}, projectCounts: {}, reporterName: "", completed: false }),
              projectCounts: { ...next.svrAnalysis.projectCounts },
              categoryCounts: { ...next.svrAnalysis.categoryCounts }
            }
          };
        }
      });

      return newStates;
    });
  };

  const [activeTab, setActiveTab] = useState<string>("section-1");
  const [lastSaved, setLastSaved] = useState<string>("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"edit" | "summary">("edit");

  // Section 5 addition states
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [justAddedFeedback, setJustAddedFeedback] = useState<string | null>(null);
  const [newImgTitle, setNewImgTitle] = useState("");
  const [newImgProj, setNewImgProj] = useState(activeProjectId);
  const [newImgDesc, setNewImgDesc] = useState("");
  const [newImgDate, setNewImgDate] = useState("2026-06-03");
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [newImgCat, setNewImgCat] = useState<"measures" | "inspection" | "training">("measures");

  // State to track upload progress of report documents for Section 2 incidents
  const [incidentUploadProgress, setIncidentUploadProgress] = useState<Record<string, number | null>>({});

  const simulateIncidentUpload = (type: "nearmiss" | "firstAid" | "accidents" | "fatalities", file: File) => {
    setIncidentUploadProgress(prev => ({ ...prev, [type]: 10 }));
    const interval = setInterval(() => {
      setIncidentUploadProgress(prev => {
        const current = prev[type];
        if (current === null || current === undefined) {
          clearInterval(interval);
          return prev;
        }
        if (current >= 100) {
          clearInterval(interval);
          
          setState(statePrev => {
            const keys = {
              nearmiss: { attachment: "nearmissAttachment", fileName: "nearmissFileName" },
              firstAid: { attachment: "firstAidAttachment", fileName: "firstAidFileName" },
              accidents: { attachment: "accidentsAttachment", fileName: "accidentsFileName" },
              fatalities: { attachment: "fatalitiesAttachment", fileName: "fatalitiesFileName" },
            };
            const config = keys[type];
            return {
              ...statePrev,
              kpis: {
                ...statePrev.kpis,
                [config.attachment]: `/reports/${encodeURIComponent(file.name)}`,
                [config.fileName]: file.name
              }
            };
          });
          return { ...prev, [type]: null };
        }
        return { ...prev, [type]: current + 30 };
      });
    }, 150);
  };

  // Sync newImgProj when activeProjectId changes
  useEffect(() => {
    setNewImgProj(activeProjectId);
  }, [activeProjectId]);

  // Chart configuration refs
  const donutChartRef = useRef<HTMLCanvasElement | null>(null);
  const barChartRef = useRef<HTMLCanvasElement | null>(null);
  const donutChartInstance = useRef<any>(null);
  const barChartInstance = useRef<any>(null);

  // Auto-save debounced to localStorage with robust self-healing quota handling
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem("handong_hse_multi_project_data_v3", JSON.stringify(projectStates));
        localStorage.setItem("handong_hse_active_project_v3", activeProjectId);
        const now = new Date();
        setLastSaved(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
        setSaveError(null);
      } catch (err: any) {
        console.error("Auto-save failed due to storage quota limits:", err);
        
        // Self-healing recovery: prune photos to instantly free up space
        try {
          const optimizedStates = { ...projectStates };
          Object.keys(optimizedStates).forEach(projId => {
            const prjState = { ...optimizedStates[projId] };
            if (prjState?.safetyPractices?.images) {
              const maxImagesToKeep = (projId === activeProjectId) ? 4 : 1;
              const imagesList = prjState.safetyPractices.images;
              if (imagesList.length > maxImagesToKeep) {
                prjState.safetyPractices = {
                  ...prjState.safetyPractices,
                  images: imagesList.slice(-maxImagesToKeep)
                };
                optimizedStates[projId] = prjState;
              }
            }
          });
          
          localStorage.setItem("handong_hse_multi_project_data_v3", JSON.stringify(optimizedStates));
          localStorage.setItem("handong_hse_active_project_v3", activeProjectId);
          setProjectStates(optimizedStates);
          
          const now = new Date();
          setLastSaved(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
          setSaveError("Dung lượng đầy - Đã tự động tối ưu hóa / Workspace auto-saved & recovered by pruning older draft photographs.");
        } catch (innerErr: any) {
          setSaveError("Dung lượng trình duyệt đầy / Browser Storage full: Please delete some photographs or press 'RESET FORM / XÓA BÁO CÁO' to proceed.");
        }
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [projectStates, activeProjectId]);

  // Handle Chart Rendering
  useEffect(() => {
    // Only render chart if elements are present on screen
    const windowChart = window.Chart;
    if (!windowChart) return;

    // Render Donut Chart
    if (donutChartRef.current) {
      if (donutChartInstance.current) {
        donutChartInstance.current.destroy();
      }

      const counts = state.svrAnalysis.categoryCounts;
      const dataValues = SVR_CATEGORIES.map(cat => counts[cat.id as keyof typeof counts] || 0);
      const totalSvr = dataValues.reduce((a, b) => a + b, 0);

      // If all is zero, show empty placeholders
      const chartData = totalSvr > 0 ? dataValues : SVR_CATEGORIES.map(() => 1);
      const bgColors = [
        "#1B3A8C", "#2E5FD9", "#3B82F6", "#60A5FA",
        "#10B981", "#059669", "#FBBF24", "#D97706",
        "#EF4444", "#DC2626", "#8B5CF6", "#EC4899"
      ];

      donutChartInstance.current = new windowChart(donutChartRef.current, {
        type: "doughnut",
        data: {
          labels: SVR_CATEGORIES.map(cat => cat.labelEn),
          datasets: [{
            data: chartData,
            backgroundColor: bgColors,
            borderWidth: 2,
            borderColor: "#ffffff"
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "right",
              labels: {
                boxWidth: 12,
                font: {
                  family: "'Inter', sans-serif",
                  size: 11
                },
                color: "#1e293b"
              }
            },
            tooltip: {
              callbacks: {
                label: function (context: any) {
                  if (totalSvr === 0) return `${context.label}: 0 (0%)`;
                  const val = dataValues[context.dataIndex];
                  const pct = ((val / totalSvr) * 100).toFixed(1);
                  return `${context.label}: ${val} (${pct}%)`;
                }
              }
            }
          }
        }
      });
    }

    // Render Bar Chart
    if (barChartRef.current) {
      if (barChartInstance.current) {
        barChartInstance.current.destroy();
      }

      const pCounts = state.svrAnalysis.projectCounts;
      const barLabels = activeBoardProjects.map(p => p.id);
      const barData = activeBoardProjects.map(p => pCounts[p.id] || 0);

      barChartInstance.current = new windowChart(barChartRef.current, {
        type: "bar",
        data: {
          labels: barLabels,
          datasets: [{
            label: "SVRs Issued",
            data: barData,
            backgroundColor: "#2E5FD9",
            borderColor: "#1B3A8C",
            borderWidth: 1,
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                precision: 0,
                color: "#64748b"
              },
              grid: {
                color: "#f1f5f9"
              }
            },
            x: {
              ticks: {
                font: {
                  size: 9,
                  weight: "bold"
                },
                color: "#64748b"
              },
              grid: {
                display: false
              }
            }
          },
          plugins: {
            legend: {
              display: false
            }
          }
        }
      });
    }

    return () => {
      if (donutChartInstance.current) donutChartInstance.current.destroy();
      if (barChartInstance.current) barChartInstance.current.destroy();
    };
  }, [state.svrAnalysis.categoryCounts, state.svrAnalysis.projectCounts, viewMode, activeTab]);

  // Calculations for Section 3 Table Row-by-Row
  const calculatedRows = state.manhourStats.monthlyData.map((row) => {
    const monthlyTotalManhours = (Object.values(row.manhoursByProject) as number[]).reduce((sum, h) => sum + (h || 0), 0);
    return {
      ...row,
      monthlyTotalManhours
    };
  });

  // Calculate Cumulative values row by row
  let accWorkHours = 0;
  let accSafeWorkHours = 0;
  let accLti = 0;
  let accFatality = 0;
  let accMtc = 0;

  const rowsWithCumulative = calculatedRows.map((row) => {
    accWorkHours += row.monthlyTotalManhours;
    accLti += row.ltiCount || 0;
    accFatality += row.fatalityCount || 0;
    accMtc += row.mtcCount || 0;

    // Running Total Accident Free Manhours
    // Reset to 0 if a Fatality or LTI occurs in this month. Otherwise accumulate.
    if ((row.fatalityCount || 0) > 0 || (row.ltiCount || 0) > 0) {
      accSafeWorkHours = 0;
    } else {
      accSafeWorkHours += row.monthlyTotalManhours;
    }

    const currentSafeHours = accSafeWorkHours;
    const ltiTotal = accLti;
    const fatalityTotal = accFatality;
    const mtcTotal = accMtc;

    // LTIFR = (fatalities + accidents) x 200,000 / month safe hours
    const ltifr = accWorkHours > 0 ? ((fatalityTotal + ltiTotal) * 200000) / accWorkHours : 0;

    // All Recordable = Fatality + LTI + MTC for the month
    const allRecordable = (row.fatalityCount || 0) + (row.ltiCount || 0) + (row.mtcCount || 0);
    const cumulativeAllRecordable = fatalityTotal + ltiTotal + mtcTotal;

    // TRIFR = (All Recordable Cumulative * 1,000,000) / Total Manhours
    const trifr = accWorkHours > 0 ? (cumulativeAllRecordable * 1000000) / accWorkHours : 0;

    return {
      ...row,
      ltiTotal,
      ltifr,
      allRecordable,
      trifr,
      currentSafeHours,
      accWorkHours
    };
  });

  // Grand totals of section 3
  const totalYtdManhours = rowsWithCumulative.reduce((sum, r) => sum + r.monthlyTotalManhours, 0);
  const totalYtdFatality = rowsWithCumulative.reduce((sum, r) => sum + (r.fatalityCount || 0), 0);
  const totalYtdLti = rowsWithCumulative.reduce((sum, r) => sum + (r.ltiCount || 0), 0);
  const totalYtdDaysLost = rowsWithCumulative.reduce((sum, r) => sum + (r.daysLost || 0), 0);
  const totalYtdMtc = rowsWithCumulative.reduce((sum, r) => sum + (r.mtcCount || 0), 0);
  const totalYtdFirstAid = rowsWithCumulative.reduce((sum, r) => sum + (r.firstAidCount || 0), 0);
  const totalYtdNearmiss = rowsWithCumulative.reduce((sum, r) => sum + (r.nearmissCount || 0), 0);
  const totalYtdSvrIssued = rowsWithCumulative.reduce((sum, r) => sum + (r.svrIssuedCount || 0), 0);

  const currentSafeHoursYTD = rowsWithCumulative.length > 0 ? rowsWithCumulative[rowsWithCumulative.length - 1].currentSafeHours : 0;
  const calculatedLtifrYtd = totalYtdManhours > 0 ? ((totalYtdFatality + totalYtdLti) * 200000) / totalYtdManhours : 0;
  const calculatedTrifrYtd = totalYtdManhours > 0 ? ((totalYtdFatality + totalYtdLti + totalYtdMtc) * 1000000) / totalYtdManhours : 0;

  // Sync auto-calcs to section 2 KPI values if not manual
  const displayLtifr = state.kpis.ltifrManual
    ? parseFloat(state.kpis.ltifrOverrideValue) || 0
    : calculatedLtifrYtd;

  const displayTrifr = state.kpis.trifrManual
    ? parseFloat(state.kpis.trifrOverrideValue) || 0
    : calculatedTrifrYtd;

  // Progress Bar calculator (5 main sections)
  const completedCount = [
    state.header.completed,
    state.kpis.completed,
    state.manhourStats.completed,
    state.svrAnalysis.completed,
    state.safetyPractices?.completed || isPendingOrFinished
  ].filter(Boolean).length;
  const completionPercentage = (completedCount / 5) * 100;

  // SVR categories calculations
  const svrCategoriesSum = SVR_CATEGORIES.reduce((sum, cat) => {
    return sum + (state.svrAnalysis.categoryCounts[cat.id as keyof typeof state.svrAnalysis.categoryCounts] || 0);
  }, 0);

  // SVR by project calculation
  const svrByProjectSum = activeBoardProjects.reduce((sum, p) => {
    return sum + (state.svrAnalysis.projectCounts[p.id] || 0);
  }, 0);

  // Form Reset Trigger
  const handleReset = () => {
    const copy = JSON.parse(JSON.stringify(emptyDashboardState));
    copy.header.projectName = projects.find(p => p.id === activeProjectId)?.name || activeProjectId;
    setState(copy);
    setShowResetConfirm(false);
    setActiveTab("section-1");
    setViewMode("edit");
  };

  const loadSampleData = () => {
    const copy = JSON.parse(JSON.stringify(defaultDashboardState));
    copy.header.projectName = projects.find(p => p.id === activeProjectId)?.name || activeProjectId;
    setState(copy);
    setActiveTab("section-1");
  };

  const addSafetyImage = () => {
    if (!newImgTitle.trim()) return;
    
    const newImg = {
      id: "img-" + Date.now(),
      title: newImgTitle,
      projectName: projects.find(p => p.id === newImgProj)?.name || newImgProj,
      imageUrl: uploadedUrl || "",
      description: newImgDesc,
      date: newImgDate,
      category: newImgCat
    };

    setState(prev => {
      const currentImages = prev.safetyPractices?.images || [];
      return {
        ...prev,
        safetyPractices: {
          ...prev.safetyPractices || { completed: false },
          images: [...currentImages, newImg],
          skipped: false
        }
      };
    });

    // Reset input fields
    setNewImgTitle("");
    setNewImgDesc("");
    setUploadedUrl("");
  };

  const deleteSafetyImage = (id: string) => {
    setState(prev => {
      const currentImages = prev.safetyPractices?.images || [];
      return {
        ...prev,
        safetyPractices: {
          ...prev.safetyPractices || { completed: false },
          images: currentImages.filter(img => img.id !== id)
        }
      };
    });
  };

  const resetToSampleSafetyImages = () => {
    setState(prev => ({
      ...prev,
      safetyPractices: {
        images: [
          {
            id: "img-1",
            title: "PPE Inspection / Kiểm tra trang bị bảo hộ",
            projectName: "GEM PARK (GP)",
            imageUrl: "https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?auto=format&fit=crop&w=600&q=80",
            description: "100% full PPE compliance checked daily at Site Entrance. Công nhân được kiểm tra mũ bảo hộ, đai an toàn và kính bảo vệ trước khi vào công trường.",
            date: "2026-04-10",
            category: "measures"
          },
          {
            id: "img-2",
            title: "Working at Height Fall Protection / An toàn làm việc trên cao",
            projectName: "DIAMOND CITY (DC)",
            imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80",
            description: "Double lanyard safety harness attached safely to static lifeline for fall prevention. Lắp đặt lưới hứng rơi và dây cứu sinh liên tục cho thợ giàn giáo.",
            date: "2026-04-14",
            category: "measures"
          },
          {
            id: "img-3",
            title: "Fire Safety Audit & Hot Work Control / Phòng cháy chữa cháy",
            projectName: "BEN TRE HOSPITAL",
            imageUrl: "https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=600&q=80",
            description: "Weekly extinguishers check and fire station deployment training in hot work zone. Huấn luyện thực hành chữa cháy định kỳ cho đội an toàn cơ sở tháng này.",
            date: "2026-04-20",
            category: "inspection"
          },
          {
            id: "img-4",
            title: "Daily safety toolbox meeting addressing high risks / Họp an toàn đầu giờ",
            projectName: "SYCAMORE B14",
            imageUrl: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80",
            description: "15-minute daily briefings addressing risk analysis on deep excavation zone. Chia sẻ rủi ro trước khi vào ca làm việc tại hố móng sâu.",
            date: "2026-04-25",
            category: "training"
          }
        ],
        completed: true
      }
    }));
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      simulateUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      simulateUpload(e.target.files[0]);
    }
  };

  const simulateUpload = (file: File) => {
    setUploadProgress(15);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target && event.target.result) {
        const originalBase64 = event.target.result as string;
        
        // Downscale and compress image to keep space in LocalStorage minimal
        const imgObj = new Image();
        imgObj.src = originalBase64;
        imgObj.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          
          let width = imgObj.width;
          let height = imgObj.height;
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          let base64Url = originalBase64;
          if (ctx) {
            ctx.drawImage(imgObj, 0, 0, width, height);
            base64Url = canvas.toDataURL("image/jpeg", 0.7);
          }
          
          let progress = 15;
          const interval = setInterval(() => {
            progress += 30;
            if (progress >= 100) {
              clearInterval(interval);
              setUploadProgress(null);
              setUploadedUrl(base64Url);

              // Automatically save the image into selected category as requested
              const rawTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ").trim();
              const cleanTitle = rawTitle ? rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1) : "Safe Photo";
              
              const categoryLabel = newImgCat === "measures" 
                ? "Biện pháp an toàn / Safety measures" 
                : newImgCat === "inspection" 
                  ? "Hình ảnh kiểm tra / Inspection" 
                  : "Huấn luyện & Toolbox / Training & Toolbox";

              const newImg = {
                id: "img-" + Date.now(),
                title: newImgTitle.trim() || cleanTitle,
                projectName: projects.find(p => p.id === newImgProj)?.name || newImgProj,
                imageUrl: base64Url,
                description: newImgDesc.trim() || `Hình ảnh thực tế đạt chuẩn an toàn vệ sinh lao động - đăng ký tại phân nhóm: ${categoryLabel}.`,
                date: newImgDate || new Date().toISOString().split('T')[0],
                category: newImgCat
              };

              setState(prev => {
                const currentImages = prev.safetyPractices?.images || [];
                return {
                  ...prev,
                  safetyPractices: {
                    ...prev.safetyPractices || { completed: false },
                    images: [...currentImages, newImg],
                    skipped: false
                  }
                };
              });

              // Set user-friendly feedback state
              setJustAddedFeedback(cleanTitle);
              setTimeout(() => setJustAddedFeedback(null), 5000);

              // Reset temp text inputs, but keep newImgProj & newImgCat
              setNewImgTitle("");
              setNewImgDesc("");
              setUploadedUrl("");
            } else {
              setUploadProgress(progress);
            }
          }, 80);
        };
        imgObj.onerror = () => {
          // Fallback to original Base64 if loading image fails
          setUploadProgress(null);
          setUploadedUrl(originalBase64);
        };
      }
    };
    reader.onerror = () => {
      setUploadProgress(null);
    };
    reader.readAsDataURL(file);
  };

  // State update helpers for deep tables
  const updateManhours = (rowIndex: number, pId: string, value: number) => {
    setState(prev => {
      const activeMonthIndex = MONTH_NAMES.findIndex(m => m.id === prev.header.month);
      const updatedRows = [...prev.manhourStats.monthlyData];
      updatedRows[rowIndex] = {
        ...updatedRows[rowIndex],
        manhoursByProject: {
          ...updatedRows[rowIndex].manhoursByProject,
          [pId]: value
        }
      };

      let newKpis = { ...prev.kpis };
      if (rowIndex === activeMonthIndex) {
        // Automatically link Section 3's manhour for active project directly to Section 2's Monthly Safe Hours
        const newMonthTotal = updatedRows[rowIndex].manhoursByProject[activeProjectId] || 0;
        const oldVal = prev.kpis.totalSafeHoursMonth || 0;
        const delta = newMonthTotal - oldVal;

        newKpis = {
          ...prev.kpis,
          totalSafeHoursMonth: newMonthTotal,
          totalSafeHoursYTD: Math.max(0, (prev.kpis.totalSafeHoursYTD || 0) + delta),
          totalSafeHoursFromStart: Math.max(0, (prev.kpis.totalSafeHoursFromStart || 0) + delta)
        };
      }

      return {
        ...prev,
        kpis: newKpis,
        manhourStats: {
          ...prev.manhourStats,
          monthlyData: updatedRows
        }
      };
    });
  };

  const updateStatsRowField = (rowIndex: number, field: string, value: number) => {
    setState(prev => {
      const activeMonthIndex = MONTH_NAMES.findIndex(m => m.id === prev.header.month);
      const updatedRows = [...prev.manhourStats.monthlyData];
      updatedRows[rowIndex] = {
        ...updatedRows[rowIndex],
        [field]: value
      };

      let newKpis = { ...prev.kpis };
      if (rowIndex === activeMonthIndex) {
        const fieldMapReverse: Record<string, string> = {
          nearmissCount: "nearmiss",
          firstAidCount: "firstAid",
          ltiCount: "accidents",
          fatalityCount: "fatalities"
        };
        const kpiKey = fieldMapReverse[field];
        if (kpiKey) {
          (newKpis as any)[kpiKey] = value;
        }
      }

      return {
        ...prev,
        kpis: newKpis,
        manhourStats: {
          ...prev.manhourStats,
          monthlyData: updatedRows
        }
      };
    });
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-[#1B3A8C] via-[#2E5FD9] to-[#1e346e] p-4 text-slate-800 font-sans">
        <div className="w-full max-w-sm bg-white border border-slate-100/80 rounded-2xl shadow-2xl p-6 flex flex-col gap-5 relative overflow-hidden transition-all">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-blue-500 to-emerald-500"></div>
          
          <div className="flex flex-col items-center text-center mt-2">
            <div className="w-12 h-12 bg-[#1B3A8C] flex items-center justify-center rounded-xl shadow-lg border border-white/12 mb-3 shrink-0">
              <span className="text-white font-sans font-black text-2xl">H</span>
            </div>
            <h1 className="text-sm font-black text-[#1B3A8C] uppercase tracking-wider leading-tight">
              HANDONG E&C
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
              HSE Compliance Platform
            </p>
            <div className="h-[1px] w-12 bg-slate-200 my-3"></div>
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              HSE System Login / Đăng nhập hệ thống
            </h2>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            {loginError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 text-[11px] p-3 rounded-lg font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Username / Tài khoản
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <User className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  required
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="admin or reporter"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1B3A8C] transition text-slate-800"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Password / Mật khẩu
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock className="w-3.5 h-3.5" />
                </span>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1B3A8C] transition text-slate-800"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#1B3A8C] hover:bg-[#2044a3] text-white rounded-lg text-xs font-black uppercase tracking-wider transition shadow flex items-center justify-center gap-1.5 cursor-pointer mt-1"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In / Đăng Nhập</span>
            </button>
          </form>

          {/* DEMO ACCOUNTS QUICK LOGIN PANEL */}
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <span className="text-[9px] text-center font-bold text-slate-400 uppercase tracking-widest block">
              Official accounts / Tài khoản truy cập:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("reporter")}
                className="p-2.5 bg-blue-50/50 hover:bg-blue-100/70 border border-blue-100 rounded-lg text-left hover:border-blue-300 transition-all text-[#1B3A8C] cursor-pointer"
              >
                <div className="flex items-center gap-1 font-sans font-black text-[10px] text-[#2E5FD9] tracking-tight uppercase">
                  <User className="w-3 h-3 shrink-0" />
                  <span>Reporter (L1)</span>
                </div>
                <div className="text-[9px] text-slate-700 font-extrabold mt-0.5 leading-none">
                  HD Site Safety Team
                </div>
                <div className="text-[8px] text-slate-400 font-semibold leading-none mt-0.5">
                  Pass: HD@2026
                </div>
                <div className="text-[8px] text-[#1B3A8C] underline font-bold mt-1.5 uppercase">
                  Click to login
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("admin")}
                className="p-2.5 bg-amber-50/50 hover:bg-amber-100/70 border border-amber-100 rounded-lg text-left hover:border-amber-300 transition-all text-amber-900 cursor-pointer"
              >
                <div className="flex items-center gap-1 font-sans font-black text-[10px] text-amber-700 tracking-tight uppercase">
                  <ShieldCheck className="w-3 h-3 shrink-0" />
                  <span>Admin/Mgr (L2)</span>
                </div>
                <div className="text-[9px] text-amber-950 font-extrabold mt-0.5 leading-none font-sans">
                  HD HO HSSE
                </div>
                <div className="text-[8px] text-slate-400 font-semibold leading-none mt-0.5">
                  Pass: HSSE@2026
                </div>
                <div className="text-[8px] text-amber-800 underline font-bold mt-1.5 uppercase">
                  Click to login
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F1F4F9] text-[#1B3A8C] font-sans print:bg-white print:text-black">
      
      {/* HEADER SECTION */}
      <header className="bg-[#1B3A8C] min-h-[4rem] text-white flex flex-col md:flex-row md:items-center px-6 py-4 md:py-0 shadow-lg shrink-0 justify-between print:bg-white print:text-black print:shadow-none">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-white flex items-center justify-center rounded mr-4 shrink-0 shadow-md">
            <span className="text-[#1B3A8C] font-sans font-black text-2xl">H</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold tracking-tight text-white uppercase print:text-[#1B3A8C]">
              HANDONG ENGINEERING & CONSTRUCTION
            </h1>
            <h2 className="text-[10px] md:text-xs opacity-80 uppercase tracking-widest text-[#F1F4F9] print:text-slate-600 font-bold">
              HSE DASHBOARD REPORT / BÁO CÁO AN TOÀN {state.header.projectName ? ` - ${state.header.projectName.toUpperCase()}` : ""}
            </h2>
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end flex-wrap gap-4 mt-3 md:mt-0">
          <div className="flex flex-col items-start md:items-end">
            <span className="text-[9px] opacity-70 uppercase font-bold tracking-wider">
              Report Period / Kỳ Báo Cáo
            </span>
            <span className="text-xs md:text-sm font-extrabold uppercase font-mono tracking-wide text-white print:text-[#1B3A8C]">
              {MONTH_NAMES.find(m => m.id === state.header.month)?.en.toUpperCase() || "OCTOBER"} {state.header.year} / THÁNG {MONTH_NAMES.find(m => m.id === state.header.month)?.short || "10"} {state.header.year}
            </span>
          </div>
          
          <div className="hidden md:block h-10 w-[1px] bg-white/20 print:hidden"></div>

          {/* USER ACCOUNT CONTROL */}
          <div className="flex items-center gap-2.5 bg-white/10 px-3 py-1 bg-opacity-20 rounded-lg border border-white/10 print:hidden shrink-0">
            <div className="flex flex-col text-left">
              <span className="text-[9px] text-amber-300 font-extrabold uppercase tracking-widest leading-none">
                {currentUser?.role === "admin" ? "★ Admin (Tổng hợp)" : "● Reporter (Cá nhân)"}
              </span>
              <span className="text-[10px] font-bold text-[#F1F4F9] tracking-tight mt-1 font-mono">
                {currentUser?.role === "admin" ? "Người tổng hợp" : "Khai báo báo cáo"}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-750 p-1.5 rounded text-white transition hover:scale-105 cursor-pointer ml-1.5"
              title="Log Out / Đăng xuất"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="hidden md:block h-10 w-[1px] bg-white/20 print:hidden"></div>

          <button
            onClick={() => window.print()}
            className="hidden md:block bg-[#2E5FD9] hover:bg-blue-600 px-4 py-2 rounded text-xs font-bold uppercase transition tracking-wider shadow-md print:hidden shrink-0 cursor-pointer"
          >
            Export PDF / Xuất PDF
          </button>
        </div>
      </header>

      {/* ROLE BANNER / RĂNG BĂNG ĐIỀU HÀNH VAI TRÒ */}
      {currentUser?.role === "reporter" ? (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between text-blue-900 text-[11px] font-bold select-none leading-normal print:hidden gap-1.5 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
            </span>
            <span>
              <strong>Chế độ nhập liệu / REPORTER:</strong> Bạn đang cập nhật số liệu cho dự án hiện tại: <strong className="text-[#1B3A8C]">{activeProjectId} - {activeProjectName}</strong>. Hãy điền đủ 5 phần (S1-S5) để báo cáo khả dụng cho Admin tổng hợp.
            </span>
          </div>
          <span className="text-[9px] text-blue-700 bg-blue-100 px-2 py-0.5 rounded font-black uppercase tracking-wider whitespace-nowrap self-start sm:self-auto font-mono shrink-0">
            PERSONAL REPORTER / CÁ NHÂN LÀM BÁO CÁO
          </span>
        </div>
      ) : (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between text-amber-955 text-[11px] font-bold select-none leading-normal print:hidden gap-1.5 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-amber-900">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-600"></span>
            </span>
            <span>
              <strong>Chế độ tổng hợp / ADMIN:</strong> Bạn có quyền kiểm tra hình ảnh, chỉnh sửa ghi chú soát xét, duyệt báo cáo và xuất bản PDF cho tất cả công trường.
            </span>
          </div>
          <span className="text-[9px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-black uppercase tracking-wider whitespace-nowrap self-start sm:self-auto font-mono shrink-0">
            GENERAL HSE ADMIN / NGƯỜI TỔNG HỢP CHÍNH
          </span>
        </div>
      )}

      {/* PROGRESS TRACKER */}
      <div className="h-1.5 bg-slate-205 w-full shrink-0 print:hidden relative overflow-hidden bg-gray-200">
        <div
          className="h-full bg-green-500 transition-all duration-500"
          style={{ width: `${completionPercentage}%` }}
        ></div>
      </div>

      {/* QUICK SYSTEM UTILITIES BAR */}
      <div className="bg-white border-b border-gray-200 py-3.5 px-6 print:hidden shadow-sm shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => { setViewMode("edit"); setActiveTab("section-1"); }}
              className={`px-4 py-2 text-xs font-extrabold tracking-wide uppercase rounded-md transition-all duration-150 flex items-center gap-2 border shadow-sm ${
                viewMode === "edit"
                  ? "bg-[#1B3A8C] border-[#1B3A8C] text-white hover:bg-[#152e74]"
                  : "bg-white text-[#1B3A8C] hover:bg-slate-50 border-gray-200"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>MONTHLY REPORT / NHẬP LIỆU BÁO CÁO</span>
            </button>
            <button
              id="view-summary-btn"
              onClick={() => setViewMode("summary")}
              className={`px-4 py-2 text-xs font-extrabold tracking-wide uppercase rounded-md transition-all duration-150 flex items-center gap-2 border shadow-sm ${
                viewMode === "summary"
                  ? "bg-[#1B3A8C] border-[#1B3A8C] text-white hover:bg-[#152e74]"
                  : "bg-white text-[#1B3A8C] hover:bg-slate-50 border-gray-200"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>SUMMARY DASHBOARD / TẤM BẢNG ĐIỀU KHIỂN CHUNG</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 md:justify-end">
            {lastSaved && (
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-green-700 bg-green-50 px-3 py-1.5 rounded-md border border-green-200 shadow-inner mr-1.5 leading-none">
                <Clock className="w-3.5 h-3.5 text-green-600 shrink-0" />
                <span>SAVED / ĐÃ LƯU: {lastSaved}</span>
              </div>
            )}

            <button
              onClick={loadSampleData}
              className="px-3.5 py-2 text-xs font-bold bg-white hover:bg-slate-50 border border-gray-200 text-slate-700 rounded-md shadow-sm flex items-center gap-1.5 transition"
              title="Restores the standard Handong Engineering sample metrics"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#2E5FD9]" />
              <span>LOAD SAMPLE DATA / SỐ LIỆU MẪU</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowResetConfirm(!showResetConfirm)}
                className="px-3.5 py-2 text-xs font-bold bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-md shadow-sm flex items-center gap-1.5 transition"
                title="Resets the local database clean"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>RESET FORM / XÓA BÁO CÁO</span>
              </button>
              
              {showResetConfirm && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-slate-200 p-4 z-50 animate-in fade-in slide-in-from-top-1 text-slate-800">
                  <div className="flex gap-2 items-start mb-3">
                    <AlertTriangle className="w-5 h-5 text-red-650 shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Are you sure? / Bạn chắc chắn?</h4>
                      <p className="text-xs text-slate-500 mt-1">This will permanently delete all input data and charts.</p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 text-xs">
                    <button
                      onClick={() => setShowResetConfirm(false)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-medium"
                    >
                      Cancel / Hủy
                    </button>
                    <button
                      onClick={handleReset}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded font-medium shadow-sm"
                    >
                      Reset Clean / Xóa Hết
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => window.print()}
              className="px-4 py-2 text-xs font-extrabold uppercase bg-emerald-600 hover:bg-emerald-700 text-white border border-transparent rounded-md shadow-md flex items-center gap-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>EXPORT PDF / IN BÁO CÁO</span>
            </button>
          </div>
        </div>
      </div>

      {/* COMPACT BILINGUAL EXPLANATION HERO BANNER */}
      <div className="bg-[#1B3A8C]/5 border-b border-gray-200 px-6 py-2.5 print:hidden text-center text-xs text-[#1B3A8C] font-bold tracking-wide flex items-center justify-center gap-2">
        <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shrink-0"></span>
        <span>Bilingual compliance audit engine (ISO 45001) / Cơ sở dữ liệu song ngữ kiểm định an toàn kỹ thuật quốc tế. All calculation grids sync in real-time.</span>
      </div>

      {saveError && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 print:hidden text-xs text-amber-800 font-bold tracking-wide flex items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="text-sm">⚠️</span>
            <span>{saveError}</span>
          </div>
          <button 
            type="button"
            onClick={() => setSaveError(null)}
            className="hover:bg-amber-100 rounded-full px-2 py-0.5 transition font-bold text-amber-900 border border-amber-300"
            title="Dismiss / Ẩn"
          >
            Hide / Ẩn ✕
          </button>
        </div>
      )}

      {/* CORE WORKSPACE */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 print:p-0 print:max-w-none space-y-6">
        
        {viewMode === "edit" && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 flex flex-col gap-5 print:hidden">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-[#1B3A8C]/10 p-2.5 rounded-xl border border-[#1B3A8C]/10">
                  <Building2 className="w-6 h-6 text-[#2E5FD9]" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-[#2E5FD9] tracking-wider block">ACTIVE ACCOUNT PROJECT PROFILE / TÀI KHOẢN KHAI BÁO DỰ ÁN</span>
                  <h2 className="text-sm font-extrabold text-[#1B3A8C] uppercase mt-0.5 tracking-tight text-brand-blue">
                    Active Site: {projects.find(p => p.id === activeProjectId)?.name || activeProjectId} ({activeProjectId})
                  </h2>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                <span className="text-xs font-bold text-slate-500 shrink-0 select-none">Switch Active Project / Đổi tài khoản dự án:</span>
                <div className="flex gap-2">
                  <select
                    value={activeProjectId}
                    onChange={(e) => setActiveProjectId(e.target.value)}
                    className="bg-slate-50 text-[#1B3A8C] border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-[#2E5FD9] cursor-pointer flex-1 animate-none"
                  >
                    {projects.map(p => {
                      const pState = projectStates[p.id];
                      const isPFinishedOrPending = p.status === "Finish" || p.status === "Pending";
                      const pStatus = pState?.header?.completed && pState?.kpis?.completed && (pState?.safetyPractices?.completed || isPFinishedOrPending);
                      const statusSuffix = p.status === "Finish" ? " (Finish) 🔴" : p.status === "Pending" ? " (Pending) 🟡" : "";
                      return (
                        <option key={p.id} value={p.id}>
                          {p.id} - {p.name} {pStatus ? "✓ Signed" : "(Draft)"}{statusSuffix}
                        </option>
                      );
                    })}
                  </select>

                  <button
                    onClick={() => setShowAddProject(!showAddProject)}
                    className="bg-[#2E5FD9] hover:bg-[#1B3A8C] text-white px-3 py-1.5 rounded-lg text-xs font-extrabold shadow-sm flex items-center gap-1.5 shrink-0 transition-colors"
                  >
                    <span>+ New Project / Thêm dự án</span>
                  </button>
                </div>
              </div>
            </div>

            {/* STATUS SELECTOR ROW */}
            <div className="border-t border-slate-100 pt-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-xs w-full sm:w-auto">
                <span className="font-extrabold text-[#1B3A8C] uppercase tracking-wider block text-[11px] shrink-0">
                  Project Status / Trạng thái công trường:
                </span>
                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
                  {(["On-going", "Pending", "Finish"] as const).map((st) => {
                    const currentStatus = projects.find(p => p.id === activeProjectId)?.status || "On-going";
                    const isSelected = currentStatus === st;
                    return (
                      <button
                        key={st}
                        onClick={() => {
                          setProjects(prev => {
                            const updated = prev.map(p => {
                              if (p.id === activeProjectId) {
                                return { ...p, status: st };
                              }
                              return p;
                            });
                            localStorage.setItem("handong_hse_projects_v4", JSON.stringify(updated));
                            return updated;
                          });
                        }}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all duration-150 ${
                          isSelected
                            ? st === "On-going"
                              ? "bg-emerald-600 text-white shadow-sm"
                              : st === "Pending"
                              ? "bg-amber-500 text-white shadow-sm"
                              : "bg-rose-600 text-white shadow-sm"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                        }`}
                      >
                        {st === "On-going" && "🟢 On-going (Đang chạy)"}
                        {st === "Pending" && "🟡 Pending (Tạm ngưng)"}
                        {st === "Finish" && "🔴 Finish (Đã hoàn thành)"}
                      </button>
                    );
                  })}
                </div>
              </div>

              {projects.find(p => p.id === activeProjectId)?.status === "Finish" && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-semibold px-3 py-1.5 rounded-lg">
                  ⚠️ This project is marked as <span className="font-black">FINISH</span> and is hidden from Section 3 & the general Summary Dashboard tables.
                </div>
              )}
            </div>

            {/* ADD NEW PROJECT FORM COLLAPSED CARD */}
            {showAddProject && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 shadow-inner space-y-3.5 transition-all duration-300">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-xs font-black text-[#1B3A8C] uppercase tracking-wider">
                    Add New Project Site / Đăng ký thêm dự án công trường mới
                  </span>
                  <button
                    onClick={() => setShowAddProject(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs font-bold font-sans"
                  >
                    [Close / Đóng]
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Project Code / Mã dự án (e.g., SYC, TDA2, HP)
                    </label>
                    <input
                      type="text"
                      className="bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold w-full focus:ring-2 focus:ring-[#2E5FD9] outline-none font-mono text-slate-800"
                      placeholder="Mã viết tắt viết hoa..."
                      value={newProjId}
                      onChange={(e) => {
                        setProjToAddError("");
                        setNewProjId(e.target.value);
                      }}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[11px] font-bold text-slate-700 uppercase">
                        Full Project Name / Tên đầy đủ dự án
                      </label>
                      <TranslateButton
                        value={newProjName}
                        onTranslated={(newVal) => setNewProjName(newVal)}
                      />
                    </div>
                    <input
                      type="text"
                      className="bg-white border border-slate-300 rounded-lg p-2 text-xs font-semibold w-full focus:ring-2 focus:ring-[#2E5FD9] outline-none text-slate-800"
                      placeholder="Tên công trường đầy đủ..."
                      value={newProjName}
                      onChange={(e) => {
                        setProjToAddError("");
                        setNewProjName(e.target.value);
                      }}
                    />
                  </div>
                </div>

                {projToAddError && (
                  <p className="text-xs text-rose-600 font-bold bg-rose-50 p-2 rounded-lg border border-rose-200">
                    {projToAddError}
                  </p>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowAddProject(false)}
                    className="bg-white hover:bg-slate-100 text-slate-700 px-3.5 py-1.5 rounded-lg text-xs font-extrabold border border-slate-300 shadow-sm"
                  >
                    Cancel / Hủy bỏ
                  </button>
                  <button
                    type="button"
                    onClick={handleAddProject}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-xs font-extrabold shadow-sm"
                  >
                    Deploy site / Thêm và Kích hoạt
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {viewMode === "edit" && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center gap-3.5 shadow-sm print:hidden">
            <div className="bg-amber-100 p-2.5 rounded-lg text-amber-800 shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-700 shrink-0" />
            </div>
            <div className="flex-1 text-xs">
              <span className="font-extrabold uppercase tracking-wider block text-amber-950 text-[11px] mb-1">
                PROJECT ACCOUNT WORKFLOW NOTICE / LƯU Ý QUY TRÌNH BÁO CÁO CÁC DỰ ÁN
              </span>
              <p className="font-medium text-slate-700 leading-relaxed font-sans">
                Each project site has a dedicated account profile to fill in information for the 5 requested sections. The Administrator / HSSE Manager account reviews all active project reports collectively on the <span className="font-bold text-[#1B3A8C] underline cursor-pointer" onClick={() => {
                  const viewSummaryBtn = document.getElementById("view-summary-btn");
                  if (viewSummaryBtn) viewSummaryBtn.click();
                }}>Summary Dashboard (Bảng tổng hợp HSSE)</span> and exports standard consolidated submissions.
              </p>
              <p className="font-sans font-bold text-[#b45309] mt-1.5 border-t border-amber-200/50 pt-1.5">
                👉 Quy trình: Mỗi dự án sẽ có một account vô điền thông tin 5 mục, account quản trị viên (Admin) sẽ xem xét chi tiết và xuất báo cáo PDF chính thức.
              </p>
            </div>
          </div>
        )}

        {viewMode === "edit" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            
            {/* SIDE NAVIGATION (SECTION SELECTORS) */}
            <div className="lg:col-span-1 flex flex-col gap-2 print:hidden">
              <span className="text-[11px] font-bold tracking-widest text-slate-400 uppercase ml-2 mb-1">
                Report Sections / Các phần báo cáo
              </span>
              
              <button
                onClick={() => setActiveTab("section-1")}
                className={`w-full text-left p-3.5 rounded-xl transition-all duration-200 border flex items-start gap-3 shadow-sm ${
                  activeTab === "section-1"
                    ? "bg-brand-blue text-white border-brand-blue font-semibold scale-[1.02]"
                    : "bg-white hover:bg-slate-100 border-slate-200 text-slate-700"
                }`}
              >
                <div className={`p-1.5 rounded-lg shrink-0 ${activeTab === "section-1" ? "bg-white/20" : "bg-slate-100"}`}>
                  <Activity className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs uppercase font-extrabold tracking-wide">Section 1 / Phần 1</div>
                  <div className="text-[11px] truncate opacity-80 font-medium">General Information / Thông Tin Chung</div>
                  {state.header.completed ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 mt-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Completed / Xong
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 mt-1 block">Pending / Chưa hoàn thành</span>
                  )}
                </div>
              </button>

              <button
                onClick={() => setActiveTab("section-2")}
                className={`w-full text-left p-3.5 rounded-xl transition-all duration-200 border flex items-start gap-3 shadow-sm ${
                  activeTab === "section-2"
                    ? "bg-brand-blue text-white border-brand-blue font-semibold scale-[1.02]"
                    : "bg-white hover:bg-slate-100 border-slate-200 text-slate-700"
                }`}
              >
                <div className={`p-1.5 rounded-lg shrink-0 ${activeTab === "section-2" ? "bg-white/20" : "bg-slate-100"}`}>
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs uppercase font-extrabold tracking-wide">Section 2 / Phần 2</div>
                  <div className="text-[11px] truncate opacity-80">KPI Indicators / Chỉ Số KPIs Chính</div>
                  {state.kpis.completed ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 mt-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Completed / Xong
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 mt-1 block">Pending / Chưa hoàn thành</span>
                  )}
                </div>
              </button>

              <button
                onClick={() => setActiveTab("section-3")}
                className={`w-full text-left p-3.5 rounded-xl transition-all duration-200 border flex items-start gap-3 shadow-sm ${
                  activeTab === "section-3"
                    ? "bg-brand-blue text-white border-brand-blue font-semibold scale-[1.02]"
                    : "bg-white hover:bg-slate-100 border-slate-200 text-slate-700"
                }`}
              >
                <div className={`p-1.5 rounded-lg shrink-0 ${activeTab === "section-3" ? "bg-white/20" : "bg-slate-100"}`}>
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs uppercase font-extrabold tracking-wide">Section 3 / Phần 3</div>
                  <div className="text-[11px] truncate opacity-80">Safety Manhours / Số Giờ Công An Toàn</div>
                  {state.manhourStats.completed ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 mt-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Completed / Xong
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 mt-1 block">Pending / Chưa hoàn thành</span>
                  )}
                </div>
              </button>

              <button
                onClick={() => setActiveTab("section-4")}
                className={`w-full text-left p-3.5 rounded-xl transition-all duration-200 border flex items-start gap-3 shadow-sm ${
                  activeTab === "section-4"
                    ? "bg-brand-blue text-white border-brand-blue font-semibold scale-[1.02]"
                    : "bg-white hover:bg-slate-100 border-slate-200 text-slate-700"
                }`}
              >
                <div className={`p-1.5 rounded-lg shrink-0 ${activeTab === "section-4" ? "bg-white/20" : "bg-slate-100"}`}>
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs uppercase font-extrabold tracking-wide">Section 4 / Phần 4</div>
                  <div className="text-[11px] truncate opacity-80">SVR Violation Analysis / Phân Tích SVR</div>
                  {state.svrAnalysis.completed ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 mt-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Completed / Xong
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 mt-1 block">Pending / Chưa hoàn thành</span>
                  )}
                </div>
              </button>

              <button
                onClick={() => setActiveTab("section-5")}
                className={`w-full text-left p-3.5 rounded-xl transition-all duration-200 border flex items-start gap-3 shadow-sm ${
                  activeTab === "section-5"
                    ? "bg-brand-blue text-white border-brand-blue font-semibold scale-[1.02]"
                    : "bg-white hover:bg-slate-100 border-slate-200 text-slate-700"
                }`}
              >
                <div className={`p-1.5 rounded-lg shrink-0 ${activeTab === "section-5" ? "bg-white/20" : "bg-slate-100"}`}>
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs uppercase font-extrabold tracking-wide">Section 5 / Phần 5</div>
                  <div className="text-[11px] truncate opacity-80">Safe Photos / Hình ảnh an toàn</div>
                  {state.safetyPractices?.completed || isPendingOrFinished ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 mt-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Completed / Xong
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 mt-1 block">Pending / Chưa hoàn thành</span>
                  )}
                </div>
              </button>

              <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 mt-4 shadow-inner text-xs text-slate-600 space-y-2">
                <div className="font-bold uppercase text-slate-900 border-b pb-1">Bilingual Glossaries</div>
                <div><strong>LTI</strong>: Injury causing 1+ day loss / Thương tật mất ngày làm việc.</div>
                <div><strong>LTIFR</strong>: Rate per 200,000 hours / Tần suất tổn thất thời gian.</div>
                <div><strong>TRIFR</strong>: Rate for recordable cases / Tần suất tổng tổn thất.</div>
                <div><strong>SVR</strong>: Safety Violation Report / Biên bản vi phạm an toàn.</div>
              </div>
            </div>

            {/* TAB PANES */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* SECTION 1 CARD */}
              {activeTab === "section-1" && (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 relative">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4 mb-5 gap-3">
                    <div>
                      <h3 className="text-lg font-black text-brand-blue uppercase tracking-tight">
                        SECTION 1 — GENERAL INFORMATION / THÔNG TIN CHUNG BÁO CÁO
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Report Month, Year, Period and default site administrator.
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-brand-blue font-extrabold text-xs rounded uppercase tracking-wider">
                      ADMIN / QUẢN TRỊ VIÊN
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-slate-700 font-bold text-xs mb-2 uppercase tracking-wide">
                        Report Month / Tháng báo cáo
                      </label>
                      <select
                        value={state.header.month}
                        onChange={(e) => {
                          const targetMonthId = e.target.value;
                          setState(prev => {
                            const targetIndex = MONTH_NAMES.findIndex(m => m.id === targetMonthId);
                            let newKpis = { ...prev.kpis };
                            const updatedMonthlyData = [...prev.manhourStats.monthlyData];
                            if (targetIndex !== -1) {
                              // Reset the current project's safe manhours for this selected month to 0
                              const row = updatedMonthlyData[targetIndex];
                              if (row) {
                                updatedMonthlyData[targetIndex] = {
                                  ...row,
                                  manhoursByProject: {
                                    ...row.manhoursByProject,
                                    [activeProjectId]: 0
                                  }
                                };
                              }

                              const rowAfterReset = updatedMonthlyData[targetIndex];
                              newKpis.nearmiss = rowAfterReset?.nearmissCount || 0;
                              newKpis.firstAid = rowAfterReset?.firstAidCount || 0;
                              newKpis.accidents = rowAfterReset?.ltiCount || 0;
                              newKpis.fatalities = rowAfterReset?.fatalityCount || 0;
                              
                              // Reset the required input fields to 0 as requested to prevent confusion
                              newKpis.totalSafeHoursMonth = 0;
                              newKpis.avgMonthlyWorkers = 0;
                              newKpis.monthlyTrainingHours = rowAfterReset?.trainingHoursByProject?.[activeProjectId] ?? 0;

                              let accTrainingHoursYTD = 0;
                              for (let i = 0; i <= targetIndex; i++) {
                                const r = updatedMonthlyData[i];
                                accTrainingHoursYTD += r?.trainingHoursByProject?.[activeProjectId] ?? 0;
                              }
                              newKpis.trainingHoursYTD = accTrainingHoursYTD;

                              let accWorkHours = 0;
                              let accSafeWorkHours = 0;
                              for (let i = 0; i <= targetIndex; i++) {
                                const r = updatedMonthlyData[i];
                                const mTotal = (Object.values(r.manhoursByProject) as number[]).reduce((sum, h) => sum + (h || 0), 0);
                                accWorkHours += mTotal;
                                if ((r.fatalityCount || 0) > 0 || (r.ltiCount || 0) > 0) {
                                  accSafeWorkHours = 0;
                                } else {
                                  accSafeWorkHours += mTotal;
                                }
                              }

                              newKpis.totalSafeHoursYTD = accSafeWorkHours;
                              const baseline = Math.max(0, (prev.kpis.totalSafeHoursFromStart || 0) - (prev.kpis.totalSafeHoursYTD || 0));
                              newKpis.totalSafeHoursFromStart = baseline + accSafeWorkHours;
                            }
                            return {
                              ...prev,
                              header: { ...prev.header, month: targetMonthId },
                              kpis: newKpis,
                              manhourStats: {
                                ...prev.manhourStats,
                                monthlyData: updatedMonthlyData
                              }
                            };
                          });
                        }}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 font-medium focus:ring-2 focus:ring-brand-blue focus:border-brand-blue outline-none transition"
                      >
                        {MONTH_NAMES.map(m => (
                          <option key={m.id} value={m.id}>{m.en}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold text-xs mb-2 uppercase tracking-wide">
                        Report Year / Năm báo cáo
                      </label>
                      <select
                        value={state.header.year}
                        onChange={(e) => setState(prev => ({
                          ...prev,
                          header: { ...prev.header, year: e.target.value }
                        }))}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 font-medium focus:ring-2 focus:ring-brand-blue focus:border-brand-blue outline-none transition"
                      >
                        {["2024", "2025", "2026", "2027", "2028", "2029", "2030"].map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <div className="bg-slate-100 rounded-xl p-4 border border-slate-200">
                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest block">
                          Report Period / Chi tiết kỳ báo cáo
                        </span>
                        <div className="text-sm font-bold text-brand-blue mt-1 uppercase">
                          HSE DASHBOARD IN {state.header.month.toUpperCase()} {state.header.year}
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-slate-700 font-bold text-xs uppercase tracking-wide">
                          Project Name / Tên dự án
                        </label>
                        <TranslateButton
                          value={state.header.projectName}
                          onTranslated={(newVal) => setState(prev => ({
                            ...prev,
                            header: { ...prev.header, projectName: newVal }
                          }))}
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Type project name (e.g. GEM PARK PROJECT) / Nhập tên dự án"
                        value={state.header.projectName}
                        onChange={(e) => setState(prev => ({
                          ...prev,
                          header: { ...prev.header, projectName: e.target.value }
                        }))}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 font-semibold focus:ring-2 focus:ring-brand-blue outline-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-slate-700 font-bold text-xs uppercase tracking-wide">
                          Reporter Name / Người báo cáo (HSE Manager/Admin)
                        </label>
                        <TranslateButton
                          value={state.header.reporterName}
                          onTranslated={(newVal) => setState(prev => ({
                            ...prev,
                            header: { ...prev.header, reporterName: newVal }
                          }))}
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Type full name / Nhập tên đầy đủ"
                        value={state.header.reporterName}
                        onChange={(e) => setState(prev => ({
                          ...prev,
                          header: { ...prev.header, reporterName: e.target.value }
                        }))}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 font-semibold focus:ring-2 focus:ring-brand-blue outline-none"
                      />
                    </div>
                  </div>

                  {/* SIGN-OFF CHECKBOX SECTION */}
                  <div className="border-t border-slate-200 pt-5 mt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <label className="inline-flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={state.header.completed}
                        onChange={(e) => setState(prev => ({
                          ...prev,
                          header: { ...prev.header, completed: e.target.checked }
                        }))}
                        className="w-5 h-5 accent-emerald-500 rounded border-slate-300 focus:ring-emerald-500"
                      />
                      <div className="text-slate-800 select-none">
                        <div className="text-xs font-black uppercase text-slate-900 tracking-wide">
                          SIGN-OFF & COMPLETE SECTION 1 / HOÀN THÀNH PHẦN 1
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Confirm report header information is correct / Xác nhận thông tin chuẩn nhập chính xác
                        </div>
                      </div>
                    </label>

                    {state.header.completed && (
                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3.5 py-2 rounded-lg flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <div>
                          <span className="font-extrabold">Completed by / Người hoàn thành:</span>
                          <p className="font-mono text-[10px] mt-0.5">{state.header.reporterName || "N/A"}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SECTION 2 CARD */}
              {activeTab === "section-2" && (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 relative">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4 mb-5 gap-3">
                    <div>
                      <h3 className="text-lg font-black text-brand-blue uppercase tracking-tight">
                        SECTION 2 — GENERAL SAFETY METRICS & INDICES / CHỈ SỐ THỰC HIỆN AN TOÀN CHÍNH
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        High level safety performance numbers compiled by HSE Manager.
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-brand-blue font-extrabold text-xs rounded uppercase tracking-wider">
                      HSE MANAGER / TRƯỞNG BAN AN TOÀN
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-slate-700 font-bold text-xs mb-1 uppercase tracking-wide">
                        Total Safe Manhours since project inception / Tổng số giờ làm việc an toàn từ đầu dự án đến hiện tại
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={state.kpis.totalSafeHoursFromStart || 0}
                        onChange={(e) => setState(prev => ({
                          ...prev,
                          kpis: { ...prev.kpis, totalSafeHoursFromStart: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 font-medium outline-none text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold text-xs mb-1 uppercase tracking-wide">
                        Year-to-Date Safe Manhours / Số giờ an toàn lũy kế trong năm
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={state.kpis.totalSafeHoursYTD || 0}
                        onChange={(e) => setState(prev => ({
                          ...prev,
                          kpis: { ...prev.kpis, totalSafeHoursYTD: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 font-medium outline-none text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold text-xs mb-1 uppercase tracking-wide">
                        Monthly Safe Manhours / Số giờ an toàn tháng
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={state.kpis.totalSafeHoursMonth || 0}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          const oldVal = state.kpis.totalSafeHoursMonth || 0;
                          const delta = val - oldVal;
                          setState(prev => {
                            const activeMonthIndex = MONTH_NAMES.findIndex(m => m.id === prev.header.month);
                            let newMonthlyData = prev.manhourStats.monthlyData;
                            if (activeMonthIndex !== -1) {
                              const updatedRows = [...prev.manhourStats.monthlyData];
                              const row = updatedRows[activeMonthIndex];
                              const newManhours = { 
                                ...row.manhoursByProject,
                                [activeProjectId]: val
                              };
                              updatedRows[activeMonthIndex] = {
                                ...row,
                                manhoursByProject: newManhours
                              };
                              newMonthlyData = updatedRows;
                            }
                            return {
                              ...prev,
                              kpis: { 
                                ...prev.kpis, 
                                totalSafeHoursMonth: val,
                                totalSafeHoursYTD: Math.max(0, (prev.kpis.totalSafeHoursYTD || 0) + delta),
                                totalSafeHoursFromStart: Math.max(0, (prev.kpis.totalSafeHoursFromStart || 0) + delta)
                              },
                              manhourStats: {
                                ...prev.manhourStats,
                                monthlyData: newMonthlyData
                              }
                            };
                          });
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold text-xs mb-1 uppercase tracking-wide">
                        Average Monthly Workers / Số lượng công nhân trung bình tháng
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={state.kpis.avgMonthlyWorkers || 0}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setState(prev => ({
                            ...prev,
                            kpis: { ...prev.kpis, avgMonthlyWorkers: val }
                          }));
                        }}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 font-medium outline-none text-sm focus:ring-2 focus:ring-[#2E5FD9]"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold text-xs mb-1 uppercase tracking-wide text-brand-blue flex items-center gap-1.5">
                        <span>📊 Cumulative Safety Training Hours / Lũy kế số giờ huấn luyện an toàn của dự án</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={state.kpis.trainingHoursYTD || 0}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setState(prev => ({
                            ...prev,
                            kpis: { ...prev.kpis, trainingHoursYTD: val }
                          }));
                        }}
                        className="w-full bg-blue-50 border border-blue-200 rounded-lg p-2.5 text-[#1B3A8C] font-black outline-none text-sm focus:ring-2 focus:ring-[#1B3A8C]"
                        placeholder="0"
                      />
                      <p className="text-[10px] text-blue-600 mt-1">
                        * Tự động cộng dồn từ số giờ HLAT tháng và lưu tiếp qua các tháng.
                      </p>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold text-xs mb-1 uppercase tracking-wide">
                        Monthly Safety Training Hours / Số giờ huấn luyện an toàn tháng
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={state.kpis.monthlyTrainingHours || 0}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          const activeMonthIndex = MONTH_NAMES.findIndex(m => m.id === state.header.month);
                          setState(prev => {
                            const updatedMonthlyData = [...prev.manhourStats.monthlyData];
                            if (activeMonthIndex !== -1) {
                              const row = updatedMonthlyData[activeMonthIndex];
                              if (row) {
                                updatedMonthlyData[activeMonthIndex] = {
                                  ...row,
                                  trainingHoursByProject: {
                                    ...(row.trainingHoursByProject || {}),
                                    [activeProjectId]: val
                                  }
                                };
                              }
                            }

                            // Calculate new cumulative YTD hours
                            let newYtd = 0;
                            if (activeMonthIndex !== -1) {
                              for (let i = 0; i <= activeMonthIndex; i++) {
                                const r = updatedMonthlyData[i];
                                newYtd += r?.trainingHoursByProject?.[activeProjectId] ?? 0;
                              }
                            }

                            return {
                              ...prev,
                              kpis: {
                                ...prev.kpis,
                                monthlyTrainingHours: val,
                                trainingHoursYTD: newYtd
                              },
                              manhourStats: {
                                ...prev.manhourStats,
                                monthlyData: updatedMonthlyData
                              }
                            };
                          });
                        }}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 font-medium outline-none text-sm focus:ring-2 focus:ring-[#2E5FD9]"
                        placeholder="0"
                      />
                    </div>

                    <div className="md:col-span-2 pt-4 border-t border-slate-200 mt-2">
                      <h4 className="text-xs font-black text-[#1B3A8C] uppercase tracking-wider mb-1">
                        Incident Information and Report Document Submissions
                      </h4>
                      <p className="text-[11px] text-slate-500 mb-4">
                        Nếu phát sinh sự cố (số trường hợp lớn hơn 0), bạn hãy điền chi tiết mô tả và chọn tệp báo cáo đính kèm tương ứng bên dưới.
                      </p>
                    </div>

                    {[
                      {
                        key: "nearmiss",
                        labelEn: "Incidents/ Nearmiss",
                        labelVi: "Báo cáo sự cố và tiềm ẩn sự cố / Incidents/ Nearmiss",
                        placeholder: "Ví dụ: Bộ phận giàn giáo lỏng lẻo tại zone B - Nearmiss Report No. 12...",
                        descKey: "nearmissDetails",
                        fileKey: "nearmissFileName",
                        attachKey: "nearmissAttachment",
                      },
                      {
                        key: "firstAid",
                        labelEn: "First Aid Treatment",
                        labelVi: "Trường hợp sơ cứu / First Aid",
                        placeholder: "Ví dụ: Cứa tay nhẹ khi cắt sắt đã xử lý - First Aid No. 04...",
                        descKey: "firstAidDetails",
                        fileKey: "firstAidFileName",
                        attachKey: "firstAidAttachment",
                      },
                      {
                        key: "accidents",
                        labelEn: "LTI Accidents",
                        labelVi: "Trường hợp tai nạn mất ngày công / Accidents (LTI)",
                        placeholder: "Ví dụ: Trượt ngã nứt cổ chân tại sàn tầng 3 - LTI No. 01...",
                        descKey: "accidentsDetails",
                        fileKey: "accidentsFileName",
                        attachKey: "accidentsAttachment",
                      },
                      {
                        key: "fatalities",
                        labelEn: "Fatalities Count",
                        labelVi: "Trường hợp tử vong / Fatalities",
                        placeholder: "Ví dụ: Tên nạn nhân, mô tả vụ việc tử vong - Fatal Report No. 01...",
                        descKey: "fatalitiesDetails",
                        fileKey: "fatalitiesFileName",
                        attachKey: "fatalitiesAttachment",
                      }
                    ].map((item) => {
                      const countValue = state.kpis[item.key as keyof typeof state.kpis] as number || 0;
                      const detailsValue = state.kpis[item.descKey as keyof typeof state.kpis] as string || "";
                      const fileName = state.kpis[item.fileKey as keyof typeof state.kpis] as string || "";
                      const attachmentUrl = state.kpis[item.attachKey as keyof typeof state.kpis] as string || "";
                      const progress = incidentUploadProgress[item.key];

                      // Calculate live dynamic values for past months YTD accumulation and current month YTD combined
                      const activeMonthIndex = MONTH_NAMES.findIndex(m => m.id === state.header.month);
                      const fieldMap: Record<string, string> = {
                        nearmiss: "nearmissCount",
                        firstAid: "firstAidCount",
                        accidents: "ltiCount",
                        fatalities: "fatalityCount"
                      };
                      const mappedField = fieldMap[item.key];
                      
                      let prevCumulative = 0;
                      if (activeMonthIndex !== -1) {
                        prevCumulative = state.manhourStats.monthlyData
                          .slice(0, activeMonthIndex)
                          .reduce((sum, mRow) => sum + ((mRow as any)[mappedField] || 0), 0);
                      }
                      const cumulativeYtdValue = prevCumulative + countValue;

                      const handleValueChange = (val: number) => {
                        const clampedVal = Math.max(0, val);
                        setState(prev => {
                          const idx = MONTH_NAMES.findIndex(m => m.id === prev.header.month);
                          let newMonthlyData = prev.manhourStats.monthlyData;
                          if (idx !== -1) {
                            const updatedRows = [...prev.manhourStats.monthlyData];
                            if (mappedField) {
                              updatedRows[idx] = {
                                ...updatedRows[idx],
                                [mappedField]: clampedVal
                              };
                            }
                            newMonthlyData = updatedRows;
                          }
                          return {
                            ...prev,
                            kpis: { 
                              ...prev.kpis, 
                              [item.key]: clampedVal
                            },
                            manhourStats: {
                              ...prev.manhourStats,
                              monthlyData: newMonthlyData
                            }
                          };
                        });
                      };

                      const hasIncidents = countValue > 0;

                      return (
                        <div key={item.key} className="md:col-span-2 p-4 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl transition flex flex-col gap-3">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="flex-1">
                              <label className="block text-slate-800 font-extrabold text-xs uppercase tracking-wide">
                                {item.labelEn} / {item.labelVi}
                              </label>
                              <p className="text-[10px] text-slate-400 font-medium">Please specify quantity. Details and report attachment opens when &gt; 0. / Nhập số vụ phát sinh. Điền thông tin chi tiết và đính kèm báo cáo khi số vụ phát sinh &gt; 0.</p>
                              
                              {/* YTD Cumulative Indicators directly displaying live YTD value */}
                              <div className="mt-2 text-slate-700">
                                <div className="inline-flex items-center gap-2 bg-[#F1F4F9] border border-slate-200 rounded-lg py-1 px-2.5">
                                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                                  <span className="text-[10px] font-black uppercase text-[#1B3A8C] tracking-wide">
                                    YTD Cumulative / Lũy kế năm (YTD): <span className="text-sm underline underline-offset-2 ml-1 text-emerald-700">{cumulativeYtdValue}</span> vụ
                                  </span>
                                </div>
                                <p className="text-[9px] text-slate-500 font-bold mt-1 pl-1">
                                  ({prevCumulative} vụ lũy kế tháng trước + {countValue} vụ phát sinh mới tháng {MONTH_NAMES.find(m => m.id === state.header.month)?.short})
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-row items-center gap-2 self-end sm:self-center shrink-0">
                              <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-tight text-right hidden lg:block">
                                Phát sinh mới tháng {MONTH_NAMES.find(m => m.id === state.header.month)?.short}:
                              </div>
                              <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden shadow-sm">
                                <button
                                  type="button"
                                  onClick={() => handleValueChange(countValue - 1)}
                                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 font-black text-xs text-[#1B3A8C] border-r border-slate-200 transition select-none cursor-pointer"
                                  title="Giảm 1 vụ / Decrease by 1"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min="0"
                                  value={countValue}
                                  onChange={(e) => handleValueChange(parseInt(e.target.value) || 0)}
                                  className="w-16 bg-transparent text-slate-800 font-extrabold text-sm text-center outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleValueChange(countValue + 1)}
                                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 font-black text-xs text-[#1B3A8C] border-l border-slate-200 transition select-none cursor-pointer"
                                  title="Tăng 1 vụ / Increase by 1"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>

                          {hasIncidents && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2.5 pt-3 border-t border-slate-200/60 transition-all duration-300">
                              <div className="flex flex-col gap-1.5">
                                <span className="text-[11px] font-bold text-slate-700 uppercase flex items-center justify-between gap-1.5">
                                  <span className="flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5 text-slate-500" /> Information Details / Điền thông tin chi tiết:
                                  </span>
                                  <TranslateButton
                                    value={detailsValue}
                                    onTranslated={(newVal) => {
                                      setState(prev => ({
                                        ...prev,
                                        kpis: { ...prev.kpis, [item.descKey]: newVal }
                                      }));
                                    }}
                                  />
                                </span>
                                <textarea
                                  value={detailsValue}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setState(prev => ({
                                      ...prev,
                                      kpis: { ...prev.kpis, [item.descKey]: val }
                                    }));
                                  }}
                                  rows={3}
                                  placeholder={item.placeholder}
                                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-850 font-medium font-sans outline-none focus:ring-1 focus:ring-brand-blue"
                                />
                              </div>

                              <div className="flex flex-col gap-1.5">
                                <span className="text-[11px] font-bold text-slate-700 uppercase flex items-center gap-1.5">
                                  <Paperclip className="w-3.5 h-3.5 text-slate-500" /> Báo cáo đính kèm / Attachment report file:
                                </span>
                                
                                <div className="border border-dashed border-slate-300 bg-white rounded-lg p-3 flex flex-col justify-center items-center text-center gap-2 relative flex-1 min-h-[85px]">
                                  <input
                                    type="file"
                                    id={`file-upload-${item.key}`}
                                    className="hidden"
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                                    onChange={(e) => {
                                      if (e.target.files && e.target.files[0]) {
                                        simulateIncidentUpload(item.key as any, e.target.files[0]);
                                      }
                                    }}
                                  />
                                  {progress !== undefined && progress !== null ? (
                                    <div className="w-full space-y-2">
                                      <div className="flex justify-between items-center text-[10px] font-extrabold text-[#2E5FD9]">
                                        <span>Uploading file...</span>
                                        <span>{progress}%</span>
                                      </div>
                                      <div className="w-full bg-slate-100 rounded-full h-1">
                                        <div className="bg-brand-blue h-1 rounded-full transition-all duration-150" style={{ width: `${progress}%` }}></div>
                                      </div>
                                    </div>
                                  ) : attachmentUrl ? (
                                    <div className="w-full flex flex-col gap-2">
                                      <div className="flex items-center gap-2 bg-blue-50/60 p-2 rounded-lg border border-blue-100 text-left">
                                        <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                                        <div className="min-w-0 flex-1">
                                          <p className="text-[9px] font-extrabold text-slate-400 uppercase">Uploaded report:</p>
                                          <p className="text-xs font-semibold text-[#1B3A8C] truncate">{fileName || "incident_report.pdf"}</p>
                                        </div>
                                      </div>
                                      <div className="flex justify-end gap-2 text-[10px] font-bold">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setState(prev => ({
                                              ...prev,
                                              kpis: {
                                                ...prev.kpis,
                                                [item.attachKey]: "",
                                                [item.fileKey]: ""
                                              }
                                            }));
                                          }}
                                          className="text-red-600 hover:text-red-800 hover:underline uppercase"
                                        >
                                          Delete / Xóa
                                        </button>
                                        <span className="text-slate-300">|</span>
                                        <button
                                          type="button"
                                          onClick={() => document.getElementById(`file-upload-${item.key}`)?.click()}
                                          className="text-[#2E5FD9] hover:underline uppercase"
                                        >
                                          Replace / Thay thế
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="p-1.5 bg-slate-50 rounded-full border border-slate-100 text-[#2E5FD9]">
                                        <Upload className="w-3.5 h-3.5" />
                                      </div>
                                      <div className="text-[10px]">
                                        <button
                                          type="button"
                                          onClick={() => document.getElementById(`file-upload-${item.key}`)?.click()}
                                          className="font-black text-[#2E5FD9] hover:underline"
                                        >
                                          Upload Report
                                        </button>
                                        <span className="text-slate-400"> (PDF/DOC/Image)</span>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 md:col-span-2">
                      <h4 className="text-xs font-black text-brand-blue uppercase tracking-widest mb-3 border-b pb-1.5">
                        AUTOMATIC FORMULA READOUTS / HIỂU THỊ SỐ LIỆU TỰ ĐỘNG THEO CÔNG THỨC DỰ ÁN
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                          <span className="block text-[10px] font-black text-slate-500 uppercase tracking-wide">
                            LTIFR (Lost Time Injury Frequency Rate) / Tần suất tổn thất thời gian
                          </span>
                          <span className="text-lg font-black text-blue-700 font-mono block mt-1">
                            {displayLtifr.toFixed(2)}
                          </span>
                          <p className="text-[10px] text-slate-400 mt-1 italic leading-normal">
                            Formula: (fatalities + accidents) x 200,000 / month safe hours<br />
                            Value: ({state.kpis.fatalities || 0} + {state.kpis.accidents || 0}) x 200,000 / {state.kpis.totalSafeHoursMonth || 0}
                          </p>
                        </div>

                        <div className="bg-white p-3 rounded-lg border border-slate-250 shadow-sm">
                          <span className="block text-[10px] font-black text-slate-500 uppercase tracking-wide">
                            TRIFR (Total Recordable Incident Frequency Rate) / Tần suất tổng chấn thương
                          </span>
                          <span className="text-lg font-black text-indigo-700 font-mono block mt-1">
                            {displayTrifr.toFixed(2)}
                          </span>
                          <p className="text-[10px] text-slate-400 mt-1 italic leading-normal">
                            Formula: accidents x 200,000 / month safe hours<br />
                            Value: {state.kpis.accidents || 0} x 200,000 / {state.kpis.totalSafeHoursMonth || 0}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-slate-705 font-bold text-xs mb-1 text-slate-800 uppercase tracking-wide">
                        HSE Manager Signature / Họ tên chữ ký người báo cáo
                      </label>
                      <input
                        type="text"
                        placeholder="HSE Manager Name / Tên Trưởng ban HSE"
                        value={state.kpis.reporterName || ""}
                        onChange={(e) => setState(prev => ({
                          ...prev,
                          kpis: { ...prev.kpis, reporterName: e.target.value }
                        }))}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 font-semibold focus:ring-1 focus:ring-brand-blue outline-none"
                      />
                    </div>
                  </div>

                  {/* SECTION 2 COMPLETE */}
                  <div className="border-t border-slate-200 pt-5 mt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <label className="inline-flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={state.kpis.completed}
                        onChange={(e) => setState(prev => ({
                          ...prev,
                          kpis: { ...prev.kpis, completed: e.target.checked }
                        }))}
                        className="w-5 h-5 accent-emerald-500 rounded border-slate-300 focus:ring-emerald-500"
                      />
                      <div className="text-slate-800 select-none">
                        <div className="text-xs font-black uppercase text-slate-900 tracking-wide">
                          SIGN-OFF & COMPLETE SECTION 2 / HOÀN THÀNH PHẦN 2
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Confirm safety indicators and KPIs / Xác nhận thông tin dữ liệu KPIs chuẩn
                        </div>
                      </div>
                    </label>

                    {state.kpis.completed && (
                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3.5 py-2 rounded-lg flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <div>
                          <span className="font-extrabold">Completed by / Người hoàn thành:</span>
                          <p className="font-mono text-[10px] mt-0.5">{state.kpis.reporterName || "N/A"}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SECTION 3 CARD (MONTHLY TABLE) */}
              {activeTab === "section-3" && (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 relative">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4 mb-5 gap-3">
                    <div>
                      <h3 className="text-lg font-black text-brand-blue uppercase tracking-tight">
                        SECTION 3 — SAFETY MANHOUR STATISTICS / THỐNG KÊ GIỜ CÔNG AN TOÀN LAO ĐỘNG
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Site HSE Officers enter monthly manhours for 12 construction sites.
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-brand-blue font-extrabold text-xs rounded uppercase tracking-wider">
                      SITE OFFICERS / CÁN BỘ CÔNG TRƯỜNG
                    </span>
                  </div>

                  {/* LARGE HORIZONTAL SCROLL CONTAINER */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-amber-800 mb-4 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      The safety metrics calculated columns automatically adjust based on input. Scroll the table horizontally to access all 12 projects and injury count forms.
                      <p className="mt-0.5 font-bold">Cuộn bảng sang ngang để điền số giờ làm việc cho cả 12 công trường và các chỉ số thương tật.</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-xl custom-scrollbar" style={{ maxWidth: "100%" }}>
                    <table className="w-full text-xs text-left border-collapse min-w-[2400px]">
                      <thead className="bg-slate-100 text-slate-700 tracking-wider font-extrabold uppercase text-[10px] sticky top-0">
                        {/* Level 1 merged headers */}
                        <tr>
                          <th className="py-2.5 px-3 border-b border-r border-slate-200 bg-slate-200 sticky left-0 text-center font-black" rowSpan={2}>
                            Month / Tháng
                          </th>
                          <th className="border-b border-r border-slate-200 p-2 text-center text-brand-blue bg-blue-50/70" colSpan={activeBoardProjects.length}>
                            Monthly Project Sites Man-hours / Số Giờ Công Làm Việc Từng Dự Án (HSE Officers)
                          </th>
                          <th className="border-b border-slate-200 p-2 text-center text-emerald-800 bg-emerald-50/70" colSpan={13}>
                            Calculated Health & Safety Statistics / Kết quả an toàn tính lũy kế
                          </th>
                        </tr>
                        {/* Level 2 headers */}
                        <tr>
                          {activeBoardProjects.map(p => (
                            <th key={p.id} className="p-2 border-b border-r border-slate-200 text-center font-bold font-mono min-w-[110px]">
                              {p.id}
                            </th>
                          ))}

                          <th className="p-2 border-b border-r border-slate-200 font-bold bg-emerald-50 text-center text-emerald-900 min-w-[110px]">
                            Total Hours / Tổng giờ công
                          </th>
                          <th className="p-2 border-b border-r border-slate-200 font-bold bg-emerald-50 text-center text-emerald-900 min-w-[124px]">
                            Safe Hours / Giờ an toàn
                          </th>
                          <th className="p-2 border-b border-r border-slate-200 font-bold bg-amber-50 text-center min-w-[80px]">
                            Fatality / Tử vong
                          </th>
                          <th className="p-2 border-b border-r border-slate-200 font-bold bg-red-50 text-center min-w-[80px]">
                            LTI/ TL tổn thất thời gian
                          </th>
                          <th className="p-2 border-b border-r border-slate-200 font-bold bg-slate-50 text-center min-w-[100px]">
                            LTI Total / Lũy kế LTI
                          </th>
                          <th className="p-2 border-b border-r border-slate-200 font-bold bg-orange-50 text-center min-w-[90px]">
                            LTIFR YTD
                          </th>
                          <th className="p-2 border-b border-r border-slate-200 font-bold bg-amber-50 text-center min-w-[90px]">
                            Days Lost / Số ngày nghỉ
                          </th>
                          <th className="p-2 border-b border-r border-slate-200 font-bold bg-blue-50 text-center min-w-[80px]">
                            MTC/ Sơ cứu tại cơ sở y tế
                          </th>
                          <th className="p-2 border-b border-r border-slate-200 font-bold bg-indigo-50 text-center min-w-[110px]">
                            All Recordable / Ghi nhận
                          </th>
                          <th className="p-2 border-b border-r border-slate-200 font-bold bg-indigo-100 text-center min-w-[100px]">
                            TRIFR YTD/ TL số vụ chấn thương tai nạn
                          </th>
                          <th className="p-2 border-b border-r border-slate-200 font-bold bg-slate-50 text-center min-w-[80px]">
                            First Aid / Sơ cứu
                          </th>
                          <th className="p-2 border-b border-slate-200 font-bold bg-slate-50 text-center min-w-[150px]">
                            Incidents/ Nearmiss / Báo cáo sự cố và tiềm ẩn sự cố
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {rowsWithCumulative.map((row, index) => (
                          <tr key={row.monthIndex} className="hover:bg-slate-50 border-b border-slate-200">
                            {/* Sticky Month column */}
                            <td className="p-2 bg-slate-150 font-bold border-r border-slate-200 sticky left-0 text-slate-800 text-[11px] text-center shrink-0 z-10 w-[120px] shadow-[2px_0_5px_rgba(0,0,0,0.05)] bg-slate-100">
                              {MONTH_NAMES[row.monthIndex].short}-{state.header.year.substring(2)}
                            </td>

                            {/* project inputs */}
                            {activeBoardProjects.map(p => (
                              <td key={p.id} className="p-1 border-r border-slate-200 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  value={row.manhoursByProject[p.id] || ""}
                                  onChange={(e) => updateManhours(index, p.id, parseInt(e.target.value) || 0)}
                                  className="w-full text-center bg-transparent focus:bg-white text-xs p-1 rounded font-medium border border-transparent hover:border-slate-300 focus:border-brand-blue outline-none"
                                />
                              </td>
                            ))}

                            {/* CALCULATED CELLS */}
                            <td className="p-2 border-r border-slate-200 font-black font-mono text-center bg-emerald-50 text-emerald-900 text-[11px]">
                              {row.monthlyTotalManhours.toLocaleString()}
                            </td>
                            <td className="p-2 border-r border-slate-200 font-bold font-mono text-center bg-emerald-50 text-emerald-900 text-[11px]">
                              {row.currentSafeHours.toLocaleString()}
                            </td>

                            {/* Injury Input Fields */}
                            <td className="p-1 border-r border-slate-200 text-center bg-amber-50">
                              <input
                                type="number"
                                min="0"
                                value={row.fatalityCount || ""}
                                onChange={(e) => updateStatsRowField(index, "fatalityCount", parseInt(e.target.value) || 0)}
                                className="w-full text-center bg-transparent focus:bg-white text-xs font-semibold p-1 focus:border-brand-blue outline-none"
                              />
                            </td>
                            <td className="p-1 border-r border-slate-200 text-center bg-red-50">
                              <input
                                type="number"
                                min="0"
                                value={row.ltiCount || ""}
                                onChange={(e) => updateStatsRowField(index, "ltiCount", parseInt(e.target.value) || 0)}
                                className="w-full text-center bg-transparent focus:bg-white text-xs font-semibold p-1 focus:border-brand-blue outline-none"
                              />
                            </td>

                            <td className="p-2 border-r border-slate-200 font-medium font-mono text-center bg-slate-50">
                              {row.ltiTotal}
                            </td>
                            <td className="p-2 border-r border-slate-200 font-bold font-mono text-center bg-orange-50 text-orange-850">
                              {row.ltifr.toFixed(2)}
                            </td>

                            <td className="p-1 border-r border-slate-200 text-center bg-amber-50">
                              <input
                                type="number"
                                min="0"
                                value={row.daysLost || ""}
                                onChange={(e) => updateStatsRowField(index, "daysLost", parseInt(e.target.value) || 0)}
                                className="w-full text-center bg-transparent focus:bg-white text-xs p-1 focus:border-brand-blue outline-none"
                              />
                            </td>
                            <td className="p-1 border-r border-slate-200 text-center bg-blue-50">
                              <input
                                type="number"
                                min="0"
                                value={row.mtcCount || ""}
                                onChange={(e) => updateStatsRowField(index, "mtcCount", parseInt(e.target.value) || 0)}
                                className="w-full text-center bg-transparent focus:bg-white text-xs p-1 focus:border-brand-blue outline-none"
                              />
                            </td>

                            <td className="p-2 border-r border-slate-200 font-medium font-mono text-center bg-indigo-50">
                              {row.allRecordable}
                            </td>
                            <td className="p-2 border-r border-slate-200 font-bold font-mono text-center bg-indigo-150 text-indigo-900">
                              {row.trifr.toFixed(2)}
                            </td>

                            <td className="p-1 border-r border-slate-200 text-center">
                              <input
                                type="number"
                                min="0"
                                value={row.firstAidCount || ""}
                                onChange={(e) => updateStatsRowField(index, "firstAidCount", parseInt(e.target.value) || 0)}
                                className="w-full text-center bg-transparent focus:bg-white p-1"
                              />
                            </td>
                            <td className="p-1 text-center">
                              <input
                                type="number"
                                min="0"
                                value={row.nearmissCount || ""}
                                onChange={(e) => updateStatsRowField(index, "nearmissCount", parseInt(e.target.value) || 0)}
                                className="w-full text-center bg-transparent focus:bg-white p-1"
                              />
                            </td>
                          </tr>
                        ))}

                        {/* ROW GRAND TOTALS */}
                        <tr className="bg-slate-200 text-slate-900 font-extrabold text-[11px] border-t-2 border-brand-blue">
                          <td className="p-2 text-center sticky left-0 bg-slate-300 font-black z-10 border-r border-slate-300 shadow-[2px_0_5px_rgba(0,0,0,0.1)]">
                            OVERALL / TỔNG CỘNG
                          </td>

                          {/* project traffic sums */}
                          {activeBoardProjects.map(p => {
                            const sumProjHours = rowsWithCumulative.reduce((sum, r) => sum + (r.manhoursByProject[p.id] || 0), 0);
                            return (
                              <td key={p.id} className="p-2 border-r border-slate-300 text-center font-mono">
                                {sumProjHours.toLocaleString()}
                              </td>
                            );
                          })}

                          <td className="p-2 border-r border-slate-300 text-center font-black bg-emerald-100 text-emerald-950 font-mono">
                            {totalYtdManhours.toLocaleString()}
                          </td>
                          <td className="p-2 border-r border-slate-300 text-center font-black bg-emerald-100 text-emerald-950 font-mono">
                            {currentSafeHoursYTD.toLocaleString()}
                          </td>

                          <td className="p-2 border-r border-slate-300 text-center bg-amber-100 text-amber-950">
                            {totalYtdFatality}
                          </td>
                          <td className="p-2 border-r border-slate-300 text-center bg-red-100 text-red-950">
                            {totalYtdLti}
                          </td>
                          <td className="p-2 border-r border-slate-300 text-center bg-slate-300">
                            -
                          </td>
                          <td className="p-2 border-r border-slate-300 text-center bg-orange-100 text-orange-950">
                            {calculatedLtifrYtd.toFixed(2)}
                          </td>

                          <td className="p-2 border-r border-slate-300 text-center bg-amber-100">
                            {totalYtdDaysLost}
                          </td>
                          <td className="p-2 border-r border-slate-300 text-center bg-blue-105">
                            {totalYtdMtc}
                          </td>
                          <td className="p-2 border-r border-slate-300 text-center bg-indigo-100">
                            {(totalYtdFatality + totalYtdLti + totalYtdMtc)}
                          </td>
                          <td className="p-2 border-r border-slate-300 text-center bg-indigo-150 text-indigo-950 font-black">
                            {calculatedTrifrYtd.toFixed(2)}
                          </td>

                          <td className="p-2 border-r border-slate-300 text-center">
                            {totalYtdFirstAid}
                          </td>
                          <td className="p-2 text-center">
                            {totalYtdNearmiss}
                          </td>

                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <p className="text-[10px] text-slate-400 mt-2 italic">
                    * LTI (Lost Time Injury): Injury requiring a physician issuing 1 day off work or more / Thương tật mất thời gian làm việc được bác sĩ chỉ định nghỉ tối thiểu 1 ngày.
                  </p>

                  <div className="md:col-span-2 mt-6">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-slate-700 font-bold text-xs uppercase tracking-wide">
                        Safety Officer Name / Người lập biểu danh sách thống kê
                      </label>
                      <TranslateButton
                        value={state.manhourStats.reporterName}
                        onTranslated={(newVal) => setState(prev => ({
                          ...prev,
                          manhourStats: { ...prev.manhourStats, reporterName: newVal }
                        }))}
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Safety Director or Coordinator / Tên Người Thực Hiện Thống Kê"
                      value={state.manhourStats.reporterName}
                      onChange={(e) => setState(prev => ({
                        ...prev,
                        manhourStats: { ...prev.manhourStats, reporterName: e.target.value }
                      }))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 font-semibold focus:ring-2 focus:ring-brand-blue outline-none"
                    />
                  </div>

                  {/* SECTION 3 COMPLETE */}
                  <div className="border-t border-slate-200 pt-5 mt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <label className="inline-flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={state.manhourStats.completed}
                        onChange={(e) => setState(prev => ({
                          ...prev,
                          manhourStats: { ...prev.manhourStats, completed: e.target.checked }
                        }))}
                        className="w-5 h-5 accent-emerald-500 rounded border-slate-300 focus:ring-emerald-500"
                      />
                      <div className="text-slate-800 select-none">
                        <div className="text-xs font-black uppercase text-slate-900 tracking-wide">
                          SIGN-OFF & COMPLETE SECTION 3 / HOÀN THÀNH PHẦN 3
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Confirm project manhours and computed injury statistics / Xác nhận thống kê bảng dữ liệu chuẩn công trường
                        </div>
                      </div>
                    </label>

                    {state.manhourStats.completed && (
                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3.5 py-2 rounded-lg flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <div>
                          <span className="font-extrabold">Completed by / Người hoàn thành:</span>
                          <p className="font-mono text-[10px] mt-0.5">{state.manhourStats.reporterName || "N/A"}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SECTION 4 CARD (ROOT CAUSE ANALYSIS) */}
              {activeTab === "section-4" && (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 relative">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4 mb-5 gap-3">
                    <div>
                      <h3 className="text-lg font-black text-brand-blue uppercase tracking-tight">
                        SECTION 4 — SAFETY VIOLATION REPORTS & ROOT CAUSE ANALYSIS / PHÂN TÍCH NGUYÊN NHÂN SVR CHÍNH
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Examine breach categories and project occurrence density for safety measures.
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-brand-blue font-extrabold text-xs rounded uppercase tracking-wider">
                      HSE MANAGER / TRƯỞNG BAN AN TOÀN
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Categories Violations inputs */}
                    <div>
                      <h4 className="text-xs font-black tracking-wider text-slate-400 uppercase mb-3 border-b border-slate-100 pb-1">
                        SVR / SOR Category Counts / Loại vi phạm
                      </h4>
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2.5 max-h-[460px] overflow-y-auto">
                        {SVR_CATEGORIES.map(cat => {
                          const val = state.svrAnalysis.categoryCounts[cat.id as keyof typeof state.svrAnalysis.categoryCounts] || 0;
                          const pct = svrCategoriesSum > 0 ? ((val / svrCategoriesSum) * 100).toFixed(1) : "0.0";
                          return (
                            <div key={cat.id} className="flex items-center justify-between gap-3 text-xs bg-white p-2 rounded-lg border border-slate-250 shadow-sm">
                              <div className="flex-1">
                                <p className="font-bold text-slate-800">{cat.labelEn}</p>
                                <p className="text-[10px] text-slate-400 font-medium">{cat.labelVn}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <input
                                  type="number"
                                  min="0"
                                  value={val || ""}
                                  onChange={(e) => setState(prev => ({
                                    ...prev,
                                    svrAnalysis: {
                                      ...prev.svrAnalysis,
                                      categoryCounts: {
                                        ...prev.svrAnalysis.categoryCounts,
                                        [cat.id]: parseInt(e.target.value) || 0
                                      }
                                    }
                                  }))}
                                  className="w-16 text-center border border-slate-300 rounded font-bold p-1 bg-slate-50 focus:bg-white text-slate-700 focus:ring-1 focus:ring-brand-blue"
                                />
                                <span className="text-[10px] text-slate-400 font-bold shrink-0 min-w-[34px] text-right">
                                  {pct}%
                                </span>
                              </div>
                            </div>
                          );
                        })}
                        <div className="flex justify-between items-center text-xs font-black border-t pt-2 mt-2 px-2 text-brand-blue">
                          <span>TOTAL CATEGORY COUNT / TỔNG SỐ SVR:</span>
                          <span className="font-mono text-sm">{svrCategoriesSum}</span>
                        </div>
                      </div>
                    </div>

                    {/* SVR by Project Inputs */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-xs font-black tracking-wider text-slate-400 uppercase border-b border-slate-100 pb-1">
                          SVR Issued By Project Site / Số lượng SVR từng công trường
                        </h4>
                        <button
                          type="button"
                          onClick={() => {
                            // Automatically grab totals from the Month rows in Section 3 table!
                            const updatedProjectCounts = { ...state.svrAnalysis.projectCounts };
                            PROJECT_NAMES.forEach(p => {
                              // Sum safety violation reports issued in section 3 table for project p.id
                              // Wait! The Monthly statistic has "svrIssuedCount" per row, but does not split SVR by project month rows.
                              // So we can compute a proportional estimate or let user update manually.
                              // Since SVR count is specific to project site, we keep manual values, but we can help sync total SVR sum.
                            });
                          }}
                          className="text-[10px] bg-slate-100 hover:bg-slate-250 text-brand-blue font-extrabold px-2 py-1 rounded"
                          title="SVR distributions by site can be manually balanced below to feed the project bar charts cleanly"
                        >
                          Manual Balanced Entry
                        </button>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 grid grid-cols-2 gap-2 max-h-[460px] overflow-y-auto">
                        {activeBoardProjects.map(p => {
                          const val = state.svrAnalysis.projectCounts[p.id] || 0;
                          return (
                            <div key={p.id} className="flex flex-col justify-between p-2 bg-white rounded-lg border border-slate-200">
                              <span className="font-extrabold text-[10px] text-slate-500 font-mono select-none">
                                {p.id}
                              </span>
                              <div className="flex justify-between items-center mt-1">
                                <span className="text-[10px] truncate text-slate-700 shrink-0 max-w-[80%] pr-1">
                                  {p.name.replace(` (${p.id})`, "")}
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  value={val || ""}
                                  onChange={(e) => setState(prev => ({
                                    ...prev,
                                    svrAnalysis: {
                                      ...prev.svrAnalysis,
                                      projectCounts: {
                                        ...prev.svrAnalysis.projectCounts,
                                        [p.id]: parseInt(e.target.value) || 0
                                      }
                                    }
                                  }))}
                                  className="w-12 text-center font-bold border border-slate-300 rounded p-0.5 text-xs bg-slate-50 focus:bg-white text-slate-700"
                                />
                              </div>
                            </div>
                          );
                        })}
                        <div className="col-span-2 flex justify-between items-center text-xs font-black border-t pt-2 mt-2 px-2 text-brand-blue">
                          <span>TOTAL YTD SVR BY SITE / SVR TẤT CẢ CÁC SITE:</span>
                          <span className="font-mono text-sm">{svrByProjectSum}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* LIVE REALTIME CHARTS RENDER PREVIEWS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 border-t border-slate-200 pt-8">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest text-center mb-3">
                        Donut Chart: SVR Root Cause / Tỷ lệ nguyên nhân vi phạm
                      </h4>
                      <div className="h-64 relative bg-slate-50 rounded-lg p-2 border border-slate-200">
                        <canvas ref={donutChartRef}></canvas>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest text-center mb-3">
                        Bar Chart: SVR count by Project Site / Số lượng SVR từng dự án
                      </h4>
                      <div className="h-64 relative bg-slate-50 rounded-lg p-2 border border-slate-200">
                        <canvas ref={barChartRef}></canvas>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 mt-6">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-slate-700 font-bold text-xs uppercase tracking-wide">
                        HSE Manager Reporter Name / Họ tên người thiết lập báo cáo vi phạm
                      </label>
                      <TranslateButton
                        value={state.svrAnalysis.reporterName}
                        onTranslated={(newVal) => setState(prev => ({
                          ...prev,
                          svrAnalysis: { ...prev.svrAnalysis, reporterName: newVal }
                        }))}
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Manager full name / Nhập tên đầy đủ"
                      value={state.svrAnalysis.reporterName}
                      onChange={(e) => setState(prev => ({
                        ...prev,
                        svrAnalysis: { ...prev.svrAnalysis, reporterName: e.target.value }
                      }))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 font-semibold focus:ring-2 focus:ring-brand-blue outline-none"
                    />
                  </div>

                  {/* SECTION 4 COMPLETE */}
                  <div className="border-t border-slate-200 pt-5 mt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <label className="inline-flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={state.svrAnalysis.completed}
                        onChange={(e) => setState(prev => ({
                          ...prev,
                          svrAnalysis: { ...prev.svrAnalysis, completed: e.target.checked }
                        }))}
                        className="w-5 h-5 accent-emerald-500 rounded border-slate-300 focus:ring-emerald-500"
                      />
                      <div className="text-slate-800 select-none">
                        <div className="text-xs font-black uppercase text-slate-900 tracking-wide">
                          SIGN-OFF & COMPLETE SECTION 4 / HOÀN THÀNH PHẦN 4
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Confirm violation statistics and root causes / Xác nhận dồn số liệu và tóm tắt rủi ro vi phạm an toàn
                        </div>
                      </div>
                    </label>

                    {state.svrAnalysis.completed && (
                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3.5 py-2 rounded-lg flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <div>
                          <span className="font-extrabold">Completed by / Người hoàn thành:</span>
                          <p className="font-mono text-[10px] mt-0.5">{state.svrAnalysis.reporterName || "N/A"}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SECTION 5 CARD */}
              {activeTab === "section-5" && (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 relative">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4 mb-5 gap-3">
                    <div>
                      <h3 className="text-lg font-black text-brand-blue uppercase tracking-tight">
                        SECTION 5 — SAFE PHOTOS / HÌNH ẢNH AN TOÀN
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Showcase and verify high quality safety initiatives implemented on work sites.
                      </p>
                      <p className="text-[10px] text-emerald-700 font-bold mt-1.5 bg-emerald-50/70 px-2.5 py-1 rounded border border-emerald-200 inline-block font-sans">
                        ℹ️ Hình ảnh thực tế được hiển thị nguyên bản 100% dạng gốc tải lên từ thiết bị, không dùng AI chỉnh sửa ảnh hay tạo lập hình ảnh tương đương. Nếu trống sẽ hiển thị "Không có hình ảnh" / Images are displayed with 100% original uploaded file fidelity without AI edit or synthetic simulation.
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-800 font-extrabold text-xs rounded uppercase tracking-wider">
                      SAFETY CAMERAS / ẢNH THỰC TẾ
                    </span>
                  </div>

                  {/* FORM TO ADD NEW WORK PICTURE */}
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 mb-6 space-y-4">
                    <h4 className="text-xs font-black text-brand-blue uppercase tracking-widest border-b pb-2">
                      Add New Safety Photo / Thêm Ảnh Thực Hành An Toàn Mới
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="block text-slate-700 font-bold text-[11px] uppercase">
                            Photo Title / Tiêu đề hình ảnh (English / Vietnamese)
                          </label>
                          <TranslateButton
                            value={newImgTitle}
                            onTranslated={(newVal) => setNewImgTitle(newVal)}
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="e.g. Scaffolding inspection or Toolbox briefing..."
                          value={newImgTitle}
                          onChange={(e) => setNewImgTitle(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-brand-blue outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold text-[11px] mb-1.5 uppercase">
                          Project Site / Công trường dự án
                        </label>
                        <select
                          value={newImgProj}
                          onChange={(e) => setNewImgProj(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-brand-blue outline-none"
                        >
                          {activeBoardProjects.map(p => (
                             <option key={p.id} value={p.id}>{p.name}</option>
                           ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold text-[11px] mb-1.5 uppercase">
                          Image Category / Phân nhóm hình ảnh
                        </label>
                        <select
                          value={newImgCat}
                          onChange={(e) => setNewImgCat(e.target.value as any)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-brand-blue outline-none"
                        >
                          <option value="measures">Mục 1: Biện pháp an toàn / Safety measures</option>
                          <option value="inspection">Mục 2: Hình ảnh kiểm tra / Inspection</option>
                          <option value="training">Mục 3: Huấn luyện, Toolbox, CT an toàn / Training, Toolbox, Programs</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <div className="flex justify-between items-center mb-1.5 font-sans">
                          <label className="block text-slate-700 font-bold text-[11px] uppercase">
                            Observation Details / Mô tả thực tế công việc đạt chuẩn
                          </label>
                          <TranslateButton
                            value={newImgDesc}
                            onTranslated={(newVal) => setNewImgDesc(newVal)}
                          />
                        </div>
                        <textarea
                          rows={2}
                          placeholder="Type details in English and Vietnamese... e.g. 100% compliant PPE..."
                          value={newImgDesc}
                          onChange={(e) => setNewImgDesc(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-medium text-slate-800 focus:ring-1 focus:ring-brand-blue outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold text-[11px] mb-1.5 uppercase">
                          Audit Date / Ngày thực hiện kiểm tra
                        </label>
                        <input
                          type="date"
                          value={newImgDate}
                          onChange={(e) => setNewImgDate(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono text-slate-800 focus:ring-1 focus:ring-brand-blue outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold text-[11px] mb-1.5 uppercase">
                          Custom Image URL / Đường dẫn ảnh tùy chọn
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. https://... or select a preset below"
                          value={uploadedUrl}
                          onChange={(e) => setUploadedUrl(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:ring-1 focus:ring-brand-blue outline-none"
                        />
                      </div>
                    </div>

                    {/* INTERACTIVE DRAG AND DROP ZONE */}
                    <div className="space-y-2 mt-3">
                      <span className="block text-slate-700 font-bold text-[11px] uppercase">
                        Drag & Drop Upload / Kéo thả ảnh hoặc chọn tệp tải lên
                      </span>
                      
                      <div
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleFileDrop}
                        onClick={() => document.getElementById("file-upload-input")?.click()}
                        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition ${
                          dragOver
                            ? "border-brand-blue bg-blue-50/50"
                            : "border-slate-300 hover:border-slate-400 bg-white"
                        }`}
                      >
                        <input
                          id="file-upload-input"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileSelect}
                        />
                        <div className="flex flex-col items-center justify-center gap-1.5 text-slate-500">
                          {uploadProgress !== null ? (
                            <div className="w-full max-w-xs space-y-2">
                              <div className="flex justify-between text-[11px] font-bold text-brand-blue">
                                <span>Uploading image / Đang tải tệp lên...</span>
                                <span>{uploadProgress}%</span>
                              </div>
                              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-brand-blue h-1.5 rounded-full transition-all duration-150" style={{ width: `${uploadProgress}%` }}></div>
                              </div>
                            </div>
                          ) : justAddedFeedback ? (
                            <div className="flex flex-col items-center gap-1.5 text-xs text-emerald-600 font-bold font-sans p-2">
                              <div className="flex items-center gap-2">
                                <span className="p-1 px-2 bg-emerald-100 rounded-full text-emerald-700 font-black animate-pulse text-sm">✓</span>
                                <span>Auto-Saved & Added to Catalog / Đã tự động lưu thành công!</span>
                              </div>
                              <div className="text-[11px] text-slate-500 font-extrabold max-w-md text-center">
                                Saved: "{justAddedFeedback}" to category "{newImgCat === "measures" ? "Biện pháp an toàn / Safety measures" : newImgCat === "inspection" ? "Hình ảnh kiểm tra / Inspection" : "Huấn luyện & Toolbox / Training & Toolbox"}"
                              </div>
                              <div className="text-[10px] text-[#2E5FD9] font-black underline underline-offset-2 mt-1">
                                Choose another category above or drop more files to continue uploading! / Bạn có thể tiếp tục đổi phân nhóm phía trên để tải tiếp ảnh khác!
                              </div>
                            </div>
                          ) : uploadedUrl ? (
                            <div className="flex items-center gap-2 text-xs text-emerald-600 font-bold">
                              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                              <span>Image selected successfully! / Đã đính kèm ảnh thành công!</span>
                            </div>
                          ) : (
                            <>
                              <FileText className="w-7 h-7 text-slate-400" />
                              <p className="text-xs font-semibold text-slate-700">
                                Click or drag custom construction photos here / Bấm hoặc thả ảnh công trường vào đây
                              </p>
                              <p className="text-[10px] text-slate-400">
                                Uploaded photos will automatically be saved to the selected category / Hình ảnh tải lên sẽ tự động lưu vào phân nhóm đang chọn
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* RECOMMENDATIONS & SUGGESTIONS FOR SAFE PHOTOS */}
                    <div className="pt-3 border-t border-slate-200">
                      <span className="block text-slate-700 font-bold text-[10px] uppercase mb-2 tracking-wider">
                        Suggested Photo Guidelines & Contents / Gợi ý nội dung hình ảnh nên upload:
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-slate-700">
                          <p className="font-extrabold text-brand-blue uppercase text-[10px] mb-1.5 flex items-center gap-1 font-sans">
                            <span className="w-1.5 h-1.5 bg-brand-blue rounded-full"></span>
                            Safety Measures / Biện pháp
                          </p>
                          <ul className="list-disc pl-3.5 space-y-1 text-slate-600 text-[10.5px] font-medium leading-relaxed">
                            <li><strong>PPE compliant:</strong> Workers equipped with proper safety gear (helmet, harness).</li>
                            <li><strong>Fall protections:</strong> Stable guardrails, pristine working platforms or lifelines.</li>
                          </ul>
                        </div>
                        <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg text-slate-700">
                          <p className="font-extrabold text-indigo-800 uppercase text-[10px] mb-1.5 flex items-center gap-1 font-sans">
                            <span className="w-1.5 h-1.5 bg-indigo-700 rounded-full"></span>
                            Inspection / Kiểm tra
                          </p>
                          <ul className="list-disc pl-3.5 space-y-1 text-slate-600 text-[10.5px] font-medium leading-relaxed">
                            <li><strong>Approved Scaffold:</strong> Scafftags green sign showing "Safe to Use" inspections.</li>
                            <li><strong>Electrical panels:</strong> Watertight construction DB box with ELCB protection active.</li>
                          </ul>
                        </div>
                        <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-lg text-slate-700">
                          <p className="font-extrabold text-emerald-800 uppercase text-[10px] mb-1.5 flex items-center gap-1 font-sans">
                            <span className="w-1.5 h-1.5 bg-emerald-700 rounded-full"></span>
                            Training & Briefing / Huấn luyện
                          </p>
                          <ul className="list-disc pl-3.5 space-y-1 text-slate-600 text-[10.5px] font-medium leading-relaxed">
                            <li><strong>Daily Toolbox:</strong> Pre-start meetings with crew members listing daily hazards.</li>
                            <li><strong>Site Inductions:</strong> Training sessions with clear visual records of trainees.</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={addSafetyImage}
                        disabled={!newImgTitle.trim()}
                        className="px-5 py-2.5 bg-brand-blue hover:bg-[#152e74] disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-black uppercase rounded shadow transition cursor-pointer"
                      >
                        Add Photograph / Thêm Vào Danh Sách
                      </button>
                    </div>
                  </div>

                  {/* COMPLETION VALIDATION CHECKLIST */}
                  <div className={`p-4 rounded-xl border mb-6 ${
                    canSignOff
                      ? "bg-emerald-50/70 border-emerald-200 text-emerald-800"
                      : "bg-amber-50 border-amber-200 text-amber-900"
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className={`p-1.5 rounded-lg shrink-0 ${canSignOff ? "bg-emerald-100" : "bg-amber-100"}`}>
                        <ShieldCheck className={`w-5 h-5 ${canSignOff ? "text-emerald-700" : "text-amber-700"}`} />
                      </div>
                      <div className="flex-1 text-xs">
                        <span className="font-extrabold uppercase block tracking-wider text-[11px]">
                          {activeProjectId} SIGN-OFF REQUIREMENTS / HÌNH ẢNH MINH HỌA HOÀN THÀNH BÁO CÁO ({activeProjectId})
                        </span>
                        <p className="mt-1 font-medium leading-relaxed font-sans">
                          {isPendingOrFinished ? (
                            <span className="text-emerald-700 font-extrabold bg-emerald-100/50 px-2 py-1 rounded inline-block mt-0.5">
                              ℹ️ This project is in <span className="underline font-black">{activeProjectStatus}</span> status. Image upload is OPTIONAL and NOT required for full report completion / Dự án ở trạng thái {activeProjectStatus} không bắt buộc phải tải lên hình ảnh an toàn để hoàn tất báo cáo.
                            </span>
                          ) : (
                            <>
                              Each active project account (<span className="font-extrabold text-[#1B3A8C]">{activeProjectName}</span>) must register <span className="font-black underline">at least 1 safety photograph</span> in Section 5 to be compliant for submission sign-off. Images are displayed with 100% original fidelity without any AI edit or crop / Hình ảnh thực tế được hiển thị nguyên bản dạng gốc tải lên, không qua chỉnh sửa AI.
                            </>
                          )}
                        </p>
                        <div className="mt-2.5 flex flex-wrap items-center gap-2 font-mono font-bold">
                          <span>Compliance Status / Trạng thái đạt chuẩn:</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wide inline-block font-extrabold text-white ${
                            isPendingOrFinished ? "bg-emerald-600" : (hasRequiredImages ? "bg-emerald-600" : (isSkipped ? "bg-blue-600" : "bg-amber-600"))
                          }`}>
                            {isPendingOrFinished
                              ? `COMPLIANT (Project Status: ${activeProjectStatus} - Images Optional / Không yêu cầu ảnh)`
                              : (hasRequiredImages
                                ? `COMPLIANT (✓ ${activeProjectImagesCount} photos registered)`
                                : (isSkipped
                                  ? "SKIPPED & COMPLETED (✓ Đã bỏ qua và hoàn tất)"
                                  : `NON-COMPLIANT (✗ Only ${activeProjectImagesCount}/1 photos registered)`))}
                          </span>
                        </div>

                        {activeProjectImagesCount === 0 && (
                          <div className="mt-3.5 pt-3 border-t border-slate-200/60 flex flex-wrap items-center gap-3">
                            {!isSkipped ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setState(prev => ({
                                    ...prev,
                                    safetyPractices: {
                                      ...prev.safetyPractices || { completed: false, images: [] },
                                      skipped: true,
                                      completed: true
                                    }
                                  }));
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-black uppercase shadow-sm transition hover:shadow cursor-pointer"
                              >
                                <SkipForward className="w-3.5 h-3.5" /> Skip & Complete / Bỏ qua & Hoàn thành Section 5
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setState(prev => ({
                                    ...prev,
                                    safetyPractices: {
                                      ...prev.safetyPractices || { completed: false, images: [] },
                                      skipped: false,
                                      completed: false
                                    }
                                  }));
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded text-xs font-bold uppercase transition cursor-pointer"
                              >
                                Restore photo requirement / Khôi phục yêu cầu ảnh
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ACTIVE IMAGES LIST GROUPED BY CATEGORIES */}
                  <div className="space-y-6">
                    <div className="flex justify-between items-center border-b pb-2 mb-4">
                      <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">
                        Grouped Photographs Catalog / Danh mục hình ảnh thực tế tốt ({state.safetyPractices?.images?.length || 0})
                      </h4>
                      {(state.safetyPractices?.images?.length || 0) === 0 && (
                        <button
                          type="button"
                          onClick={resetToSampleSafetyImages}
                          className="px-3 py-1.5 text-[10px] text-[#2E5FD9] hover:text-blue-700 bg-blue-50 hover:bg-blue-100 font-extrabold rounded-lg flex items-center gap-1 transition animate-pulse cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Load Default Images / Tải lại ảnh mặc định</span>
                        </button>
                      )}
                    </div>

                    {(() => {
                      const imgs = state.safetyPractices?.images || [];
                      const cat1 = imgs.filter(img => img.category === "measures" || !img.category);
                      const cat2 = imgs.filter(img => img.category === "inspection");
                      const cat3 = imgs.filter(img => img.category === "training");

                      return (
                        <div className="space-y-6">
                          {/* CATEGORY 1 PANEL */}
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                            <h5 className="text-xs font-black text-[#1B3A8C] uppercase tracking-wider border-b pb-1.5 mb-3 flex items-center justify-between">
                              <span>Mục 1: Biện pháp an toàn / Safety measures</span>
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-mono text-[9px]">{cat1.length} images</span>
                            </h5>
                            {cat1.length === 0 ? (
                              <p className="text-slate-400 text-[11px] italic py-2 pl-1">No images registered in this category / Chưa có ảnh ở mục này.</p>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
                                {cat1.map((img) => (
                                  <div key={img.id} className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm flex gap-3 p-3 transition hover:border-[#2E5FD9]">
                                    {img.imageUrl ? (
                                      <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-slate-100 border relative">
                                        <img
                                          src={img.imageUrl}
                                          alt={img.title}
                                          referrerPolicy="no-referrer"
                                          className="object-contain w-full h-full"
                                        />
                                        <span className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/75 text-white rounded font-mono text-[8px]">
                                          {img.projectName.split(" (")[0]}
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="w-24 h-24 shrink-0 rounded-lg bg-slate-100 border flex flex-col items-center justify-center text-center p-1 text-[8.5px] text-slate-400 font-bold uppercase select-none leading-normal">
                                        <span>Không có</span>
                                        <span>hình ảnh</span>
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                                      <div>
                                        <div className="flex justify-between items-start gap-2">
                                          <h6 className="font-extrabold text-xs text-[#1B3A8C] truncate uppercase">{img.title}</h6>
                                          <button
                                            onClick={() => deleteSafetyImage(img.id)}
                                            className="p-1 text-slate-400 hover:text-red-655 text-red-600 transition shrink-0 cursor-pointer"
                                            title="Delete image"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                        <p className="text-[10px] text-[#2E5FD9] font-black uppercase mt-0.5">{img.projectName}</p>
                                        <p className="text-[10px] text-slate-500 line-clamp-2 mt-1 leading-normal italic">{img.description}</p>
                                      </div>
                                      <div className="text-[9px] text-slate-400 font-mono mt-1 pt-1 border-t text-right">
                                        Date: {img.date}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* CATEGORY 2 PANEL */}
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                            <h5 className="text-xs font-black text-[#1B3A8C] uppercase tracking-wider border-b pb-1.5 mb-3 flex items-center justify-between">
                              <span>Mục 2: Hình ảnh kiểm tra / Inspection</span>
                              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-mono text-[9px]">{cat2.length} images</span>
                            </h5>
                            {cat2.length === 0 ? (
                              <p className="text-slate-400 text-[11px] italic py-2 pl-1">No images registered in this category / Chưa có ảnh ở mục này.</p>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
                                {cat2.map((img) => (
                                  <div key={img.id} className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm flex gap-3 p-3 transition hover:border-[#2E5FD9]">
                                    {img.imageUrl ? (
                                      <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-slate-100 border relative">
                                        <img
                                          src={img.imageUrl}
                                          alt={img.title}
                                          referrerPolicy="no-referrer"
                                          className="object-contain w-full h-full"
                                        />
                                        <span className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/75 text-white rounded font-mono text-[8px]">
                                          {img.projectName.split(" (")[0]}
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="w-24 h-24 shrink-0 rounded-lg bg-slate-100 border flex flex-col items-center justify-center text-center p-1 text-[8.5px] text-slate-400 font-bold uppercase select-none leading-normal">
                                        <span>Không có</span>
                                        <span>hình ảnh</span>
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                                      <div>
                                        <div className="flex justify-between items-start gap-2">
                                          <h6 className="font-extrabold text-xs text-[#1B3A8C] truncate uppercase">{img.title}</h6>
                                          <button
                                            onClick={() => deleteSafetyImage(img.id)}
                                            className="p-1 text-slate-400 hover:text-red-150 text-red-600 transition shrink-0 cursor-pointer"
                                            title="Delete image"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                        <p className="text-[10px] text-[#2E5FD9] font-black uppercase mt-0.5">{img.projectName}</p>
                                        <p className="text-[10px] text-slate-500 line-clamp-2 mt-1 leading-normal italic">{img.description}</p>
                                      </div>
                                      <div className="text-[9px] text-slate-400 font-mono mt-1 pt-1 border-t text-right">
                                        Date: {img.date}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* CATEGORY 3 PANEL */}
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                            <h5 className="text-xs font-black text-[#1B3A8C] uppercase tracking-wider border-b pb-1.5 mb-3 flex items-center justify-between">
                              <span>Mục 3: Huấn luyện, Toolbox meeting & chương trình an toàn / Training, Toolbox, Programs</span>
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-mono text-[9px]">{cat3.length} images</span>
                            </h5>
                            {cat3.length === 0 ? (
                              <p className="text-slate-400 text-[11px] italic py-2 pl-1">No images registered in this category / Chưa có ảnh ở mục này.</p>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
                                {cat3.map((img) => (
                                  <div key={img.id} className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm flex gap-3 p-3 transition hover:border-[#2E5FD9]">
                                    {img.imageUrl ? (
                                      <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-slate-100 border relative">
                                        <img
                                          src={img.imageUrl}
                                          alt={img.title}
                                          referrerPolicy="no-referrer"
                                          className="object-contain w-full h-full"
                                        />
                                        <span className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/75 text-white rounded font-mono text-[8px]">
                                          {img.projectName.split(" (")[0]}
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="w-24 h-24 shrink-0 rounded-lg bg-slate-100 border flex flex-col items-center justify-center text-center p-1 text-[8.5px] text-slate-400 font-bold uppercase select-none leading-normal">
                                        <span>Không có</span>
                                        <span>hình ảnh</span>
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                                      <div>
                                        <div className="flex justify-between items-start gap-2">
                                          <h6 className="font-extrabold text-xs text-[#1B3A8C] truncate uppercase">{img.title}</h6>
                                          <button
                                            onClick={() => deleteSafetyImage(img.id)}
                                            className="p-1 text-slate-400 hover:text-red-150 text-red-600 transition shrink-0 cursor-pointer"
                                            title="Delete image"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                        <p className="text-[10px] text-[#2E5FD9] font-black uppercase mt-0.5">{img.projectName}</p>
                                        <p className="text-[10px] text-slate-500 line-clamp-2 mt-1 leading-normal italic">{img.description}</p>
                                      </div>
                                      <div className="text-[9px] text-slate-400 font-mono mt-1 pt-1 border-t text-right">
                                        Date: {img.date}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* SIGN-OFF CHECKBOX SECTION */}
                  <div className="border-t border-slate-200 pt-5 mt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <label className="inline-flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={!canSignOff}
                        checked={(state.safetyPractices?.completed || isPendingOrFinished) && canSignOff}
                        onChange={(e) => {
                          if (!canSignOff) return;
                          setState(prev => ({
                            ...prev,
                            safetyPractices: {
                              ...prev.safetyPractices || { completed: false, images: [] },
                              completed: e.target.checked
                            }
                          }));
                        }}
                        className={`w-5 h-5 rounded border-slate-300 focus:ring-emerald-500 ${
                          canSignOff ? "accent-emerald-500 cursor-pointer" : "bg-slate-200 cursor-not-allowed opacity-50"
                        }`}
                      />
                      <div className="text-slate-800 select-none">
                        <div className="text-xs font-black uppercase text-slate-900 tracking-wide">
                          SIGN-OFF & COMPLETE SECTION 5 / HOÀN THÀNH PHẦN 5
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {isPendingOrFinished
                            ? "ℹ️ Bypassed: Image upload is optional for Pending or Finish projects / Được miễn trừ tự động vì dự án đang ở trạng thái Tạm dừng hoặc Hoàn thành"
                            : (canSignOff
                              ? (isSkipped ? "ℹ️ Completed with bypassed safety photos / Báo cáo không có ảnh an toàn (Đã bỏ qua)" : "Confirm site inspections with good safety photographs are correct / Xác nhận hình ảnh thực tế tốt đạt chuẩn")
                              : "⚠️ Disabled: Add at least 1 safety photo or click Skip in the checklist to proceed / Đăng ký tối thiểu 1 ảnh hoặc bấm bỏ qua")}
                        </div>
                      </div>
                    </label>

                    {(state.safetyPractices?.completed || isPendingOrFinished) && canSignOff && (
                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3.5 py-2 rounded-lg flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <div>
                          <span className="font-extrabold">{isPendingOrFinished ? "Bypassed / Miễn trừ" : "Completed by / Người hoàn thành:"}</span>
                          <p className="font-mono text-[10px] mt-0.5">{isPendingOrFinished ? "Images Optional / Không bắt buộc" : (state.header.reporterName || "N/A")}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SECTION PROGRESS SIGNATURE COMPLIANCE CARDS PAGE (BOTTOM SUMMARY VIEW IN EDIT MODE) */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 mt-6">
                <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest border-b pb-2.5 mb-4">
                  DIGITAL SIGN-OFF LIST / TRANG CHỮ KÝ SỐ LIỆU ĐIỆN TỬ
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 font-sans">
                  {[
                    { title: "General Information", subtitle: "Thông tin chung", num: "Phần 1", completed: state.header.completed, name: state.header.reporterName || "N/A", isBypassed: false },
                    { title: "KPI Indicators", subtitle: "Chỉ số KPIs chính", num: "Phần 2", completed: state.kpis.completed, name: state.kpis.reporterName || "N/A", isBypassed: false },
                    { title: "Manhours Statistics", subtitle: "Báo cáo giờ công", num: "Phần 3", completed: state.manhourStats.completed, name: state.manhourStats.reporterName || "N/A", isBypassed: false },
                    { title: "SVR Root Causes", subtitle: "Phân tích vi phạm", num: "Phần 4", completed: state.svrAnalysis.completed, name: state.svrAnalysis.reporterName || "N/A", isBypassed: false },
                    { title: "Safe Photos", subtitle: "Hình ảnh an toàn", num: "Phần 5", completed: state.safetyPractices?.completed || isPendingOrFinished, name: isPendingOrFinished ? "Project Status" : (state.safetyPractices?.reporterName || state.header.reporterName || "N/A"), isBypassed: isPendingOrFinished },
                    { title: "Admin Sign-off (L2)", subtitle: "Phê duyệt tổng hợp", num: "Phê duyệt", completed: !!approvedProjects[activeProjectId], name: synthesizerName, isBypassed: false }
                  ].map((s, idx) => {
                    const isCompleted = s.completed;
                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border transition duration-300 flex flex-col justify-between gap-3 ${
                          isCompleted
                            ? "bg-emerald-50/50 border-emerald-200 shadow-sm"
                            : "bg-slate-50 border-slate-200 text-slate-500"
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] font-black uppercase text-slate-400 font-mono">{s.num}</span>
                            {isCompleted ? (
                              <span className="bg-emerald-100 text-emerald-800 font-black text-[9px] px-2 py-0.5 rounded tracking-wide uppercase shadow-sm">
                                {s.isBypassed ? "BYPASSED / MIỄN TRỪ" : "COMPLETED"}
                              </span>
                            ) : (
                              <span className="bg-slate-200 text-slate-600 font-bold text-[9px] px-2 py-0.5 rounded tracking-wide uppercase">
                                PENDING
                              </span>
                            )}
                          </div>
                          <h4 className="font-extrabold text-slate-800 text-xs mt-1.5">{s.title}</h4>
                          <p className="text-[10px] text-slate-400 font-medium leading-tight">{s.subtitle}</p>
                        </div>

                        <div className="border-t border-slate-100 pt-2 flex items-center gap-1.5">
                          {isCompleted ? (
                            <>
                              <div className="p-1 bg-emerald-500 rounded-full text-white">
                                <Check className="w-3 h-3" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[9px] text-slate-400 font-bold uppercase truncate">
                                  {s.isBypassed ? "Project Status" : "Sign-off by / Chữ ký số"}
                                </p>
                                <p className="text-[10px] font-mono font-bold text-slate-700 truncate">
                                  {s.isBypassed ? `${activeProjectStatus} (Optional)` : s.name}
                                </p>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="p-1 bg-slate-200 rounded-full text-slate-400">
                                <Circle className="w-3 h-3 text-slate-400 fill-slate-100" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[9px] text-slate-400 font-bold uppercase">Awaiting entry</p>
                                <p className="text-[10px] text-slate-400 italic truncate font-semibold animate-pulse text-amber-600">Chờ xác nhận</p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {completedCount === 5 ? (
                  <div className="bg-emerald-500 text-white rounded-xl p-4 mt-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in zoom-in-95">
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-wider">ALL SECTIONS COMPLETED / TOÀN BỘ CÁC BÁO CÁO ĐÃ HOÀN TẤT!</h4>
                      <p className="text-xs opacity-90 mt-1">
                        You can now view the formatted full HSE Monthly Dashboard ready to export to PDF for safety registry.
                      </p>
                    </div>
                    <button
                      onClick={() => setViewMode("summary")}
                      className="px-5 py-2.5 bg-white text-emerald-800 font-extrabold text-sm rounded-lg shadow-md hover:bg-slate-50 transition transform hover:scale-[1.03] duration-150 shrink-0"
                    >
                      VIEW SUMMARY DASHBOARD / XEM TỔNG HỢP & IN BÁO CÁO
                    </button>
                  </div>
                ) : (
                  <div className="bg-blue-50 text-[#1B3A8C] rounded-xl p-4 mt-6 border border-blue-100 text-xs flex gap-2 items-center">
                    <Milestone className="w-5 h-5 text-[#2E5FD9] shrink-0" />
                    <div>
                      Please complete and tick the Sign-off checkboxes of all 5 sections (Currently: {completedCount}/5) to unlock the master summary view widget.
                      <p className="font-bold">Đánh dấu tích vào ô hoàn thành của cả 5 biểu mẫu bên trên để xem dữ liệu tổng hợp chính thức.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SUMMARY DASHBOARD PAGE VIEW */}
        {viewMode === "summary" && (() => {
          const projectSummaryList = activeBoardProjects.map((pn) => {
            const hSum = rowsWithCumulative.reduce((sum, r) => sum + (r.manhoursByProject[pn.id] || 0), 0);
            const sCounts = state.svrAnalysis.projectCounts[pn.id] || 0;
            return {
              id: pn.id,
              name: pn.name,
              hours: hSum,
              svrs: sCounts,
            };
          });

          return (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* PRINT-ONLY CORPORATE LOGO HEADER */}
              <div className="hidden print:flex justify-between items-center border-b-2 border-[#1B3A8C] pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-[#1B3A8C] flex items-center justify-center w-12 h-12 rounded">
                    <span className="font-sans font-black text-2.5xl text-white">H</span>
                  </div>
                  <div>
                    <h1 className="font-extrabold text-sm tracking-tight leading-tight uppercase text-[#1B3A8C]">
                      HANDONG ENGINEERING & CONSTRUCTION
                    </h1>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                      HSE MANAGEMENT SYSTEM / HỆ THỐNG AN TOÀN LAO ĐỘNG
                    </p>
                  </div>
                </div>
                <div className="text-right text-slate-800">
                  <p className="text-[10px] font-mono font-bold">DATE: 2026-06-03 UTC</p>
                  <p className="text-xs font-black text-[#1B3A8C]">HSE MONTHLY BRIEFING</p>
                </div>
              </div>

              {/* SCREEN-ONLY SUMMARY CONTROLS */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 print:hidden shadow-sm">
                <div>
                  <h3 className="text-sm font-bold text-[#1B3A8C] uppercase tracking-wider">
                    HSSE Dashboard / Bảng Tổng Hợp HSSE
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live consolidated view. Admin Mode: Reviewing reports submitted by each project account before exporting standard submissions.
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium font-sans">
                    (Mỗi dự án sử dụng tài khoản riêng để khai báo đầy đủ 5 phần. Admin soát xét và xuất báo cáo tổng hợp.)
                  </p>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => setViewMode("edit")}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-gray-300 text-slate-800 text-xs font-bold rounded uppercase tracking-wide transition cursor-pointer"
                  >
                    Return to editor / Trở lại sửa
                  </button>
                  <button
                    onClick={() => {
                      if (currentUser?.role !== "admin") {
                        alert("⚠️ Export PDF / Print capability is restricted to Admin role only. / Chỉ tài khoản Admin mới có thể thực hiện in xuất báo cáo.");
                        return;
                      }
                      window.print();
                    }}
                    className={`px-4 py-2 text-xs font-bold rounded shadow-md flex items-center gap-1.5 transition uppercase tracking-wide cursor-pointer ${
                      currentUser?.role === "admin"
                        ? "bg-[#2E5FD9] hover:bg-blue-600 text-white"
                        : "bg-slate-300 text-slate-600 cursor-not-allowed"
                    }`}
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print / Xuất PDF
                  </button>
                </div>
              </div>

              {/* ADMIN COMPLIANCE AUDIT HUB / TRUNG TÂM KIỂM SOÁT & PHÊ DUYỆT CỦA ADMIN */}
              {currentUser?.role === "admin" && (
                <div className="bg-gradient-to-r from-slate-50 to-blue-50/20 border border-slate-300 rounded-xl p-5 shadow-inner space-y-4 print:hidden animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-3">
                    <ShieldCheck className="w-5 h-5 text-[#1B3A8C]" />
                    <h4 className="text-xs font-black text-[#1B3A8C] uppercase tracking-wider font-sans">
                      ADMIN COMPLIANCE AUDIT HUB / TRUNG TÂM ĐỐI SOÁT & PHÊ DUYỆT BÁO CÁO CÔNG TRƯỜNG
                    </h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
                    {/* LEFT AREA: PROJECTS LIST & PHOTO STATUS */}
                    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
                      <div>
                        <h5 className="text-[11px] font-black uppercase text-slate-500 tracking-wider mb-2">
                          Site Submissions Status / Trạng thái báo cáo từng công trường
                        </h5>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {activeBoardProjects.map(proj => {
                            const pState = projectStates[proj.id] || emptyDashboardState;
                            const pImages = (pState.safetyPractices?.images || []).filter(img => 
                              img.projectName.toUpperCase().includes(proj.id.toUpperCase()) ||
                              img.projectName.toUpperCase().includes(proj.name.toUpperCase())
                            );
                            const pImgCount = pImages.length;
                            const pCompliant = pImgCount >= 1 || !!pState.safetyPractices?.skipped;
                            
                            const isApproved = !!approvedProjects[proj.id];
                            
                            return (
                              <div key={proj.id} className="flex items-center justify-between p-2 rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-100/50 transition">
                                <div className="min-w-0">
                                  <span className="font-extrabold text-[11px] text-[#1B3A8C] uppercase block truncate">
                                    {proj.id} - {proj.name}
                                  </span>
                                  <div className="flex items-center gap-2 mt-0.5 font-mono text-[9px] font-semibold text-slate-500">
                                    <span>Photos:</span>
                                    <span className={`px-1 rounded text-white ${pImgCount >= 1 ? "bg-emerald-600" : (pState.safetyPractices?.skipped ? "bg-blue-600" : "bg-amber-600")}`}>
                                      {pImgCount}/1
                                    </span>
                                    <span>• Sign-off:</span>
                                    <span className={pState.safetyPractices?.completed ? "text-emerald-700" : "text-amber-700 font-extrabold"}>
                                      {pState.safetyPractices?.completed ? "✓ Done" : "Draft"}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      const currentAppr = !approvedProjects[proj.id];
                                      setApprovedProjects(prev => {
                                        const n = { ...prev, [proj.id]: currentAppr };
                                        localStorage.setItem("handong_hse_approved_projects_v1", JSON.stringify(n));
                                        return n;
                                      });
                                    }}
                                    className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md shadow-sm cursor-pointer transition ${
                                      isApproved
                                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                        : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                                    }`}
                                  >
                                    {isApproved ? "✓ APPROVED / ĐÃ DUYỆT" : "PENDING / CHỜ DUYỆT"}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <p className="text-[9px] text-slate-400 font-bold italic mt-2.5">
                        * Admin checks each site's safety data & images, then toggles APPROVE to officially stamp and lock the report.
                      </p>
                    </div>

                    {/* RIGHT AREA: WRITE NOTES/COMMENTS */}
                    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <h5 className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
                            Verification notes / Nhận xét & kiến nghị của người tổng hợp
                          </h5>
                          <span className="text-[9px] font-extrabold text-[#2E5FD9] bg-blue-50 px-1.5 py-0.5 rounded uppercase font-mono">
                            Active Project: {activeProjectId}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mb-2 font-semibold">
                          Add notes for {activeProjectName} to print directly on their report summary page:
                        </p>
                        <textarea
                          rows={3}
                          value={adminComments[activeProjectId] || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setAdminComments(prev => {
                              const n = { ...prev, [activeProjectId]: val };
                              localStorage.setItem("handong_hse_admin_comments_v1", JSON.stringify(n));
                              return n;
                            });
                          }}
                          placeholder="Type auditor notes (e.g. Scaffolding records accepted, PPE training certified by general HSE director. Đạt tiêu chuẩn an toàn lao động...)"
                          className="w-full border border-slate-300 rounded-lg p-2 bg-slate-50 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1B3A8C] text-slate-800"
                        />
                      </div>

                      {/* SYNTHESIZER SIGNATURE NAME INPUT */}
                      <div className="mt-2.5 mb-3 px-1">
                        <label className="block text-slate-650 font-black text-[10px] mb-1.5 uppercase tracking-wider">
                          ✍️ Synthesizer Signature Name / Họ & tên Người Ký Tổng Hợp (Admin)
                        </label>
                        <input
                          type="text"
                          value={synthesizerName}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSynthesizerName(val);
                            localStorage.setItem("handong_hse_synthesizer_name_v1", val);
                          }}
                          placeholder="Nhập họ tên Người tổng hợp..."
                          className="w-full border border-slate-300 rounded-lg p-2 bg-slate-50 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#1B3A8C] text-slate-800"
                        />
                      </div>

                      <div className="flex justify-between items-center grid-cols-2 mt-2 gap-2">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="checkbox"
                            id="admin-approved-chk"
                            checked={!!approvedProjects[activeProjectId]}
                            onChange={(e) => {
                              const val = e.target.checked;
                              setApprovedProjects(prev => {
                                const n = { ...prev, [activeProjectId]: val };
                                localStorage.setItem("handong_hse_approved_projects_v1", JSON.stringify(n));
                                return n;
                              });
                            }}
                            className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 accent-emerald-500 cursor-pointer"
                          />
                          <label htmlFor="admin-approved-chk" className="text-xs font-bold text-slate-700 select-none cursor-pointer">
                            Approve active project / Duyệt báo cáo dự án hiện tại
                          </label>
                        </div>
                        <span className="text-[9px] text-slate-500 uppercase font-mono font-bold">Autosaved to cache</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUBTITLE CARD HEADER */}
              <div className="bg-[#1B3A8C] text-white rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300 block">
                    Report Period / Kỳ Báo Cáo
                  </span>
                  <h2 className="text-base font-bold uppercase mt-1 tracking-tight font-sans">
                    HSE DASHBOARD IN {state.header.month.toUpperCase()} {state.header.year}
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-6 text-xs bg-white/10 p-3 rounded border border-white/10">
                  <div>
                    <span className="text-slate-300 font-bold uppercase block text-[9px] tracking-wider">REPORTER NAME</span>
                    <span className="font-bold text-white font-mono text-[11px]">{state.header.reporterName || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-slate-300 font-bold uppercase block text-[9px] tracking-wider">AUDIT STATUS</span>
                    <span className="inline-flex items-center gap-1 bg-green-500 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase">
                      <Check className="w-2.5 h-2.5 stroke-[3px]" /> SIGNED
                    </span>
                  </div>
                </div>
              </div>

              {/* AUDIT APPROVAL AND STAMP (PRINTABLE AND VISIBLE) */}
              {approvedProjects[activeProjectId] ? (
                <div className="bg-emerald-50 border-2 border-emerald-300 text-emerald-900 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-300">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-emerald-100 rounded-xl shrink-0 border border-emerald-200">
                      <ShieldCheck className="w-6 h-6 text-emerald-700" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-black text-emerald-800 tracking-wider block">
                        ★ REPORT APPROVED BY HSE AUDITOR / ĐÃ PHÊ DUYỆT BỞI NGƯỜI TỔNG HỢP:
                      </span>
                      <p className="mt-1 text-xs font-semibold text-slate-800 italic">
                        "{adminComments[activeProjectId] || "All Safety metrics, photographs, and risk analyses have been verified and confirmed. Đạt chỉ tiêu và điều kiện báo cáo."}"
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col items-center sm:items-end justify-center bg-emerald-100/50 border border-emerald-200 p-2.5 rounded-lg border-dashed text-emerald-800">
                    <span className="text-[8px] font-mono font-black uppercase tracking-widest text-[#1B3A8C]">
                      HANDONG AUDIT STAMP
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-wider block mt-1">
                      ✓ AUDITED & CLOSED / ĐÃ KIỂM SOÁT
                    </span>
                    <span className="text-[8px] font-mono font-semibold text-slate-500 block mt-0.5">
                      Auditor ID: ADMIN (UTC)
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50/55 border border-amber-200 text-amber-900 rounded-lg p-3.5 flex items-center gap-3 shadow-inner print:bg-slate-50 print:border-slate-300 print:text-slate-800">
                  <AlertCircle className="w-5 h-5 text-amber-700 shrink-0" />
                  <div className="text-xs">
                    <span className="font-extrabold uppercase text-[10px] text-amber-800 block print:text-slate-700">
                      AWAITING AUDIT & SIGN-OFF / BÁO CÁO ĐANG CHỜ DUYỆT TỔNG HỢP:
                    </span>
                    <p className="mt-0.5 font-medium">
                      This report draft is waiting for the synthesizer (Admin) to check compliance figures & safety images before final sign-off.
                      <span className="hidden print:inline font-bold"> (Bản nháp báo cáo công trường chưa chính thức)</span>
                    </p>
                  </div>
                </div>
              )}

              {/* MAIN DASHBOARD 3-6-3 GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                
                {/* LEFT COLUMN: KPI & STATUS */}
                <div className="lg:col-span-3 flex flex-col gap-4">
                  <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm flex flex-col">
                    <h3 className="text-[11px] font-black text-gray-500 uppercase border-b pb-2 mb-3 tracking-wider">Key Indicators / Chỉ Số KPI</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">LTIFR Value / Chỉ số LTIFR</p>
                        <p className="text-2xl font-black text-[#2E5FD9] font-mono leading-tight mt-0.5">{displayLtifr.toFixed(2)}</p>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase inline-block mt-1 ${displayLtifr === 0 ? "bg-green-105 text-green-700 bg-green-100" : "bg-red-100 text-red-700"}`}>
                          {displayLtifr === 0 ? "TARGET MET: 0.00" : "EXCEEDED TARGET"}
                        </span>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">TRIFR Value / Chỉ số TRIFR</p>
                        <p className="text-xl font-black text-indigo-700 font-mono leading-tight mt-0.5">{displayTrifr.toFixed(2)}</p>
                        <span className="text-[9px] px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded font-bold inline-block mt-1">YTD COMPRESSED</span>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Safe Work Hours YTD / Giờ An Toàn</p>
                        <p className="text-xl font-black text-slate-800 font-mono mt-0.5">{currentSafeHoursYTD.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Avg Monthly Workers / Lực Lượng Lao Động</p>
                        <p className="text-xl font-black text-slate-800 font-mono mt-0.5">{(state.kpis.avgMonthlyWorkers || 0).toLocaleString()} Workers</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Safety Training Hours / Giờ Huấn Luyện An Toàn</p>
                        <p className="text-xl font-black text-slate-800 font-mono mt-0.5">{(state.kpis.monthlyTrainingHours || 0).toLocaleString()} Hours</p>
                        <span className="text-[9px] px-1.5 py-0.5 bg-blue-50 text-[#1B3A8C] border border-blue-100 rounded font-bold inline-block mt-0.5 uppercase tracking-wide">
                          YTD Cumulative: {((state.kpis.trainingHoursYTD || 0)).toLocaleString()} Hours
                        </span>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Avg SVR Close / TG Đóng SVR</p>
                        <p className="text-xl font-black text-slate-800 mt-0.5">{(state.kpis.avgCloseTimeSVR ?? 0).toFixed(1)} Days</p>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase inline-block mt-1 ${(state.kpis.avgCloseTimeSVR ?? 0) <= 2 ? "bg-blue-100 text-[#2E5FD9]" : "bg-amber-100 text-amber-700"}`}>
                          TARGET: &lt; 2 DAYS
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                    <h3 className="text-[11px] font-black text-gray-500 uppercase border-b pb-2 mb-3 tracking-wider">Incident Counts / Số Vụ Việc</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-2 bg-gray-50 rounded border border-gray-100">
                        <p className="text-[9px] font-bold text-gray-400 uppercase">Incidents / Nearmiss / Báo cáo sự cố và tiềm ẩn sự cố</p>
                        <p className="text-lg font-black text-slate-850 font-mono mt-0.5">{totalYtdNearmiss.toLocaleString()}</p>
                      </div>
                      <div className="p-2 bg-gray-50 rounded border border-gray-100">
                        <p className="text-[9px] font-bold text-gray-400 uppercase">First Aid / Sơ Cứu</p>
                        <p className="text-lg font-black text-slate-850 font-mono mt-0.5">{totalYtdFirstAid.toLocaleString()}</p>
                      </div>
                      <div className="p-2 bg-gray-50 rounded border border-gray-100">
                        <p className="text-[9px] font-bold text-gray-400 uppercase">LTI / Tai Nạn</p>
                        <p className={`text-lg font-black font-mono mt-0.5 ${totalYtdLti > 0 ? "text-red-600" : "text-green-600"}`}>{totalYtdLti.toLocaleString()}</p>
                      </div>
                      <div className="p-2 bg-gray-50 rounded border border-gray-100">
                        <p className="text-[9px] font-bold text-gray-400 uppercase">Fatalities / Tử Vong</p>
                        <p className={`text-lg font-black font-mono mt-0.5 ${totalYtdFatality > 0 ? "text-red-650" : "text-green-600"}`}>{totalYtdFatality.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* MIDDLE COLUMN: MANHOUR TABLE & SVR CHART */}
                <div className="lg:col-span-6 flex flex-col gap-4">
                  {/* CONDENSED TABLE */}
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-4 py-2 bg-gray-50 border-b flex justify-between items-center shrink-0">
                      <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-wider">Safety Manhour Statistics / Thống Kê Giờ Làm Việc An Toàn</h3>
                      <span className="text-[9px] bg-blue-100 text-[#2E5FD9] font-extrabold px-2 py-0.5 rounded uppercase font-mono">Consolidated</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-[10px] text-left border-collapse">
                        <thead>
                          <tr className="bg-[#1B3A8C] text-white">
                            <th className="p-2 border-r border-white/10 font-bold uppercase tracking-wider">Project Site / Công Trường</th>
                            <th className="p-2 border-r border-white/10 text-center font-bold uppercase tracking-wider">Year to date manhours</th>
                            <th className="p-2 text-center font-bold uppercase tracking-wider">Safety Violation Reports</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {projectSummaryList.map((p) => (
                            <tr key={p.id} className="hover:bg-blue-50 transition-colors">
                              <td className="p-2 font-bold text-slate-800">{p.name} ({p.id})</td>
                              <td className="p-2 text-center text-slate-650 font-mono font-bold">{p.hours.toLocaleString()}</td>
                              <td className="p-2 text-center font-bold text-[#2E5FD9] font-mono">{p.svrs}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-gray-100 font-extrabold border-t border-gray-200 text-slate-800 text-[11px]">
                            <td className="p-2 text-slate-900 border-t">TOTAL / TỔNG CỘNG</td>
                            <td className="p-2 text-center border-t font-mono text-slate-900">{totalYtdManhours.toLocaleString()}</td>
                            <td className="p-2 text-center border-t text-[#2E5FD9] font-mono">{totalYtdSvrIssued}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* SVR BAR CHART */}
                  <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                    <h3 className="text-[11px] font-black text-gray-500 uppercase border-b pb-2 mb-3 tracking-wider">SVR by Site / Vi phạm theo công trường</h3>
                    <div className="h-60 relative bg-slate-50 rounded p-2 border border-slate-100">
                      <canvas ref={barChartRef}></canvas>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: ROOT CAUSE & SIGN OFF */}
                <div className="lg:col-span-3 flex flex-col gap-4">
                  {/* ROOT CAUSE DONUT CHART */}
                  <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm flex-1 flex flex-col">
                    <h3 className="text-[11px] font-black text-gray-500 uppercase border-b pb-2 mb-3 tracking-wider">Root Cause Analysis / Nguyên Nhân</h3>
                    <div className="h-44 relative bg-slate-50 rounded p-2 border border-slate-100 flex items-center justify-center">
                      <canvas ref={donutChartRef}></canvas>
                    </div>
                    
                    <div className="space-y-1.5 mt-3 overflow-hidden text-[9px] divide-y divide-gray-50 pt-2">
                      {SVR_CATEGORIES.map((cat, idx) => {
                        const val = state.svrAnalysis.categoryCounts[cat.id as keyof typeof state.svrAnalysis.categoryCounts] || 0;
                        if (val === 0) return null;
                        const pct = svrCategoriesSum > 0 ? ((val / svrCategoriesSum) * 100).toFixed(0) : "0";
                        const colors = [
                          "#1B3A8C", "#2E5FD9", "#3B82F6", "#60A5FA",
                          "#10B981", "#059669", "#FBBF24", "#D97706",
                          "#EF4444", "#DC2626", "#8B5CF6", "#EC4899"
                        ];
                        const color = colors[idx % colors.length];
                        return (
                          <div key={cat.id} className="flex items-center text-[9px] font-bold text-slate-650 justify-between py-1">
                            <div className="flex items-center truncate max-w-[70%]">
                              <div className="w-2 h-2 rounded mr-1.5 shrink-0" style={{ backgroundColor: color }}></div>
                              <span className="truncate">{cat.labelEn}</span>
                            </div>
                            <span className="font-mono text-slate-800 ml-1 shrink-0 bg-slate-100 px-1 py-0.5 rounded">{val} ({pct}%)</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* SIGN OFF / COMPLETION */}
                  <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                    <h3 className="text-[11px] font-black text-gray-500 uppercase border-b pb-2 mb-3 tracking-wider">Completion / Chữ ký số</h3>
                    <div className="space-y-3">
                      {[
                        { label: "Section 1: Header", title: "Header Info", signed: state.header.completed, owner: state.header.reporterName },
                        { label: "Section 2: KPI", title: "KPI Block", signed: state.kpis.completed, owner: state.kpis.reporterName },
                        { label: "Section 3: Manhour", title: "Manhours Log", signed: state.manhourStats.completed, owner: state.manhourStats.reporterName },
                        { label: "Section 4: SVR violations", title: "SVR Audit", signed: state.svrAnalysis.completed, owner: state.svrAnalysis.reporterName }
                      ].map((sec, id) => (
                        <div
                          key={id}
                          className={`flex items-center justify-between p-2.5 rounded border transition-all ${
                            sec.signed
                              ? "bg-green-50 rounded-lg border-green-200 text-green-900"
                              : "bg-gray-105 border-gray-200 text-slate-400 bg-gray-50"
                          }`}
                        >
                          <div className="min-w-0">
                            <p className={`text-[9px] font-bold uppercase leading-none ${sec.signed ? "text-green-800" : "text-slate-500"}`}>{sec.label}</p>
                            <p className={`text-[10px] font-mono truncate mt-1 ${sec.signed ? "text-green-700 font-extrabold" : "text-slate-400 italic"}`}>
                              {sec.signed ? `BY: ${sec.owner?.toUpperCase() || "ADMIN"}` : "PENDING SIGN-OFF"}
                            </p>
                          </div>
                          {sec.signed ? (
                            <span className="text-green-600 font-bold text-sm">✓</span>
                          ) : (
                            <span className="text-gray-400 text-xs font-bold leading-none">...</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* DETAILED LOG DATA COLLAPSIBLE SECTION */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm print-no-break">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b pb-3 mb-4 gap-2">
                  <h3 className="text-xs font-extrabold text-[#1B3A8C] uppercase tracking-wider pl-1">
                    Safety Manhour Statistics / Sổ Nhật Ký Thống Kê Giờ Công Lũy Kế Chi Tiết
                  </h3>
                  <span className="text-[10px] text-[#2E5FD9] bg-blue-50 px-2.5 py-1 rounded font-bold border border-blue-100 uppercase tracking-wide">
                    ISO 45001 Compliance Registry
                  </span>
                </div>
                
                <div className="overflow-x-auto border border-gray-250 rounded-lg custom-scrollbar">
                  <table className="w-full text-left border-collapse" style={{ fontSize: "10px" }}>
                    <thead className="bg-[#1B3A8C] text-white tracking-wider font-extrabold uppercase text-[9px]">
                      <tr className="border-b border-blue-900">
                        <th className="p-2 border-r border-[#1B3A8C] bg-[#152e74] sticky left-0 text-center font-black">Month</th>
                        {activeBoardProjects.map(p => (
                          <th key={p.id} className="p-2 border-r border-white/10 text-center bg-white/5">{p.id}</th>
                        ))}
                        <th className="p-2 border-r border-[#1B3A8C] text-center bg-emerald-600 font-extrabold">Total Hours</th>
                        <th className="p-2 border-r border-[#1B3A8C] text-center bg-emerald-600 font-extrabold">Safe Hours</th>
                        <th className="p-2 border-r border-white/10 text-center bg-red-800">LTI</th>
                        <th className="p-2 border-r border-white/10 text-center bg-orange-700">LTIFR</th>
                        <th className="p-2 border-r border-white/10 text-center bg-indigo-800">TRIFR</th>
                        <th className="p-2 text-center bg-[#2E5FD9]">SVR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rowsWithCumulative.map(row => (
                        <tr key={row.monthIndex} className="hover:bg-slate-50 border-b border-gray-200 font-mono text-[9px] text-[#1B3A8C]">
                          <td className="p-2 px-3 bg-gray-50 border-r text-center font-bold sticky left-0 shadow-inner">{MONTH_NAMES[row.monthIndex].short}</td>
                          {activeBoardProjects.map(p => (
                            <td key={p.id} className="p-2 border-r text-center text-slate-600">{(row.manhoursByProject[p.id] || 0).toLocaleString()}</td>
                          ))}
                          <td className="p-2 border-r text-center bg-green-50 text-green-900 font-bold">{row.monthlyTotalManhours.toLocaleString()}</td>
                          <td className="p-2 border-r text-center bg-green-50 text-green-900 font-bold">{row.currentSafeHours.toLocaleString()}</td>
                          <td className="p-2 border-r text-center bg-red-50 text-red-950 font-bold">{row.ltiCount}</td>
                          <td className="p-2 border-r text-center bg-orange-50 text-orange-950 font-bold">{row.ltifr.toFixed(2)}</td>
                          <td className="p-2 border-r text-center bg-indigo-50 text-indigo-950 font-bold">{row.trifr.toFixed(2)}</td>
                          <td className="p-2 text-center font-bold text-[#2E5FD9]">{row.svrIssuedCount}</td>
                        </tr>
                      ))}
                      <tr className="bg-gray-100 font-extrabold text-[9px] border-t border-gray-300 font-black text-[#1B3A8C]">
                        <td className="p-2 text-center bg-gray-200 uppercase font-black">Total</td>
                        {activeBoardProjects.map(p => (
                          <td key={p.id} className="p-2 border-r text-center bg-slate-50">
                            {rowsWithCumulative.reduce((s, r) => s + (r.manhoursByProject[p.id] || 0), 0).toLocaleString()}
                          </td>
                        ))}
                        <td className="p-2 border-r text-center bg-green-100 text-green-950 font-black">{totalYtdManhours.toLocaleString()}</td>
                        <td className="p-2 border-r text-center bg-green-100 text-green-950 font-black">{currentSafeHoursYTD.toLocaleString()}</td>
                        <td className="p-2 border-r text-center bg-red-100 text-red-950 font-black">{totalYtdLti}</td>
                        <td className="p-2 border-r text-center bg-orange-100 text-orange-950 font-black">{calculatedLtifrYtd.toFixed(2)}</td>
                        <td className="p-2 border-r text-center bg-indigo-100 text-indigo-950 font-black">{calculatedTrifrYtd.toFixed(2)}</td>
                        <td className="p-2 text-center text-[#2E5FD9] bg-blue-100 font-bold">{totalYtdSvrIssued}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION 2-B: REPORTED INCIDENT DETAILS */}
              {(state.kpis.nearmiss > 0 || state.kpis.firstAid > 0 || state.kpis.accidents > 0 || state.kpis.fatalities > 0) && (
                <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm print-no-break">
                  <div className="border-b pb-3 mb-4">
                    <span className="text-[10px] font-black uppercase text-red-650 font-mono">Incident Details / Chi tiết sự cố</span>
                    <h3 className="text-sm font-black text-[#1B3A8C] uppercase tracking-wider mt-0.5">
                      REPORTED INCIDENT DETAILS & ATTACHMENTS / THÔNG TIN CÁC VỤ VIỆC & BÁO CÁO CHI TIẾT
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {[
                      {
                        labelVi: "Báo cáo sự cố và tiềm ẩn sự cố / Incidents/ Nearmiss",
                        count: state.kpis.nearmiss,
                        details: state.kpis.nearmissDetails,
                        file: state.kpis.nearmissFileName,
                        url: state.kpis.nearmissAttachment
                      },
                      {
                        labelVi: "Trường hợp sơ cứu / First Aid Treatment",
                        count: state.kpis.firstAid,
                        details: state.kpis.firstAidDetails,
                        file: state.kpis.firstAidFileName,
                        url: state.kpis.firstAidAttachment
                      },
                      {
                        labelVi: "Trường hợp tai nạn mất ngày công / LTI Accidents",
                        count: state.kpis.accidents,
                        details: state.kpis.accidentsDetails,
                        file: state.kpis.accidentsFileName,
                        url: state.kpis.accidentsAttachment
                      },
                      {
                        labelVi: "Trường hợp tử vong / Fatalities Count",
                        count: state.kpis.fatalities,
                        details: state.kpis.fatalitiesDetails,
                        file: state.kpis.fatalitiesFileName,
                        url: state.kpis.fatalitiesAttachment
                      }
                    ].filter(inc => inc.count > 0).map((inc, i) => (
                      <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-950 uppercase">{inc.labelVi}:</span>
                            <span className="bg-red-100 text-red-800 font-mono font-bold text-xs px-2.5 py-0.5 rounded-full">{inc.count}</span>
                          </div>
                          {inc.details ? (
                            <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed italic bg-white/70 p-2.5 rounded-lg border border-slate-100 mt-2">{inc.details}</p>
                          ) : (
                            <p className="text-xs text-slate-400 italic mt-2">No details provided / Chưa cung cấp thông tin mô tả chi tiết.</p>
                          )}
                        </div>
                        {inc.url && (
                          <div className="shrink-0 flex items-center gap-2 bg-white px-3.5 py-2 rounded-lg border border-slate-200 shadow-sm">
                            <FileText className="w-4 h-4 text-[#2E5FD9]" />
                            <div className="text-left">
                              <span className="block text-[8px] text-slate-400 font-extrabold uppercase">File / Tệp báo cáo</span>
                              <a href={inc.url} target="_blank" rel="noreferrer" className="text-xs font-bold text-[#2E5FD9] hover:underline hover:text-[#1B3A8C]">
                                {inc.file || "incident_report.pdf"}
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 5: GOOD HSE PRACTICES SHOT GALLERY */}
              <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm print-no-break">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase text-[#2E5FD9] font-mono">Section 5 / Phần 5</span>
                    <h3 className="text-sm font-black text-[#1B3A8C] uppercase tracking-wider mt-0.5">
                      SAFE PHOTOS / HÌNH ẢNH AN TOÀN
                    </h3>
                    <p className="text-[9px] text-[#2E5FD9] font-extrabold uppercase mt-1 leading-normal italic">
                      Giữ nguyên nguyên bản ảnh gốc tải lên, không dùng AI chỉnh sửa hay giả lập ảnh tương đương. Nếu không có hình ảnh sẽ hiển thị "Không có hình ảnh" / Preserves 100% authentic uploaded photos with no AI-generated equivalents. Shows "No image" if empty.
                    </p>
                  </div>
                  <span className="text-[10px] bg-green-50 text-green-700 border border-green-100 font-extrabold uppercase px-2.5 py-1 rounded inline-block">
                    {state.safetyPractices?.images?.length || 0} Photos / Ảnh Đạt Chuẩn
                  </span>
                </div>

                {(!state.safetyPractices?.images || state.safetyPractices.images.length === 0) ? (
                  <div className="text-center py-8 text-slate-400 text-xs italic bg-slate-50 border border-dashed border-slate-200 rounded-lg">
                    No good safety practices photos designated for this period.
                    <p className="not-italic text-[10px] text-red-600 font-bold mt-1 uppercase">🚫 Không có hình ảnh / No safety photo uploaded</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {state.safetyPractices.images.map((img) => (
                      <div key={img.id} className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50 flex flex-col hover:shadow-md transition">
                        {img.imageUrl ? (
                          <div className="h-40 w-full overflow-hidden relative bg-slate-100 border-b border-slate-200">
                            <img
                              src={img.imageUrl}
                              alt={img.title}
                              referrerPolicy="no-referrer"
                              className="object-contain w-full h-full"
                            />
                            <div className="absolute top-2 left-2 bg-[#1B3A8C] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-sm">
                              {img.projectName}
                            </div>
                          </div>
                        ) : (
                          <div className="h-40 w-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 border-b border-slate-200 text-center p-4">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Không có hình ảnh</span>
                            <span className="text-[9px] text-slate-400 mt-1 font-mono italic">No Safety Photo Uploaded</span>
                          </div>
                        )}
                        <div className="p-3.5 flex-1 flex flex-col justify-between">
                          <div>
                            <h4 className="font-extrabold text-[#1B3A8C] text-xs leading-snug line-clamp-2 uppercase">
                              {img.title}
                            </h4>
                            {!img.imageUrl && (
                              <p className="text-[10px] text-[#2E5FD9] font-black uppercase mt-1">
                                Project: {img.projectName}
                              </p>
                            )}
                            <p className="text-[10px] text-slate-500 mt-1 font-semibold leading-relaxed line-clamp-3 italic">
                              {img.description}
                            </p>
                          </div>
                          <div className="mt-3.5 pt-2 border-t border-slate-200 flex justify-between items-center text-[9px] text-slate-400 font-mono">
                            <span>Checked on / Đã duyệt:</span>
                            <span className="font-bold text-slate-600">{img.date}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* DIRECT DIGITAL AUTHORIZATION / SIGN-OFF BLOCK */}
              <div className="pt-6 border-t border-gray-200 print-no-break">
                <h4 className="text-xs font-black text-[#1B3A8C] uppercase tracking-widest pl-1 mb-4">
                  OFFICIAL 2-TIER HSE SIGNATURE SHEET / DANH SÁCH CHỮ KÝ PHÊ DUYỆT BÁO CÁO (2 CẤP)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                  {/* CẤP 1: NGƯỜI LÀM BÁO CÁO */}
                  <div className="border border-gray-200 bg-white p-5 rounded-xl flex flex-col justify-between min-h-[160px] shadow-sm relative overflow-hidden">
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-extrabold text-xs text-[#1B3A8C] block uppercase tracking-wider">LEVEL 1: PREPARED BY REPORTER</span>
                          <span className="font-black text-xs text-slate-800 block mt-0.5">CẤP 1: NGƯỜI LẬP BÁO CÁO CHUYÊN TRÁCH</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded uppercase font-mono">Reporter</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                        Responsible for compiling raw safety datasets, manhours registry, and site photographs (Sections 1-5).
                      </p>
                    </div>

                    <div className="border-t border-gray-100 pt-4 mt-4">
                      {completedCount === 5 ? (
                        <div className="font-mono">
                          <div className="text-[9px] font-black text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded uppercase w-max tracking-wide flex items-center gap-1.5 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                            ✓ DIGITALLY SIGNED & VERIFIED
                          </div>
                          <p className="text-[#1B3A8C] text-xs font-black mt-2.5 uppercase">Officer: {state.header.reporterName || "Active Site Officer"}</p>
                          <p className="text-[8px] text-slate-400 mt-0.5">Timestamp: {state.header.month.toUpperCase()}-2026 UTC</p>
                        </div>
                      ) : completedCount > 0 ? (
                        <div className="font-mono font-bold">
                          <div className="text-[9px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded uppercase w-max tracking-wide">
                            ⚠️ PARTIALLY SIGNED ({completedCount}/5 Sections)
                          </div>
                          <p className="text-slate-600 text-xs font-bold mt-2">Officer: {state.header.reporterName || "Active Site Officer"}</p>
                          <p className="text-[8px] text-slate-400 mt-0.5">Incomplete drafts remain</p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 py-1 text-slate-400 italic text-xs font-bold font-sans">
                          <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                          Awaiting sign-off / Chưa hoàn thành ký số
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CẤP 2: NGƯỜI TỔNG HỢP (ADMIN/MANAGER) */}
                  <div className="border border-gray-200 bg-white p-5 rounded-xl flex flex-col justify-between min-h-[160px] shadow-sm relative overflow-hidden">
                    {/* RED ROUND INDUSTRIAL/CORPORATE STAMP STYLING */}
                    {approvedProjects[activeProjectId] && (
                      <div className="absolute right-4 bottom-4 w-24 h-24 rounded-full border-4 border-red-650/25 flex flex-col items-center justify-center rotate-12 pointer-events-none select-none">
                        <div className="text-[9px] font-black text-red-650 tracking-widest text-center uppercase leading-none border-b border-red-650/20 pb-0.5 mb-0.5">
                          HANDONG
                        </div>
                        <div className="text-[8px] font-black text-red-650 uppercase leading-none">
                          HSE DEPT
                        </div>
                        <div className="text-[8px] font-bold text-red-650/80 uppercase font-mono mt-0.5">
                          APPROVED
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-extrabold text-xs text-[#1B3A8C] block uppercase tracking-wider">LEVEL 2: VERIFIED BY SYNTHESIZER</span>
                          <span className="font-black text-xs text-slate-800 block mt-0.5">CẤP 2: NGƯỜI TỔNG HỢP & PHÊ DUYỆT (ADMIN/MANAGER)</span>
                        </div>
                        <span className="text-[10px] text-red-700 font-bold bg-red-55 px-2 py-0.5 rounded uppercase border border-red-150 font-mono">Synthesizer</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                        Authorized HSE Administrator or General Manager auditing and consolidating report metrics.
                      </p>
                    </div>

                    <div className="border-t border-gray-100 pt-4 mt-4">
                      {approvedProjects[activeProjectId] ? (
                        <div className="font-mono">
                          <div className="text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg uppercase w-max tracking-wide flex items-center gap-1.5 animate-pulse shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            ✓ APPROVED & DIGITALLY SIGNED (ĐÃ PHÊ DUYỆT & KÝ SỐ)
                          </div>
                          <p className="text-[#1B3A8C] text-xs font-black mt-2.5 uppercase">
                            Auditor / Người duyệt: {synthesizerName.toUpperCase()}
                          </p>
                          <p className="text-[8px] text-slate-400 mt-0.5">Date Approved: 2026-06-03 UTC</p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 py-1 text-slate-400 italic text-xs font-bold font-sans">
                          <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping duration-1000 shrink-0"></span>
                          Awaiting Synthesizer approval / Chờ người tổng hợp phê duyệt
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* BRAND LEGAL STAMP FOOTER */}
              <div className="text-center pt-8 border-t border-gray-200 space-y-1 text-slate-800">
                <p className="text-xs font-black text-[#1B3A8C] uppercase tracking-wide">
                  HANDONG ENGINEERING & CONSTRUCTION JOINT STOCK COMPANY
                </p>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                  Headquarters: Handong Tower, Binh Thanh District, Ho Chi Minh City, Vietnam
                </p>
                <p className="text-[9px] text-slate-400 font-mono italic">
                  Document Code: HD-HSE-MR-2026-v1.4 | Dynamic data-stream. Generated in timezone Asia/Ho_Chi_Minh.
                </p>
              </div>
            </div>
          );
        })()}
      </main>

      {/* COMPACT BILINGUAL FOOTER */}
      <footer className="bg-white border-t border-gray-200 py-4 px-6 md:px-8 text-center text-slate-500 text-[11px] print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3">
          <div>
            <strong>HANDONG ENGINEERING & CONSTRUCTION</strong> HSE Monthly Hub.
            <span className="mx-2 text-slate-300">|</span>
            Hệ thống báo cáo chỉ số an toàn hàng tháng.
          </div>
          <div className="font-mono text-slate-400 flex items-center gap-2">
            <span>YTD Timestamp: 2026-06-03 | Build stable.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
