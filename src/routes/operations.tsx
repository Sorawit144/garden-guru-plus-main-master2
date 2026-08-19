import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ClipboardList,
  Cpu,
  PackageSearch,
  ShieldCheck,
  Tractor,
  UsersRound,
} from "lucide-react";
import { AppShell, Badge, Card, SectionTitle } from "@/components/AppShell";
import {
  getInventoryDaysRemaining,
  getInventoryStatus,
  getWorkOrderCompletionIssue,
} from "@/lib/dragonfly-data";
import { useDragonflyData } from "@/hooks/useDragonflyData";
import { ProAccessGate } from "@/components/ProAccessGate";

export const Route = createFileRoute("/operations")({
  head: () => ({ meta: [{ title: "ศูนย์ควบคุมสวน — EasyPlants" }] }),
  component: OperationsPage,
});

function OperationsPage() {
  const { persona, state, dashboardFarms, activeDashboardFarm, setActiveDashboardFarm } =
    useDragonflyData();
  const [siteId, setSiteId] = useState("ทั้งหมด");
  const [period, setPeriod] = useState("วันนี้");
  const hasPro = persona.subscription === "Farm Pro";
  const selectedSite = state.sites.find((site) => site.id === siteId);
  const isInScope = (plot?: string) =>
    !selectedSite || selectedSite.plotPrefixes.some((prefix) => plot?.startsWith(prefix));
  const scopedOrders = useMemo(
    () => state.workOrders.filter((order) => isInScope(order.plot)),
    [state.workOrders, siteId],
  );
  const scopedTasks = useMemo(
    () => state.tasks.filter((task) => isInScope(task.plot)),
    [state.tasks, siteId],
  );
  const scopedWorkers = useMemo(
    () => state.workers.filter((worker) => isInScope(worker.plot)),
    [state.workers, siteId],
  );
  const issues = scopedOrders
    .map((order) => ({ order, issue: getWorkOrderCompletionIssue(state, order) }))
    .filter((item) => item.issue);
  const openOrders = scopedOrders.filter(
    (order) => !["Completed", "Approved"].includes(order.status),
  );
  const inventory = state.inventoryItems.filter(
    (item) =>
      item.farmId === activeDashboardFarm.id && (siteId === "ทั้งหมด" || item.siteId === siteId),
  );
  const machines = state.machines.filter(
    (machine) =>
      machine.farmId === activeDashboardFarm.id &&
      (siteId === "ทั้งหมด" || machine.siteId === siteId),
  );
  const machineStatus = {
    Ready: "พร้อมใช้",
    "In Use": "กำลังใช้งาน",
    "Inspection Due": "ถึงกำหนดตรวจ",
    Maintenance: "อยู่ระหว่างซ่อม",
    "Out of Service": "ห้ามใช้งาน",
  } as const;

  if (!hasPro) {
    return (
      <AppShell title="ศูนย์ปฏิบัติการ 360" subtitle="มุมมองรวมสำหรับผู้จัดการสวน">
        <ProAccessGate
          feature="ศูนย์ปฏิบัติการ 360"
          detail="รวมหลายฟาร์ม หลายโซน ทีม งาน สต็อก และการตรวจรับในมุมมองผู้จัดการ"
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      title="ศูนย์ปฏิบัติการ 360"
      subtitle={
        hasPro
          ? "ฟาร์ม → แปลง → งาน → ทรัพยากร → การตรวจรับ"
          : "ตัวอย่างการบริหารสวนองค์กรใน Farm Pro"
      }
    >
      <Card className="border-primary/25 bg-primary-soft/45 p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="block text-xs font-semibold text-primary">
            ฟาร์มที่กำลังดู
            <select
              value={activeDashboardFarm.id}
              onChange={(event) => setActiveDashboardFarm(event.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-primary/20 bg-card px-3 py-2.5 text-sm font-semibold text-foreground outline-none focus:border-primary"
            >
              {dashboardFarms.map((farm) => (
                <option key={farm.id} value={farm.id}>
                  {farm.name} · {farm.location}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-primary">
            ขอบเขตพื้นที่
            <select
              value={siteId}
              onChange={(event) => setSiteId(event.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-primary/20 bg-card px-3 py-2.5 text-sm font-semibold text-foreground outline-none focus:border-primary"
            >
              <option value="ทั้งหมด">ทุกโซนในฟาร์ม</option>
              {state.sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.code} · {site.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-primary">
            ช่วงเวลาปฏิบัติการ
            <select
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-primary/20 bg-card px-3 py-2.5 text-sm font-semibold text-foreground outline-none focus:border-primary"
            >
              <option>วันนี้</option>
              <option>7 วันข้างหน้า</option>
              <option>เดือนนี้</option>
              <option>กำหนดเอง</option>
            </select>
          </label>
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          {activeDashboardFarm.dataLabel} · ตัวกรองนี้กำหนดขอบเขตของสรุปในหน้านี้
          ไม่ผสมตัวเลขระหว่างฟาร์ม
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-2 text-center md:grid-cols-4">
        <Card>
          <Building2 className="mx-auto size-5 text-primary" />
          <p className="mt-1 text-lg font-bold">{state.sites.length}</p>
          <p className="text-[10px] text-muted-foreground">โซนงาน</p>
        </Card>
        <Card>
          <UsersRound className="mx-auto size-5 text-primary" />
          <p className="mt-1 text-lg font-bold">{scopedWorkers.length}</p>
          <p className="text-[10px] text-muted-foreground">คนในขอบเขต</p>
        </Card>
        <Card>
          <AlertTriangle className="mx-auto size-5 text-destructive" />
          <p className="mt-1 text-lg font-bold">{issues.length}</p>
          <p className="text-[10px] text-muted-foreground">ต้องตัดสินใจ</p>
        </Card>
        <Card>
          <ShieldCheck className="mx-auto size-5 text-primary" />
          <p className="mt-1 text-lg font-bold">{issues.length ? "1" : "0"}</p>
          <p className="text-[10px] text-muted-foreground">Compliance risk</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <SectionTitle>โครงสร้างสวน</SectionTitle>
          <div className="space-y-2">
            {state.sites
              .filter((site) => siteId === "ทั้งหมด" || site.id === siteId)
              .map((site) => (
                <Card key={site.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      {site.code} · {site.name}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {site.type} · {site.areaRai.toLocaleString("th-TH")} ไร่ · ผู้ดูแล{" "}
                      {site.manager}
                    </p>
                  </div>
                  <Badge
                    tone={
                      site.status === "Normal" ? "good" : site.status === "Blocked" ? "bad" : "warn"
                    }
                  >
                    {site.status === "Normal"
                      ? "ปกติ"
                      : site.status === "Blocked"
                        ? "ติดขัด"
                        : "ต้องดู"}
                  </Badge>
                </Card>
              ))}
          </div>
        </section>

        <section>
          <SectionTitle>งานที่ผู้จัดการต้องตัดสินใจ</SectionTitle>
          {issues.length > 0 ? (
            <>
              <SectionTitle>กฎที่กำลังบล็อกงาน</SectionTitle>
              {issues.map(({ order, issue }) => (
                <Card key={order.id} className="border-destructive/30 bg-destructive/10">
                  <p className="text-sm font-semibold text-destructive">
                    {order.id} · {order.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{issue}</p>
                </Card>
              ))}
            </>
          ) : null}

          <SectionTitle>คิวงานของโซน · {period}</SectionTitle>
          <div className="space-y-2">
            {openOrders.slice(0, 4).map((order) => (
              <Card key={order.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{order.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {order.plot} · {order.team}
                  </p>
                </div>
                <Badge tone={order.status === "Delayed" ? "bad" : "info"}>{order.status}</Badge>
              </Card>
            ))}
            {openOrders.length === 0 ? (
              <Card className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="size-5 text-primary" />
                ไม่มี Work Order ค้างในขอบเขตนี้
              </Card>
            ) : null}
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section>
          <SectionTitle>ทีมและความคืบหน้า</SectionTitle>
          <Card className="space-y-3">
            {state.workforce.crews.map((crew) => {
              const crewTasks = scopedTasks.filter((task) => task.team === crew.name);
              const delayed = crewTasks.filter((task) => task.status === "Delayed").length;
              return (
                <div
                  key={crew.name}
                  className="border-b border-border pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{crew.name}</p>
                    <Badge tone={delayed ? "bad" : "info"}>
                      {delayed ? `${delayed} งานล่าช้า` : `${crewTasks.length} งาน`}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    กำลังทำ {crewTasks.filter((task) => task.status === "In Progress").length} ·
                    รอมอบหมาย {crewTasks.filter((task) => task.status === "Assigned").length} ·{" "}
                    {crew.status}
                  </p>
                </div>
              );
            })}
          </Card>
        </section>
        <section>
          <SectionTitle
            action={
              <Link to="/inventory" className="text-xs font-semibold text-primary">
                จัดการ
              </Link>
            }
          >
            สต็อกและการจัดซื้อ
          </SectionTitle>
          <Card className="space-y-3">
            {inventory.slice(0, 4).map((item) => {
              const status = getInventoryStatus(item);
              const days = getInventoryDaysRemaining(item);
              return (
                <div key={item.id} className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.onHand} / {item.targetStock} {item.unit}
                      {days !== undefined ? ` · พอใช้ ${days} วัน` : ""}
                    </p>
                  </div>
                  <Badge tone={status === "order" ? "bad" : status === "watch" ? "warn" : "good"}>
                    {status === "order" ? "ต้องสั่ง" : status === "watch" ? "เฝ้าดู" : "พร้อม"}
                  </Badge>
                </div>
              );
            })}
            {inventory.length === 0 ? (
              <p className="text-xs text-muted-foreground">ยังไม่มีรายการสต็อกในขอบเขตนี้</p>
            ) : null}
            <Link
              to="/inventory"
              className="block rounded-lg border border-primary/25 bg-primary-soft/45 py-2 text-center text-xs font-semibold text-primary"
            >
              เปิดคลัง ใบขอซื้อ และการอนุมัติ
            </Link>
          </Card>
        </section>
        <section>
          <SectionTitle
            action={
              <Link to="/machinery" className="text-xs font-semibold text-primary">
                จัดการ
              </Link>
            }
          >
            เครื่องจักรและอุปกรณ์
          </SectionTitle>
          <Card className="space-y-3">
            {machines.slice(0, 4).map((machine) => (
              <div key={machine.id} className="flex items-start gap-2">
                <Tractor className="mt-0.5 size-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {machine.name} ·{" "}
                    <span
                      className={
                        ["Maintenance", "Out of Service"].includes(machine.status)
                          ? "text-destructive"
                          : machine.status === "Inspection Due"
                            ? "text-amber-600"
                            : "text-primary"
                      }
                    >
                      {machineStatus[machine.status]}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {machine.assetCode} · ตรวจถัดไป{" "}
                    {new Date(machine.nextInspectionDate).toLocaleDateString("th-TH")}
                  </p>
                </div>
              </div>
            ))}
            {machines.length === 0 ? (
              <p className="text-xs text-muted-foreground">ยังไม่มีเครื่องจักรในขอบเขตนี้</p>
            ) : null}
            <Link
              to="/machinery"
              className="block rounded-lg border border-primary/25 bg-primary-soft/45 py-2 text-center text-xs font-semibold text-primary"
            >
              เปิดทะเบียน ผลตรวจ และแผนซ่อมบำรุง
            </Link>
          </Card>
        </section>
        <section>
          <SectionTitle>ข้อมูลและการเชื่อมต่อ</SectionTitle>
          <Card className="space-y-3">
            <div className="flex gap-2">
              <Cpu className="size-4 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-semibold">
                  IoT online{" "}
                  {state.iotDevices.filter((device) => device.status === "Online").length}/
                  {state.iotDevices.length}
                </p>
                <p className="text-xs text-muted-foreground">ข้อมูลอุปกรณ์ใน Demo Mode</p>
              </div>
            </div>
            <div className="flex gap-2">
              <PackageSearch className="size-4 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-semibold">
                  คลัง {inventory.length} รายการ · ใบขอซื้อ{" "}
                  {
                    state.purchaseRequests.filter(
                      (request) => request.farmId === activeDashboardFarm.id,
                    ).length
                  }
                </p>
                <p className="text-xs text-muted-foreground">
                  Demo Mode บันทึกใน Local Storage; production ต้องเชื่อมฐานข้อมูลและ ERP
                </p>
              </div>
            </div>
          </Card>
        </section>
      </div>

      <Card className="flex items-center justify-between gap-3 bg-muted/50">
        <div>
          <p className="text-sm font-semibold">งานในปฏิทิน {scopedTasks.length} รายการ</p>
          <p className="text-xs text-muted-foreground">ดูระดับงานรายคนได้จาก Workforce</p>
        </div>
        <ClipboardList className="size-5 text-primary" />
      </Card>
      <div className="grid grid-cols-2 gap-3 md:max-w-md">
        <Link
          to="/workers"
          className="rounded-xl border border-border py-3 text-center text-sm font-semibold"
        >
          Workforce
        </Link>
        <Link
          to="/farm-pro"
          className="rounded-xl bg-primary py-3 text-center text-sm font-semibold text-primary-foreground"
        >
          Work Orders
        </Link>
      </div>
    </AppShell>
  );
}
