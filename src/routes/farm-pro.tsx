import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, BriefcaseBusiness, Plus, Users } from "lucide-react";
import { AppShell, Badge, Card, Progress, SectionTitle } from "@/components/AppShell";
import { useDragonflyData } from "@/hooks/useDragonflyData";
import { canPersonaApproveTask, getLocalDateKey, getTaskApprovalMode, getTaskReviewerLabel, getWorkOrderCompletionIssue } from "@/lib/dragonfly-data";
import { TimeRangeFilter } from "@/components/TimeRangeFilter";
import { ProAccessGate } from "@/components/ProAccessGate";
import { SearchableSelect } from "@/components/SearchableSelect";

export const Route = createFileRoute("/farm-pro")({
  head: () => ({
    meta: [
      { title: "Farm Pro — EasyPlants" },
      { name: "description", content: "Production planning, work orders, workforce, harvest and PHI demo" },
    ],
  }),
  component: FarmProPage,
});

function FarmProPage() {
  const { persona, state, addTask, updateTaskStatus, updateWorkOrderStatus } = useDragonflyData();
  const hasPro = persona.subscription === "Farm Pro";
  const [stageFilter, setStageFilter] = useState("ทั้งหมด");
  const [workStatusFilter, setWorkStatusFilter] = useState("ทั้งหมด");
  const [teamFilter, setTeamFilter] = useState("ทั้งหมด");
  const [plotFilter, setPlotFilter] = useState("ทั้งหมด");
  const [productionTimeFilter, setProductionTimeFilter] = useState("all");
  const [workOrderTimeFilter, setWorkOrderTimeFilter] = useState("30d");
  const [productionCustomRange, setProductionCustomRange] = useState({ start: "", end: "" });
  const [workOrderCustomRange, setWorkOrderCustomRange] = useState({ start: "", end: "" });
  const [actionMessage, setActionMessage] = useState<string>();
  const [activeView, setActiveView] = useState<"orders" | "workforce" | "production">("orders");
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPlot, setNewTaskPlot] = useState("");
  const [newTaskTeam, setNewTaskTeam] = useState("");
  const [newTaskWorkerId, setNewTaskWorkerId] = useState("");
  const [newTaskApprovalMode, setNewTaskApprovalMode] = useState<"team_lead" | "farm_manager" | "qa">("team_lead");
  const stages = useMemo(
    () => ["ทั้งหมด", ...Array.from(new Set(state.productionPlans.map((plan) => plan.stage)))],
    [state.productionPlans]
  );
  const workStatuses = useMemo(
    () => ["ทั้งหมด", ...Array.from(new Set(state.workOrders.map((workOrder) => workOrder.status)))],
    [state.workOrders]
  );
  const plots = useMemo(
    () => ["ทั้งหมด", ...Array.from(new Set([...state.productionPlans.map((plan) => plan.plot), ...state.workOrders.map((wo) => wo.plot)]))],
    [state.productionPlans, state.workOrders]
  );
  const teams = useMemo(
    () => ["ทั้งหมด", ...Array.from(new Set(state.workOrders.map((workOrder) => workOrder.team)))],
    [state.workOrders]
  );
  const productionPlans = state.productionPlans.filter((plan) => {
    const stageOk = stageFilter === "ทั้งหมด" || plan.stage === stageFilter;
    const plotOk = plotFilter === "ทั้งหมด" || plan.plot === plotFilter;
    return stageOk && plotOk && isInFuturePeriod(plan.expectedHarvest, productionTimeFilter, productionCustomRange);
  });
  const workOrders = state.workOrders.filter((wo) => {
    const statusOk = workStatusFilter === "ทั้งหมด" || wo.status === workStatusFilter;
    const plotOk = plotFilter === "ทั้งหมด" || wo.plot === plotFilter;
    const teamOk = teamFilter === "ทั้งหมด" || wo.team === teamFilter;
    return statusOk && plotOk && teamOk && isInFuturePeriod(wo.plannedFor, workOrderTimeFilter, workOrderCustomRange);
  });

  if (!hasPro) {
    return <AppShell title="Farm Pro" subtitle="เครื่องมือระดับทีมและการผลิต"><ProAccessGate feature="Work Orders และแผนการผลิต" detail="ใช้วางแผนการผลิต มอบหมายทีม ตรวจรับงาน และตรวจข้อจำกัด PHI สำหรับสวนที่ทำงานหลายแปลงหรือหลายคน" /></AppShell>;
  }

  return (
    <AppShell title="งานและทีม" subtitle="มอบหมายงาน · ติดตามคน · วางแผนผลิต">
      <div className="grid grid-cols-3 gap-2">
        <Card className="text-center">
          <BriefcaseBusiness className="mx-auto size-5 text-primary" />
          <p className="mt-1 text-xl font-bold">{state.workOrders.length}</p>
          <p className="text-[10px] text-muted-foreground">Work Orders</p>
        </Card>
        <Card className="text-center">
          <Users className="mx-auto size-5 text-primary" />
          <p className="mt-1 text-xl font-bold">{state.workforce.active}</p>
          <p className="text-[10px] text-muted-foreground">Active</p>
        </Card>
        <Card className="text-center">
          <AlertTriangle className="mx-auto size-5 text-destructive" />
          <p className="mt-1 text-xl font-bold">1</p>
          <p className="text-[10px] text-muted-foreground">PHI Alert</p>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {([ ["orders", "งานทีม"], ["workforce", "คนและทีม"], ["production", "แผนผลิต"] ] as const).map(([view, label]) => <button key={view} onClick={() => setActiveView(view)} className={`min-h-11 rounded-lg border px-2 text-xs font-semibold ${activeView === view ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>{label}</button>)}
      </div>

      {activeView === "production" ? <>
      <SectionTitle>ตัวกรองแผนผลิต</SectionTitle>
      <Card className="space-y-3">
        <SearchableSelect label="แปลง" options={plots} value={plotFilter} onChange={setPlotFilter} allLabel="ทุกแปลง" searchPlaceholder="ค้นหารหัสหรือชื่อแปลง" />
        <TimeRangeFilter value={productionTimeFilter} onChange={setProductionTimeFilter} options={[{ value: "30d", label: "เก็บเกี่ยว 30 วัน" }, { value: "90d", label: "เก็บเกี่ยว 90 วัน" }, { value: "1y", label: "ภายใน 1 ปี" }, { value: "all", label: "ทุกช่วง" }]} label="ช่วงเก็บเกี่ยวของแผนผลิต" dateRange={productionCustomRange} onDateRangeChange={setProductionCustomRange} />
        <SearchableSelect label="ระยะการผลิต" options={stages} value={stageFilter} onChange={setStageFilter} allLabel="ทุกระยะการผลิต" searchPlaceholder="ค้นหาระยะการผลิต" />
      </Card>
      <SectionTitle>แผนผลิต</SectionTitle>
      <div className="space-y-3">
        {productionPlans.map((plan) => (
          <Card key={plan.id}>
            <div className="flex justify-between gap-3"><div><p className="text-sm font-semibold">{plan.plot} · {plan.variety}</p><p className="text-xs text-muted-foreground">{plan.stage} · คาดเก็บเกี่ยว {plan.expectedHarvest}</p></div><Badge tone="info">{plan.expectedYield}</Badge></div>
            <div className="mt-3"><Progress value={plan.progress} /></div>
          </Card>
        ))}
      </div>
      </> : null}

      {activeView === "orders" ? <>
      <SectionTitle>ตัวกรองงาน</SectionTitle>
      <Card className="space-y-3">
        <SearchableSelect label="แปลง" options={plots} value={plotFilter} onChange={setPlotFilter} allLabel="ทุกแปลง" searchPlaceholder="ค้นหารหัสหรือชื่อแปลง" />
        <SearchableSelect label="ทีมรับผิดชอบ" options={teams} value={teamFilter} onChange={setTeamFilter} allLabel="ทุกทีม" searchPlaceholder="ค้นหาชื่อทีม" />
        <TimeRangeFilter value={workOrderTimeFilter} onChange={setWorkOrderTimeFilter} options={[{ value: "today", label: "งานวันนี้" }, { value: "30d", label: "30 วัน" }, { value: "all", label: "ทุกช่วง" }]} label="กำหนดทำ Work Order" dateRange={workOrderCustomRange} onDateRangeChange={setWorkOrderCustomRange} />
        <SearchableSelect label="สถานะใบสั่งงาน" options={workStatuses} value={workStatusFilter} onChange={setWorkStatusFilter} allLabel="ทุกสถานะ" searchPlaceholder="ค้นหาสถานะใบสั่งงาน" />
      </Card>

      {actionMessage ? <Card className="border-destructive/30 bg-destructive/10 text-xs text-destructive">{actionMessage}</Card> : null}

      <Card className="border-primary/25 bg-primary-soft/35">
        <p className="text-sm font-semibold text-primary">ใครเป็นผู้ยืนยันว่างานเรียบร้อย</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">ค่าเริ่มต้นคือหัวหน้าทีมตรวจรับเฉพาะงานของทีมตนเอง ผู้จัดการฟาร์มเป็นผู้อนุมัติสำรอง งาน QA/เก็บเกี่ยวต้องใช้สิทธิ์ QA พนักงานทำได้เพียงกดเสร็จและส่งงานเข้าสถานะ “รอตรวจรับ”</p>
        <Link to="/settings" className="mt-3 block rounded-lg border border-primary/25 bg-card py-2 text-center text-xs font-semibold text-primary">ตั้งค่า Role และสิทธิ์ขององค์กร</Link>
      </Card>

      <SectionTitle action={<button onClick={() => { setShowTaskForm((value) => !value); setNewTaskPlot(plots.find((plot) => plot !== "ทั้งหมด") ?? ""); setNewTaskTeam(teams.find((team) => team !== "ทั้งหมด") ?? ""); }} className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"><Plus className="size-3.5" />มอบหมายงาน</button>}>แผนงานและใบสั่งงานทีม</SectionTitle>
      {showTaskForm ? <Card className="space-y-2 border-primary/25 bg-primary-soft/35"><p className="text-xs font-semibold text-primary">สร้าง Task จากแผนงานทีม</p><input value={newTaskTitle} onChange={(event) => setNewTaskTitle(event.target.value)} placeholder="ชื่องานที่พนักงานต้องทำ" className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary" /><div className="grid grid-cols-2 gap-2"><select value={newTaskPlot} onChange={(event) => setNewTaskPlot(event.target.value)} className="rounded-lg border border-border bg-card px-2 py-2 text-xs"><option value="">เลือกแปลง</option>{plots.filter((plot) => plot !== "ทั้งหมด").map((plot) => <option key={plot}>{plot}</option>)}</select><select value={newTaskTeam} onChange={(event) => { setNewTaskTeam(event.target.value); setNewTaskWorkerId(""); }} className="rounded-lg border border-border bg-card px-2 py-2 text-xs"><option value="">เลือกทีม</option>{teams.filter((team) => team !== "ทั้งหมด").map((team) => <option key={team}>{team}</option>)}</select></div><label className="block text-xs font-semibold text-muted-foreground">รูปแบบผู้รับผิดชอบ<select value={newTaskWorkerId} onChange={(event) => setNewTaskWorkerId(event.target.value)} className="mt-1.5 w-full rounded-lg border border-border bg-card px-2 py-2 text-xs"><option value="">มอบหมายทั้งทีม · สมาชิกทุกคนเห็นงาน</option>{state.workers.filter((worker) => !newTaskTeam || worker.crew === newTaskTeam).map((worker) => <option key={worker.id} value={worker.id}>รายบุคคล · {worker.name}</option>)}</select></label><p className="text-[11px] text-muted-foreground">ถ้าเลือกทั้งทีม สมาชิกคนแรกที่กด “รับและเริ่มงาน” จะเป็นผู้ปฏิบัติงานหลัก</p><label className="block text-xs font-semibold text-muted-foreground">ผู้มีสิทธิ์ตรวจรับ<select value={newTaskApprovalMode} onChange={(event) => setNewTaskApprovalMode(event.target.value as typeof newTaskApprovalMode)} className="mt-1.5 block w-full rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground"><option value="team_lead">หัวหน้าทีม · ผู้จัดการอนุมัติสำรอง</option><option value="farm_manager">ผู้จัดการฟาร์มเท่านั้น</option><option value="qa">เจ้าหน้าที่ QA</option></select></label><button onClick={() => { if (!newTaskTitle.trim() || !newTaskPlot || !newTaskTeam) { setActionMessage("กรอกชื่องาน แปลง และทีมก่อนมอบหมาย"); return; } addTask({ title: newTaskTitle, plot: newTaskPlot, team: newTaskTeam, assignedWorkerId: newTaskWorkerId || undefined, type: newTaskApprovalMode === "qa" ? "QA" : "General", approvalMode: newTaskApprovalMode, origin: "team", createdBy: persona.role, status: "Assigned", scheduledFor: getLocalDateKey() }); setShowTaskForm(false); setNewTaskTitle(""); setNewTaskApprovalMode("team_lead"); setActionMessage(newTaskWorkerId ? "มอบหมายงานรายบุคคลแล้ว" : `มอบหมายงานให้ทีม ${newTaskTeam} แล้ว สมาชิกทุกคนในทีมจะเห็นงาน`); }} className="w-full rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground">สร้างและมอบหมายงาน</button></Card> : null}
      <div className="space-y-3">
        {workOrders.map((wo) => (
          <Card key={wo.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{wo.id} · {wo.title}</p>
                <p className="text-xs text-muted-foreground">{wo.plot} · {wo.team}{wo.plannedFor ? ` · กำหนด ${formatDate(wo.plannedFor)}` : ""}</p>
                {wo.reason ? <p className="mt-1 text-xs text-destructive">สาเหตุ: {wo.reason}</p> : null}
              </div>
              <Badge tone={wo.status === "Completed" ? "good" : wo.status === "Delayed" ? "bad" : "warn"}>{wo.status}</Badge>
            </div>
            {wo.status !== "Completed" ? (
              <button
                onClick={() => {
                  const result = updateWorkOrderStatus(wo.id, "Completed");
                  setActionMessage("reason" in result ? result.reason : undefined);
                }}
                className="mt-3 w-full rounded-xl border border-border py-2 text-xs font-semibold"
              >
                ปิดงานหลังตรวจรายการและแนบหลักฐาน
              </button>
            ) : null}
            {getWorkOrderCompletionIssue(state, wo) ? <p className="mt-2 text-xs text-destructive">{getWorkOrderCompletionIssue(state, wo)}</p> : null}
          </Card>
        ))}
      </div>
      <SectionTitle>Task ของทีม</SectionTitle>
      <div className="space-y-2">{state.tasks.filter((task) => (plotFilter === "ทั้งหมด" || task.plot === plotFilter) && (teamFilter === "ทั้งหมด" || task.team === teamFilter)).map((task) => { const worker = state.workers.find((item) => item.id === task.assignedWorkerId); const awaitingReview = task.status === "Supervisor Review"; const canApprove = canPersonaApproveTask(persona.id, task, state.organizationRoles); const reviewerLabel = getTaskReviewerLabel(task); return <Card key={task.id}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-sm font-semibold">{task.title}</p><p className="mt-1 text-xs text-muted-foreground">{task.plot} · {task.team ?? "ยังไม่ระบุทีม"} · {worker ? `ผู้ปฏิบัติงาน ${worker.name}` : task.team ? "มอบหมายทั้งทีม" : "รอมอบหมาย"}</p><p className="mt-1 text-[11px] text-muted-foreground">ผู้ตรวจรับ: {reviewerLabel}</p>{awaitingReview ? <p className="mt-1 text-xs text-primary">พนักงานส่งงานแล้ว · {task.completion?.evidenceCount ? `หลักฐาน ${task.completion.evidenceCount} รายการ` : "ไม่มีหลักฐานภาพ"}</p> : null}</div><Badge tone={task.status === "Completed" ? "good" : task.status === "Delayed" ? "bad" : task.status === "In Progress" ? "info" : "warn"}>{awaitingReview ? "รอตรวจรับ" : task.status}</Badge></div>{awaitingReview && canApprove ? <div className="mt-3 grid grid-cols-2 gap-2"><button onClick={() => { updateTaskStatus(task.id, "In Progress", "ผู้ตรวจรับส่งกลับให้แก้ไข"); setActionMessage("ส่งงานกลับให้พนักงานแก้ไขแล้ว"); }} className="rounded-lg border border-border py-2 text-xs font-semibold">ส่งกลับแก้ไข</button><button onClick={() => { updateTaskStatus(task.id, "Completed", undefined, { ...task.completion, approvedBy: `${persona.role} · ${getTaskApprovalMode(task) === "qa" ? "สิทธิ์ QA" : "สิทธิ์ตรวจรับงาน"}`, completedBy: task.completion?.completedBy ?? worker?.name ?? "ไม่ระบุ" }); setActionMessage("อนุมัติงานแล้ว และเพิ่มลงประวัติการดูแลแปลง"); }} className="rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground">อนุมัติงาน</button></div> : awaitingReview ? <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">บัญชีนี้ไม่มีสิทธิ์ตรวจรับงานประเภทนี้ · รอ {reviewerLabel}</p> : null}</Card>; })}</div>
      <SectionTitle>ข้อจำกัดก่อนปิดงาน</SectionTitle>
      <Card className="border-destructive/30 bg-destructive/10"><p className="text-sm font-semibold text-destructive">PHI Warning</p><p className="mt-1 text-xs text-muted-foreground">แปลง {state.phiScenario.plot}: เก็บเกี่ยวได้เร็วสุด {state.phiScenario.earliestHarvest} แต่แผนปัจจุบันคือ {state.phiScenario.plannedHarvest}</p></Card>
      </> : null}

      {activeView === "workforce" ? <>
      <SectionTitle>คนและทีม</SectionTitle>
      <Card>
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            ["Total", state.workforce.total],
            ["Active", state.workforce.active],
            ["Available", state.workforce.available],
            ["Absent", state.workforce.absent],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-muted/60 py-2">
              <p className="text-sm font-bold">{value}</p>
              <p className="text-[10px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 space-y-2">
          {state.workforce.crews.map((crew) => (
            <div key={crew.name} className="flex items-center justify-between text-xs">
              <span>{crew.name}</span>
              <span className="text-muted-foreground">{crew.assigned} assigned · {crew.status}</span>
            </div>
          ))}
        </div>
      </Card>
      <div className="mt-3 space-y-2">{state.workers.map((worker) => { const assigned = state.tasks.filter((task) => task.assignedWorkerId === worker.id || (!task.assignedWorkerId && task.team === worker.crew)); const openTasks = assigned.filter((task) => !["Completed", "Cancelled", "Skipped"].includes(task.status)); return <Card key={worker.id} className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-sm font-semibold">{worker.name} · {worker.crew}</p><p className="mt-1 text-xs text-muted-foreground">พื้นที่หลัก {worker.plot ?? "ยังไม่ระบุ"}</p><p className="mt-1 text-xs text-primary">ภาระงานปัจจุบัน {openTasks.length} งาน · งานล่าช้า {assigned.filter((task) => task.status === "Delayed").length}</p></div><Badge tone={worker.status === "On Leave" || worker.status === "Unavailable" ? "bad" : worker.status === "Available" ? "warn" : "info"}>{({ Active: "กำลังปฏิบัติงาน", Available: "พร้อมทำงาน", "On Leave": "ลางาน", Unavailable: "ไม่พร้อม" } as Record<string, string>)[worker.status] ?? worker.status}</Badge></Card>; })}</div>
      </> : null}

      {activeView === "production" ? <Link to="/traceability" className="block rounded-2xl bg-primary py-3 text-center text-sm font-semibold text-primary-foreground">ดู Traceability ของล็อต</Link> : null}
    </AppShell>
  );
}

function isInFuturePeriod(date: string | undefined, period: string, customRange: { start: string; end: string }) {
  if (period === "all" || !date) return true;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (period === "custom") {
    const start = customRange.start ? new Date(`${customRange.start}T00:00:00`) : undefined;
    const end = customRange.end ? new Date(`${customRange.end}T23:59:59`) : undefined;
    return (!start || parsed >= start) && (!end || parsed <= end);
  }
  if (period === "today") return parsed.getTime() === today.getTime();
  const end = new Date(today);
  end.setDate(today.getDate() + (period === "30d" ? 30 : period === "90d" ? 90 : 365));
  return parsed >= today && parsed <= end;
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("th-TH", { day: "numeric", month: "short" });
}
