import { plots as legacyPlots, type Plot } from "@/lib/farm-data";

export type DataMode = "demo" | "database";
export type DemoPersonaId = "beginner" | "owner" | "commercial" | "export" | "employee";
export type KnowledgeLevel = "Beginner" | "Intermediate" | "Experienced";
export type OperationScale = "Personal" | "Small Farm" | "Commercial Farm" | "Enterprise / Export";
export type SubscriptionPlan = "Free" | "Farm Pro";

export type ExperienceStage = {
  id: DemoPersonaId;
  title: string;
  summary: string;
  unlocks: string[];
  requiresPro?: boolean;
};

export const experienceStages: ExperienceStage[] = [
  {
    id: "beginner",
    title: "มือใหม่",
    summary: "เริ่มจากแปลง งาน และคำแนะนำรายวัน",
    unlocks: ["แปลง", "ปฏิทินงาน", "คำแนะนำ AI", "ต้นทุนพื้นฐาน"],
  },
  {
    id: "owner",
    title: "เจ้าของสวน",
    summary: "วางแผนผลผลิต รายได้ และดูสุขภาพสวนเป็นระบบ",
    unlocks: ["คาดการณ์ผลผลิต", "วิเคราะห์ต้นทุน", "การแจ้งเตือนตามแปลง"],
  },
  {
    id: "commercial",
    title: "ผู้จัดการสวน",
    summary: "บริหารทีม แผนผลิต และงานหลายโซน",
    unlocks: ["Work Orders", "Workforce", "ศูนย์ปฏิบัติการ 360"],
    requiresPro: true,
  },
  {
    id: "export",
    title: "องค์กร/ส่งออก",
    summary: "ควบคุมหลายฟาร์ม ล็อตผลิต และการตรวจรับ",
    unlocks: ["Traceability", "Compliance", "พอร์ตหลายฟาร์ม"],
    requiresPro: true,
  },
];

export type UserFarmProfile = {
  farmingType: string;
  experience: string;
  farmSize: string;
  workforce: string;
  technology: string[];
  knowledgeLevel: KnowledgeLevel;
  operationScale: OperationScale;
  tutorialsEnabled: boolean;
  recommendationsEnabled: boolean;
};

export type DemoPersona = {
  id: DemoPersonaId;
  label: string;
  role: string;
  subscription: SubscriptionPlan;
  profile: UserFarmProfile;
};

export type FarmSummary = {
  name: string;
  type: string;
  areaRai: number;
  primaryCrop: string;
  varieties: string[];
  plotCount: number;
  treeCount: number;
  workerCount: number;
};

export type DashboardFarm = FarmSummary & {
  id: string;
  location: string;
  status: "Normal" | "Needs attention" | "Blocked";
  dataLabel: string;
};

export function getDashboardFarms(state: {
  farm: FarmSummary;
  additionalFarms?: DashboardFarm[];
}): DashboardFarm[] {
  const primary: DashboardFarm = {
    id: "FARM-PRIMARY",
    ...state.farm,
    location: "จันทบุรี",
    status: "Normal",
    dataLabel: "ข้อมูลฟาร์มที่กำลังใช้งานใน Demo Mode",
  };

  // Demo portfolio makes the multi-farm dashboard behavior testable without mixing its data with the primary farm.
  if (state.farm.areaRai < 20) return [primary, ...(state.additionalFarms ?? [])];

  return [
    primary,
    {
      id: "FARM-NORTH",
      name: "สวนทุเรียนเขาคิชฌกูฏ",
      type: "Commercial Fruit Orchard",
      areaRai: 185,
      primaryCrop: "Durian",
      varieties: ["Monthong", "Kanyao"],
      plotCount: 9,
      treeCount: 2_960,
      workerCount: 14,
      location: "จันทบุรี",
      status: "Needs attention",
      dataLabel: "ข้อมูลพอร์ตฟาร์มตัวอย่างใน Demo Mode",
    },
    {
      id: "FARM-EAST",
      name: "สวนผลไม้ระยอง",
      type: "Mixed Fruit Orchard",
      areaRai: 96,
      primaryCrop: "Mangosteen",
      varieties: ["Mangosteen", "Rambutan"],
      plotCount: 6,
      treeCount: 1_740,
      workerCount: 8,
      location: "ระยอง",
      status: "Normal",
      dataLabel: "ข้อมูลพอร์ตฟาร์มตัวอย่างใน Demo Mode",
    },
    ...(state.additionalFarms ?? []),
  ];
}

export type FarmSite = {
  id: string;
  farmId?: string;
  code: string;
  name: string;
  type: string;
  areaRai: number;
  manager: string;
  plotPrefixes: string[];
  status: "Normal" | "Needs attention" | "Blocked";
};

export type SmartTask = {
  id: string;
  title: string;
  plot: string;
  farmId?: string;
  siteId?: string;
  type: string;
  status:
    | "Planned"
    | "Assigned"
    | "In Progress"
    | "Supervisor Review"
    | "Completed"
    | "Delayed"
    | "Skipped"
    | "Cancelled";
  reason?: string;
  scheduledFor?: string;
  plannedStart?: string;
  estimatedMinutes?: number;
  priority?: "Low" | "Normal" | "High" | "Urgent";
  assignedWorkerId?: string;
  team?: string;
  /** One shared task record powers both an owner's todo and a manager's team board. */
  origin?: "personal" | "team" | "system";
  createdBy?: string;
  ownerPersonaId?: DemoPersonaId;
  approvalMode?: "self" | "team_lead" | "farm_manager" | "qa";
  completion?: {
    note: string;
    health?: number;
    evidenceCount: number;
    completedAt?: string;
    completedBy?: string;
    approvedBy?: string;
    laborHours?: number;
    laborCost?: number;
    materialCost?: number;
    chemicalLot?: string;
    phiDays?: number;
  };
};

export type DragonflyWeather = {
  source: "demo" | "api";
  temp: number;
  condition: string;
  humidity: number;
  wind: number;
  uv: number;
  rainChance: number;
  hourly: { t: string; temp: number; rain: number; condition: string }[];
  daily: { d: string; hi: number; lo: number; rain: number; icon: string }[];
};

export type Recommendation = {
  id: string;
  title: string;
  plot: string;
  reason: string;
  action: string;
  confidence: "Demo" | "Low" | "Medium" | "High";
  sourceType: "system" | "ai-estimate" | "demo" | "user-data" | "external";
  sourceLabel: string;
  generatedAt?: string;
};

export type ProductionPlan = {
  id: string;
  plot: string;
  crop: string;
  variety: string;
  stage: string;
  progress: number;
  expectedHarvest: string;
  expectedYield: string;
};

export type WorkOrder = {
  id: string;
  title: string;
  plot: string;
  team: string;
  type?: "Inspection" | "Irrigation" | "Fertilizer" | "Harvest" | "General";
  status:
    | "Planned"
    | "Assigned"
    | "In Progress"
    | "Completed"
    | "Supervisor Review"
    | "Approved"
    | "Delayed";
  reason?: string;
  plannedFor?: string;
};

export type WorkerSummary = {
  total: number;
  active: number;
  available: number;
  absent: number;
  crews: { name: string; assigned: number; status: string }[];
};

export type WorkerProfile = {
  id: string;
  name: string;
  role: string;
  crew: string;
  status: "Active" | "Available" | "On Leave" | "Unavailable";
  farmId?: string;
  plot?: string;
  currentTask?: string;
};

export type MemberInvite = {
  id: string;
  email: string;
  role: string;
  crew: string;
  status: "Sent" | "Accepted" | "Expired";
  sentAt: string;
};

export type OrganizationRole = {
  id: string;
  name: string;
  permissions: string[];
  scope: "organization" | "assigned_farms" | "assigned_team" | "own_tasks";
  builtIn?: boolean;
};

export const organizationPermissionOptions = [
  "ดูงานทีม",
  "ดูและอัปเดตงานของตนเอง",
  "สร้างและมอบหมายงาน",
  "อนุมัติงานทุกทีมในฟาร์ม",
  "อนุมัติงานเฉพาะทีมตนเอง",
  "อนุมัติงาน QA/เก็บเกี่ยว",
  "ดูต้นทุนและรายได้",
  "ดู Traceability/QA",
  "จัดการสมาชิกและบทบาท",
  "ดูสต็อกและใบขอซื้อ",
  "สร้างใบขอซื้อ",
  "อนุมัติใบขอซื้อ",
  "ออกคำสั่งซื้อ PO",
  "รับสินค้าและปรับยอดสต็อก",
] as const;

/** ตำแหน่งงานจริงที่ใช้เมื่อเชิญหรือจัดการสมาชิกในองค์กร */
export const jobPositionOptions = [
  "คนงาน",
  "หัวหน้าทีม",
  "เจ้าหน้าที่ QA",
  "เจ้าหน้าที่คลัง",
  "เจ้าหน้าที่จัดซื้อ",
  "ผู้จัดการฟาร์ม",
  "ผู้ช่วยสวน",
] as const;

export type JobPosition = (typeof jobPositionOptions)[number];

export const defaultOrganizationRoles: OrganizationRole[] = [
  {
    id: "ROLE-OWNER",
    name: "Owner / Admin",
    scope: "organization",
    builtIn: true,
    permissions: [...organizationPermissionOptions],
  },
  {
    id: "ROLE-MANAGER",
    name: "ผู้จัดการฟาร์ม",
    scope: "assigned_farms",
    builtIn: true,
    permissions: [
      "ดูงานทีม",
      "สร้างและมอบหมายงาน",
      "อนุมัติงานทุกทีมในฟาร์ม",
      "ดูต้นทุนและรายได้",
      "ดู Traceability/QA",
      "จัดการสมาชิกและบทบาท",
      "ดูสต็อกและใบขอซื้อ",
      "สร้างใบขอซื้อ",
      "อนุมัติใบขอซื้อ",
    ],
  },
  {
    id: "ROLE-SUPERVISOR",
    name: "หัวหน้าทีม",
    scope: "assigned_team",
    builtIn: true,
    permissions: [
      "ดูงานทีม",
      "สร้างและมอบหมายงาน",
      "อนุมัติงานเฉพาะทีมตนเอง",
      "ดูสต็อกและใบขอซื้อ",
      "สร้างใบขอซื้อ",
    ],
  },
  {
    id: "ROLE-WORKER",
    name: "พนักงานภาคสนาม",
    scope: "own_tasks",
    builtIn: true,
    permissions: ["ดูและอัปเดตงานของตนเอง"],
  },
  {
    id: "ROLE-QA",
    name: "เจ้าหน้าที่ QA",
    scope: "assigned_farms",
    builtIn: true,
    permissions: ["ดูงานทีม", "อนุมัติงาน QA/เก็บเกี่ยว", "ดู Traceability/QA"],
  },
  {
    id: "ROLE-PROCUREMENT",
    name: "เจ้าหน้าที่จัดซื้อ",
    scope: "assigned_farms",
    builtIn: true,
    permissions: ["ดูสต็อกและใบขอซื้อ", "ออกคำสั่งซื้อ PO"],
  },
  {
    id: "ROLE-WAREHOUSE",
    name: "เจ้าหน้าที่คลัง",
    scope: "assigned_farms",
    builtIn: true,
    permissions: ["ดูสต็อกและใบขอซื้อ", "รับสินค้าและปรับยอดสต็อก"],
  },
];

export function getTaskApprovalMode(
  task: Pick<SmartTask, "origin" | "team" | "type" | "approvalMode">,
) {
  if (task.approvalMode) return task.approvalMode;
  if (task.origin === "personal" && !task.team) return "self" as const;
  if (["Chemical", "Harvest", "QA"].includes(task.type)) return "qa" as const;
  return "team_lead" as const;
}

export function getTaskReviewerLabel(
  task: Pick<SmartTask, "origin" | "team" | "type" | "approvalMode">,
) {
  const mode = getTaskApprovalMode(task);
  if (mode === "self") return "เจ้าของงานยืนยันด้วยตนเอง";
  if (mode === "qa") return "เจ้าหน้าที่ QA ของฟาร์ม";
  if (mode === "farm_manager") return "ผู้จัดการฟาร์ม";
  return `หัวหน้าทีม ${task.team ?? "ที่รับผิดชอบ"} · ผู้จัดการฟาร์มเป็นผู้อนุมัติสำรอง`;
}

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isTaskInPeriod(
  date: string | undefined,
  period: string,
  customRange: { start: string; end: string },
) {
  if (period === "all") return true;
  if (!date) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const scheduled = new Date(`${date}T00:00:00`);

  if (period === "custom") {
    const start = customRange.start ? new Date(`${customRange.start}T00:00:00`) : undefined;
    const end = customRange.end ? new Date(`${customRange.end}T23:59:59`) : undefined;
    return (!start || scheduled >= start) && (!end || scheduled <= end);
  }

  if (period === "today") return date === getLocalDateKey();
  const days = period === "7d" ? 7 : 30;
  const end = new Date(today);
  end.setDate(today.getDate() + days);
  return scheduled >= today && scheduled <= end;
}

export function canOrganizationRoleApproveTask(
  role: OrganizationRole,
  task: Pick<SmartTask, "origin" | "team" | "type" | "approvalMode">,
  reviewerTeam?: string,
) {
  const mode = getTaskApprovalMode(task);
  if (role.scope === "assigned_team" && reviewerTeam !== task.team) return false;
  if (mode === "qa") return role.permissions.includes("อนุมัติงาน QA/เก็บเกี่ยว");
  if (mode === "farm_manager") return role.permissions.includes("อนุมัติงานทุกทีมในฟาร์ม");
  if (mode === "team_lead")
    return (
      role.permissions.includes("อนุมัติงานทุกทีมในฟาร์ม") ||
      role.permissions.includes("อนุมัติงานเฉพาะทีมตนเอง")
    );
  return role.permissions.includes("ดูและอัปเดตงานของตนเอง");
}

export function canPersonaApproveTask(
  personaId: DemoPersonaId,
  task: Pick<SmartTask, "origin" | "team" | "type" | "approvalMode">,
  roles: OrganizationRole[] = defaultOrganizationRoles,
) {
  const roleIds =
    personaId === "export"
      ? ["ROLE-MANAGER", "ROLE-QA"]
      : personaId === "commercial"
        ? ["ROLE-MANAGER"]
        : personaId === "owner"
          ? ["ROLE-OWNER"]
          : ["ROLE-WORKER"];
  return roles
    .filter((role) => roleIds.includes(role.id))
    .some((role) => canOrganizationRoleApproveTask(role, task, task.team));
}

export type IoTDevice = {
  id: string;
  name: string;
  type: string;
  plot: string;
  status: "Online" | "Offline";
  latestReading: string;
  numericValue?: number;
  unit?: string;
  lastCommunication: string;
  battery?: number;
  firmware?: string;
};

export type IoTRule = {
  id: string;
  name: string;
  deviceId: string;
  threshold: number;
  operator: "<" | ">";
  action: string;
  enabled?: boolean;
  severity?: "Info" | "Warning" | "Critical";
  recipients?: string;
};

export type IoTAlert = {
  id: string;
  title: string;
  plot: string;
  current: string;
  target: string;
  action: string;
  severity?: "Info" | "Warning" | "Critical";
  deviceId?: string;
  ruleId?: string;
};

export type TraceabilityChain = {
  lotId: string;
  farmId?: string;
  farmName?: string;
  siteId?: string;
  siteName?: string;
  packingLot: string;
  harvestLot: string;
  plot: string;
  crop: string;
  variety: string;
  activities: string[];
  chemicalRecords: string[];
  irrigationRecords: string[];
  workers: string[];
};

export type DocumentCategory =
  | "การผลิต"
  | "สารเคมีและ PHI"
  | "QA และ Compliance"
  | "ใบรับรอง"
  | "การขายและส่งออก"
  | "ภัยพิบัติ"
  | "รายงานจากระบบ";

export type OrganizationDocumentType = {
  id: string;
  name: string;
  category: DocumentCategory;
  requiresApproval: boolean;
  tracksExpiry: boolean;
  requiredFor: string;
  builtIn?: boolean;
};

export type FarmDocument = {
  id: string;
  title: string;
  typeId: string;
  category: DocumentCategory;
  source: "upload" | "task" | "system" | "integration";
  farmId?: string;
  siteId?: string;
  plotId?: string;
  lotId?: string;
  documentNumber?: string;
  issuedAt: string;
  expiresAt?: string;
  fileName?: string;
  status: "Draft" | "Pending Review" | "Approved" | "Rejected" | "Expired";
  uploadedBy: string;
  approvedBy?: string;
  notes?: string;
};

export type InventoryItem = {
  id: string;
  farmId: string;
  siteId?: string;
  name: string;
  category:
    | "ปุ๋ยและธาตุอาหาร"
    | "ชีวภัณฑ์และสารป้องกัน"
    | "เชื้อเพลิง"
    | "วัสดุเก็บเกี่ยว"
    | "อะไหล่และอุปกรณ์";
  unit: string;
  onHand: number;
  reorderPoint: number;
  targetStock: number;
  averageDailyUsage: number;
  leadTimeDays: number;
  unitCost: number;
  supplier: string;
  updatedAt: string;
};

export type PurchaseRequest = {
  id: string;
  farmId: string;
  itemId: string;
  quantity: number;
  unit: string;
  requestedBy: string;
  requestedAt: string;
  neededBy: string;
  reason: string;
  status:
    | "Draft"
    | "Pending Approval"
    | "Approved"
    | "Ordered"
    | "Partially Received"
    | "Received"
    | "Rejected";
  approvedBy?: string;
  supplier?: string;
  orderNumber?: string;
  receivedQuantity?: number;
};

export type MachineStatus =
  "Ready" | "In Use" | "Inspection Due" | "Maintenance" | "Out of Service";

export type MachineAsset = {
  id: string;
  farmId: string;
  siteId?: string;
  name: string;
  type:
    "รถแทรกเตอร์" | "ระบบน้ำ" | "เครื่องพ่น" | "เครื่องตัดหญ้า" | "เครื่องกำเนิดไฟฟ้า" | "อื่นๆ";
  assetCode: string;
  status: MachineStatus;
  location: string;
  assignedTeam: string;
  meterHours: number;
  lastInspectionDate?: string;
  nextInspectionDate: string;
  nextMaintenanceHours: number;
};

export type MachineInspection = {
  id: string;
  machineId: string;
  farmId: string;
  inspectedAt: string;
  inspectedBy: string;
  meterHours: number;
  result: "Passed" | "Needs Attention" | "Failed";
  checklist: { name: string; result: "Pass" | "Attention" | "Fail" }[];
  notes?: string;
};

export type MaintenanceRecord = {
  id: string;
  machineId: string;
  farmId: string;
  title: string;
  type: "Preventive" | "Repair";
  scheduledFor: string;
  assignedTo: string;
  estimatedCost: number;
  status: "Planned" | "In Progress" | "Completed";
  notes?: string;
};

export function getInventoryDaysRemaining(item: InventoryItem) {
  return item.averageDailyUsage > 0 ? Math.floor(item.onHand / item.averageDailyUsage) : undefined;
}

export function getSuggestedOrderQuantity(item: InventoryItem) {
  return Math.max(0, item.targetStock - item.onHand);
}

export function getInventoryStatus(item: InventoryItem) {
  const daysRemaining = getInventoryDaysRemaining(item);
  if (
    item.onHand <= item.reorderPoint ||
    (daysRemaining !== undefined && daysRemaining <= item.leadTimeDays)
  )
    return "order" as const;
  if (
    item.onHand <= item.reorderPoint * 1.35 ||
    (daysRemaining !== undefined && daysRemaining <= item.leadTimeDays + 3)
  )
    return "watch" as const;
  return "ready" as const;
}

export type DemoState = {
  personaId: DemoPersonaId;
  farm: FarmSummary;
  additionalFarms?: DashboardFarm[];
  sites: FarmSite[];
  plots: Plot[];
  tasks: SmartTask[];
  recommendations: Recommendation[];
  weather: DragonflyWeather;
  productionPlans: ProductionPlan[];
  workOrders: WorkOrder[];
  workforce: WorkerSummary;
  workers: WorkerProfile[];
  memberInvites: MemberInvite[];
  organizationRoles: OrganizationRole[];
  iotDevices: IoTDevice[];
  iotRules: IoTRule[];
  iotAlerts: IoTAlert[];
  traceability: TraceabilityChain[];
  documentTypes: OrganizationDocumentType[];
  documents: FarmDocument[];
  inventoryItems: InventoryItem[];
  purchaseRequests: PurchaseRequest[];
  machines: MachineAsset[];
  machineInspections: MachineInspection[];
  maintenanceRecords: MaintenanceRecord[];
  tutorialProgress: string[];
  phiScenario: {
    plot: string;
    chemicalDate: string;
    phiDays: number;
    earliestHarvest: string;
    plannedHarvest: string;
  };
  satellite: { plot: string; previousNdvi: number; currentNdvi: number; changePercent: number };
};

const STORAGE_KEY = "dragonfly_demo_state_v1";
const PERSONA_KEY = "dragonfly_demo_persona_v1";
const EMPLOYEE_PARENT_PERSONA_KEY = "easyplants_employee_parent_persona";

export const appDataMode: DataMode =
  (import.meta.env.VITE_APP_DATA_MODE as DataMode | undefined) ??
  (import.meta.env.APP_DATA_MODE as DataMode | undefined) ??
  "demo";

export const isDemoMode = appDataMode === "demo";

export function getInitialDemoState() {
  return buildDemoState("commercial");
}

export const demoPersonas: DemoPersona[] = [
  {
    id: "employee",
    label: "Field Worker",
    role: "พนักงานภาคสนาม",
    subscription: "Free",
    profile: {
      farmingType: "Field operations",
      experience: "Assigned work only",
      farmSize: "Assigned zones",
      workforce: "Field crew member",
      technology: ["Mobile task list"],
      knowledgeLevel: "Intermediate",
      operationScale: "Commercial Farm",
      tutorialsEnabled: true,
      recommendationsEnabled: false,
    },
  },
  {
    id: "owner",
    label: "Farm Owner",
    role: "เจ้าของสวน",
    subscription: "Free",
    profile: {
      farmingType: "Mixed fruit orchard",
      experience: "1-2 years",
      farmSize: "5-20 rai",
      workforce: "Family and 1-3 helpers",
      technology: ["Mobile records", "Manual irrigation"],
      knowledgeLevel: "Intermediate",
      operationScale: "Small Farm",
      tutorialsEnabled: true,
      recommendationsEnabled: true,
    },
  },
  {
    id: "beginner",
    label: "Beginner Farmer",
    role: "ชาวสวนมือใหม่",
    subscription: "Free",
    profile: {
      farmingType: "Just starting / Learning",
      experience: "No experience",
      farmSize: "Less than 5 rai",
      workforce: "Working alone",
      technology: ["No IoT"],
      knowledgeLevel: "Beginner",
      operationScale: "Small Farm",
      tutorialsEnabled: true,
      recommendationsEnabled: true,
    },
  },
  {
    id: "commercial",
    label: "Commercial Farm Manager",
    role: "ผู้จัดการสวนเชิงพาณิชย์",
    subscription: "Farm Pro",
    profile: {
      farmingType: "Commercial farm",
      experience: "2-5 years",
      farmSize: "20-100 rai",
      workforce: "More than 20 workers",
      technology: ["Sensors", "Automatic irrigation", "Weather station"],
      knowledgeLevel: "Intermediate",
      operationScale: "Commercial Farm",
      tutorialsEnabled: false,
      recommendationsEnabled: true,
    },
  },
  {
    id: "export",
    label: "Export Farm Manager",
    role: "ผู้จัดการสวนส่งออก",
    subscription: "Farm Pro",
    profile: {
      farmingType: "Export farm",
      experience: "More than 5 years",
      farmSize: "More than 100 rai",
      workforce: "More than 20 workers",
      technology: ["Sensors", "Automatic irrigation", "Weather station", "Other agricultural IoT"],
      knowledgeLevel: "Experienced",
      operationScale: "Enterprise / Export",
      tutorialsEnabled: false,
      recommendationsEnabled: true,
    },
  },
];

const demoWeather: DragonflyWeather = {
  source: "demo",
  temp: 31,
  condition: "มีเมฆมาก ฝนช่วงเย็น",
  humidity: 74,
  wind: 11,
  uv: 6,
  rainChance: 68,
  hourly: [
    { t: "13:00", temp: 32, rain: 35, condition: "Cloudy" },
    { t: "15:00", temp: 31, rain: 58, condition: "Cloudy" },
    { t: "17:00", temp: 29, rain: 78, condition: "Rain" },
    { t: "20:00", temp: 27, rain: 42, condition: "Cloudy" },
  ],
  daily: [
    { d: "วันนี้", hi: 32, lo: 25, rain: 68, icon: "🌧️" },
    { d: "พรุ่งนี้", hi: 33, lo: 25, rain: 45, icon: "⛅" },
    { d: "พุธ", hi: 32, lo: 24, rain: 72, icon: "🌧️" },
    { d: "พฤหัสฯ", hi: 34, lo: 25, rain: 30, icon: "🌤️" },
    { d: "ศุกร์", hi: 33, lo: 25, rain: 40, icon: "⛅" },
  ],
};

function orchardPlots(prefix = "D", scale = 1): Plot[] {
  const base = [
    ["01", "Monthong", "Fruit Development", 42, 410, 87],
    ["02", "Monthong", "Flowering", 38, 365, 82],
    ["03", "Chanee", "Fruit Set", 31, 320, 76],
    ["04", "Monthong", "Pre-Harvest", 45, 480, 69],
    ["05", "Monthong", "Vegetative Growth", 28, 290, 91],
    ["06", "Chanee", "Post Harvest", 34, 335, 84],
  ] as const;

  return base.map(([code, variety, stage, area, trees, health]) => ({
    id: `${prefix}${code}`,
    farmId: "FARM-PRIMARY",
    siteId: Number(code) <= 2 ? "SITE-D01" : Number(code) <= 4 ? "SITE-D02" : "SITE-D03",
    name: `แปลง ${prefix}${code}`,
    crop: `ทุเรียน${variety}`,
    emoji: "🥭",
    ageMonths: 72,
    trees: Math.round(trees * scale),
    area: Math.round(area * scale),
    health,
    gps: `12.${6086 + Number(code)}° N, 102.${1035 + Number(code)}° E`,
    lastCare: stage,
    history: [
      { date: "10 ส.ค. 2569", action: "ตรวจแปลง", note: `สถานะการผลิต: ${stage}` },
      { date: "6 ส.ค. 2569", action: "บันทึกสุขภาพ", note: `คะแนนสุขภาพ ${health}/100` },
    ],
  }));
}

const defaultDocumentTypes: OrganizationDocumentType[] = [
  {
    id: "DOC-TYPE-TASK",
    name: "หลักฐานการปฏิบัติงาน",
    category: "การผลิต",
    requiresApproval: true,
    tracksExpiry: false,
    requiredFor: "Task ที่ต้องตรวจรับ",
    builtIn: true,
  },
  {
    id: "DOC-TYPE-CHEM",
    name: "บันทึกการใช้สาร",
    category: "สารเคมีและ PHI",
    requiresApproval: true,
    tracksExpiry: false,
    requiredFor: "งานพ่นสารทุกครั้ง",
    builtIn: true,
  },
  {
    id: "DOC-TYPE-PHI",
    name: "ใบสรุปสถานะ PHI",
    category: "สารเคมีและ PHI",
    requiresApproval: true,
    tracksExpiry: false,
    requiredFor: "ล็อตก่อนเก็บเกี่ยว",
    builtIn: true,
  },
  {
    id: "DOC-TYPE-QA",
    name: "ใบตรวจรับ QA",
    category: "QA และ Compliance",
    requiresApproval: true,
    tracksExpiry: false,
    requiredFor: "Harvest/Packing Lot",
    builtIn: true,
  },
  {
    id: "DOC-TYPE-GAP",
    name: "ใบรับรอง GAP",
    category: "ใบรับรอง",
    requiresApproval: true,
    tracksExpiry: true,
    requiredFor: "ฟาร์มที่อ้างอิงมาตรฐาน GAP",
    builtIn: true,
  },
  {
    id: "DOC-TYPE-LAB",
    name: "ผลตรวจสารตกค้าง",
    category: "QA และ Compliance",
    requiresApproval: true,
    tracksExpiry: true,
    requiredFor: "ล็อตส่งออก",
    builtIn: true,
  },
  {
    id: "DOC-TYPE-EXPORT",
    name: "เอกสารส่งออก",
    category: "การขายและส่งออก",
    requiresApproval: true,
    tracksExpiry: false,
    requiredFor: "ล็อตส่งออก",
    builtIn: true,
  },
  {
    id: "DOC-TYPE-REPORT",
    name: "รายงานที่สร้างจากระบบ",
    category: "รายงานจากระบบ",
    requiresApproval: false,
    tracksExpiry: false,
    requiredFor: "รายงาน PDF/Excel",
    builtIn: true,
  },
];

function demoDocuments(farmName: string): FarmDocument[] {
  return [
    {
      id: "DOC-001",
      title: `ใบรับรอง GAP · ${farmName}`,
      typeId: "DOC-TYPE-GAP",
      category: "ใบรับรอง",
      source: "upload",
      farmId: "FARM-PRIMARY",
      documentNumber: "GAP-TH-2569-0041",
      issuedAt: "2026-01-15",
      expiresAt: "2027-01-14",
      fileName: "gap-certificate-2569.pdf",
      status: "Approved",
      uploadedBy: "ผู้จัดการฟาร์ม",
      approvedBy: "Owner/Admin",
    },
    {
      id: "DOC-002",
      title: "สรุป PHI ล็อต EXPORT-2026-001",
      typeId: "DOC-TYPE-PHI",
      category: "สารเคมีและ PHI",
      source: "system",
      farmId: "FARM-PRIMARY",
      siteId: "SITE-D02",
      plotId: "D04",
      lotId: "EXPORT-2026-001",
      documentNumber: "PHI-D04-001",
      issuedAt: "2026-08-20",
      fileName: "phi-export-2026-001.pdf",
      status: "Pending Review",
      uploadedBy: "ระบบ EasyPlants",
      notes: "คำนวณจากบันทึกใช้สารล่าสุดและ PHI 14 วัน",
    },
    {
      id: "DOC-003",
      title: "ผลตรวจสารตกค้างก่อนส่งออก",
      typeId: "DOC-TYPE-LAB",
      category: "QA และ Compliance",
      source: "upload",
      farmId: "FARM-PRIMARY",
      siteId: "SITE-D02",
      plotId: "D04",
      lotId: "EXPORT-2026-001",
      documentNumber: "LAB-RES-260818",
      issuedAt: "2026-08-18",
      expiresAt: "2026-11-18",
      fileName: "lab-residue-export-001.pdf",
      status: "Approved",
      uploadedBy: "เจ้าหน้าที่ QA",
      approvedBy: "QA Manager",
    },
    {
      id: "DOC-004",
      title: "ใบตรวจรับคุณภาพ Packing Lot 014",
      typeId: "DOC-TYPE-QA",
      category: "QA และ Compliance",
      source: "task",
      farmId: "FARM-PRIMARY",
      siteId: "SITE-D04",
      plotId: "D04",
      lotId: "EXPORT-2026-001",
      issuedAt: "2026-08-20",
      fileName: "qa-pack-014.pdf",
      status: "Approved",
      uploadedBy: "รัชนี",
      approvedBy: "ผู้จัดการโรงคัด",
    },
    {
      id: "DOC-005",
      title: "Phytosanitary Certificate · North Lot 003",
      typeId: "DOC-TYPE-EXPORT",
      category: "การขายและส่งออก",
      source: "upload",
      farmId: "FARM-NORTH",
      siteId: "NORTH-A",
      plotId: "N02",
      lotId: "EXPORT-NORTH-2026-003",
      documentNumber: "PHYTO-TH-260821-88",
      issuedAt: "2026-08-21",
      fileName: "phyto-north-003.pdf",
      status: "Approved",
      uploadedBy: "ฝ่ายส่งออก",
      approvedBy: "Export Manager",
    },
    {
      id: "DOC-006",
      title: "หลักฐานตรวจระบบน้ำ D01",
      typeId: "DOC-TYPE-TASK",
      category: "การผลิต",
      source: "task",
      farmId: "FARM-PRIMARY",
      siteId: "SITE-D01",
      plotId: "D01",
      issuedAt: "2026-08-17",
      fileName: "task-T-001-evidence.jpg",
      status: "Approved",
      uploadedBy: "มาลี",
      approvedBy: "หัวหน้าสวน",
    },
  ];
}

function demoInventoryItems(): InventoryItem[] {
  return [
    {
      id: "INV-001",
      farmId: "FARM-PRIMARY",
      siteId: "SITE-D02",
      name: "ปุ๋ย 15-15-15",
      category: "ปุ๋ยและธาตุอาหาร",
      unit: "กระสอบ",
      onHand: 18,
      reorderPoint: 24,
      targetStock: 40,
      averageDailyUsage: 6,
      leadTimeDays: 4,
      unitCost: 760,
      supplier: "สหกรณ์การเกษตรจันทบุรี",
      updatedAt: "วันนี้ 07:30",
    },
    {
      id: "INV-002",
      farmId: "FARM-PRIMARY",
      siteId: "SITE-D02",
      name: "ชีวภัณฑ์ป้องกันโรค",
      category: "ชีวภัณฑ์และสารป้องกัน",
      unit: "ขวด",
      onHand: 12,
      reorderPoint: 6,
      targetStock: 12,
      averageDailyUsage: 0.5,
      leadTimeDays: 5,
      unitCost: 420,
      supplier: "ไบโอฟาร์มซัพพลาย",
      updatedAt: "เมื่อวาน 16:20",
    },
    {
      id: "INV-003",
      farmId: "FARM-PRIMARY",
      siteId: "SITE-D03",
      name: "เชื้อเพลิงดีเซล",
      category: "เชื้อเพลิง",
      unit: "ลิตร",
      onHand: 220,
      reorderPoint: 240,
      targetStock: 600,
      averageDailyUsage: 55,
      leadTimeDays: 2,
      unitCost: 34.5,
      supplier: "PT Farm Fleet",
      updatedAt: "วันนี้ 06:45",
    },
    {
      id: "INV-004",
      farmId: "FARM-PRIMARY",
      siteId: "SITE-D02",
      name: "ลังเก็บเกี่ยว",
      category: "วัสดุเก็บเกี่ยว",
      unit: "ใบ",
      onHand: 74,
      reorderPoint: 35,
      targetStock: 100,
      averageDailyUsage: 8,
      leadTimeDays: 3,
      unitCost: 185,
      supplier: "Eastern Pack",
      updatedAt: "17 ส.ค. 15:10",
    },
    {
      id: "INV-N01",
      farmId: "FARM-NORTH",
      siteId: "NORTH-A",
      name: "ปุ๋ยตามแผนฤดูกาล",
      category: "ปุ๋ยและธาตุอาหาร",
      unit: "กระสอบ",
      onHand: 6,
      reorderPoint: 20,
      targetStock: 40,
      averageDailyUsage: 5,
      leadTimeDays: 5,
      unitCost: 810,
      supplier: "สหกรณ์เขาคิชฌกูฏ",
      updatedAt: "วันนี้ 08:10",
    },
    {
      id: "INV-N02",
      farmId: "FARM-NORTH",
      siteId: "NORTH-B",
      name: "วัสดุเก็บเกี่ยว",
      category: "วัสดุเก็บเกี่ยว",
      unit: "ชุด",
      onHand: 74,
      reorderPoint: 35,
      targetStock: 100,
      averageDailyUsage: 7,
      leadTimeDays: 4,
      unitCost: 210,
      supplier: "Eastern Pack",
      updatedAt: "เมื่อวาน 14:00",
    },
    {
      id: "INV-E01",
      farmId: "FARM-EAST",
      siteId: "EAST-A",
      name: "เชื้อเพลิงดีเซล",
      category: "เชื้อเพลิง",
      unit: "ลิตร",
      onHand: 410,
      reorderPoint: 220,
      targetStock: 600,
      averageDailyUsage: 42,
      leadTimeDays: 2,
      unitCost: 34.5,
      supplier: "PT Farm Fleet",
      updatedAt: "วันนี้ 07:00",
    },
  ];
}

function demoPurchaseRequests(): PurchaseRequest[] {
  return [
    {
      id: "PR-2569-018",
      farmId: "FARM-PRIMARY",
      itemId: "INV-001",
      quantity: 22,
      unit: "กระสอบ",
      requestedBy: "กิตติ · หัวหน้าทีมทั่วไป",
      requestedAt: "2026-08-18",
      neededBy: "2026-08-22",
      reason: "คงเหลือต่ำกว่าจุดสั่งซื้อและพอใช้ประมาณ 3 วัน",
      status: "Pending Approval",
    },
    {
      id: "PR-2569-017",
      farmId: "FARM-PRIMARY",
      itemId: "INV-003",
      quantity: 380,
      unit: "ลิตร",
      requestedBy: "มาลี · หัวหน้าทีมระบบน้ำ",
      requestedAt: "2026-08-17",
      neededBy: "2026-08-20",
      reason: "เติมกลับถึงสต็อกเป้าหมายก่อนงานเครื่องจักรรอบถัดไป",
      status: "Ordered",
      approvedBy: "ผู้จัดการฟาร์ม",
      supplier: "PT Farm Fleet",
      orderNumber: "PO-2569-103",
    },
    {
      id: "PR-2569-014",
      farmId: "FARM-PRIMARY",
      itemId: "INV-004",
      quantity: 30,
      unit: "ใบ",
      requestedBy: "สมพร · ทีมเก็บเกี่ยว",
      requestedAt: "2026-08-12",
      neededBy: "2026-08-16",
      reason: "เตรียมลังสำรองสำหรับรอบเก็บเกี่ยว",
      status: "Received",
      approvedBy: "ผู้จัดการฟาร์ม",
      supplier: "Eastern Pack",
      orderNumber: "PO-2569-099",
      receivedQuantity: 30,
    },
    {
      id: "PR-N-006",
      farmId: "FARM-NORTH",
      itemId: "INV-N01",
      quantity: 34,
      unit: "กระสอบ",
      requestedBy: "ธนา · ผู้จัดการโซน",
      requestedAt: "2026-08-18",
      neededBy: "2026-08-23",
      reason: "สต็อกต่ำกว่าจุดสั่งซื้อก่อนรอบบำรุง",
      status: "Pending Approval",
    },
  ];
}

function demoMachines(): MachineAsset[] {
  return [
    {
      id: "MCH-001",
      farmId: "FARM-PRIMARY",
      siteId: "SITE-D01",
      name: "ปั๊มน้ำหลัก",
      type: "ระบบน้ำ",
      assetCode: "PUMP-D01-01",
      status: "Ready",
      location: "โรงปั๊มโซนผลผลิต 1",
      assignedTeam: "ทีมระบบน้ำ",
      meterHours: 1840,
      lastInspectionDate: "2026-08-19",
      nextInspectionDate: "2026-08-26",
      nextMaintenanceHours: 2000,
    },
    {
      id: "MCH-002",
      farmId: "FARM-PRIMARY",
      siteId: "SITE-D02",
      name: "รถแทรกเตอร์ 01",
      type: "รถแทรกเตอร์",
      assetCode: "TRACTOR-01",
      status: "Inspection Due",
      location: "โรงจอดกลาง",
      assignedTeam: "ทีมเครื่องจักร",
      meterHours: 2368,
      lastInspectionDate: "2026-08-12",
      nextInspectionDate: "2026-08-19",
      nextMaintenanceHours: 2400,
    },
    {
      id: "MCH-003",
      farmId: "FARM-PRIMARY",
      siteId: "SITE-D03",
      name: "เครื่องพ่นแรงดันสูง",
      type: "เครื่องพ่น",
      assetCode: "SPRAYER-03",
      status: "Maintenance",
      location: "คลังอุปกรณ์โซน 3",
      assignedTeam: "ทีมอารักขาพืช",
      meterHours: 624,
      lastInspectionDate: "2026-08-18",
      nextInspectionDate: "2026-08-25",
      nextMaintenanceHours: 650,
    },
    {
      id: "MCH-N01",
      farmId: "FARM-NORTH",
      siteId: "NORTH-A",
      name: "รถแทรกเตอร์เหนือ 01",
      type: "รถแทรกเตอร์",
      assetCode: "N-TRACTOR-01",
      status: "In Use",
      location: "โซนเนินเหนือ",
      assignedTeam: "ทีมเครื่องจักรเหนือ",
      meterHours: 1512,
      lastInspectionDate: "2026-08-19",
      nextInspectionDate: "2026-08-26",
      nextMaintenanceHours: 1600,
    },
    {
      id: "MCH-E01",
      farmId: "FARM-EAST",
      siteId: "EAST-A",
      name: "เครื่องตัดหญ้าระยอง",
      type: "เครื่องตัดหญ้า",
      assetCode: "R-MOWER-04",
      status: "Ready",
      location: "โซนริมคลอง",
      assignedTeam: "ทีมดูแลพื้นที่",
      meterHours: 482,
      lastInspectionDate: "2026-08-18",
      nextInspectionDate: "2026-08-25",
      nextMaintenanceHours: 500,
    },
  ];
}

function demoMachineInspections(): MachineInspection[] {
  return [
    {
      id: "INSP-260819-01",
      machineId: "MCH-001",
      farmId: "FARM-PRIMARY",
      inspectedAt: "2026-08-19T07:30:00+07:00",
      inspectedBy: "มาลี · หัวหน้าทีมระบบน้ำ",
      meterHours: 1840,
      result: "Passed",
      checklist: [
        { name: "น้ำมันและของเหลว", result: "Pass" },
        { name: "รอยรั่ว", result: "Pass" },
        { name: "อุปกรณ์นิรภัย", result: "Pass" },
      ],
      notes: "แรงดันและเสียงเดินเครื่องปกติ",
    },
    {
      id: "INSP-260818-02",
      machineId: "MCH-003",
      farmId: "FARM-PRIMARY",
      inspectedAt: "2026-08-18T15:10:00+07:00",
      inspectedBy: "อนันต์ · ทีมอารักขาพืช",
      meterHours: 624,
      result: "Needs Attention",
      checklist: [
        { name: "น้ำมันและของเหลว", result: "Pass" },
        { name: "รอยรั่ว", result: "Attention" },
        { name: "อุปกรณ์นิรภัย", result: "Pass" },
      ],
      notes: "พบซึมบริเวณข้อต่อสายแรงดัน ส่งซ่อมก่อนใช้งานครั้งถัดไป",
    },
  ];
}

function demoMaintenanceRecords(): MaintenanceRecord[] {
  return [
    {
      id: "MAINT-260818-01",
      machineId: "MCH-003",
      farmId: "FARM-PRIMARY",
      title: "เปลี่ยนข้อต่อสายแรงดัน",
      type: "Repair",
      scheduledFor: "2026-08-20",
      assignedTo: "ช่างประจำฟาร์ม · ทีมเครื่องจักร",
      estimatedCost: 1850,
      status: "Planned",
      notes: "สร้างจากผลตรวจ INSP-260818-02",
    },
    {
      id: "MAINT-260812-02",
      machineId: "MCH-002",
      farmId: "FARM-PRIMARY",
      title: "บำรุงรักษารอบ 2,400 ชั่วโมง",
      type: "Preventive",
      scheduledFor: "2026-08-24",
      assignedTo: "ศูนย์บริการคู่สัญญา",
      estimatedCost: 12500,
      status: "Planned",
      notes: "เหลือประมาณ 32 ชั่วโมงก่อนถึงรอบ",
    },
  ];
}

function buildDemoState(personaId: DemoPersonaId): DemoState {
  if (personaId === "beginner") {
    return {
      personaId,
      farm: {
        name: "สวนเรียนรู้ EasyPlants",
        type: "Small Learning Farm",
        areaRai: 5,
        primaryCrop: "ผักสวนครัวและไม้ผล",
        varieties: ["มะนาว", "พริก", "โหระพา"],
        plotCount: 2,
        treeCount: 84,
        workerCount: 1,
      },
      sites: [
        {
          id: "SITE-B01",
          code: "B01",
          name: "สวนเรียนรู้",
          type: "แปลงทดลอง",
          areaRai: 5,
          manager: "เจ้าของสวน",
          plotPrefixes: ["B"],
          status: "Normal",
        },
      ],
      plots: legacyPlots
        .slice(0, 2)
        .map((p, i) => ({ ...p, id: `B0${i + 1}`, area: i === 0 ? 3 : 2 })),
      tasks: [
        {
          id: "BT-001",
          title: "ตรวจใบและยอดอ่อน",
          plot: "B01",
          farmId: "FARM-PRIMARY",
          siteId: "SITE-B01",
          type: "Plant Health",
          status: "Planned",
          scheduledFor: getLocalDateKey(),
          plannedStart: "07:00",
          estimatedMinutes: 25,
          priority: "High",
          origin: "personal",
        },
        {
          id: "BT-002",
          title: "รดน้ำช่วงเช้า",
          plot: "B02",
          farmId: "FARM-PRIMARY",
          siteId: "SITE-B01",
          type: "Irrigation",
          status: "Completed",
          scheduledFor: getLocalDateKey(),
          plannedStart: "06:15",
          estimatedMinutes: 35,
          priority: "Normal",
          origin: "personal",
        },
        {
          id: "BT-003",
          title: "จดบันทึกการเจริญเติบโต",
          plot: "B01",
          farmId: "FARM-PRIMARY",
          siteId: "SITE-B01",
          type: "Record",
          status: "Planned",
          scheduledFor: getLocalDateKey(),
          plannedStart: "17:00",
          estimatedMinutes: 15,
          priority: "Normal",
          origin: "personal",
        },
      ],
      recommendations: [
        {
          id: "BR-001",
          title: "ฝนจะตกช่วงเย็น",
          plot: "แปลงมะนาว",
          reason: "Demo weather แสดงโอกาสฝน 68% หลัง 17:00",
          action: "พิจารณาเลื่อนการรดน้ำรอบเย็น",
          confidence: "Demo",
          sourceType: "demo",
          sourceLabel: "ข้อมูลอากาศตัวอย่างจาก Demo Mode",
          generatedAt: "2026-08-17",
        },
      ],
      weather: demoWeather,
      productionPlans: [],
      workOrders: [],
      workforce: {
        total: 1,
        active: 1,
        available: 0,
        absent: 0,
        crews: [{ name: "เจ้าของสวน", assigned: 3, status: "Active" }],
      },
      workers: [
        {
          id: "OWNER-001",
          name: "เจ้าของสวน",
          role: "Farm Owner",
          crew: "เจ้าของสวน",
          status: "Active",
          plot: "แปลงมะนาว",
          currentTask: "ตรวจใบและยอดอ่อน",
        },
      ],
      memberInvites: [],
      organizationRoles: defaultOrganizationRoles.map((role) => ({
        ...role,
        permissions: [...role.permissions],
      })),
      iotDevices: [],
      iotRules: [],
      iotAlerts: [],
      traceability: [],
      documentTypes: defaultDocumentTypes,
      documents: [],
      inventoryItems: demoInventoryItems()
        .filter((item) => item.farmId === "FARM-PRIMARY")
        .slice(0, 2),
      purchaseRequests: [],
      machines: demoMachines()
        .filter((machine) => machine.farmId === "FARM-PRIMARY")
        .slice(0, 1),
      machineInspections: demoMachineInspections().filter(
        (inspection) => inspection.machineId === "MCH-001",
      ),
      maintenanceRecords: [],
      tutorialProgress: ["create-farm", "create-plot"],
      phiScenario: {
        plot: "-",
        chemicalDate: "-",
        phiDays: 0,
        earliestHarvest: "-",
        plannedHarvest: "-",
      },
      satellite: { plot: "แปลงมะนาว", previousNdvi: 0.64, currentNdvi: 0.62, changePercent: -3.1 },
    };
  }

  const isExport = personaId === "export";
  const scale = isExport ? 2.65 : 1;
  const plots = orchardPlots("D", scale);
  const scheduleDate = (offset: number) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + offset);
    return getLocalDateKey(date);
  };

  return {
    personaId,
    farm: {
      name: isExport ? "EasyPlants Export Orchard" : "EasyPlants Demo Orchard",
      type: isExport ? "Export Fruit Orchard" : "Commercial Fruit Orchard",
      areaRai: isExport ? 850 : 320,
      primaryCrop: "Durian",
      varieties: ["Monthong", "Chanee"],
      plotCount: isExport ? 28 : 12,
      treeCount: isExport ? 12840 : 4850,
      workerCount: isExport ? 65 : 24,
    },
    sites: isExport
      ? [
          {
            id: "SITE-D01",
            code: "D01",
            name: "โซนเหนือ",
            type: "ทุเรียนส่งออก",
            areaRai: 220,
            manager: "อนันต์",
            plotPrefixes: ["D01", "D02"],
            status: "Normal",
          },
          {
            id: "SITE-D02",
            code: "D02",
            name: "โซนกลาง",
            type: "ทุเรียนส่งออก",
            areaRai: 210,
            manager: "มาลี",
            plotPrefixes: ["D03", "D04"],
            status: "Needs attention",
          },
          {
            id: "SITE-D03",
            code: "D03",
            name: "โซนตะวันออก",
            type: "ทุเรียนส่งออก",
            areaRai: 220,
            manager: "รัชนี",
            plotPrefixes: ["D05", "D06"],
            status: "Normal",
          },
          {
            id: "SITE-D04",
            code: "D04",
            name: "ศูนย์คัดบรรจุ",
            type: "Packing & QA",
            areaRai: 200,
            manager: "ผู้จัดการโรงคัด",
            plotPrefixes: [],
            status: "Normal",
          },
        ]
      : [
          {
            id: "SITE-D01",
            code: "D01",
            name: "โซนผลผลิต 1",
            type: "ทุเรียนหมอนทอง",
            areaRai: 110,
            manager: "มาลี",
            plotPrefixes: ["D01", "D02"],
            status: "Normal",
          },
          {
            id: "SITE-D02",
            code: "D02",
            name: "โซนผลผลิต 2",
            type: "ทุเรียนผสม",
            areaRai: 130,
            manager: "อนันต์",
            plotPrefixes: ["D03", "D04"],
            status: "Needs attention",
          },
          {
            id: "SITE-D03",
            code: "D03",
            name: "โซนสนับสนุน",
            type: "ระบบน้ำและบำรุง",
            areaRai: 80,
            manager: "กิตติ",
            plotPrefixes: ["D05", "D06"],
            status: "Normal",
          },
        ],
    plots,
    tasks: [
      {
        id: "T-001",
        title: "ตรวจระบบน้ำหยดและแรงดัน",
        plot: "D01",
        farmId: "FARM-PRIMARY",
        siteId: "SITE-D01",
        type: "Irrigation",
        status: "Completed",
        scheduledFor: scheduleDate(0),
        plannedStart: "06:00",
        estimatedMinutes: 45,
        priority: "High",
        assignedWorkerId: "W-002",
        team: "Irrigation Crew",
        origin: "team",
        approvalMode: "team_lead",
      },
      {
        id: "T-002",
        title: "สำรวจเพลี้ยแป้งใต้ทรงพุ่ม",
        plot: "D03",
        farmId: "FARM-PRIMARY",
        siteId: "SITE-D02",
        type: "Inspection",
        status: "In Progress",
        scheduledFor: scheduleDate(0),
        plannedStart: "06:30",
        estimatedMinutes: 90,
        priority: "Urgent",
        assignedWorkerId: "W-001",
        team: "Crop Protection Crew",
        origin: "team",
        approvalMode: "team_lead",
      },
      {
        id: "T-003",
        title: "บันทึกความชื้นดินก่อนรอบให้น้ำ",
        plot: "D01",
        farmId: "FARM-PRIMARY",
        siteId: "SITE-D01",
        type: "Inspection",
        status: "Assigned",
        scheduledFor: scheduleDate(0),
        plannedStart: "07:15",
        estimatedMinutes: 30,
        priority: "High",
        assignedWorkerId: "W-002",
        team: "Irrigation Crew",
        origin: "team",
        approvalMode: "team_lead",
      },
      {
        id: "T-009",
        title: "ตรวจหัวจ่ายน้ำท้ายแถวและจุดรั่ว",
        plot: "D02",
        farmId: "FARM-PRIMARY",
        siteId: "SITE-D01",
        type: "Irrigation",
        status: "Assigned",
        scheduledFor: scheduleDate(0),
        plannedStart: "08:00",
        estimatedMinutes: 60,
        priority: "Normal",
        assignedWorkerId: "W-002",
        team: "Irrigation Crew",
        origin: "team",
        approvalMode: "team_lead",
      },
      {
        id: "T-010",
        title: "เก็บตัวอย่างดินก่อนวางแผนใส่ปุ๋ย",
        plot: "D04",
        farmId: "FARM-PRIMARY",
        siteId: "SITE-D02",
        type: "Inspection",
        status: "Planned",
        scheduledFor: scheduleDate(0),
        plannedStart: "09:00",
        estimatedMinutes: 50,
        priority: "Normal",
        assignedWorkerId: "W-004",
        team: "General Farm Crew",
        origin: "team",
        approvalMode: "farm_manager",
      },
      {
        id: "T-011",
        title: "ตรวจความพร้อมกรรไกรและลังเก็บเกี่ยว",
        plot: "D04",
        farmId: "FARM-PRIMARY",
        siteId: "SITE-D02",
        type: "Harvest",
        status: "Supervisor Review",
        scheduledFor: scheduleDate(0),
        plannedStart: "10:00",
        estimatedMinutes: 40,
        priority: "High",
        assignedWorkerId: "W-003",
        team: "Harvest Crew",
        origin: "team",
        approvalMode: "qa",
        completion: {
          note: "ตรวจนับอุปกรณ์ครบและฆ่าเชื้อแล้ว",
          evidenceCount: 0,
          completedBy: "สมพร",
        },
      },
      {
        id: "T-012",
        title: "ตัดหญ้าแนวร่องระบายน้ำ",
        plot: "D02",
        farmId: "FARM-PRIMARY",
        siteId: "SITE-D01",
        type: "Maintenance",
        status: "Delayed",
        reason: "ฝนตกช่วงเช้า พื้นที่ลื่น",
        scheduledFor: scheduleDate(0),
        plannedStart: "10:30",
        estimatedMinutes: 120,
        priority: "Normal",
        assignedWorkerId: "W-004",
        team: "General Farm Crew",
        origin: "team",
        approvalMode: "team_lead",
      },
      {
        id: "T-013",
        title: "สำรวจใบอ่อนและรอยทำลายของแมลง",
        plot: "D03",
        farmId: "FARM-PRIMARY",
        siteId: "SITE-D02",
        type: "Inspection",
        status: "In Progress",
        scheduledFor: scheduleDate(0),
        plannedStart: "13:00",
        estimatedMinutes: 75,
        priority: "High",
        assignedWorkerId: "W-001",
        team: "Crop Protection Crew",
        origin: "team",
        approvalMode: "team_lead",
      },
      {
        id: "T-014",
        title: "ตรวจคุณภาพผลล็อตตัวอย่างก่อนตัด",
        plot: "D04",
        farmId: "FARM-PRIMARY",
        siteId: "SITE-D02",
        type: "Inspection",
        status: "Assigned",
        scheduledFor: scheduleDate(0),
        plannedStart: "14:00",
        estimatedMinutes: 60,
        priority: "Urgent",
        assignedWorkerId: "W-005",
        team: "Harvest Crew",
        origin: "team",
        approvalMode: "qa",
      },
      {
        id: "T-015",
        title: "บันทึกอุณหภูมิและความชื้นจุดพักผลผลิต",
        plot: "D04",
        farmId: "FARM-PRIMARY",
        siteId: "SITE-D02",
        type: "Record",
        status: "Completed",
        scheduledFor: scheduleDate(0),
        plannedStart: "15:30",
        estimatedMinutes: 20,
        priority: "Normal",
        assignedWorkerId: "W-005",
        team: "Harvest Crew",
        origin: "team",
        approvalMode: "qa",
      },
      {
        id: "T-016",
        title: "เก็บเศษกิ่งและเปิดทางระบายน้ำหลังฝน",
        plot: "D02",
        farmId: "FARM-PRIMARY",
        siteId: "SITE-D01",
        type: "Maintenance",
        status: "Assigned",
        scheduledFor: scheduleDate(0),
        plannedStart: "16:00",
        estimatedMinutes: 80,
        priority: "High",
        team: "General Farm Crew",
        origin: "team",
        approvalMode: "team_lead",
      },
      {
        id: "T-004",
        title: "ใส่ปุ๋ยก่อนเก็บเกี่ยว",
        plot: "D04",
        farmId: "FARM-PRIMARY",
        siteId: "SITE-D02",
        type: "Fertilizer",
        status: "Delayed",
        reason: "Heavy Rain",
        scheduledFor: scheduleDate(1),
        plannedStart: "07:00",
        estimatedMinutes: 180,
        priority: "High",
        assignedWorkerId: "W-004",
        team: "General Farm Crew",
        origin: "team",
        approvalMode: "farm_manager",
      },
      {
        id: "T-005",
        title: "เตรียมทีมและอุปกรณ์เก็บเกี่ยว",
        plot: "D04",
        farmId: "FARM-PRIMARY",
        siteId: "SITE-D02",
        type: "Harvest",
        status: "Assigned",
        scheduledFor: scheduleDate(2),
        plannedStart: "06:00",
        estimatedMinutes: 90,
        priority: "High",
        assignedWorkerId: "W-003",
        team: "Harvest Crew",
        origin: "team",
        approvalMode: "qa",
      },
      {
        id: "T-006",
        title: "ตรวจวาล์วและล้างไส้กรอง",
        plot: "D02",
        farmId: "FARM-PRIMARY",
        siteId: "SITE-D01",
        type: "Irrigation",
        status: "Planned",
        scheduledFor: scheduleDate(3),
        plannedStart: "08:00",
        estimatedMinutes: 60,
        priority: "Normal",
        assignedWorkerId: "W-002",
        team: "Irrigation Crew",
        origin: "team",
        approvalMode: "team_lead",
      },
      {
        id: "T-007",
        title: "ตรวจคุณภาพผลก่อนตัด",
        plot: "D04",
        farmId: "FARM-PRIMARY",
        siteId: "SITE-D02",
        type: "Inspection",
        approvalMode: "qa",
        status: "Planned",
        scheduledFor: scheduleDate(5),
        plannedStart: "09:30",
        estimatedMinutes: 75,
        priority: "High",
        assignedWorkerId: "W-005",
        team: "Harvest Crew",
        origin: "team",
      },
      {
        id: "T-008",
        title: "ตัดแต่งกิ่งแห้งหลังเก็บ",
        plot: "D03",
        farmId: "FARM-PRIMARY",
        siteId: "SITE-D02",
        type: "Pruning",
        status: "Planned",
        scheduledFor: scheduleDate(7),
        plannedStart: "07:30",
        estimatedMinutes: 150,
        priority: "Normal",
        assignedWorkerId: "W-001",
        team: "Crop Protection Crew",
        origin: "team",
        approvalMode: "team_lead",
      },
      {
        id: "NT-001",
        title: "สำรวจน้ำขังบริเวณโคนต้น",
        plot: "N02",
        farmId: "FARM-NORTH",
        siteId: "NORTH-A",
        type: "Inspection",
        status: "In Progress",
        scheduledFor: scheduleDate(0),
        plannedStart: "06:45",
        estimatedMinutes: 75,
        priority: "Urgent",
        team: "ทีมดูแลโซนเนินเหนือ",
        origin: "team",
        approvalMode: "team_lead",
      },
      {
        id: "NT-002",
        title: "ตรวจขนาดผลก่อนกำหนดรอบตัด",
        plot: "N07",
        farmId: "FARM-NORTH",
        siteId: "NORTH-B",
        type: "Harvest",
        status: "Assigned",
        scheduledFor: scheduleDate(0),
        plannedStart: "09:30",
        estimatedMinutes: 90,
        priority: "High",
        team: "ทีมเก็บเกี่ยวเหนือ 2",
        origin: "team",
        approvalMode: "qa",
      },
      {
        id: "NT-003",
        title: "ตรวจบันทึก PHI ล็อต NORTH-003",
        plot: "N02",
        farmId: "FARM-NORTH",
        siteId: "NORTH-A",
        type: "Inspection",
        status: "Supervisor Review",
        scheduledFor: scheduleDate(0),
        plannedStart: "14:00",
        estimatedMinutes: 35,
        priority: "High",
        team: "ทีม QA ภาคเหนือ",
        origin: "team",
        approvalMode: "qa",
      },
      {
        id: "ET-001",
        title: "ตรวจระดับน้ำร่องสวนหลังฝน",
        plot: "R03",
        farmId: "FARM-EAST",
        siteId: "EAST-A",
        type: "Inspection",
        status: "Planned",
        scheduledFor: scheduleDate(0),
        plannedStart: "07:00",
        estimatedMinutes: 60,
        priority: "High",
        team: "ทีมผลไม้ระยอง",
        origin: "team",
        approvalMode: "team_lead",
      },
      {
        id: "ET-002",
        title: "บันทึกผลผลิตมังคุดรอบเช้า",
        plot: "R05",
        farmId: "FARM-EAST",
        siteId: "EAST-A",
        type: "Record",
        status: "Completed",
        scheduledFor: scheduleDate(0),
        plannedStart: "11:00",
        estimatedMinutes: 30,
        priority: "Normal",
        team: "ทีมผลไม้ระยอง",
        origin: "team",
        approvalMode: "farm_manager",
      },
    ],
    recommendations: [
      {
        id: "R-001",
        title: "ความชื้น D01 ต่ำ แต่ฝนใกล้เข้ามา",
        plot: "D01",
        reason:
          "ความชื้นดิน 27% และชุดข้อมูลอากาศจำลองคาดว่าฝนอาจมาในราว 3 ชั่วโมง ขณะพืชอยู่ระยะพัฒนาผล",
        action: "ตรวจความชื้นดินหน้างานก่อนเริ่มให้น้ำ",
        confidence: "Demo",
        sourceType: "ai-estimate",
        sourceLabel: "ประมาณการจาก AI โดยใช้ข้อมูลจำลอง Weather + IoT + Crop Stage",
        generatedAt: "2026-08-17",
      },
      {
        id: "R-002",
        title: "NDVI D01 ลดลงจากรอบก่อน",
        plot: "D01",
        reason: "ค่า NDVI ตัวอย่างรอบก่อน 0.76 รอบปัจจุบัน 0.69 เปลี่ยนแปลง -9.2%",
        action: "สร้างงานตรวจทรงพุ่มและระบบน้ำก่อนตัดสินใจแก้ไข",
        confidence: "Demo",
        sourceType: "demo",
        sourceLabel: "ข้อมูลดาวเทียม/NDVI จำลองสำหรับ Demo Mode",
        generatedAt: "2026-08-15",
      },
    ],
    weather: demoWeather,
    productionPlans: [
      {
        id: "PP-D01",
        plot: "D01",
        crop: "Durian",
        variety: "Monthong",
        stage: "Fruit Development",
        progress: 68,
        expectedHarvest: "May 2027",
        expectedYield: "28 tons",
      },
      {
        id: "PP-D02",
        plot: "D02",
        crop: "Durian",
        variety: "Monthong",
        stage: "Flowering",
        progress: 41,
        expectedHarvest: "June 2027",
        expectedYield: "24 tons",
      },
      {
        id: "PP-D03",
        plot: "D03",
        crop: "Durian",
        variety: "Chanee",
        stage: "Fruit Set",
        progress: 53,
        expectedHarvest: "May 2027",
        expectedYield: "18 tons",
      },
      {
        id: "PP-D04",
        plot: "D04",
        crop: "Durian",
        variety: "Monthong",
        stage: "Pre-Harvest",
        progress: 86,
        expectedHarvest: "20 Aug 2026",
        expectedYield: "31 tons",
      },
    ],
    workOrders: [
      {
        id: "WO-001",
        title: "Inspect irrigation system",
        plot: "D01",
        team: "Irrigation Crew",
        type: "Irrigation",
        status: "Completed",
        plannedFor: "2026-08-17",
      },
      {
        id: "WO-002",
        title: "Pest inspection",
        plot: "D03",
        team: "Crop Protection Crew",
        type: "Inspection",
        status: "In Progress",
        plannedFor: "2026-08-17",
      },
      {
        id: "WO-003",
        title: "Fertilizer application",
        plot: "D04",
        team: "General Farm Crew",
        type: "Fertilizer",
        status: "Delayed",
        reason: "Heavy Rain",
        plannedFor: "2026-08-19",
      },
      {
        id: "WO-004",
        title: "Harvest readiness checklist",
        plot: "D04",
        team: "Harvest Crew",
        type: "Harvest",
        status: "Assigned",
        plannedFor: "2026-08-20",
      },
    ],
    workforce: {
      total: isExport ? 65 : 24,
      active: isExport ? 48 : 18,
      available: isExport ? 11 : 4,
      absent: isExport ? 6 : 2,
      crews: [
        { name: "Irrigation Crew", assigned: 5, status: "On schedule" },
        { name: "Crop Protection Crew", assigned: 6, status: "In field" },
        { name: "Harvest Crew", assigned: isExport ? 18 : 8, status: "Preparing" },
        { name: "General Farm Crew", assigned: isExport ? 19 : 5, status: "Delayed by rain" },
      ],
    },
    workers: [
      {
        id: "W-001",
        name: "อนันต์",
        role: "หัวหน้าทีม",
        crew: "Crop Protection Crew",
        status: "Active",
        farmId: "FARM-PRIMARY",
        plot: "D03",
        currentTask: "Pest inspection",
      },
      {
        id: "W-002",
        name: "มาลี",
        role: "หัวหน้าทีม",
        crew: "Irrigation Crew",
        status: "Active",
        farmId: "FARM-PRIMARY",
        plot: "D01",
        currentTask: "Inspect irrigation system",
      },
      {
        id: "W-003",
        name: "สมพร",
        role: "พนักงานภาคสนาม",
        crew: "Harvest Crew",
        status: "Available",
        farmId: "FARM-PRIMARY",
        plot: "D04",
        currentTask: "Standby harvest prep",
      },
      {
        id: "W-004",
        name: "กิตติ",
        role: "พนักงานภาคสนาม",
        crew: "General Farm Crew",
        status: "Active",
        farmId: "FARM-PRIMARY",
        plot: "D04",
        currentTask: "Fertilizer application",
      },
      {
        id: "W-005",
        name: "รัชนี",
        role: "เจ้าหน้าที่ QA",
        crew: "Harvest Crew",
        status: "Active",
        farmId: "FARM-PRIMARY",
        plot: "D04",
        currentTask: "Harvest readiness checklist",
      },
      {
        id: "W-006",
        name: "วิชัย",
        role: "พนักงานภาคสนาม",
        crew: "General Farm Crew",
        status: "On Leave",
        farmId: "FARM-PRIMARY",
        currentTask: "ลาป่วย",
      },
    ],
    memberInvites: [
      {
        id: "INV-001",
        email: "niran@example.com",
        role: "พนักงาน",
        crew: "Harvest Crew",
        status: "Sent",
        sentAt: "2026-08-17T08:30:00",
      },
    ],
    organizationRoles: defaultOrganizationRoles.map((role) => ({
      ...role,
      permissions: [...role.permissions],
    })),
    iotDevices: [
      {
        id: "SM-D01-001",
        name: "Soil Moisture D01",
        type: "Soil moisture",
        plot: "D01",
        status: "Online",
        latestReading: "34%",
        numericValue: 34,
        unit: "%",
        lastCommunication: "1 minute ago",
        battery: 82,
        firmware: "1.8.2",
      },
      {
        id: "WS-FARM-001",
        name: "Weather Station",
        type: "Weather station",
        plot: "Farm",
        status: "Online",
        latestReading: "31.4°C / 74%",
        numericValue: 31.4,
        unit: "°C",
        lastCommunication: "2 minutes ago",
        battery: 94,
        firmware: "2.1.0",
      },
      {
        id: "FLOW-D03-001",
        name: "Water Flow D03",
        type: "Flow meter",
        plot: "D03",
        status: "Online",
        latestReading: "18 L/min",
        numericValue: 18,
        unit: "L/min",
        lastCommunication: "4 minutes ago",
        battery: 76,
        firmware: "1.4.5",
      },
      {
        id: "VALVE-D04-02",
        name: "Valve D04-02",
        type: "Valve",
        plot: "D04",
        status: "Online",
        latestReading: "Closed",
        lastCommunication: "1 minute ago",
        firmware: "3.0.1",
      },
    ],
    iotRules: [
      {
        id: "RULE-001",
        name: "ความชื้นดินต่ำ",
        deviceId: "SM-D01-001",
        threshold: 30,
        operator: "<",
        action: "สร้างงานตรวจระบบน้ำ",
        enabled: true,
        severity: "Warning",
        recipients: "หัวหน้าสวน, ทีมให้น้ำ",
      },
    ],
    iotAlerts: [],
    traceability: [
      {
        lotId: "EXPORT-2026-001",
        farmId: "FARM-PRIMARY",
        farmName: isExport ? "EasyPlants Export Orchard" : "EasyPlants Demo Orchard",
        siteId: "SITE-D02",
        siteName: isExport ? "โซนกลาง" : "โซนผลผลิต 2",
        packingLot: "PACK-2026-014",
        harvestLot: "HARVEST-D04-001",
        plot: "D04",
        crop: "Monthong Durian",
        variety: "Monthong",
        activities: ["Pruning record 28 Jul 2026", "Pre-harvest inspection 14 Aug 2026"],
        chemicalRecords: ["Demo chemical application 10 Aug 2026, PHI 14 days"],
        irrigationRecords: ["Irrigation D04, 90 minutes, 12 Aug 2026"],
        workers: ["Supervisor: K. Anan", "Harvest Crew A"],
      },
      {
        lotId: "DOMESTIC-2026-021",
        farmId: "FARM-PRIMARY",
        farmName: isExport ? "EasyPlants Export Orchard" : "EasyPlants Demo Orchard",
        siteId: "SITE-D01",
        siteName: isExport ? "โซนเหนือ" : "โซนผลผลิต 1",
        packingLot: "PACK-2026-021",
        harvestLot: "HARVEST-D01-004",
        plot: "D01",
        crop: "ทุเรียนหมอนทอง",
        variety: "หมอนทอง",
        activities: ["ตรวจความแก่ผล 16 ส.ค. 2569", "ตัดผลและชั่งน้ำหนัก 18 ส.ค. 2569"],
        chemicalRecords: ["ไม่พบการใช้สารในช่วง PHI ก่อนเก็บเกี่ยว"],
        irrigationRecords: ["ให้น้ำ D01 60 นาที 15 ส.ค. 2569"],
        workers: ["หัวหน้าทีม: มาลี", "ทีมเก็บเกี่ยว 2"],
      },
      {
        lotId: "EXPORT-2026-008",
        farmId: "FARM-PRIMARY",
        farmName: isExport ? "EasyPlants Export Orchard" : "EasyPlants Demo Orchard",
        siteId: "SITE-D02",
        siteName: isExport ? "โซนกลาง" : "โซนผลผลิต 2",
        packingLot: "PACK-2026-026",
        harvestLot: "HARVEST-D03-003",
        plot: "D03",
        crop: "ทุเรียนชะนี",
        variety: "ชะนี",
        activities: ["ตรวจศัตรูพืช 12 ส.ค. 2569", "ตรวจคุณภาพก่อนเก็บ 19 ส.ค. 2569"],
        chemicalRecords: ["สารชีวภัณฑ์ Lot BIO-114 วันที่ 12 ส.ค. 2569"],
        irrigationRecords: ["ให้น้ำ D03 75 นาที 17 ส.ค. 2569"],
        workers: ["ผู้ตรวจ: อนันต์", "ทีมอารักขาพืช"],
      },
      {
        lotId: "EXPORT-NORTH-2026-003",
        farmId: "FARM-NORTH",
        farmName: "สวนทุเรียนเขาคิชฌกูฏ",
        siteId: "NORTH-A",
        siteName: "โซนเนินเหนือ",
        packingLot: "PACK-NORTH-2026-009",
        harvestLot: "HARVEST-N02-002",
        plot: "N02",
        crop: "ทุเรียนหมอนทอง",
        variety: "หมอนทอง",
        activities: ["ตรวจความสมบูรณ์ต้น 11 ส.ค. 2569", "คัดเกรดส่งออก 20 ส.ค. 2569"],
        chemicalRecords: ["บันทึกสาร Lot CHEM-N22 · ผ่าน PHI 21 วัน"],
        irrigationRecords: ["ระบบน้ำโซน N02 · 80 นาที"],
        workers: ["ผู้จัดการโซน: ธนา", "ทีมเก็บเกี่ยวเหนือ"],
      },
      {
        lotId: "EXPORT-NORTH-2026-004",
        farmId: "FARM-NORTH",
        farmName: "สวนทุเรียนเขาคิชฌกูฏ",
        siteId: "NORTH-B",
        siteName: "โซนเชิงเขา",
        packingLot: "PACK-NORTH-2026-011",
        harvestLot: "HARVEST-N07-001",
        plot: "N07",
        crop: "ทุเรียนก้านยาว",
        variety: "ก้านยาว",
        activities: ["ตรวจขนาดผล 14 ส.ค. 2569", "รับเข้าศูนย์คัดบรรจุ 21 ส.ค. 2569"],
        chemicalRecords: ["ไม่มีการใช้สารเคมีในรอบ 30 วัน"],
        irrigationRecords: ["น้ำหยด N07 · 55 นาที"],
        workers: ["ผู้ตรวจ QA: ปวีณา", "ทีมเก็บเกี่ยวเหนือ 2"],
      },
      {
        lotId: "RAYONG-2026-015",
        farmId: "FARM-EAST",
        farmName: "สวนผลไม้ระยอง",
        siteId: "EAST-A",
        siteName: "โซนริมคลอง",
        packingLot: "PACK-RAYONG-2026-015",
        harvestLot: "HARVEST-R03-006",
        plot: "R03",
        crop: "มังคุด",
        variety: "มังคุดพื้นเมือง",
        activities: ["สำรวจผิวผล 13 ส.ค. 2569", "เก็บเกี่ยวและคัดขนาด 19 ส.ค. 2569"],
        chemicalRecords: ["ปุ๋ยทางใบ Lot FOL-R18 วันที่ 2 ส.ค. 2569"],
        irrigationRecords: ["สปริงเกอร์ R03 · 45 นาที"],
        workers: ["หัวหน้าสวน: ศิริ", "ทีมผลไม้ระยอง"],
      },
    ],
    documentTypes: defaultDocumentTypes,
    documents: demoDocuments(isExport ? "EasyPlants Export Orchard" : "EasyPlants Demo Orchard"),
    inventoryItems: demoInventoryItems(),
    purchaseRequests: demoPurchaseRequests(),
    machines: demoMachines(),
    machineInspections: demoMachineInspections(),
    maintenanceRecords: demoMaintenanceRecords(),
    tutorialProgress: ["profile-ready"],
    phiScenario: {
      plot: "D04",
      chemicalDate: "10 Aug 2026",
      phiDays: 14,
      earliestHarvest: "24 Aug 2026",
      plannedHarvest: "20 Aug 2026",
    },
    satellite: { plot: "D01", previousNdvi: 0.76, currentNdvi: 0.69, changePercent: -9.2 },
  };
}

export function getDemoState(): DemoState {
  if (typeof window === "undefined") return getInitialDemoState();

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return normalizeDemoState(JSON.parse(stored));
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }

  const personaId =
    (window.localStorage.getItem(PERSONA_KEY) as DemoPersonaId | null) ?? "export";
  const state = buildDemoState(personaId);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  return state;
}

function normalizeDemoState(stored: unknown): DemoState {
  const saved = stored && typeof stored === "object" ? (stored as Partial<DemoState>) : {};
const personaId = "export" as DemoPersonaId;
  const baseline = buildDemoState(personaId);
  const savedTasks = Array.isArray(saved.tasks) ? saved.tasks : undefined;
  const isLegacySchedule =
    savedTasks?.length === 4 &&
    savedTasks.every(
      (task) =>
        task &&
        typeof task === "object" &&
        ["T-001", "T-002", "T-003", "T-004"].includes((task as SmartTask).id) &&
        (task as SmartTask).scheduledFor?.startsWith("2026-08-"),
    );
  const savedRecommendations = Array.isArray(saved.recommendations)
    ? saved.recommendations
    : undefined;
  const normalizedTasks = isLegacySchedule
    ? baseline.tasks
    : savedTasks
      ? [
          ...savedTasks.map((task) => {
            const refreshed = baseline.tasks.find((item) => item.id === task.id);
            return refreshed
              ? { ...refreshed, ...task, scheduledFor: refreshed.scheduledFor }
              : task;
          }),
          ...baseline.tasks.filter(
            (task) => !savedTasks.some((savedTask) => savedTask.id === task.id),
          ),
        ]
      : baseline.tasks;
  const normalizedRecommendations = savedRecommendations?.map((recommendation) => {
    const refreshed = baseline.recommendations.find((item) => item.id === recommendation.id);
    return refreshed && (recommendation.id === "R-001" || recommendation.id === "R-002")
      ? { ...recommendation, ...refreshed }
      : recommendation;
  });
  const normalizedWorkers = Array.isArray(saved.workers)
    ? saved.workers.map((worker) => {
        const legacyStatus = (worker as WorkerProfile & { status?: string }).status;
        const status =
          legacyStatus === "Assigned"
            ? "Active"
            : legacyStatus === "Absent"
              ? "On Leave"
              : legacyStatus;
        const role =
          (
            {
              Supervisor: "หัวหน้าทีม",
              "Crew Lead": "หัวหน้าทีม",
              Worker: "พนักงานภาคสนาม",
              "QA Inspector": "เจ้าหน้าที่ QA",
            } as Record<string, string>
          )[worker.role] ?? worker.role;
        const { hoursToday: _hoursToday, ...workerWithoutHours } = worker as WorkerProfile & {
          hoursToday?: number;
        };
        return { ...workerWithoutHours, role, status } as WorkerProfile;
      })
    : baseline.workers;
  const savedTraceability = Array.isArray(saved.traceability) ? saved.traceability : [];
  const normalizedTraceability = [
    ...savedTraceability.map((record) => ({
      ...baseline.traceability.find((item) => item.lotId === record.lotId),
      ...record,
    })),
    ...baseline.traceability.filter(
      (record) => !savedTraceability.some((savedRecord) => savedRecord.lotId === record.lotId),
    ),
  ];

  // Demo data evolves with the app; retain user changes while filling fields introduced later.
  return {
    ...baseline,
    ...saved,
    farm: { ...baseline.farm, ...(saved.farm ?? {}) },
    additionalFarms: Array.isArray(saved.additionalFarms)
      ? saved.additionalFarms
      : (baseline.additionalFarms ?? []),
    sites: Array.isArray(saved.sites) ? saved.sites : baseline.sites,
    plots: Array.isArray(saved.plots) ? saved.plots : baseline.plots,
    tasks: normalizedTasks,
    recommendations: normalizedRecommendations ?? baseline.recommendations,
    productionPlans: Array.isArray(saved.productionPlans)
      ? saved.productionPlans
      : baseline.productionPlans,
    workOrders: Array.isArray(saved.workOrders) ? saved.workOrders : baseline.workOrders,
    workers: normalizedWorkers,
    memberInvites: Array.isArray(saved.memberInvites)
      ? saved.memberInvites
      : baseline.memberInvites,
    organizationRoles: Array.isArray(saved.organizationRoles)
      ? [
          ...saved.organizationRoles.map((role) => ({
            ...role,
            scope: role.scope ?? ("assigned_farms" as const),
          })),
          ...baseline.organizationRoles.filter(
            (role) => !saved.organizationRoles!.some((savedRole) => savedRole.id === role.id),
          ),
        ]
      : baseline.organizationRoles,
    iotDevices: Array.isArray(saved.iotDevices) ? saved.iotDevices : baseline.iotDevices,
    iotRules: Array.isArray(saved.iotRules) ? saved.iotRules : baseline.iotRules,
    iotAlerts: Array.isArray(saved.iotAlerts) ? saved.iotAlerts : baseline.iotAlerts,
    traceability: normalizedTraceability,
    documentTypes: Array.isArray(saved.documentTypes)
      ? [
          ...saved.documentTypes,
          ...baseline.documentTypes.filter(
            (type) => !saved.documentTypes!.some((savedType) => savedType.id === type.id),
          ),
        ]
      : baseline.documentTypes,
    documents: Array.isArray(saved.documents)
      ? [
          ...saved.documents,
          ...baseline.documents.filter(
            (document) =>
              !saved.documents!.some((savedDocument) => savedDocument.id === document.id),
          ),
        ]
      : baseline.documents,
    inventoryItems: Array.isArray(saved.inventoryItems)
      ? [
          ...saved.inventoryItems,
          ...baseline.inventoryItems.filter(
            (item) => !saved.inventoryItems!.some((savedItem) => savedItem.id === item.id),
          ),
        ]
      : baseline.inventoryItems,
    purchaseRequests: Array.isArray(saved.purchaseRequests)
      ? [
          ...saved.purchaseRequests,
          ...baseline.purchaseRequests.filter(
            (request) =>
              !saved.purchaseRequests!.some((savedRequest) => savedRequest.id === request.id),
          ),
        ]
      : baseline.purchaseRequests,
    machines: Array.isArray(saved.machines)
      ? [
          ...saved.machines,
          ...baseline.machines.filter(
            (machine) => !saved.machines!.some((savedMachine) => savedMachine.id === machine.id),
          ),
        ]
      : baseline.machines,
    machineInspections: Array.isArray(saved.machineInspections)
      ? [
          ...saved.machineInspections,
          ...baseline.machineInspections.filter(
            (inspection) =>
              !saved.machineInspections!.some(
                (savedInspection) => savedInspection.id === inspection.id,
              ),
          ),
        ]
      : baseline.machineInspections,
    maintenanceRecords: Array.isArray(saved.maintenanceRecords)
      ? [
          ...saved.maintenanceRecords,
          ...baseline.maintenanceRecords.filter(
            (record) =>
              !saved.maintenanceRecords!.some((savedRecord) => savedRecord.id === record.id),
          ),
        ]
      : baseline.maintenanceRecords,
    tutorialProgress: Array.isArray(saved.tutorialProgress)
      ? saved.tutorialProgress
      : baseline.tutorialProgress,
    workforce: { ...baseline.workforce, ...(saved.workforce ?? {}) },
    weather: { ...baseline.weather, ...(saved.weather ?? {}) },
    phiScenario: { ...baseline.phiScenario, ...(saved.phiScenario ?? {}) },
    satellite: { ...baseline.satellite, ...(saved.satellite ?? {}) },
  };
}

export function saveDemoState(state: DemoState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.localStorage.setItem(PERSONA_KEY, state.personaId);
  window.dispatchEvent(new Event("dragonfly_demo_state_updated"));
}

export function switchDemoPersona(personaId: DemoPersonaId) {
  const current = getDemoState();
  if (
    personaId === "employee" &&
    (current.personaId === "commercial" || current.personaId === "export")
  ) {
    window.localStorage.setItem(EMPLOYEE_PARENT_PERSONA_KEY, current.personaId);
    saveDemoState({ ...current, personaId });
    return;
  }
  if (current.personaId === "employee") {
    const parentPersona = window.localStorage.getItem(EMPLOYEE_PARENT_PERSONA_KEY);
    if (personaId === parentPersona) {
      saveDemoState({ ...current, personaId });
      return;
    }
  }
  window.localStorage.removeItem(EMPLOYEE_PARENT_PERSONA_KEY);
  const state = buildDemoState(personaId);
  saveDemoState(state);
}

export function resetDemoState() {
  if (typeof window === "undefined") return;
  const current = getDemoState().personaId;
  const state = buildDemoState(current);
  saveDemoState(state);
}

export function getCurrentDemoPersona(state = getDemoState()) {
  return demoPersonas.find((p) => p.id === state.personaId) ?? demoPersonas[1]!;
}

export function evaluateIoTRules(state: DemoState): DemoState {
  const alerts = state.iotRules.flatMap((rule) => {
    if (rule.enabled === false) return [];
    const device = state.iotDevices.find((d) => d.id === rule.deviceId);
    if (!device || device.numericValue == null) return [];
    const matched =
      rule.operator === "<"
        ? device.numericValue < rule.threshold
        : device.numericValue > rule.threshold;
    if (!matched) return [];
    return [
      {
        id: `ALERT-${rule.id}`,
        title: rule.name,
        plot: device.plot,
        current: `${device.numericValue}${device.unit ?? ""}`,
        target: `${rule.operator} ${rule.threshold}${device.unit ?? ""}`,
        action: rule.action,
        severity: rule.severity ?? "Warning",
        deviceId: device.id,
        ruleId: rule.id,
      },
    ];
  });

  return { ...state, iotAlerts: alerts };
}

export function getWorkOrderCompletionIssue(state: DemoState, workOrder: WorkOrder) {
  if (workOrder.type !== "Harvest") return undefined;
  const { plot, earliestHarvest, plannedHarvest, phiDays } = state.phiScenario;
  if (workOrder.plot !== plot || phiDays <= 0) return undefined;
  const earliest = Date.parse(earliestHarvest);
  const planned = Date.parse(plannedHarvest);
  if (!Number.isNaN(earliest) && !Number.isNaN(planned) && planned < earliest) {
    return `ยังปิดงานเก็บเกี่ยวไม่ได้: แปลง ${plot} ต้องเว้นระยะ PHI ${phiDays} วัน และเริ่มเก็บได้ ${earliestHarvest}`;
  }
  return undefined;
}

export function buildCropSuitabilityRecommendations(plot: Plot): Recommendation[] {
  const area = plot.area || 0;
  const crop = plot.crop.toLowerCase();
  const baseReason = `ระบบใช้ข้อมูลที่ผู้ใช้กรอก: พื้นที่ ${area} ไร่, จำนวน ${plot.trees} ต้น, พิกัด ${plot.gps}`;

  if (crop.includes("ทุเรียน") || area >= 20) {
    return [
      {
        id: `CROP-${plot.id}-durian`,
        title: "ทุเรียนหมอนทองเหมาะกับแปลงเชิงพาณิชย์",
        plot: plot.name,
        reason: `${baseReason}. แปลงขนาดนี้เหมาะกับการวาง production cycle และ work order รายแปลง`,
        action: "สร้าง Production Plan และกำหนดรอบให้น้ำ/ปุ๋ย",
        confidence: "Medium",
        sourceType: "ai-estimate",
        sourceLabel: "ประมาณการจาก AI จากขนาดแปลงและพืชที่ผู้ใช้เลือก",
      },
      {
        id: `CROP-${plot.id}-cover`,
        title: "ควรพิจารณาพืชคลุมดินระหว่างแถว",
        plot: plot.name,
        reason: "พืชคลุมดินช่วยลดการชะล้างหน้าดินและรักษาความชื้น แต่ต้องตรวจสภาพพื้นที่จริงก่อน",
        action: "บันทึกงานสำรวจดินและวัชพืชก่อนตัดสินใจ",
        confidence: "Low",
        sourceType: "ai-estimate",
        sourceLabel: "ข้อเสนอเชิงเกษตรทั่วไปจาก AI ยังไม่ใช่คำแนะนำยืนยัน",
      },
    ];
  }

  return [
    {
      id: `CROP-${plot.id}-lime`,
      title: "มะนาวหรือพืชผักหมุนเวียนเหมาะกับแปลงขนาดเล็ก",
      plot: plot.name,
      reason: `${baseReason}. แปลงขนาดเล็กเหมาะกับพืชที่เริ่มง่าย ใช้แรงงานน้อย และบันทึกผลได้เร็ว`,
      action: "เพิ่ม Crop Calendar และสร้างตารางรดน้ำ/ใส่ปุ๋ยพื้นฐาน",
      confidence: "Medium",
      sourceType: "ai-estimate",
      sourceLabel: "ประมาณการจาก AI จากขนาดแปลงและจำนวนแรงงาน",
    },
    {
      id: `CROP-${plot.id}-herb`,
      title: "สมุนไพร/ผักสวนครัวช่วยให้มือใหม่เรียนรู้เร็ว",
      plot: plot.name,
      reason: "รอบปลูกสั้น เห็นผลเร็ว เหมาะกับการฝึกใช้บันทึกงานและปฏิทินพืช",
      action: "เริ่มจากแปลงทดลอง 1 ส่วนก่อนขยายพื้นที่",
      confidence: "Low",
      sourceType: "ai-estimate",
      sourceLabel: "คำแนะนำเชิงเรียนรู้จาก AI ไม่ใช่ข้อมูลตลาดจริง",
    },
  ];
}
