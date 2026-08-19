import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2, X } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { AppShell, Badge, Card, SectionTitle } from "@/components/AppShell";
import { useDragonflyData } from "@/hooks/useDragonflyData";
import { usePlots } from "@/hooks/usePlots";
import { toast } from "sonner";
import { TimeRangeFilter } from "@/components/TimeRangeFilter";
import { SearchableSelect } from "@/components/SearchableSelect";
import { getLocalDateKey, getTaskReviewerLabel, isTaskInPeriod } from "@/lib/dragonfly-data";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "ปฏิทินงานสวน — สวนอัจฉริยะ" },
      { name: "description", content: "ตารางงานใส่ปุ๋ย รดน้ำ ฉีดยา และเก็บเกี่ยว พร้อมการแจ้งเตือน" },
      { property: "og:title", content: "ปฏิทินงานสวน — สวนอัจฉริยะ" },
      { property: "og:description", content: "วางแผนงานเกษตรรายวันและรับแจ้งเตือนอัตโนมัติ" },
    ],
  }),
  component: CalendarPage,
});

type TaskType = "รดน้ำ" | "ใส่ปุ๋ย" | "ฉีดยา" | "เก็บเกี่ยว" | "ตัดแต่ง" | "อื่นๆ";

type FarmTask = {
  id: string;
  date: string; // ISO yyyy-mm-dd
  title: string;
  type: TaskType;
  plotId: string;
  done: boolean;
};

const TYPE_EMOJI: Record<TaskType, string> = {
  รดน้ำ: "💧",
  ใส่ปุ๋ย: "🌿",
  ฉีดยา: "🧴",
  เก็บเกี่ยว: "🧺",
  ตัดแต่ง: "✂️",
  อื่นๆ: "📌",
};

const TYPE_TONE: Record<TaskType, "good" | "warn" | "info" | "muted"> = {
  รดน้ำ: "info",
  ใส่ปุ๋ย: "good",
  ฉีดยา: "warn",
  เก็บเกี่ยว: "muted",
  ตัดแต่ง: "muted",
  อื่นๆ: "muted",
};

function getWeek(): { date: string; dayLabel: string; dayShort: string }[] {
  const days = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
  const result = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    result.push({
      date: getLocalDateKey(d),
      dayLabel: d.getDate().toString(),
      dayShort: days[d.getDay()] ?? "?",
    });
  }
  return result;
}

function CalendarPage() {
  const dragonfly = useDragonflyData();
  const { plots } = usePlots();
  const [tasks, setTasks] = useState<FarmTask[]>([]);
  const [selectedDate, setSelectedDate] = useState(getLocalDateKey());
  const [showAdd, setShowAdd] = useState(false);
  const [demoFarmFilter, setDemoFarmFilter] = useState(dragonfly.activeDashboardFarm.id);
  const [demoSiteFilter, setDemoSiteFilter] = useState("ทั้งหมด");
  const [demoPlotFilter, setDemoPlotFilter] = useState("ทั้งหมด");
  const [demoStatusFilter, setDemoStatusFilter] = useState("ทั้งหมด");
  const [demoTypeFilter, setDemoTypeFilter] = useState("ทั้งหมด");
  const [demoOriginFilter, setDemoOriginFilter] = useState("ทั้งหมด");
  const [demoTimeFilter, setDemoTimeFilter] = useState("today");
  const [demoCustomRange, setDemoCustomRange] = useState({ start: "", end: "" });
  const [showSmartTaskForm, setShowSmartTaskForm] = useState(false);
  const [smartTaskTitle, setSmartTaskTitle] = useState("");
  const [smartTaskPlot, setSmartTaskPlot] = useState("");
  const [smartTaskType, setSmartTaskType] = useState("Inspection");
  const [smartTaskOrigin, setSmartTaskOrigin] = useState<"personal" | "team">("personal");
  const [smartTaskAssigneeMode, setSmartTaskAssigneeMode] = useState<"crew" | "person">("crew");
  const [smartTaskTeam, setSmartTaskTeam] = useState("");
  const [smartTaskWorkerId, setSmartTaskWorkerId] = useState("");
  const [smartTaskApprovalMode, setSmartTaskApprovalMode] = useState<"team_lead" | "farm_manager" | "qa">("team_lead");
  const [smartTaskDate, setSmartTaskDate] = useState(getLocalDateKey());
  const [assigningTaskId, setAssigningTaskId] = useState<string | null>(null);
  const [assignmentMode, setAssignmentMode] = useState<"crew" | "person">("crew");
  const [assignmentTeam, setAssignmentTeam] = useState("");
  const [assignmentWorkerId, setAssignmentWorkerId] = useState("");
  const [assignmentApprovalMode, setAssignmentApprovalMode] = useState<"team_lead" | "farm_manager" | "qa">("team_lead");

  // form state
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<TaskType>("รดน้ำ");
  const [newPlotId, setNewPlotId] = useState("");
  const [newDate, setNewDate] = useState(selectedDate);

  const week = useMemo(() => getWeek(), []);

  // load from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("garden_guru_calendar_tasks");
      if (stored) {
        try { setTasks(JSON.parse(stored)); } catch (e) {}
      }
    }
    if (plots.length > 0 && plots[0] && !newPlotId) {
      setNewPlotId(plots[0].id);
    }
  }, [plots]);

  useEffect(() => {
    setDemoFarmFilter(dragonfly.activeDashboardFarm.id);
    setDemoSiteFilter("ทั้งหมด");
    setDemoPlotFilter("ทั้งหมด");
  }, [dragonfly.activeDashboardFarm.id]);

  const saveTasks = (updated: FarmTask[]) => {
    setTasks(updated);
    localStorage.setItem("garden_guru_calendar_tasks", JSON.stringify(updated));
  };

  const addTask = () => {
    if (!newTitle.trim()) {
      toast.error("กรุณาระบุชื่องาน");
      return;
    }
    const task: FarmTask = {
      id: `task-${Date.now()}`,
      date: newDate,
      title: newTitle.trim(),
      type: newType,
      plotId: newPlotId,
      done: false,
    };
    saveTasks([task, ...tasks]);
    setNewTitle("");
    setShowAdd(false);
    toast.success("เพิ่มงานสำเร็จ!");
  };

  const toggleDone = (id: string) => {
    saveTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const deleteTask = (id: string) => {
    saveTasks(tasks.filter((t) => t.id !== id));
    toast.success("ลบงานแล้ว");
  };

  const tasksForDate = tasks.filter((t) => t.date === selectedDate);

  if (dragonfly.isDemoMode) {
    const statusTone = (status: string): "good" | "warn" | "bad" | "info" | "muted" => {
      if (status === "Completed") return "good";
      if (status === "Delayed" || status === "Skipped" || status === "Cancelled") return "bad";
      if (status === "In Progress") return "info";
      if (status === "Assigned" || status === "Unassigned") return "warn";
      return "muted";
    };

    const selectedSite = dragonfly.state.sites.find((site) => site.id === demoSiteFilter);
    const farmSiteIds = Array.from(new Set(dragonfly.state.tasks.filter((task) => (task.farmId ?? "FARM-PRIMARY") === demoFarmFilter).map((task) => task.siteId).filter(Boolean))) as string[];
    const demoSiteOptions = [
      "ทั้งหมด",
      ...Array.from(new Map([
        ...dragonfly.state.sites.filter((site) => (site.farmId ?? "FARM-PRIMARY") === demoFarmFilter).map((site) => [site.id, { value: site.id, label: `${site.code} · ${site.name}` }] as const),
        ...farmSiteIds.map((siteId) => [siteId, { value: siteId, label: getDemoSiteLabel(siteId) }] as const),
      ]).values()),
    ];
    const scopedTaskPlots = dragonfly.state.plots.filter((plot) => {
      const matchesFarm = (plot.farmId ?? "FARM-PRIMARY") === demoFarmFilter;
      const matchesSite = demoSiteFilter === "ทั้งหมด" || plot.siteId === demoSiteFilter || (!plot.siteId && selectedSite?.plotPrefixes.some((prefix) => plot.id.startsWith(prefix)));
      return matchesFarm && matchesSite;
    });
    const scopedPlotIds = new Set(scopedTaskPlots.map((plot) => plot.id));
    const organizationEmployee = dragonfly.workspaceContext === "organization" && dragonfly.persona.id === "employee";
    const employeeWorker = dragonfly.state.workers.find((worker) => worker.id === "W-004") ?? dragonfly.state.workers[0];
    const tasksInScope = dragonfly.state.tasks.filter((task) => {
      const plot = dragonfly.state.plots.find((item) => item.id === task.plot || item.name === task.plot);
      const taskFarmId = task.farmId ?? plot?.farmId ?? "FARM-PRIMARY";
      const taskSiteId = task.siteId ?? plot?.siteId;
      const matchesFarm = taskFarmId === demoFarmFilter;
      const matchesSite = demoSiteFilter === "ทั้งหมด" || taskSiteId === demoSiteFilter;
      const matchesKnownPlot = scopedPlotIds.size === 0 || scopedPlotIds.has(task.plot) || scopedTaskPlots.some((item) => item.name === task.plot);
      const isTeamTask = task.origin === "team" || Boolean(task.team);
      const matchesWorkspace = dragonfly.workspaceContext === "personal" ? !isTeamTask : isTeamTask || task.origin === "system";
      const matchesEmployee = !organizationEmployee || task.assignedWorkerId === employeeWorker?.id || (!task.assignedWorkerId && task.team === employeeWorker?.crew);
      return matchesFarm && matchesSite && matchesKnownPlot && matchesWorkspace && matchesEmployee;
    });
    const demoPlotOptions = ["ทั้งหมด", ...Array.from(new Set(tasksInScope.map((task) => task.plot))).map((plotId) => {
      const plot = dragonfly.state.plots.find((item) => item.id === plotId || item.name === plotId);
      return { value: plotId, label: plot ? `${plotId} · ${plot.name} · ${plot.crop}` : plotId };
    })];
    const getEffectiveTaskStatus = (task: typeof tasksInScope[number]) => task.status === "Planned" ? (task.team || task.assignedWorkerId ? "Assigned" : "Unassigned") : task.status;
    const demoStatusOptions = ["ทั้งหมด", ...Array.from(new Set(tasksInScope.map(getEffectiveTaskStatus)))];
    const demoTypeOptions = ["ทั้งหมด", ...Array.from(new Set(tasksInScope.map((task) => task.type)))];
    const summarySmartTasks = tasksInScope.filter((task) =>
      (demoPlotFilter === "ทั้งหมด" || task.plot === demoPlotFilter) &&
      (demoTypeFilter === "ทั้งหมด" || task.type === demoTypeFilter) &&
      (demoOriginFilter === "ทั้งหมด" || (demoOriginFilter === "team" ? task.origin === "team" || Boolean(task.team) : task.origin !== "team" && !task.team)) &&
      isTaskInPeriod(task.scheduledFor, demoTimeFilter, demoCustomRange)
    );
    const filteredSmartTasks = summarySmartTasks.filter((task) => demoStatusFilter === "ทั้งหมด" || getEffectiveTaskStatus(task) === demoStatusFilter);
    const canCreatePersonalTask = dragonfly.workspaceContext === "personal";
    const canCreateTeamTask = dragonfly.workspaceContext === "organization" && dragonfly.effectiveSubscription === "Farm Pro" && !organizationEmployee;
    const crewOptions = Array.from(new Set(dragonfly.state.workers.map((worker) => worker.crew))).map((crew) => ({ value: crew, label: crew }));
    const originLabel = (task: typeof filteredSmartTasks[number]) => task.origin === "team" || task.team ? "งานทีม" : task.origin === "system" ? "งานจากระบบ" : "งานส่วนตัว";

    return (
      <AppShell title="ตารางงานสวน" subtitle={`${dragonfly.workspaceLabel} · ${dragonfly.effectiveRole} · ติดตามงานตามแปลง ประเภท และสถานะ`}>
        <Card className="border-primary/30 bg-primary-soft/50">
          <p className="text-sm font-semibold text-primary">สถานะงาน</p>
          <p className="mt-1 text-xs text-muted-foreground">
            งานที่เลื่อนหรือข้ามต้องระบุเหตุผล เพื่อให้ผู้จัดการเห็นสาเหตุและติดตามต่อได้
          </p>
        </Card>

        <Card className="space-y-3">
          <SearchableSelect label="ฟาร์ม" options={dragonfly.dashboardFarms.map((farm) => ({ value: farm.id, label: `${farm.name} · ${farm.location}` }))} value={demoFarmFilter} onChange={(value) => { dragonfly.setActiveDashboardFarm(value); setDemoFarmFilter(value); setDemoSiteFilter("ทั้งหมด"); setDemoPlotFilter("ทั้งหมด"); }} searchPlaceholder="ค้นหาชื่อฟาร์มหรือพื้นที่" />
          <SearchableSelect label="โซน" options={demoSiteOptions} value={demoSiteFilter} onChange={(value) => { setDemoSiteFilter(value); setDemoPlotFilter("ทั้งหมด"); }} allLabel="ทุกโซนในฟาร์ม" searchPlaceholder="ค้นหารหัสหรือชื่อโซน" />
          <TimeRangeFilter value={demoTimeFilter} onChange={setDemoTimeFilter} options={[{ value: "today", label: "วันนี้" }, { value: "7d", label: "7 วัน" }, { value: "30d", label: "30 วัน" }, { value: "all", label: "ทั้งหมด" }]} dateRange={demoCustomRange} onDateRangeChange={setDemoCustomRange} />
          <SearchableSelect label="แปลง" options={demoPlotOptions} value={demoPlotFilter} onChange={setDemoPlotFilter} allLabel="ทุกแปลง" searchPlaceholder="ค้นหารหัส ชื่อแปลง หรือพืช" />
          <DropdownFilter label="สถานะ" values={demoStatusOptions} value={demoStatusFilter} onChange={setDemoStatusFilter} allLabel="ทุกสถานะ" getLabel={getCalendarStatusLabel} />
          <DropdownFilter label="ประเภทงาน" values={demoTypeOptions} value={demoTypeFilter} onChange={setDemoTypeFilter} allLabel="ทุกประเภทงาน" />
          <DropdownFilter label="ประเภทเจ้าของงาน" values={dragonfly.workspaceContext === "personal" ? ["ส่วนตัว"] : ["ทีม"]} value={dragonfly.workspaceContext === "personal" ? "ส่วนตัว" : "ทีม"} onChange={() => setDemoOriginFilter(dragonfly.workspaceContext === "personal" ? "personal" : "team")} allLabel="ทุกงาน" />
          <p className="text-xs text-muted-foreground">กำลังแสดง {filteredSmartTasks.length} จาก {tasksInScope.length} งานในฟาร์ม/โซนที่เลือก</p>
        </Card>

        {canCreatePersonalTask || canCreateTeamTask ? <button
          data-tour="calendar-create-task"
          onClick={() => { setSmartTaskPlot(scopedTaskPlots[0]?.id ?? ""); setSmartTaskOrigin(canCreateTeamTask ? "team" : "personal"); setSmartTaskAssigneeMode("crew"); setSmartTaskTeam(crewOptions[0]?.value ?? ""); setSmartTaskWorkerId(""); setSmartTaskDate(getLocalDateKey()); setShowSmartTaskForm((value) => !value); }}
          className="bg-primary flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold text-primary-foreground cursor-pointer active:scale-[0.98]"
        >
          <Plus className="size-4" /> สร้างงาน
        </button> : <Card className="border-primary/25 bg-primary-soft/35 text-xs text-muted-foreground">ปฏิทินนี้แสดงแผนงานของสวน พนักงานสร้างหรือแก้ไขงานไม่ได้ และรับงานผ่านหน้า “งานของฉัน” เท่านั้น</Card>}

        {showSmartTaskForm ? <Card className="space-y-3 border-primary/30 bg-primary-soft/35">
          <div><p className="text-sm font-semibold text-primary">สร้างงานในปฏิทิน</p><p className="mt-1 text-xs text-muted-foreground">ทุกงานจะเป็น Task กลาง และจะเข้า Care Log ของแปลงเมื่อปิดงานแล้ว</p></div>
          <input value={smartTaskTitle} onChange={(event) => setSmartTaskTitle(event.target.value)} placeholder="ชื่องาน เช่น ตรวจใบอ่อน" className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary" />
          <SearchableSelect label="แปลง" options={scopedTaskPlots.map((plot) => ({ value: plot.id, label: `${plot.id} · ${plot.name} · ${plot.crop}` }))} value={smartTaskPlot} onChange={setSmartTaskPlot} searchPlaceholder="ค้นหารหัส ชื่อแปลง หรือพืช" />
          <div className="grid grid-cols-2 gap-2"><select value={smartTaskType} onChange={(event) => { const type = event.target.value; setSmartTaskType(type); if (type === "Harvest") setSmartTaskApprovalMode("qa"); }} className="rounded-lg border border-border bg-card px-2 py-2 text-xs"><option value="Inspection">ตรวจแปลง</option><option value="Irrigation">ให้น้ำ</option><option value="Fertilizer">ใส่ปุ๋ย</option><option value="Pruning">ตัดแต่ง</option><option value="Harvest">เก็บเกี่ยว</option><option value="General">อื่น ๆ</option></select><input type="date" value={smartTaskDate} onChange={(event) => setSmartTaskDate(event.target.value)} className="rounded-lg border border-border bg-card px-2 py-2 text-xs" /></div>
          <div className="grid grid-cols-2 gap-2">{(["personal", "team"] as const).filter((origin) => origin === "team" ? canCreateTeamTask : canCreatePersonalTask).map((origin) => <button key={origin} onClick={() => setSmartTaskOrigin(origin)} className={`rounded-lg border py-2 text-xs font-semibold ${smartTaskOrigin === origin ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>{origin === "personal" ? "งานส่วนตัว" : "งานทีม"}</button>)}</div>
          {smartTaskOrigin === "team" ? <>
            <div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => { setSmartTaskAssigneeMode("crew"); setSmartTaskWorkerId(""); }} className={`rounded-lg border py-2 text-xs font-semibold ${smartTaskAssigneeMode === "crew" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>มอบหมายทั้งทีม</button><button type="button" onClick={() => setSmartTaskAssigneeMode("person")} className={`rounded-lg border py-2 text-xs font-semibold ${smartTaskAssigneeMode === "person" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>มอบหมายรายบุคคล</button></div>
            {smartTaskAssigneeMode === "crew" ? <SearchableSelect label="ทีมรับผิดชอบ" options={crewOptions} value={smartTaskTeam} onChange={setSmartTaskTeam} searchPlaceholder="ค้นหาชื่อทีม" /> : <SearchableSelect label="พนักงานรับผิดชอบ" options={dragonfly.state.workers.map((worker) => ({ value: worker.id, label: `${worker.name} · ${worker.crew}` }))} value={smartTaskWorkerId} onChange={(value) => { setSmartTaskWorkerId(value); setSmartTaskTeam(dragonfly.state.workers.find((worker) => worker.id === value)?.crew ?? ""); }} searchPlaceholder="ค้นหาชื่อพนักงานหรือทีม" />}
            <p className="text-[11px] text-muted-foreground">{smartTaskAssigneeMode === "crew" ? "สมาชิกทุกคนในทีมจะเห็นงานนี้ใน “งานของฉัน” จนกว่าจะมีคนรับงาน" : "เฉพาะพนักงานที่เลือกจะเห็นงานนี้ใน “งานของฉัน”"}</p>
            <label className="block text-xs font-semibold text-muted-foreground">ผู้มีสิทธิ์ตรวจรับ<select value={smartTaskApprovalMode} onChange={(event) => setSmartTaskApprovalMode(event.target.value as typeof smartTaskApprovalMode)} className="mt-1.5 block w-full rounded-lg border border-border bg-card px-3 py-2.5 text-xs text-foreground"><option value="team_lead">หัวหน้าทีม · ผู้จัดการอนุมัติสำรอง</option><option value="farm_manager">ผู้จัดการฟาร์มเท่านั้น</option><option value="qa">เจ้าหน้าที่ QA</option></select></label>
          </> : null}
          <button onClick={() => { const plot = scopedTaskPlots.find((item) => item.id === smartTaskPlot); const worker = dragonfly.state.workers.find((item) => item.id === smartTaskWorkerId); const assignedTeam = smartTaskOrigin === "team" ? (smartTaskAssigneeMode === "crew" ? smartTaskTeam : worker?.crew ?? smartTaskTeam) : undefined; if (!smartTaskTitle.trim() || !plot) { toast.error("กรอกชื่องานและเลือกแปลงก่อน"); return; } if (smartTaskOrigin === "team" && !assignedTeam) { toast.error("เลือกทีมหรือพนักงานที่รับผิดชอบก่อน"); return; } dragonfly.addTask({ title: smartTaskTitle.trim(), plot: plot.id, farmId: plot.farmId ?? demoFarmFilter, siteId: plot.siteId, type: smartTaskType, priority: "Normal", approvalMode: smartTaskOrigin === "personal" ? "self" : smartTaskApprovalMode, origin: smartTaskOrigin, team: assignedTeam, assignedWorkerId: smartTaskOrigin === "team" && smartTaskAssigneeMode === "person" ? smartTaskWorkerId || undefined : undefined, createdBy: dragonfly.effectiveRole, ownerPersonaId: smartTaskOrigin === "personal" ? dragonfly.persona.id : undefined, status: smartTaskOrigin === "team" ? "Assigned" : "Planned", scheduledFor: smartTaskDate }); setSmartTaskTitle(""); setSmartTaskApprovalMode("team_lead"); setShowSmartTaskForm(false); toast.success(smartTaskOrigin === "team" ? `มอบหมายงานให้${smartTaskAssigneeMode === "crew" ? `ทีม ${assignedTeam}` : worker?.name ?? "พนักงาน"}แล้ว` : "สร้างงานส่วนตัวแล้ว"); }} className="w-full rounded-lg bg-primary py-2.5 text-xs font-semibold text-primary-foreground">สร้าง Task</button>
        </Card> : null}

        <SectionTitle>งานตามตัวกรอง</SectionTitle>
        <div className="space-y-3">
          {filteredSmartTasks.map((task) => {
            const taskPlot = dragonfly.state.plots.find((plot) => plot.id === task.plot || plot.name === task.plot);
            const taskFarmId = task.farmId ?? taskPlot?.farmId ?? "FARM-PRIMARY";
            const assignableWorkers = dragonfly.state.workers.filter((worker) => !worker.farmId || worker.farmId === taskFarmId);
            const assignmentCrewOptions = Array.from(new Set(assignableWorkers.map((worker) => worker.crew))).map((crew) => ({ value: crew, label: crew }));
            const crewKeyword = task.type === "Irrigation" ? "irrigation" : task.type === "Harvest" ? "harvest" : task.type === "Inspection" ? "protection" : "general";
            const suggestedAssignmentTeam = assignableWorkers.find((worker) => worker.plot === task.plot)?.crew ?? assignmentCrewOptions.find((crew) => crew.value.toLocaleLowerCase().includes(crewKeyword))?.value ?? assignmentCrewOptions[0]?.value ?? "";
            const effectiveStatus = getEffectiveTaskStatus(task);
            const isUnassigned = effectiveStatus === "Unassigned";
            return (
            <Card key={task.id}>
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-lg">
                  {task.type === "Irrigation" ? "💧" : task.type === "Fertilizer" ? "🌿" : task.type === "Harvest" ? "🧺" : "📌"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{task.title}</p>
                      <p className="text-xs text-muted-foreground">{task.plot} · {task.type} · {originLabel(task)}{task.scheduledFor ? ` · ${formatTaskDate(task.scheduledFor)}` : " · ไม่ระบุวัน"}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {task.plannedStart ? `${task.plannedStart} น.` : "ไม่ระบุเวลา"}
                        {task.estimatedMinutes ? ` · ${task.estimatedMinutes} นาที` : ""}
                        {task.assignedWorkerId ? ` · ผู้รับผิดชอบ ${dragonfly.state.workers.find((worker) => worker.id === task.assignedWorkerId)?.name ?? task.assignedWorkerId}` : task.team ? ` · มอบหมายทั้งทีม ${task.team}` : " · ยังไม่มอบหมาย"}
                        {task.priority ? ` · ความสำคัญ ${task.priority === "Urgent" ? "เร่งด่วน" : task.priority === "High" ? "สูง" : task.priority === "Low" ? "ต่ำ" : "ปกติ"}` : ""}
                      </p>
                      {task.origin === "team" || task.team ? <p className="mt-1 text-[11px] text-muted-foreground">ผู้ตรวจรับ: {getTaskReviewerLabel(task)}</p> : null}
                    </div>
                    <Badge tone={statusTone(effectiveStatus)}>{getCalendarStatusLabel(effectiveStatus)}</Badge>
                  </div>
                  {task.reason ? (
                    <p className="mt-2 rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">
                      สาเหตุ: {task.reason}
                    </p>
                  ) : null}
                  {!organizationEmployee && isUnassigned ? <>
                    <button
                      type="button"
                      onClick={() => {
                        setAssigningTaskId(task.id);
                        setAssignmentMode("crew");
                        setAssignmentTeam(suggestedAssignmentTeam);
                        setAssignmentWorkerId("");
                        setAssignmentApprovalMode(task.type === "Harvest" ? "qa" : "team_lead");
                      }}
                      className="mt-3 w-full rounded-lg bg-primary py-2.5 text-xs font-semibold text-primary-foreground"
                    >
                      มอบหมายงาน
                    </button>
                    {assigningTaskId === task.id ? <div className="mt-3 space-y-3 rounded-lg border border-primary/25 bg-primary-soft/35 p-3">
                      <div><p className="text-xs font-semibold text-primary">เลือกผู้รับผิดชอบ</p><p className="mt-1 text-[11px] text-muted-foreground">งานยังไม่เข้าหน้างานของพนักงานจนกว่าจะยืนยันการมอบหมาย</p></div>
                      <div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => { setAssignmentMode("crew"); setAssignmentWorkerId(""); }} className={`rounded-lg border py-2 text-xs font-semibold ${assignmentMode === "crew" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>มอบหมายทั้งทีม</button><button type="button" onClick={() => setAssignmentMode("person")} className={`rounded-lg border py-2 text-xs font-semibold ${assignmentMode === "person" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>มอบหมายรายบุคคล</button></div>
                      {assignmentMode === "crew" ? <SearchableSelect label="ทีมรับผิดชอบ" options={assignmentCrewOptions} value={assignmentTeam} onChange={setAssignmentTeam} searchPlaceholder="ค้นหาชื่อทีม" /> : <SearchableSelect label="พนักงานรับผิดชอบ" options={assignableWorkers.filter((worker) => !["On Leave", "Unavailable"].includes(worker.status)).map((worker) => ({ value: worker.id, label: `${worker.name} · ${worker.crew}` }))} value={assignmentWorkerId} onChange={(value) => { setAssignmentWorkerId(value); setAssignmentTeam(assignableWorkers.find((worker) => worker.id === value)?.crew ?? ""); }} searchPlaceholder="ค้นหาชื่อพนักงานหรือทีม" />}
                      <label className="block text-xs font-semibold text-muted-foreground">ผู้มีสิทธิ์ตรวจรับ<select value={assignmentApprovalMode} onChange={(event) => setAssignmentApprovalMode(event.target.value as typeof assignmentApprovalMode)} className="mt-1.5 block min-h-11 w-full rounded-lg border border-border bg-card px-3 text-xs text-foreground"><option value="team_lead">หัวหน้าทีม · ผู้จัดการอนุมัติสำรอง</option><option value="farm_manager">ผู้จัดการฟาร์มเท่านั้น</option><option value="qa">เจ้าหน้าที่ QA</option></select></label>
                      <div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setAssigningTaskId(null)} className="rounded-lg border border-border py-2 text-xs font-semibold">ยกเลิก</button><button type="button" onClick={() => { const worker = assignableWorkers.find((item) => item.id === assignmentWorkerId); const team = assignmentMode === "person" ? worker?.crew ?? assignmentTeam : assignmentTeam; if (!team || (assignmentMode === "person" && !worker)) { toast.error(assignmentMode === "person" ? "เลือกพนักงานก่อนมอบหมาย" : "เลือกทีมก่อนมอบหมาย"); return; } const result = dragonfly.assignTask(task.id, { team, assignedWorkerId: assignmentMode === "person" ? worker?.id : undefined, approvalMode: assignmentApprovalMode }); if (!result.ok) { toast.error(result.reason); return; } setAssigningTaskId(null); toast.success(assignmentMode === "person" ? `มอบหมายให้ ${worker?.name} แล้ว` : `มอบหมายให้ทีม ${team} แล้ว`); }} className="rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground">ยืนยันมอบหมาย</button></div>
                    </div> : null}
                  </> : !organizationEmployee && !["Completed", "Cancelled", "Skipped"].includes(task.status) ? <><div className="mt-3 grid grid-cols-3 gap-2">
                    <button
                      onClick={() => dragonfly.updateTaskStatus(task.id, "In Progress")}
                      className="rounded-xl border border-border py-2 text-xs font-semibold"
                    >
                      เริ่มงาน
                    </button>
                    <button
                      onClick={() => dragonfly.updateTaskStatus(task.id, "Supervisor Review")}
                      className="rounded-xl bg-primary py-2 text-xs font-semibold text-primary-foreground"
                    >
                      ส่งตรวจ
                    </button>
                    <button
                      onClick={() => {
                        const reason = window.prompt("เหตุผลที่เลื่อน/ข้ามงาน", "Rain") ?? "Other";
                        dragonfly.updateTaskStatus(task.id, "Delayed", reason);
                      }}
                      className="rounded-xl border border-destructive/30 py-2 text-xs font-semibold text-destructive"
                    >
                      เลื่อนงาน
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      const reason = window.prompt("เหตุผลที่ข้ามงาน", "Worker unavailable") ?? "Other";
                      dragonfly.updateTaskStatus(task.id, "Skipped", reason);
                    }}
                    className="mt-2 w-full rounded-xl border border-border py-2 text-xs font-semibold text-muted-foreground"
                  >
                    ข้ามงานพร้อมเหตุผล
                  </button>
                  </> : organizationEmployee ? <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">ในบริบทองค์กร พนักงานอัปเดตได้เฉพาะงานที่มอบหมายผ่านหน้า “งานของฉัน”</p> : null}
                </div>
              </div>
            </Card>
            );
          })}
        </div>

        {filteredSmartTasks.length === 0 ? <Card className="py-8 text-center text-sm text-muted-foreground">ไม่มีงานที่ตรงกับตัวกรองนี้</Card> : null}

        <SectionTitle>สรุปสถานะตามตัวกรอง</SectionTitle>
        <Card className="grid grid-cols-3 gap-2 text-center">
          {["Unassigned", "Assigned", "In Progress", "Supervisor Review", "Completed", "Delayed", "Skipped"].map((status) => (
            <div key={status} className="rounded-xl bg-muted/60 p-2">
              <p className="text-sm font-bold">
                {summarySmartTasks.filter((task) => getEffectiveTaskStatus(task) === status).length}
              </p>
              <p className="text-[10px] text-muted-foreground">{getCalendarStatusLabel(status)}</p>
            </div>
          ))}
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell title="ปฏิทินงาน" subtitle="วางแผนงานเกษตรรายวัน">
      {/* 7-day week strip */}
      <Card>
        <div className="grid grid-cols-7 gap-1 text-center">
          {week.map((d) => {
            const dayTasks = tasks.filter((t) => t.date === d.date);
            const isSelected = d.date === selectedDate;
            return (
              <button
                key={d.date}
                onClick={() => setSelectedDate(d.date)}
                className={`rounded-xl py-2 transition-all cursor-pointer ${
                  isSelected ? "bg-primary text-primary-foreground" : "bg-muted/50 hover:bg-muted"
                }`}
              >
                <p className="text-[10px] opacity-80">{d.dayShort}</p>
                <p className="text-sm font-semibold">{d.dayLabel}</p>
                <div className="mt-1 flex justify-center gap-0.5 flex-wrap">
                  {dayTasks.slice(0, 3).map((t, k) => (
                    <span
                      key={k}
                      className={`size-1.5 rounded-full ${isSelected ? "bg-white/80" : "bg-primary/60"}`}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Add task button */}
      <button
        onClick={() => { setNewDate(selectedDate); setShowAdd(true); }}
        className="bg-primary flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold text-primary-foreground cursor-pointer active:scale-[0.98]"
      >
        <Plus className="size-4" /> เพิ่มงานใหม่
      </button>

      {/* Add task modal overlay */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setShowAdd(false)}>
          <div
            className="w-full max-w-md rounded-t-3xl bg-card p-5 pb-8 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold">เพิ่มงานใหม่</p>
              <button onClick={() => setShowAdd(false)} className="text-muted-foreground cursor-pointer">
                <X className="size-5" />
              </button>
            </div>

            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="ชื่องาน เช่น ใส่ปุ๋ยทางใบแปลงทุเรียน"
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />

            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">ประเภทงาน</p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(TYPE_EMOJI) as TaskType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setNewType(t)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium cursor-pointer transition-all ${
                      newType === t ? "border-primary bg-primary-soft text-primary" : "border-border"
                    }`}
                  >
                    {TYPE_EMOJI[t]} {t}
                  </button>
                ))}
              </div>
            </div>

            {plots.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">แปลงที่ทำงาน</p>
                <select
                  value={newPlotId}
                  onChange={(e) => setNewPlotId(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                >
                  <option value="">-- ไม่ระบุแปลง --</option>
                  {plots.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.emoji} {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">วันที่</p>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>

            <button
              onClick={addTask}
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground cursor-pointer active:scale-[0.99]"
            >
              บันทึกงาน
            </button>
          </div>
        </div>
      )}

      {/* Tasks for selected date */}
      <SectionTitle>
        งานวันที่ {new Date(selectedDate + "T00:00:00").toLocaleDateString("th-TH", {
          weekday: "long", day: "numeric", month: "long",
        })}
      </SectionTitle>

      {tasksForDate.length === 0 ? (
        <Card className="text-center py-6">
          <p className="text-2xl mb-2">📅</p>
          <p className="text-sm text-muted-foreground">ยังไม่มีงานในวันนี้</p>
          <p className="text-xs text-muted-foreground mt-1">กดปุ่ม "เพิ่มงานใหม่" เพื่อวางแผนได้เลย</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {tasksForDate.map((t) => {
            const plot = plots.find((p) => p.id === t.plotId);
            return (
              <Card key={t.id} className={`flex items-center gap-3 ${t.done ? "opacity-60" : ""}`}>
                <button
                  onClick={() => toggleDone(t.id)}
                  className={`flex size-10 shrink-0 items-center justify-center rounded-xl transition-all cursor-pointer ${
                    t.done ? "bg-primary/20 text-primary" : "bg-muted text-lg"
                  }`}
                >
                  {t.done ? "✓" : TYPE_EMOJI[t.type]}
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${t.done ? "line-through text-muted-foreground" : ""}`}>
                    {t.title}
                  </p>
                  {plot && <p className="text-xs text-muted-foreground">{plot.emoji} {plot.name}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge tone={TYPE_TONE[t.type]}>{t.type}</Badge>
                  <button onClick={() => deleteTask(t.id)} className="text-muted-foreground hover:text-destructive cursor-pointer">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </Card>
            );
          })}
          <p className="text-center text-xs text-muted-foreground pt-1">
            เสร็จแล้ว {tasksForDate.filter((t) => t.done).length}/{tasksForDate.length} งาน
          </p>
        </div>
      )}

      {/* Upcoming tasks from other days */}
      {tasks.filter((t) => t.date > selectedDate && !t.done).length > 0 && (
        <>
          <SectionTitle>งานที่กำลังจะมาถึง</SectionTitle>
          <div className="space-y-2">
            {tasks
              .filter((t) => t.date > selectedDate && !t.done)
              .sort((a, b) => a.date.localeCompare(b.date))
              .slice(0, 5)
              .map((t) => {
                const plot = plots.find((p) => p.id === t.plotId);
                const dateLabel = new Date(t.date + "T00:00:00").toLocaleDateString("th-TH", {
                  day: "numeric", month: "short",
                });
                return (
                  <Card key={t.id} className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-lg">
                      {TYPE_EMOJI[t.type]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{t.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {dateLabel}{plot ? ` · ${plot.name}` : ""}
                      </p>
                    </div>
                    <Badge tone={TYPE_TONE[t.type]}>{t.type}</Badge>
                  </Card>
                );
              })}
          </div>
        </>
      )}
    </AppShell>
  );
}

function DropdownFilter({ label, values, value, onChange, allLabel, getLabel }: { label: string; values: string[]; value: string; onChange: (value: string) => void; allLabel: string; getLabel?: (value: string) => string }) {
  return <label className="block text-xs font-medium text-muted-foreground">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1.5 block min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm font-semibold text-foreground outline-none focus:border-primary">{values.map((item) => <option key={item} value={item}>{item === "ทั้งหมด" ? allLabel : getLabel?.(item) ?? item}</option>)}</select></label>;
}

function formatTaskDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("th-TH", { day: "numeric", month: "short" });
}

function getDemoSiteLabel(siteId: string) {
  return ({ "NORTH-A": "NORTH-A · โซนเนินเหนือ", "NORTH-B": "NORTH-B · โซนเชิงเขา", "EAST-A": "EAST-A · โซนริมคลอง" } as Record<string, string>)[siteId] ?? siteId;
}

function getCalendarStatusLabel(status: string) {
  return ({ Unassigned: "ยังไม่มอบหมาย", Planned: "วางแผนแล้ว", Assigned: "มอบหมายแล้ว", "In Progress": "กำลังทำ", "Supervisor Review": "รอตรวจรับ", Completed: "เสร็จแล้ว", Delayed: "ล่าช้า", Skipped: "ข้ามงาน", Cancelled: "ยกเลิก" } as Record<string, string>)[status] ?? status;
}
