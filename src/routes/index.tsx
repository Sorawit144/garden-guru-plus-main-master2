import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  ArrowUpRight,
  ChevronRight,
  CloudSun,
  Droplets,
  Sparkles,
  Sprout,
  Tags,
  MapPin,
  Building2,
  Clock3,
  UserRound,
  ShieldCheck,
  ListChecks,
  PackageCheck,
  Scissors,
  ClipboardList,
  Wrench,
  Search,
} from "lucide-react";
import { AppShell, Badge, Card, Progress, SectionTitle, baht } from "@/components/AppShell";
import { BrandMark } from "@/components/BrandMark";
import { notifications, todayTasks as legacyTodayTasks, weather } from "@/lib/farm-data";
import { useDragonflyData } from "@/hooks/useDragonflyData";
import { usePlots } from "@/hooks/usePlots";
import { ExperienceProgression } from "@/components/ExperienceProgression";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getTaskReviewerLabel, isTaskInPeriod, type SmartTask } from "@/lib/dragonfly-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "สวนอัจฉริยะ — แอปจัดการสวนด้วย AI" },
      {
        name: "description",
        content: "ภาพรวมสวน งานประจำวัน สภาพอากาศ และสรุปต้นทุน-รายได้ ในแอปเดียว",
      },
      { property: "og:title", content: "สวนอัจฉริยะ — แอปจัดการสวนด้วย AI" },
      {
        property: "og:description",
        content: "จัดการแปลง วิเคราะห์โรคพืชด้วย AI และวางแผนงานเกษตรได้ในที่เดียว",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const dragonfly = useDragonflyData();
  const { plots } = usePlots();
  const isPersonalWorkspace = dragonfly.workspaceContext === "personal";
  const isOrganizationEmployee = !isPersonalWorkspace && dragonfly.persona.id === "employee";
  const isBeginner = isPersonalWorkspace && dragonfly.persona.profile.knowledgeLevel === "Beginner";
  const isOwner = isPersonalWorkspace || dragonfly.persona.id === "owner";
  const isCommercial =
    !isPersonalWorkspace &&
    !isOrganizationEmployee &&
    dragonfly.persona.profile.operationScale === "Commercial Farm";
  const isExport =
    !isPersonalWorkspace &&
    !isOrganizationEmployee &&
    dragonfly.persona.profile.operationScale === "Enterprise / Export";
  const smartTasks = dragonfly.isDemoMode ? dragonfly.state.tasks : legacyTodayTasks;
  const smartWeather = dragonfly.isDemoMode ? dragonfly.state.weather : weather.now;
  const avgHealth =
    plots.length > 0 ? Math.round(plots.reduce((s, p) => s + p.health, 0) / plots.length) : 0;
  const area = plots.reduce((s, p) => s + p.area, 0);
  const selectedFarm = dragonfly.activeDashboardFarm;
  const isPrimaryFarm = selectedFarm.id === "FARM-PRIMARY";
  const farmHealth =
    selectedFarm.plotCount === 0
      ? 0
      : isPrimaryFarm
        ? avgHealth
        : selectedFarm.status === "Needs attention"
          ? 78
          : 91;
  const farmTasks = smartTasks.filter((task) => {
    if (!dragonfly.isDemoMode) return true;
    const smartTask = task as SmartTask;
    const plot = dragonfly.state.plots.find(
      (item) => item.id === smartTask.plot || item.name === smartTask.plot,
    );
    const isTeamTask = smartTask.origin === "team" || Boolean(smartTask.team);
    const matchesWorkspace = isPersonalWorkspace
      ? !isTeamTask
      : isTeamTask || smartTask.origin === "system";
    return (
      matchesWorkspace && (smartTask.farmId ?? plot?.farmId ?? "FARM-PRIMARY") === selectedFarm.id
    );
  });
  const employeeWorker =
    dragonfly.state.workers.find((worker) => worker.id === "W-004") ?? dragonfly.state.workers[0];
  const todayFarmTasks = farmTasks
    .filter(
      (task) =>
        !dragonfly.isDemoMode ||
        isTaskInPeriod((task as SmartTask).scheduledFor, "today", { start: "", end: "" }),
    )
    .filter(
      (task) =>
        !isOrganizationEmployee ||
        (task as SmartTask).assignedWorkerId === employeeWorker?.id ||
        (!(task as SmartTask).assignedWorkerId &&
          (task as SmartTask).team === employeeWorker?.crew),
    )
    .sort(compareDashboardTasks);
  const todayOpenCount = todayFarmTasks.filter(
    (task) => !["Completed", "Cancelled", "Skipped"].includes(getDashboardTaskStatus(task)),
  ).length;
  const todayReviewCount = todayFarmTasks.filter(
    (task) => getDashboardTaskStatus(task) === "Supervisor Review",
  ).length;
  const todayCompletedCount = todayFarmTasks.filter(
    (task) => getDashboardTaskStatus(task) === "Completed",
  ).length;

  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedTodayTask, setSelectedTodayTask] = useState<
    (SmartTask & { time?: string; done?: boolean }) | null
  >(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const loadTx = () => {
      const stored = localStorage.getItem("garden_guru_transactions");
      if (stored) {
        try {
          setTransactions(JSON.parse(stored));
        } catch (e) {}
      }
    };
    loadTx();
    window.addEventListener("transactions_updated", loadTx);
    return () => window.removeEventListener("transactions_updated", loadTx);
  }, []);

  const income = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const cost = transactions.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  return (
    <AppShell
      title={
        dragonfly.isDemoMode
          ? isPersonalWorkspace
            ? "สวนของฉัน"
            : selectedFarm.name
          : "สวัสดี ชาวสวน"
      }
      subtitle={
        dragonfly.isDemoMode
          ? `แดชบอร์ด · ${dragonfly.workspaceLabel} · ${dragonfly.effectiveRole} · ${dragonfly.effectiveSubscription}`
          : "ศุกร์ที่ 7 สิงหาคม 2569"
      }
    >
      {dragonfly.isDemoMode ? (
        <Card data-tour="dashboard-farm" className="overflow-hidden p-0">
          {selectedFarm.plotCount > 0 ? (
            <img
              src="/images/durian-orchard-dashboard.jpg"
              alt="สวนทุเรียนที่กำลังดูบนแดชบอร์ด"
              className="aspect-[16/7] w-full object-cover"
            />
          ) : (
            <div className="flex aspect-[16/5] items-center justify-center bg-primary-soft text-primary">
              <Sprout className="size-10" />
            </div>
          )}
          <div className="p-4">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Building2 className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <label htmlFor="dashboard-farm" className="text-xs font-semibold text-primary">
                  {isPersonalWorkspace ? "สวนส่วนตัวที่กำลังดู" : "ฟาร์มขององค์กรที่กำลังดู"}
                </label>
                <select
                  id="dashboard-farm"
                  value={selectedFarm.id}
                  onChange={(event) => dragonfly.setActiveDashboardFarm(event.target.value)}
                  className="mt-1.5 block w-full rounded-lg border border-border bg-muted/55 px-3 py-2.5 text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                >
                  {dragonfly.dashboardFarms.map((farm) => (
                    <option key={farm.id} value={farm.id}>
                      {farm.name} · {farm.location}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
              <span className="inline-flex min-w-0 items-center gap-1">
                <MapPin className="size-3 shrink-0" />
                {selectedFarm.type} · {selectedFarm.plotCount} แปลง
              </span>
              <Badge
                tone={
                  selectedFarm.status === "Normal"
                    ? "good"
                    : selectedFarm.status === "Blocked"
                      ? "bad"
                      : "warn"
                }
              >
                {selectedFarm.status === "Normal"
                  ? "ปกติ"
                  : selectedFarm.status === "Blocked"
                    ? "ติดขัด"
                    : "ต้องดู"}
              </Badge>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              {isPersonalWorkspace
                ? "ข้อมูลในพื้นที่นี้เป็นของบัญชีส่วนตัว ไม่รวมงาน บุคลากร หรือต้นทุนขององค์กร"
                : selectedFarm.dataLabel}
            </p>
          </div>
        </Card>
      ) : null}

      {isPersonalWorkspace && selectedFarm.plotCount === 0 ? (
        <Card className="border-primary/25 bg-primary-soft/45">
          <p className="text-sm font-semibold text-primary">เริ่มสวนส่วนตัวของคุณ</p>
          <p className="mt-1 text-xs text-muted-foreground">
            พื้นที่นี้ยังไม่มีแปลงและไม่ดึงข้อมูลจากบริษัท เพิ่มแปลงแรกจาก GPS แล้ว Todo คำแนะนำ
            และประวัติการดูแลจะเชื่อมกับสวนนี้เท่านั้น
          </p>
          <Link
            to="/plots"
            className="mt-3 block rounded-lg bg-primary py-2.5 text-center text-xs font-semibold text-primary-foreground"
          >
            เพิ่มแปลงแรก
          </Link>
        </Card>
      ) : null}

      {isBeginner ? (
        <Card className="border-primary/30 bg-primary-soft/60">
          <p className="text-sm font-semibold text-primary">เริ่มต้นวันนี้</p>
          <p className="mt-1 text-xs text-muted-foreground">
            EasyPlants จะค่อย ๆ พาเพิ่มแปลง สร้างงาน
            และบันทึกสุขภาพพืชโดยไม่โชว์เครื่องมือระดับองค์กรก่อนจำเป็น
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            {["Create farm", "Create first plot", "Add crop", "Create first task"].map(
              (step, index) => (
                <div key={step} className="rounded-xl bg-card px-3 py-2">
                  <span className="font-bold text-primary">{index + 1}.</span> {step}
                </div>
              ),
            )}
          </div>
        </Card>
      ) : null}

      {isOwner ? (
        <Card className="border-primary/25 bg-primary-soft/45">
          <p className="text-sm font-semibold text-primary">มุมมองเจ้าของสวน</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            โฟกัสผลผลิต ต้นทุน และงานที่ช่วยให้ตัดสินใจเองได้
            โดยยังไม่แสดงเครื่องมือสั่งงานทีมที่ซับซ้อน
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <Link to="/yield" className="rounded-lg bg-card px-3 py-2 font-semibold">
              ดูแผนผลผลิต
            </Link>
            <Link to="/costs" className="rounded-lg bg-card px-3 py-2 font-semibold">
              ตรวจต้นทุน
            </Link>
          </div>
        </Card>
      ) : null}

      {isCommercial || isExport ? (
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "งานในขอบเขต", value: farmTasks.length },
            {
              label: "กำลังทำ",
              value: farmTasks.filter((task) => task.status === "In Progress").length,
            },
            {
              label: "คนงาน",
              value: isPrimaryFarm
                ? dragonfly.state.workforce.active
                : Math.max(1, Math.round(selectedFarm.workerCount * 0.75)),
            },
            {
              label: isExport ? "PHI Alerts" : "แปลงต้องเฝ้าระวัง",
              value: isExport
                ? selectedFarm.status === "Needs attention"
                  ? 2
                  : 0
                : selectedFarm.status === "Needs attention"
                  ? 2
                  : plots.filter((p) => p.health < 75).length,
            },
          ].map((metric) => (
            <Card key={metric.label} className="text-center">
              <p className="text-[11px] text-muted-foreground">{metric.label}</p>
              <p className="text-2xl font-bold text-primary">{metric.value}</p>
            </Card>
          ))}
        </div>
      ) : null}

      <Card
        data-tour="dashboard-health"
        className="relative overflow-hidden border-primary/20 bg-primary px-5 py-5 text-primary-foreground shadow-[0_20px_36px_-24px_oklch(0.25_0.10_145_/_0.9)]"
      >
        <div className="pointer-events-none absolute -right-12 -top-14 size-44 rounded-full bg-primary-foreground/10" />
        <div className="pointer-events-none absolute -bottom-20 right-12 size-36 rounded-full border-[18px] border-primary-foreground/10" />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-primary-foreground/72">สุขภาพสวนโดยรวม</p>
            <div className="mt-1 flex items-end gap-2">
              <span className="font-display text-4xl font-bold text-primary-foreground">
                {farmHealth}
              </span>
              <span className="mb-1 text-sm text-primary-foreground/72">/ 100 · ดี</span>
            </div>
          </div>
          <BrandMark
            size="md"
            className="rounded-2xl bg-primary-foreground/15 text-primary-foreground shadow-none"
          />
        </div>
        <div className="relative mt-5 h-2.5 w-full overflow-hidden rounded-full bg-primary-foreground/20">
          <div
            className="h-full rounded-full bg-primary-foreground"
            style={{ width: `${farmHealth}%` }}
          />
        </div>
        <div className="relative mt-5 grid grid-cols-3 divide-x divide-primary-foreground/15 rounded-2xl bg-primary-foreground/10 py-2.5 text-center backdrop-blur-sm">
          <div className="py-1">
            <p className="text-lg font-bold text-primary-foreground">
              {dragonfly.isDemoMode ? selectedFarm.plotCount : plots.length}
            </p>
            <p className="text-[11px] text-primary-foreground/70">แปลง</p>
          </div>
          <div className="py-1">
            <p className="text-lg font-bold text-primary-foreground">
              {dragonfly.isDemoMode ? selectedFarm.areaRai : area}
            </p>
            <p className="text-[11px] text-primary-foreground/70">ไร่</p>
          </div>
          <div className="py-1">
            <p className="text-lg font-bold text-primary-foreground">
              {dragonfly.isDemoMode
                ? selectedFarm.treeCount
                : plots.reduce((s, p) => s + p.trees, 0)}
            </p>
            <p className="text-[11px] text-primary-foreground/70">ต้น</p>
          </div>
        </div>
      </Card>

      <div>
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 className="text-[15px] font-bold tracking-tight">ทางลัดสำหรับวันนี้</h2>
          <Link
            to="/more"
            className="inline-flex items-center gap-0.5 text-xs font-semibold text-primary"
          >
            ทั้งหมด <ChevronRight className="size-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              to: "/market" as const,
              icon: Tags,
              label: "ราคาตลาด",
              tone: "bg-amber-50 text-amber-700",
            },
            {
              to: "/disaster" as const,
              icon: Droplets,
              label: "ท่วม/แล้ง",
              tone: "bg-sky-50 text-sky-700",
            },
            {
              to: "/monitor" as const,
              icon: Sprout,
              label: "เฝ้าระวัง",
              tone: "bg-emerald-50 text-emerald-700",
            },
          ].map((q) => (
            <Link
              key={q.to}
              to={q.to}
              className="surface-card group flex min-h-24 flex-col items-center justify-center gap-2 p-3 hover:-translate-y-0.5 active:scale-[0.98]"
            >
              <span className={`flex size-10 items-center justify-center rounded-2xl ${q.tone}`}>
                <q.icon className="size-5" />
              </span>
              <span className="text-xs font-medium text-foreground">{q.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link to="/weather">
          <Card className="h-full transition-transform duration-200 hover:-translate-y-0.5">
            <div className="flex items-start justify-between">
              <p className="text-xs font-medium text-muted-foreground">สภาพอากาศ</p>
              <CloudSun className="size-5 text-warning" />
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight">{smartWeather.temp}°</p>
            <p className="text-xs text-muted-foreground">{smartWeather.condition}</p>
            <p className="mt-3 text-xs font-semibold text-primary">
              โอกาสฝน {smartWeather.rainChance}%
            </p>
          </Card>
        </Link>
        <Link to="/recommend">
          <Card className="h-full transition-transform duration-200 hover:-translate-y-0.5">
            <div className="flex items-start justify-between">
              <p className="text-xs font-medium text-muted-foreground">คำแนะนำ AI</p>
              <Sparkles className="size-4 text-primary" />
            </div>
            <p className="mt-2 text-sm font-semibold leading-snug">ยังไม่ต้องรดน้ำ</p>
            <p className="mt-1 text-xs text-muted-foreground">ใส่ปุ๋ยแปลงมังคุด</p>
            <p className="mt-3 inline-flex items-center gap-0.5 text-xs font-semibold text-primary">
              ดู 4 ข้อ <ArrowUpRight className="size-3.5" />
            </p>
          </Card>
        </Link>
      </div>

      {!(isPersonalWorkspace && dragonfly.persona.id === "employee") ? (
        <ExperienceProgression persona={dragonfly.persona} onAdvance={dragonfly.setPersona} />
      ) : null}

      <SectionTitle
        action={
          <Link
            to="/calendar"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
          >
            ดูในปฏิทิน <ChevronRight className="size-3.5" />
          </Link>
        }
      >
        งานที่ต้องทำวันนี้ · {todayFarmTasks.length}
      </SectionTitle>
      <Card className="overflow-hidden p-0">
        <div className="border-b border-border bg-muted/35 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-foreground">วันนี้ · {selectedFarm.name}</p>
            <ListChecks className="mt-0.5 size-4 shrink-0 text-primary" />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {[
              { label: "ยังเปิด", value: todayOpenCount },
              { label: "รอตรวจ", value: todayReviewCount },
              { label: "เสร็จแล้ว", value: todayCompletedCount },
            ].map((item) => (
              <div key={item.label} className="rounded-lg bg-card px-1 py-2">
                <p className="text-base font-bold text-foreground">{item.value}</p>
                <p className="text-[10px] text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {todayFarmTasks.length > 0 ? (
          <div className="divide-y divide-border">
            {todayFarmTasks.map((task) => {
              const smartTask = task as SmartTask & { time?: string; done?: boolean };
              const plot = dragonfly.state.plots.find(
                (item) => item.id === smartTask.plot || item.name === smartTask.plot,
              );
              const site = dragonfly.state.sites.find(
                (item) =>
                  item.id === smartTask.siteId ||
                  item.plotPrefixes.some((prefix) => smartTask.plot.startsWith(prefix)),
              );
              const worker = dragonfly.state.workers.find(
                (item) => item.id === smartTask.assignedWorkerId,
              );
              const status = getDashboardTaskStatus(task);
              const isCompleted = status === "Completed";
              return (
                <button
                  key={smartTask.id}
                  type="button"
                  onClick={() => setSelectedTodayTask(smartTask)}
                  className="w-full px-4 py-3.5 text-left hover:bg-muted/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                >
                  <div className="flex items-start gap-3">
                    <div className="shrink-0">
                      <span
                        className={`flex size-10 items-center justify-center rounded-xl ${isCompleted ? "bg-primary-soft text-primary" : status === "Delayed" ? "bg-destructive/10 text-destructive" : "bg-muted text-primary"}`}
                      >
                        {getTaskTypeIcon(smartTask.type)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-sm font-semibold leading-snug ${isCompleted ? "text-muted-foreground" : "text-foreground"}`}
                          >
                            {smartTask.title}
                          </p>
                          <p className="mt-1 truncate text-[11px] text-muted-foreground">
                            {plot ? plot.name : smartTask.plot} ·{" "}
                            {smartTask.plannedStart ?? smartTask.time ?? "ไม่ระบุเวลา"}
                          </p>
                        </div>
                        <Badge tone={getTaskStatusTone(status)}>{getTaskStatusLabel(status)}</Badge>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="px-4 py-8 text-center">
            <p className="text-sm font-semibold">ไม่มีงานที่กำหนดไว้สำหรับวันนี้</p>
            <p className="mt-1 text-xs text-muted-foreground">
              สร้างหรือเลื่อนงานจากปฏิทิน แล้วรายการจะมาแสดงที่นี่อัตโนมัติ
            </p>
            <Link
              to="/calendar"
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary"
            >
              เปิดปฏิทินงาน <ChevronRight className="size-3.5" />
            </Link>
          </div>
        )}
      </Card>
      <Dialog
        open={Boolean(selectedTodayTask)}
        onOpenChange={(open) => !open && setSelectedTodayTask(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedTodayTask?.title}</DialogTitle>
            <DialogDescription>
              {selectedTodayTask
                ? `${selectedTodayTask.plot} · ${getTaskTypeLabel(selectedTodayTask.type)}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          {selectedTodayTask ? (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-muted p-3">
                  <p className="text-[11px] text-muted-foreground">เวลา</p>
                  <p className="mt-1 font-semibold">
                    {selectedTodayTask.plannedStart ?? selectedTodayTask.time ?? "ไม่ระบุ"}
                  </p>
                </div>
                <div className="rounded-xl bg-muted p-3">
                  <p className="text-[11px] text-muted-foreground">สถานะ</p>
                  <p className="mt-1 font-semibold">
                    {getTaskStatusLabel(getDashboardTaskStatus(selectedTodayTask))}
                  </p>
                </div>
              </div>
              <div className="space-y-2 rounded-xl border border-border p-3 text-xs text-muted-foreground">
                <p>
                  <span className="font-semibold text-foreground">ระยะเวลา:</span>{" "}
                  {selectedTodayTask.estimatedMinutes
                    ? `${selectedTodayTask.estimatedMinutes} นาที`
                    : "ไม่ระบุ"}
                </p>
                <p>
                  <span className="font-semibold text-foreground">ผู้รับผิดชอบ:</span>{" "}
                  {dragonfly.state.workers.find(
                    (worker) => worker.id === selectedTodayTask.assignedWorkerId,
                  )?.name ?? "รอมอบหมาย"}
                  {selectedTodayTask.team ? ` · ${selectedTodayTask.team}` : ""}
                </p>
                {selectedTodayTask.team ? (
                  <p>
                    <span className="font-semibold text-foreground">ผู้ตรวจรับ:</span>{" "}
                    {getTaskReviewerLabel(selectedTodayTask)}
                  </p>
                ) : null}
                <p>
                  <span className="font-semibold text-foreground">ความสำคัญ:</span>{" "}
                  {getTaskPriorityLabel(selectedTodayTask.priority)}
                </p>
                {selectedTodayTask.reason ? (
                  <p className="rounded-lg bg-destructive/10 p-2 text-destructive">
                    สาเหตุ: {selectedTodayTask.reason}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {dragonfly.isDemoMode && dragonfly.state.recommendations.length > 0 ? (
        <>
          <SectionTitle>Smart Recommendations</SectionTitle>
          <Card className="space-y-3">
            {dragonfly.state.recommendations.slice(0, 2).map((rec) => (
              <div key={rec.id}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{rec.title}</p>
                  <Badge tone="info">{rec.confidence}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{rec.reason}</p>
                <p className="mt-1 text-xs font-medium text-primary">{rec.action}</p>
              </div>
            ))}
          </Card>
        </>
      ) : null}

      <SectionTitle
        action={
          <Link to="/plots" className="text-xs font-medium text-primary">
            ดูทั้งหมด
          </Link>
        }
      >
        แปลงของฉัน
      </SectionTitle>
      <div className="space-y-3">
        {plots.map((p) => (
          <Card key={p.id}>
            <div className="flex items-center gap-3">
              <BrandMark size="md" className="bg-primary-soft text-primary shadow-none" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{p.name}</p>
                <p className="text-xs text-muted-foreground">
                  {p.crop} · {p.trees} ต้น · {p.area} ไร่
                </p>
              </div>
              <span className="text-sm font-semibold text-primary">{p.health}%</span>
            </div>
            <div className="mt-3">
              <Progress value={p.health} />
            </div>
          </Card>
        ))}
      </div>

      <SectionTitle
        action={
          <Link to="/costs" className="text-xs font-medium text-primary">
            รายละเอียด
          </Link>
        }
      >
        สรุปการเงินเดือนนี้
      </SectionTitle>
      <Card>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-muted-foreground">รายได้</p>
            <p className="text-sm font-bold text-primary">{baht(income)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">ต้นทุน</p>
            <p className="text-sm font-bold text-destructive">{baht(cost)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">กำไร</p>
            <p className="text-sm font-bold">{baht(income - cost)}</p>
          </div>
        </div>
      </Card>

      <SectionTitle
        action={
          <Link to="/notifications" className="text-xs font-medium text-primary">
            ทั้งหมด
          </Link>
        }
      >
        แจ้งเตือนล่าสุด
      </SectionTitle>
      <Card className="space-y-3">
        {notifications.slice(0, 3).map((n) => (
          <div key={n.id} className="flex items-start gap-3">
            <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
            <div className="min-w-0 flex-1">
              <p className="text-sm">{n.title}</p>
              <p className="text-xs text-muted-foreground">
                {n.type} · {n.time}
              </p>
            </div>
          </div>
        ))}
      </Card>
    </AppShell>
  );
}

function getDashboardTaskStatus(task: any) {
  return task.status ?? (task.done ? "Completed" : "Planned");
}

function compareDashboardTasks(a: any, b: any) {
  const priority = { Urgent: 0, High: 1, Normal: 2, Low: 3 } as Record<string, number>;
  const status = {
    Delayed: 0,
    "Supervisor Review": 1,
    "In Progress": 2,
    Assigned: 3,
    Planned: 4,
    Completed: 5,
    Skipped: 6,
    Cancelled: 7,
  } as Record<string, number>;
  const priorityDifference =
    (priority[a.priority ?? "Normal"] ?? 2) - (priority[b.priority ?? "Normal"] ?? 2);
  if (priorityDifference !== 0) return priorityDifference;
  const statusDifference =
    (status[getDashboardTaskStatus(a)] ?? 4) - (status[getDashboardTaskStatus(b)] ?? 4);
  if (statusDifference !== 0) return statusDifference;
  return String(a.plannedStart ?? a.time ?? "99:99").localeCompare(
    String(b.plannedStart ?? b.time ?? "99:99"),
  );
}

function getTaskStatusLabel(status: string) {
  return (
    (
      {
        Planned: "วางแผนแล้ว",
        Assigned: "มอบหมายแล้ว",
        "In Progress": "กำลังทำ",
        "Supervisor Review": "รอตรวจรับ",
        Completed: "เสร็จแล้ว",
        Delayed: "ล่าช้า",
        Skipped: "ข้ามงาน",
        Cancelled: "ยกเลิก",
      } as Record<string, string>
    )[status] ?? status
  );
}

function getTaskStatusTone(status: string): "good" | "warn" | "bad" | "info" | "muted" {
  if (status === "Completed") return "good";
  if (["Delayed", "Skipped", "Cancelled"].includes(status)) return "bad";
  if (status === "In Progress") return "info";
  if (["Assigned", "Supervisor Review"].includes(status)) return "warn";
  return "muted";
}

function getTaskPriorityLabel(priority?: SmartTask["priority"]) {
  return priority === "Urgent"
    ? "เร่งด่วน"
    : priority === "High"
      ? "สูง"
      : priority === "Low"
        ? "ต่ำ"
        : "ปกติ";
}

function getTaskPriorityTone(priority?: SmartTask["priority"]) {
  if (priority === "Urgent") return "bg-destructive/15 text-destructive";
  if (priority === "High") return "bg-amber-100 text-amber-800";
  return "bg-muted text-muted-foreground";
}

function getTaskTypeLabel(type: string) {
  return (
    (
      {
        Irrigation: "ระบบน้ำ",
        Fertilizer: "ใส่ปุ๋ย",
        Inspection: "ตรวจแปลง",
        Harvest: "เก็บเกี่ยว",
        Pruning: "ตัดแต่ง",
        Maintenance: "บำรุงรักษา",
        Record: "บันทึกข้อมูล",
        "Plant Health": "สุขภาพพืช",
        รดน้ำ: "ระบบน้ำ",
        ใส่ปุ๋ย: "ใส่ปุ๋ย",
        ฉีดยา: "อารักขาพืช",
      } as Record<string, string>
    )[type] ?? type
  );
}

function getTaskTypeIcon(type: string) {
  const Icon = ["Irrigation", "รดน้ำ"].includes(type)
    ? Droplets
    : ["Fertilizer", "ใส่ปุ๋ย", "Plant Health"].includes(type)
      ? Sprout
      : type === "Harvest"
        ? PackageCheck
        : type === "Pruning"
          ? Scissors
          : type === "Record"
            ? ClipboardList
            : type === "Maintenance"
              ? Wrench
              : Search;
  return <Icon className="size-5" aria-hidden="true" />;
}
