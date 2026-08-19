import { useEffect, useMemo, useState } from "react";
import {
  appDataMode,
  buildCropSuitabilityRecommendations,
  demoPersonas,
  evaluateIoTRules,
  getWorkOrderCompletionIssue,
  getLocalDateKey,
  getCurrentDemoPersona,
  getDemoState,
  getInitialDemoState,
  getDashboardFarms,
  isDemoMode,
  resetDemoState,
  saveDemoState,
  switchDemoPersona,
  type DemoPersonaId,
  type DemoState,
  type FarmDocument,
  type IoTDevice,
  type IoTRule,
  type MemberInvite,
  type OrganizationRole,
  type OrganizationDocumentType,
  type SmartTask,
  type WorkerProfile,
  type WorkOrder,
  type DashboardFarm,
  type FarmSite,
  type PurchaseRequest,
  type MachineInspection,
  type MaintenanceRecord,
} from "@/lib/dragonfly-data";
import type { Plot } from "@/lib/farm-data";

export type WorkspaceContext = "personal" | "organization";

const WORKSPACE_CONTEXT_KEY = "easyplants_workspace_context";
const WORKSPACE_CONTEXT_EVENT = "easyplants_workspace_context_updated";
export const PERSONAL_FARM_ID = "FARM-PERSONAL";

function getDefaultWorkspaceContext(personaId: DemoPersonaId): WorkspaceContext {
  return ["employee", "commercial", "export"].includes(personaId)
    ? "organization"
    : "personal";
}

export function useDragonflyData() {
  // Keep the server and first client render identical; restore local demo changes after hydration.
  const [state, setState] = useState<DemoState>(() => getInitialDemoState());

  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = () => setState(getDemoState());
    update();
    window.addEventListener("dragonfly_demo_state_updated", update);
    return () => window.removeEventListener("dragonfly_demo_state_updated", update);
  }, []);

  const persona = useMemo(() => getCurrentDemoPersona(state), [state]);
  const [workspaceContext, setWorkspaceContextState] =
    useState<WorkspaceContext>("organization");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateWorkspaceContext = () => {
      const saved = window.localStorage.getItem(WORKSPACE_CONTEXT_KEY);
      setWorkspaceContextState(
        saved === "personal" || saved === "organization"
          ? saved
          : getDefaultWorkspaceContext(getCurrentDemoPersona(getDemoState()).id),
      );
    };
    updateWorkspaceContext();
    window.addEventListener(WORKSPACE_CONTEXT_EVENT, updateWorkspaceContext);
    return () => window.removeEventListener(WORKSPACE_CONTEXT_EVENT, updateWorkspaceContext);
  }, []);

  const setWorkspaceContext = (context: WorkspaceContext) => {
    setWorkspaceContextState(context);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(WORKSPACE_CONTEXT_KEY, context);
      window.dispatchEvent(new Event(WORKSPACE_CONTEXT_EVENT));
    }
  };

  const isOrganizationContext = workspaceContext === "organization";
  const effectiveRole = isOrganizationContext
    ? persona.role
    : persona.id === "beginner"
      ? "ชาวสวนมือใหม่"
      : "เจ้าของสวน";
  const effectiveSubscription = isOrganizationContext ? persona.subscription : "Free";
  const workspaceLabel = isOrganizationContext
    ? "องค์กร EasyPlants Produce"
    : "สวนของฉัน";
  const [activeDashboardFarmId, setActiveDashboardFarmId] = useState("FARM-PRIMARY");
  const dashboardFarms = useMemo(() => {
    const organizationFarms = getDashboardFarms(state);
    const needsSeparatedPersonalFarm =
      workspaceContext === "personal" && ["employee", "commercial", "export"].includes(persona.id);
    if (!needsSeparatedPersonalFarm) return organizationFarms;
    const personalPlots = state.plots.filter(
      (plot) => (plot.farmId ?? "FARM-PRIMARY") === PERSONAL_FARM_ID,
    );
    const crops = [...new Set(personalPlots.map((plot) => plot.crop))];
    return [{
      id: PERSONAL_FARM_ID,
      name: "สวนส่วนตัวของฉัน",
      type: "Personal Farm",
      areaRai: personalPlots.reduce((sum, plot) => sum + plot.area, 0),
      primaryCrop: crops[0] ?? "ยังไม่ระบุพืช",
      varieties: crops,
      plotCount: personalPlots.length,
      treeCount: personalPlots.reduce((sum, plot) => sum + plot.trees, 0),
      workerCount: 0,
      location: "ยังไม่ระบุพื้นที่",
      status: "Normal" as const,
      dataLabel: "ข้อมูลสวนส่วนตัว แยกจากฟาร์ม งาน และบุคลากรขององค์กร",
    }];
  }, [persona.id, state, workspaceContext]);
  const activeDashboardFarm =
    dashboardFarms.find((farm) => farm.id === activeDashboardFarmId) ?? dashboardFarms[0];

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedFarmId = window.localStorage.getItem("easyplants_active_dashboard_farm");
    if (savedFarmId) setActiveDashboardFarmId(savedFarmId);
  }, []);

  const setActiveDashboardFarm = (farmId: string) => {
    setActiveDashboardFarmId(farmId);
    if (typeof window !== "undefined")
      window.localStorage.setItem("easyplants_active_dashboard_farm", farmId);
  };

  const persist = (next: DemoState) => {
    const evaluated = evaluateIoTRules(next);
    setState(evaluated);
    saveDemoState(evaluated);
  };

  const setPersona = (personaId: DemoPersonaId) => {
    setWorkspaceContext(getDefaultWorkspaceContext(personaId));
    switchDemoPersona(personaId);
    setState(getDemoState());
  };

  const resetDemo = () => {
    resetDemoState();
    setState(getDemoState());
  };

  const addPlot = (
    plot: Omit<Plot, "id" | "health" | "lastCare" | "history">,
    structure?: {
      newFarm?: Pick<DashboardFarm, "id" | "name" | "location">;
      newSite?: Pick<FarmSite, "id" | "farmId" | "code" | "name">;
    },
  ) => {
    const fullPlot: Plot = {
      ...plot,
      id: `P-${Date.now()}`,
      health: 100,
      lastCare: "เพิ่งเพิ่มแปลงใหม่ใน Demo Mode",
      history: [
        {
          date: new Date().toLocaleDateString("th-TH", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
          action: "สร้างแปลง",
          note: "บันทึกลง Demo Local Store",
        },
      ],
    };

    const newFarm = structure?.newFarm
      ? {
          ...structure.newFarm,
          type: "สวนที่ผู้ใช้สร้าง",
          areaRai: plot.area,
          primaryCrop: plot.crop,
          varieties: [plot.crop],
          plotCount: 1,
          treeCount: plot.trees,
          workerCount: 0,
          status: "Normal" as const,
          dataLabel: "ข้อมูลสวนที่ผู้ใช้เพิ่มใน Demo Mode",
        }
      : undefined;
    const newSite = structure?.newSite
      ? {
          ...structure.newSite,
          type: "โซนที่ผู้ใช้สร้าง",
          areaRai: plot.area,
          manager: "ยังไม่ระบุ",
          plotPrefixes: [],
          status: "Normal" as const,
        }
      : undefined;
    persist({
      ...state,
      additionalFarms: newFarm
        ? [...(state.additionalFarms ?? []), newFarm]
        : (state.additionalFarms ?? []),
      sites: newSite ? [...state.sites, newSite] : state.sites,
      plots: [...state.plots, fullPlot],
      recommendations: [...buildCropSuitabilityRecommendations(fullPlot), ...state.recommendations],
      farm:
        plot.farmId === "FARM-PRIMARY" || !plot.farmId
          ? {
              ...state.farm,
              plotCount: state.farm.plotCount + 1,
              areaRai: state.farm.areaRai + plot.area,
              treeCount: state.farm.treeCount + plot.trees,
            }
          : state.farm,
    });
  };

  const addTask = (task: Omit<SmartTask, "id" | "status"> & Partial<Pick<SmartTask, "status">>) => {
    persist({
      ...state,
      tasks: [
        {
          id: `TASK-${Date.now()}`,
          status: task.status ?? "Planned",
          scheduledFor: task.scheduledFor ?? getLocalDateKey(),
          origin: task.origin ?? (task.team || task.assignedWorkerId ? "team" : "personal"),
          ...task,
        },
        ...state.tasks,
      ],
    });
  };

  const updateTaskStatus = (
    taskId: string,
    status: SmartTask["status"],
    reason?: string,
    completion?: Omit<NonNullable<SmartTask["completion"]>, "completedAt">,
  ) => {
    const completedTask = state.tasks.find((task) => task.id === taskId);
    const shouldAppendHistory = status === "Completed" && completedTask?.status !== "Completed";
    const completionForHistory = completion ?? completedTask?.completion;
    const completedDate = new Date().toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    persist({
      ...state,
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status,
              reason,
              completion: completion
                ? {
                    ...task.completion,
                    ...completion,
                    completedAt:
                      status === "Completed"
                        ? new Date().toISOString()
                        : task.completion?.completedAt,
                  }
                : status === "Completed" && task.completion
                  ? { ...task.completion, completedAt: new Date().toISOString() }
                  : task.completion,
            }
          : task,
      ),
      plots:
        shouldAppendHistory && completedTask
          ? state.plots.map((plot) =>
              plot.id === completedTask.plot || plot.name === completedTask.plot
                ? {
                    ...plot,
                    lastCare: `${completedTask.title} · ${completedDate}`,
                    health: completionForHistory?.health ?? plot.health,
                    history: [
                      {
                        date: completedDate,
                        action: completedTask.title,
                        note: `${completionForHistory?.note || "ปิดงานแล้ว"} · งาน ${completedTask.id} · ${completedTask.origin === "team" || completedTask.team ? "งานทีม" : completedTask.origin === "system" ? "งานจากระบบ" : "งานส่วนตัว"}${completedTask.team ? ` · ทีม ${completedTask.team}` : ""}${completionForHistory?.completedBy ? ` · ผู้ปฏิบัติงาน ${completionForHistory.completedBy}` : ""}${completionForHistory?.approvedBy ? ` · ผู้อนุมัติ ${completionForHistory.approvedBy}` : ""}${completionForHistory?.evidenceCount ? ` · หลักฐาน ${completionForHistory.evidenceCount} รายการ` : ""}`,
                      },
                      ...plot.history,
                    ],
                  }
                : plot,
            )
          : state.plots,
    });
  };

  const startTeamTask = (taskId: string, workerId: string) => {
    persist({
      ...state,
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? { ...task, assignedWorkerId: task.assignedWorkerId ?? workerId, status: "In Progress" }
          : task,
      ),
    });
  };

  const assignTask = (
    taskId: string,
    assignment: Pick<SmartTask, "team" | "assignedWorkerId" | "approvalMode">,
  ) => {
    const task = state.tasks.find((item) => item.id === taskId);
    if (!task) return { ok: false as const, reason: "ไม่พบงานที่ต้องการมอบหมาย" };
    if (!assignment.team) return { ok: false as const, reason: "เลือกทีมรับผิดชอบก่อน" };
    if (
      assignment.assignedWorkerId &&
      !state.workers.some(
        (worker) =>
          worker.id === assignment.assignedWorkerId && worker.crew === assignment.team,
      )
    ) {
      return { ok: false as const, reason: "พนักงานไม่ได้อยู่ในทีมที่เลือก" };
    }
    persist({
      ...state,
      tasks: state.tasks.map((item) =>
        item.id === taskId
          ? {
              ...item,
              origin: "team",
              team: assignment.team,
              assignedWorkerId: assignment.assignedWorkerId || undefined,
              approvalMode: assignment.approvalMode ?? "team_lead",
              status: "Assigned",
            }
          : item,
      ),
    });
    return { ok: true as const };
  };

  const recordWeeklyInspection = (
    checks: { plotId: string; score: number; issues: string[] }[],
  ) => {
    const recordedAt = new Date();
    const date = recordedAt.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const marker = `weekly-monitor:${recordedAt.toISOString().slice(0, 10)}`;
    const eligible = checks.filter((check) => {
      const plot = state.plots.find((item) => item.id === check.plotId);
      return plot && !plot.history.some((item) => item.note.includes(marker));
    });
    if (!eligible.length) return { saved: 0, skipped: checks.length };
    const lookup = new Map(eligible.map((check) => [check.plotId, check]));
    persist({
      ...state,
      plots: state.plots.map((plot) => {
        const check = lookup.get(plot.id);
        return check
          ? {
              ...plot,
              history: [
                {
                  date,
                  action: "บันทึกเฝ้าระวังรายสัปดาห์",
                  note: `คะแนนสุขภาพ ${check.score}/100${check.issues.length ? ` · พบ: ${check.issues.join(", ")}` : " · ไม่พบประเด็นเร่งด่วน"} · ${marker}`,
                },
                ...plot.history,
              ],
            }
          : plot;
      }),
    });
    return { saved: eligible.length, skipped: checks.length - eligible.length };
  };

  const updateWorkOrderStatus = (
    workOrderId: string,
    status: WorkOrder["status"],
    reason?: string,
  ) => {
    const workOrder = state.workOrders.find((item) => item.id === workOrderId);
    const completionIssue =
      workOrder && status === "Completed"
        ? getWorkOrderCompletionIssue(state, workOrder)
        : undefined;
    if (completionIssue) return { ok: false, reason: completionIssue };
    persist({
      ...state,
      workOrders: state.workOrders.map((workOrder) =>
        workOrder.id === workOrderId ? { ...workOrder, status, reason } : workOrder,
      ),
    });
    return { ok: true as const };
  };

  const updateDevice = (deviceId: string, patch: Partial<IoTDevice>) => {
    persist({
      ...state,
      iotDevices: state.iotDevices.map((device) =>
        device.id === deviceId ? { ...device, ...patch } : device,
      ),
    });
  };

  const updateWorker = (workerId: string, patch: Partial<WorkerProfile>) => {
    persist({
      ...state,
      workers: state.workers.map((worker) =>
        worker.id === workerId ? { ...worker, ...patch } : worker,
      ),
    });
  };

  const addIoTRule = (rule: Omit<IoTRule, "id">) => {
    persist({ ...state, iotRules: [{ ...rule, id: `RULE-${Date.now()}` }, ...state.iotRules] });
  };

  const updateIoTRule = (ruleId: string, patch: Partial<IoTRule>) => {
    persist({
      ...state,
      iotRules: state.iotRules.map((rule) => (rule.id === ruleId ? { ...rule, ...patch } : rule)),
    });
  };

  const deleteIoTRule = (ruleId: string) => {
    persist({ ...state, iotRules: state.iotRules.filter((rule) => rule.id !== ruleId) });
  };

  const addWorker = (worker: Pick<WorkerProfile, "name" | "role" | "crew">) => {
    const newWorker: WorkerProfile = {
      id: `W-${Date.now()}`,
      ...worker,
      status: "Available",
      currentTask: "ยังไม่ได้มอบหมายงาน",
    };
    const existingCrew = state.workforce.crews.find((crew) => crew.name === worker.crew);
    persist({
      ...state,
      workers: [...state.workers, newWorker],
      workforce: {
        ...state.workforce,
        total: state.workforce.total + 1,
        available: state.workforce.available + 1,
        crews: existingCrew
          ? state.workforce.crews.map((crew) =>
              crew.name === worker.crew ? { ...crew, assigned: crew.assigned + 1 } : crew,
            )
          : [...state.workforce.crews, { name: worker.crew, assigned: 1, status: "Available" }],
      },
      farm: { ...state.farm, workerCount: state.farm.workerCount + 1 },
    });
  };

  const inviteMembers = (emails: string[], role: MemberInvite["role"], crew: string) => {
    const uniqueEmails = [
      ...new Set(emails.map((email) => email.trim().toLowerCase()).filter(Boolean)),
    ];
    const validEmails = uniqueEmails.filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
    const existing = new Set(
      state.memberInvites
        .filter((invite) => invite.status === "Sent")
        .map((invite) => invite.email),
    );
    const newEmails = validEmails.filter((email) => !existing.has(email));
    if (!newEmails.length) return { sent: 0, invalid: uniqueEmails.length };
    persist({
      ...state,
      memberInvites: [
        ...state.memberInvites,
        ...newEmails.map((email) => ({
          id: `INV-${Date.now()}-${email}`,
          email,
          role,
          crew,
          status: "Sent" as const,
          sentAt: new Date().toISOString(),
        })),
      ],
    });
    return { sent: newEmails.length, invalid: uniqueEmails.length - newEmails.length };
  };

  const addOrganizationRole = (
    name: string,
    permissions: string[],
    scope: OrganizationRole["scope"] = "assigned_team",
  ) => {
    const normalizedName = name.trim();
    if (!normalizedName || !permissions.length)
      return { ok: false as const, reason: "กรอกชื่อ role และเลือกสิทธิ์อย่างน้อย 1 รายการ" };
    if (
      state.organizationRoles.some(
        (role) =>
          role.name.toLocaleLowerCase("th-TH") === normalizedName.toLocaleLowerCase("th-TH"),
      )
    )
      return { ok: false as const, reason: "มี role ชื่อนี้ในองค์กรแล้ว" };
    const newRole: OrganizationRole = {
      id: `ROLE-${Date.now()}`,
      name: normalizedName,
      permissions,
      scope,
    };
    persist({ ...state, organizationRoles: [...state.organizationRoles, newRole] });
    return { ok: true as const, role: newRole };
  };

  const updateOrganizationRole = (
    roleId: string,
    updates: Pick<OrganizationRole, "permissions" | "scope">,
  ) => {
    if (!updates.permissions.length)
      return { ok: false as const, reason: "เลือกสิทธิ์อย่างน้อย 1 รายการ" };
    persist({
      ...state,
      organizationRoles: state.organizationRoles.map((role) =>
        role.id === roleId ? { ...role, ...updates } : role,
      ),
    });
    return { ok: true as const };
  };

  const addDocumentType = (documentType: Omit<OrganizationDocumentType, "id" | "builtIn">) => {
    const name = documentType.name.trim();
    if (!name) return { ok: false as const, reason: "กรอกชื่อประเภทเอกสาร" };
    if (
      state.documentTypes.some(
        (type) => type.name.toLocaleLowerCase("th-TH") === name.toLocaleLowerCase("th-TH"),
      )
    )
      return { ok: false as const, reason: "มีประเภทเอกสารชื่อนี้แล้ว" };
    const created = { ...documentType, id: `DOC-TYPE-${Date.now()}`, name };
    persist({ ...state, documentTypes: [...state.documentTypes, created] });
    return { ok: true as const, documentType: created };
  };

  const addDocument = (document: Omit<FarmDocument, "id">) => {
    const created = { ...document, id: `DOC-${Date.now()}` };
    persist({ ...state, documents: [created, ...state.documents] });
    return created;
  };

  const updateDocumentStatus = (
    documentId: string,
    status: FarmDocument["status"],
    approvedBy?: string,
  ) => {
    persist({
      ...state,
      documents: state.documents.map((document) =>
        document.id === documentId
          ? {
              ...document,
              status,
              approvedBy: status === "Approved" ? approvedBy : document.approvedBy,
            }
          : document,
      ),
    });
  };

  const addPurchaseRequest = (
    request: Omit<PurchaseRequest, "id" | "requestedAt" | "status"> &
      Partial<Pick<PurchaseRequest, "status">>,
  ) => {
    const created: PurchaseRequest = {
      ...request,
      id: `PR-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`,
      requestedAt: getLocalDateKey(),
      status: request.status ?? "Pending Approval",
    };
    persist({ ...state, purchaseRequests: [created, ...state.purchaseRequests] });
    return created;
  };

  const updatePurchaseRequestStatus = (
    requestId: string,
    status: PurchaseRequest["status"],
    details?: Partial<Pick<PurchaseRequest, "approvedBy" | "supplier" | "orderNumber">>,
  ) => {
    persist({
      ...state,
      purchaseRequests: state.purchaseRequests.map((request) =>
        request.id === requestId ? { ...request, ...details, status } : request,
      ),
    });
  };

  const receivePurchaseRequest = (requestId: string) => {
    const request = state.purchaseRequests.find((item) => item.id === requestId);
    if (!request || request.status === "Received") return { ok: false as const };
    persist({
      ...state,
      inventoryItems: state.inventoryItems.map((item) =>
        item.id === request.itemId
          ? {
              ...item,
              onHand: item.onHand + request.quantity,
              updatedAt: "รับสินค้าเข้าคลังเมื่อสักครู่",
            }
          : item,
      ),
      purchaseRequests: state.purchaseRequests.map((item) =>
        item.id === requestId
          ? { ...item, status: "Received", receivedQuantity: item.quantity }
          : item,
      ),
    });
    return { ok: true as const };
  };

  const updateInventoryStock = (itemId: string, onHand: number) => {
    if (!Number.isFinite(onHand) || onHand < 0) return { ok: false as const };
    persist({
      ...state,
      inventoryItems: state.inventoryItems.map((item) =>
        item.id === itemId ? { ...item, onHand, updatedAt: "ปรับยอดนับจริงเมื่อสักครู่" } : item,
      ),
    });
    return { ok: true as const };
  };

  const addMachineInspection = (
    inspection: Omit<MachineInspection, "id" | "farmId" | "inspectedAt">,
  ) => {
    const machine = state.machines.find((item) => item.id === inspection.machineId);
    if (!machine) return { ok: false as const, reason: "ไม่พบเครื่องจักรที่เลือก" };
    const inspectedAt = new Date().toISOString();
    const nextInspection = new Date();
    nextInspection.setDate(nextInspection.getDate() + 7);
    const created: MachineInspection = {
      ...inspection,
      id: `INSP-${Date.now()}`,
      farmId: machine.farmId,
      inspectedAt,
    };
    const nextStatus =
      inspection.result === "Failed"
        ? "Out of Service"
        : inspection.result === "Needs Attention"
          ? "Inspection Due"
          : machine.status === "In Use"
            ? "In Use"
            : "Ready";
    persist({
      ...state,
      machineInspections: [created, ...state.machineInspections],
      machines: state.machines.map((item) =>
        item.id === machine.id
          ? {
              ...item,
              status: nextStatus,
              meterHours: inspection.meterHours,
              lastInspectionDate: inspectedAt.slice(0, 10),
              nextInspectionDate: nextInspection.toISOString().slice(0, 10),
            }
          : item,
      ),
    });
    return { ok: true as const, inspection: created };
  };

  const addMaintenanceRecord = (
    record: Omit<MaintenanceRecord, "id" | "farmId" | "status"> &
      Partial<Pick<MaintenanceRecord, "status">>,
  ) => {
    const machine = state.machines.find((item) => item.id === record.machineId);
    if (!machine) return { ok: false as const, reason: "ไม่พบเครื่องจักรที่เลือก" };
    const created: MaintenanceRecord = {
      ...record,
      id: `MAINT-${Date.now()}`,
      farmId: machine.farmId,
      status: record.status ?? "Planned",
    };
    persist({
      ...state,
      maintenanceRecords: [created, ...state.maintenanceRecords],
      machines: state.machines.map((item) =>
        item.id === machine.id && record.type === "Repair"
          ? { ...item, status: "Maintenance" }
          : item,
      ),
    });
    return { ok: true as const, record: created };
  };

  const updateMaintenanceStatus = (recordId: string, status: MaintenanceRecord["status"]) => {
    const record = state.maintenanceRecords.find((item) => item.id === recordId);
    if (!record) return { ok: false as const };
    persist({
      ...state,
      maintenanceRecords: state.maintenanceRecords.map((item) =>
        item.id === recordId ? { ...item, status } : item,
      ),
      machines: state.machines.map((machine) =>
        machine.id === record.machineId
          ? {
              ...machine,
              status:
                status === "Completed"
                  ? "Ready"
                  : status === "In Progress"
                    ? "Maintenance"
                    : machine.status,
              nextMaintenanceHours:
                status === "Completed"
                  ? Math.max(machine.nextMaintenanceHours + 250, machine.meterHours + 250)
                  : machine.nextMaintenanceHours,
            }
          : machine,
      ),
    });
    return { ok: true as const };
  };

  const completeTutorialStep = (stepIds: string | string[]) => {
    const completedIds = Array.isArray(stepIds) ? stepIds : [stepIds];
    persist({
      ...state,
      tutorialProgress: [...new Set([...state.tutorialProgress, ...completedIds])],
    });
  };

  return {
    mode: appDataMode,
    isDemoMode,
    personas: demoPersonas,
    persona,
    workspaceContext,
    setWorkspaceContext,
    isOrganizationContext,
    effectiveRole,
    effectiveSubscription,
    workspaceLabel,
    state,
    dashboardFarms,
    activeDashboardFarm,
    setActiveDashboardFarm,
    setPersona,
    resetDemo,
    addPlot,
    addTask,
    updateTaskStatus,
    startTeamTask,
    assignTask,
    recordWeeklyInspection,
    updateWorkOrderStatus,
    updateDevice,
    updateWorker,
    addIoTRule,
    updateIoTRule,
    deleteIoTRule,
    addWorker,
    inviteMembers,
    addOrganizationRole,
    updateOrganizationRole,
    addDocumentType,
    addDocument,
    updateDocumentStatus,
    addPurchaseRequest,
    updatePurchaseRequestStatus,
    receivePurchaseRequest,
    updateInventoryStock,
    addMachineInspection,
    addMaintenanceRecord,
    updateMaintenanceStatus,
    completeTutorialStep,
  };
}
