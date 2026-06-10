export interface ReportHeaderState {
  month: string;
  year: string;
  reporterName: string;
  completed: boolean;
  projectName: string;
}

export interface KPIIndicatorsState {
  totalSafeHoursFromStart: number;
  totalSafeHoursYTD: number;
  totalSafeHoursMonth: number;
  avgMonthlyWorkers?: number;
  monthlyTrainingHours?: number;
  trainingHoursYTD?: number;
  nearmiss: number;
  nearmissDetails?: string;
  nearmissAttachment?: string;
  nearmissFileName?: string;
  firstAid: number;
  firstAidDetails?: string;
  firstAidAttachment?: string;
  firstAidFileName?: string;
  accidents: number;
  accidentsDetails?: string;
  accidentsAttachment?: string;
  accidentsFileName?: string;
  fatalities: number;
  fatalitiesDetails?: string;
  fatalitiesAttachment?: string;
  fatalitiesFileName?: string;
  reporterName: string;
  completed: boolean;
  avgCloseTimeSVR?: number;
}

export interface ProjectManhourData {
  [projectId: string]: number;
}

export interface MonthlyStatisticRow {
  monthIndex: number; // 0 to 11
  manhoursByProject: ProjectManhourData;
  fatalityCount: number;
  ltiCount: number;
  daysLost: number;
  mtcCount: number;
  firstAidCount: number;
  nearmissCount: number;
  svrIssuedCount: number;
  trainingHoursByProject?: Record<string, number>;
}

export interface Section3State {
  monthlyData: MonthlyStatisticRow[];
  reporterName: string;
  completed: boolean;
}

export interface SvrCategoryAnalyses {
  behaviorsPpe: number;
  lifting: number;
  excavation: number;
  workingAtHeight: number;
  scaffoldStructure: number;
  housekeeping: number;
  electrical: number;
  equipment: number;
  fireExplosion: number;
  permitToWork: number;
  management: number;
  others: number;
}

export interface SvrByProject {
  [projectId: string]: number;
}

export interface Section4State {
  categoryCounts: SvrCategoryAnalyses;
  projectCounts: SvrByProject;
  reporterName: string;
  completed: boolean;
}

export interface SafetyPracticeImage {
  id: string;
  title: string;
  projectName: string;
  imageUrl: string;
  description: string;
  date: string;
  category: "measures" | "inspection" | "training";
}

export interface Section5State {
  images: SafetyPracticeImage[];
  completed: boolean;
}

export interface FullDashboardState {
  header: ReportHeaderState;
  kpis: KPIIndicatorsState;
  manhourStats: Section3State;
  svrAnalysis: Section4State;
  safetyPractices: Section5State;
}

export const PROJECT_NAMES = [
  { id: "DC", name: "DIAMOND CITY (DC)" },
  { id: "GP", name: "GEM PARK (GP)" },
  { id: "TDA", name: "TDA" },
  { id: "KHOME_174", name: "KHOME 174" },
  { id: "K_HOME_AVENUE", name: "K HOME AVENUE" },
  { id: "BEN_TRE_HOSPITAL", name: "BEN TRE HOSPITAL" },
  { id: "SYCAMORE_B14", name: "SYCAMORE B14" },
  { id: "PHU_LONG", name: "PHU LONG" },
  { id: "BROADWAY", name: "BROADWAY" },
  { id: "SEDO", name: "SEDO" },
  { id: "SWANBAY", name: "SWANBAY" },
  { id: "STARVIEW", name: "STARVIEW" },
] as const;

export type ProjectId = typeof PROJECT_NAMES[number]["id"];

export const MONTH_NAMES = [
  { en: "January / Tháng 1", short: "Jan", id: "January" },
  { en: "February / Tháng 2", short: "Feb", id: "February" },
  { en: "March / Tháng 3", short: "Mar", id: "March" },
  { en: "April / Tháng 4", short: "Apr", id: "April" },
  { en: "May / Tháng 5", short: "May", id: "May" },
  { en: "June / Tháng 6", short: "Jun", id: "June" },
  { en: "July / Tháng 7", short: "Jul", id: "July" },
  { en: "August / Tháng 8", short: "Aug", id: "August" },
  { en: "September / Tháng 9", short: "Sep", id: "September" },
  { en: "October / Tháng 10", short: "Oct", id: "October" },
  { en: "November / Tháng 11", short: "Nov", id: "November" },
  { en: "December / Tháng 12", short: "Dec", id: "December" },
] as const;

export const SVR_CATEGORIES = [
  { id: "behaviorsPpe", labelEn: "Behaviors / PPE", labelVn: "Hành vi / Trang thiết bị bảo hộ" },
  { id: "lifting", labelEn: "Lifting", labelVn: "Nâng hạ" },
  { id: "excavation", labelEn: "Excavation", labelVn: "Đào đất" },
  { id: "workingAtHeight", labelEn: "Working at Height", labelVn: "Làm việc trên cao" },
  { id: "scaffoldStructure", labelEn: "Scaffold / Structure", labelVn: "Giàn giáo / Cấu trúc" },
  { id: "housekeeping", labelEn: "Housekeeping", labelVn: "Vệ sinh dọn dẹp" },
  { id: "electrical", labelEn: "Electrical", labelVn: "Điện" },
  { id: "equipment", labelEn: "Equipment", labelVn: "Thiết bị" },
  { id: "fireExplosion", labelEn: "Fire / Explosion", labelVn: "Cháy / Nổ" },
  { id: "permitToWork", labelEn: "Permit To Work", labelVn: "Giấy phép làm việc" },
  { id: "management", labelEn: "Management", labelVn: "Quản lý" },
  { id: "others", labelEn: "Others", labelVn: "Khác" },
] as const;
