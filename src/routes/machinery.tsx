import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Gauge,
  Plus,
  ShieldCheck,
  Tractor,
  UsersRound,
  Wrench,
} from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell, Badge, Card, SectionTitle } from "@/components/AppShell";
import { ProAccessGate } from "@/components/ProAccessGate";
import { SearchableSelect } from "@/components/SearchableSelect";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDragonflyData } from "@/hooks/useDragonflyData";
import type { MachineInspection, MachineStatus } from "@/lib/dragonfly-data";

export const Route = createFileRoute("/machinery")({
  head: () => ({
    meta: [
      { title: "เครื่องจักรและการบำรุงรักษา — EasyPlants" },
      {
        name: "description",
        content: "ทะเบียนเครื่อง ตรวจเช็กก่อนใช้ ประวัติซ่อม และแผนบำรุงรักษา",
      },
    ],
  }),
  component: MachineryPage,
});

const statusLabel: Record<MachineStatus, string> = {
  Ready: "พร้อมใช้",
  "In Use": "กำลังใช้งาน",
  "Inspection Due": "ถึงกำหนดตรวจ",
  Maintenance: "อยู่ระหว่างซ่อม",
  "Out of Service": "ห้ามใช้งาน",
};

const statusTone = (status: MachineStatus) =>
  status === "Ready"
    ? "good"
    : status === "In Use"
      ? "info"
      : status === "Inspection Due"
        ? "warn"
        : "bad";
const resultLabel: Record<MachineInspection["result"], string> = {
  Passed: "ผ่าน",
  "Needs Attention": "ต้องติดตาม",
  Failed: "ไม่ผ่าน",
};
const formatDate = (value?: string) =>
  value
    ? new Date(value).toLocaleDateString("th-TH", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "ยังไม่มีข้อมูล";

function MachineryPage() {
  const {
    persona,
    state,
    dashboardFarms,
    activeDashboardFarm,
    setActiveDashboardFarm,
    addMachineInspection,
    addMaintenanceRecord,
    updateMaintenanceStatus,
  } = useDragonflyData();
  const [view, setView] = useState<"assets" | "inspections" | "maintenance" | "roles">("assets");
  const [siteFilter, setSiteFilter] = useState("ทั้งหมด");
  const [typeFilter, setTypeFilter] = useState("ทั้งหมด");
  const [statusFilter, setStatusFilter] = useState("ทั้งหมด");
  const [inspectionOpen, setInspectionOpen] = useState(false);
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [machineId, setMachineId] = useState("");
  const [meterHours, setMeterHours] = useState("");
  const [inspectedBy, setInspectedBy] = useState(persona.role);
  const [inspectionNotes, setInspectionNotes] = useState("");
  const [checks, setChecks] = useState<Record<string, "Pass" | "Attention" | "Fail">>({
    fluids: "Pass",
    leaks: "Pass",
    controls: "Pass",
    safety: "Pass",
  });
  const [maintenanceTitle, setMaintenanceTitle] = useState("");
  const [maintenanceType, setMaintenanceType] = useState<"Preventive" | "Repair">("Repair");
  const [scheduledFor, setScheduledFor] = useState(new Date().toISOString().slice(0, 10));
  const [assignedTo, setAssignedTo] = useState("ทีมเครื่องจักร");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [message, setMessage] = useState("");
  const canManage = ["owner", "commercial", "export"].includes(persona.id);
  const hasAccess =
    persona.subscription === "Farm Pro" || (persona.id === "employee" && state.machines.length > 1);

  const sites = state.sites.filter(
    (site) =>
      state.plots.some(
        (plot) => plot.farmId === activeDashboardFarm.id && plot.siteId === site.id,
      ) ||
      state.machines.some(
        (machine) => machine.farmId === activeDashboardFarm.id && machine.siteId === site.id,
      ),
  );
  const machines = useMemo(
    () =>
      state.machines.filter(
        (machine) =>
          machine.farmId === activeDashboardFarm.id &&
          (siteFilter === "ทั้งหมด" || machine.siteId === siteFilter) &&
          (typeFilter === "ทั้งหมด" || machine.type === typeFilter) &&
          (statusFilter === "ทั้งหมด" || machine.status === statusFilter),
      ),
    [state.machines, activeDashboardFarm.id, siteFilter, typeFilter, statusFilter],
  );
  const farmMachineIds = new Set(
    state.machines
      .filter((machine) => machine.farmId === activeDashboardFarm.id)
      .map((machine) => machine.id),
  );
  const inspections = state.machineInspections.filter((inspection) =>
    farmMachineIds.has(inspection.machineId),
  );
  const maintenance = state.maintenanceRecords.filter((record) =>
    farmMachineIds.has(record.machineId),
  );
  const selectedMachine = state.machines.find((machine) => machine.id === machineId);
  const maintenanceCost = maintenance
    .filter((record) => record.status !== "Completed")
    .reduce((sum, record) => sum + record.estimatedCost, 0);

  const openInspection = (id: string) => {
    const machine = state.machines.find((item) => item.id === id);
    setMachineId(id);
    setMeterHours(String(machine?.meterHours ?? 0));
    setInspectedBy(persona.role);
    setInspectionNotes("");
    setChecks({ fluids: "Pass", leaks: "Pass", controls: "Pass", safety: "Pass" });
    setInspectionOpen(true);
  };

  const openMaintenance = (id: string, type: "Preventive" | "Repair" = "Repair") => {
    const machine = state.machines.find((item) => item.id === id);
    setMachineId(id);
    setMaintenanceType(type);
    setMaintenanceTitle(
      type === "Repair"
        ? `ตรวจซ่อม ${machine?.name ?? "เครื่องจักร"}`
        : `บำรุงรักษาตามรอบ ${machine?.name ?? "เครื่องจักร"}`,
    );
    setAssignedTo(machine?.assignedTeam ?? "ทีมเครื่องจักร");
    setEstimatedCost("");
    setMaintenanceOpen(true);
  };

  if (!hasAccess)
    return (
      <AppShell
        title="เครื่องจักรและการบำรุงรักษา"
        subtitle="ทะเบียนเครื่อง ตรวจเช็ก และประวัติซ่อม"
      >
        <ProAccessGate
          feature="ระบบเครื่องจักร Farm Pro"
          detail="ใช้ทะเบียนทรัพย์สิน ตรวจเช็กก่อนใช้ วางแผนบำรุง และคุมค่าใช้จ่ายหลายฟาร์ม"
        />
      </AppShell>
    );

  return (
    <AppShell
      title="เครื่องจักรและการบำรุงรักษา"
      subtitle="ทะเบียนเครื่อง → ตรวจเช็ก → แจ้งซ่อม → ปิดงานบำรุง"
    >
      <Card className="border-primary/25 bg-primary-soft/40">
        <div className="grid gap-3 md:grid-cols-3">
          <SearchableSelect
            label="สวน/ฟาร์ม"
            options={dashboardFarms.map((farm) => ({
              value: farm.id,
              label: `${farm.name} · ${farm.location}`,
            }))}
            value={activeDashboardFarm.id}
            onChange={(value) => {
              setActiveDashboardFarm(value);
              setSiteFilter("ทั้งหมด");
            }}
            searchPlaceholder="ค้นหาสวน"
          />
          <SearchableSelect
            label="โซน"
            options={[
              "ทั้งหมด",
              ...sites.map((site) => ({ value: site.id, label: `${site.code} · ${site.name}` })),
            ]}
            value={siteFilter}
            onChange={setSiteFilter}
            allLabel="ทุกโซน"
            searchPlaceholder="ค้นหาโซน"
          />
          <SearchableSelect
            label="ประเภทเครื่อง"
            options={[
              "ทั้งหมด",
              ...Array.from(new Set(state.machines.map((machine) => machine.type))),
            ]}
            value={typeFilter}
            onChange={setTypeFilter}
            allLabel="ทุกประเภท"
            searchPlaceholder="ค้นหาประเภท"
          />
          <SearchableSelect
            label="สถานะ"
            options={[
              { value: "ทั้งหมด", label: "ทุกสถานะ" },
              ...Object.entries(statusLabel).map(([value, label]) => ({ value, label })),
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
            allLabel="ทุกสถานะ"
            searchPlaceholder="ค้นหาสถานะ"
          />
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          แสดงเฉพาะเครื่องจักรของ {activeDashboardFarm.name} ไม่รวมทรัพย์สินของฟาร์มอื่น
        </p>
      </Card>

      {message ? (
        <Card className="flex items-start gap-2 border-primary/30 bg-primary-soft/45 text-sm">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
          <p>{message}</p>
        </Card>
      ) : null}

      <div className="grid grid-cols-2 gap-2 text-center md:grid-cols-4">
        <Card>
          <Tractor className="mx-auto size-5 text-primary" />
          <p className="mt-1 text-lg font-bold">{machines.length}</p>
          <p className="text-[10px] text-muted-foreground">เครื่องในขอบเขต</p>
        </Card>
        <Card>
          <CheckCircle2 className="mx-auto size-5 text-primary" />
          <p className="mt-1 text-lg font-bold">
            {machines.filter((machine) => machine.status === "Ready").length}
          </p>
          <p className="text-[10px] text-muted-foreground">พร้อมใช้</p>
        </Card>
        <Card>
          <AlertTriangle className="mx-auto size-5 text-destructive" />
          <p className="mt-1 text-lg font-bold">
            {
              machines.filter((machine) =>
                ["Inspection Due", "Maintenance", "Out of Service"].includes(machine.status),
              ).length
            }
          </p>
          <p className="text-[10px] text-muted-foreground">ต้องดำเนินการ</p>
        </Card>
        <Card>
          <Wrench className="mx-auto size-5 text-primary" />
          <p className="mt-1 text-lg font-bold">฿{maintenanceCost.toLocaleString("th-TH")}</p>
          <p className="text-[10px] text-muted-foreground">ค่าซ่อมที่วางแผน</p>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {(
          [
            ["assets", "ทะเบียนเครื่อง"],
            ["inspections", "ผลตรวจ"],
            ["maintenance", "ซ่อมบำรุง"],
            ["roles", "ผู้รับผิดชอบ"],
          ] as const
        ).map(([id, label]) => (
          <button
            type="button"
            key={id}
            onClick={() => setView(id)}
            className={`min-h-11 rounded-lg border px-2 text-xs font-semibold ${view === id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {view === "assets" ? (
        <section>
          <SectionTitle>ทะเบียนเครื่องจักร</SectionTitle>
          <div className="grid gap-3 lg:grid-cols-2">
            {machines.map((machine) => (
              <Card key={machine.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                      <Tractor className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{machine.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {machine.assetCode} · {machine.type}
                      </p>
                    </div>
                  </div>
                  <Badge tone={statusTone(machine.status)}>{statusLabel[machine.status]}</Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-muted/55 p-3 text-xs">
                  <div>
                    <p className="text-muted-foreground">ตำแหน่ง</p>
                    <p className="mt-1 font-semibold">{machine.location}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">ทีมดูแล</p>
                    <p className="mt-1 font-semibold">{machine.assignedTeam}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">ชั่วโมงเครื่อง</p>
                    <p className="mt-1 font-semibold">
                      {machine.meterHours.toLocaleString("th-TH")} ชม.
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">รอบบำรุงถัดไป</p>
                    <p className="mt-1 font-semibold">
                      {machine.nextMaintenanceHours.toLocaleString("th-TH")} ชม.
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-[11px] text-muted-foreground">
                  ตรวจล่าสุด {formatDate(machine.lastInspectionDate)} · ตรวจครั้งถัดไป{" "}
                  {formatDate(machine.nextInspectionDate)}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => openInspection(machine.id)}
                    className="min-h-10 rounded-lg border border-primary/30 bg-primary-soft text-xs font-semibold text-primary"
                  >
                    <ClipboardCheck className="mr-1.5 inline size-4" />
                    บันทึกผลตรวจ
                  </button>
                  {canManage ? (
                    <button
                      type="button"
                      onClick={() => openMaintenance(machine.id)}
                      className="min-h-10 rounded-lg bg-primary text-xs font-semibold text-primary-foreground"
                    >
                      <Wrench className="mr-1.5 inline size-4" />
                      แจ้งซ่อม
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="min-h-10 rounded-lg bg-muted text-xs font-semibold text-muted-foreground"
                    >
                      หัวหน้างานเป็นผู้แจ้งซ่อม
                    </button>
                  )}
                </div>
              </Card>
            ))}
            {machines.length === 0 ? (
              <Card className="py-8 text-center text-sm text-muted-foreground">
                ไม่พบเครื่องจักรตามตัวกรอง
              </Card>
            ) : null}
          </div>
        </section>
      ) : null}

      {view === "inspections" ? (
        <section>
          <SectionTitle
            action={
              <button
                type="button"
                onClick={() => openInspection(machines[0]?.id ?? state.machines[0]?.id)}
                className="flex items-center gap-1 text-xs font-semibold text-primary"
              >
                <Plus className="size-4" />
                ตรวจเครื่อง
              </button>
            }
          >
            ประวัติการตรวจ
          </SectionTitle>
          <div className="space-y-3">
            {inspections.map((inspection) => {
              const machine = state.machines.find((item) => item.id === inspection.machineId);
              return (
                <Card key={inspection.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">
                        {machine?.name ?? inspection.machineId}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {inspection.id} · {formatDate(inspection.inspectedAt)} ·{" "}
                        {inspection.inspectedBy}
                      </p>
                    </div>
                    <Badge
                      tone={
                        inspection.result === "Passed"
                          ? "good"
                          : inspection.result === "Needs Attention"
                            ? "warn"
                            : "bad"
                      }
                    >
                      {resultLabel[inspection.result]}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    มิเตอร์ {inspection.meterHours.toLocaleString("th-TH")} ชม. ·{" "}
                    {inspection.checklist
                      .map(
                        (item) =>
                          `${item.name}: ${item.result === "Pass" ? "ผ่าน" : item.result === "Attention" ? "ติดตาม" : "ไม่ผ่าน"}`,
                      )
                      .join(" · ")}
                  </p>
                  {inspection.notes ? (
                    <p className="mt-2 rounded-lg bg-muted/55 p-2 text-xs">{inspection.notes}</p>
                  ) : null}
                </Card>
              );
            })}
          </div>
        </section>
      ) : null}

      {view === "maintenance" ? (
        <section>
          <SectionTitle
            action={
              canManage ? (
                <button
                  type="button"
                  onClick={() =>
                    openMaintenance(machines[0]?.id ?? state.machines[0]?.id, "Preventive")
                  }
                  className="flex items-center gap-1 text-xs font-semibold text-primary"
                >
                  <Plus className="size-4" />
                  วางแผน
                </button>
              ) : undefined
            }
          >
            แผนซ่อมและบำรุง
          </SectionTitle>
          <div className="space-y-3">
            {maintenance.map((record) => {
              const machine = state.machines.find((item) => item.id === record.machineId);
              return (
                <Card key={record.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{record.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {machine?.name} ·{" "}
                        {record.type === "Repair" ? "ซ่อมแก้ไข" : "บำรุงเชิงป้องกัน"}
                      </p>
                    </div>
                    <Badge
                      tone={
                        record.status === "Completed"
                          ? "good"
                          : record.status === "In Progress"
                            ? "warn"
                            : "info"
                      }
                    >
                      {record.status === "Completed"
                        ? "เสร็จแล้ว"
                        : record.status === "In Progress"
                          ? "กำลังดำเนินการ"
                          : "วางแผนแล้ว"}
                    </Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <p>
                      <CalendarDays className="mr-1 inline size-3.5 text-primary" />
                      {formatDate(record.scheduledFor)}
                    </p>
                    <p>
                      <UsersRound className="mr-1 inline size-3.5 text-primary" />
                      {record.assignedTo}
                    </p>
                    <p className="col-span-2">
                      งบประมาณ ฿{record.estimatedCost.toLocaleString("th-TH")}
                    </p>
                  </div>
                  {canManage && record.status !== "Completed" ? (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => updateMaintenanceStatus(record.id, "In Progress")}
                        className="rounded-lg border border-border py-2 text-xs font-semibold"
                      >
                        เริ่มงานซ่อม
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          updateMaintenanceStatus(record.id, "Completed");
                          setMessage(`ปิดงาน ${record.title} และคืนสถานะเครื่องเป็นพร้อมใช้แล้ว`);
                        }}
                        className="rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground"
                      >
                        ปิดงานซ่อม
                      </button>
                    </div>
                  ) : null}
                </Card>
              );
            })}
          </div>
        </section>
      ) : null}

      {view === "roles" ? (
        <section>
          <SectionTitle>สิทธิ์และผู้รับผิดชอบ</SectionTitle>
          <div className="grid gap-3 md:grid-cols-2">
            <Responsibility
              icon={Tractor}
              title="ผู้ใช้งานเครื่อง"
              detail="ตรวจเช็กก่อนใช้ บันทึกชั่วโมงเครื่อง และหยุดใช้งานทันทีเมื่อพบความเสี่ยง"
            />
            <Responsibility
              icon={ClipboardCheck}
              title="หัวหน้าทีม"
              detail="ตรวจทานผลตรวจ แจ้งซ่อม จัดเครื่องทดแทน และอนุญาตให้นำกลับมาใช้"
            />
            <Responsibility
              icon={Wrench}
              title="ช่าง/ผู้ให้บริการ"
              detail="รับงานซ่อม บันทึกอะไหล่ ค่าใช้จ่าย และผลหลังซ่อม"
            />
            <Responsibility
              icon={ShieldCheck}
              title="ผู้จัดการทรัพย์สิน"
              detail="ดูทะเบียน รอบบำรุง งบประมาณ เอกสารรับประกัน และ audit trail ทุกฟาร์ม"
            />
          </div>
          <Card className="mt-3 text-xs leading-relaxed text-muted-foreground">
            ค่าเริ่มต้น: พนักงานบันทึกผลตรวจได้ แต่การแจ้งซ่อม ปิดงานซ่อม และคืนสถานะ “พร้อมใช้”
            เป็นสิทธิ์หัวหน้าทีมหรือผู้จัดการ องค์กรปรับสิทธิ์เพิ่มได้จากการตั้งค่า Role
          </Card>
        </section>
      ) : null}

      <Card className="border-dashed text-xs leading-relaxed text-muted-foreground">
        <Gauge className="mr-1.5 inline size-4 text-primary" />
        ข้อมูลหน้านี้เป็นข้อมูลสาธิตใน Local Storage ระบบ production ควรเชื่อม QR/Asset tag,
        ชั่วโมงเครื่องจาก IoT, ใบเบิกอะไหล่จากคลัง และเอกสารใบซ่อมใน{" "}
        <Link to="/documents" className="font-semibold text-primary">
          ศูนย์เอกสาร
        </Link>
      </Card>

      <Dialog open={inspectionOpen} onOpenChange={setInspectionOpen}>
        <DialogContent className="max-h-[88vh] w-[94vw] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>บันทึกผลตรวจเครื่องจักร</DialogTitle>
            <DialogDescription>
              ผู้ใช้งานตรวจสภาพก่อนเริ่มงาน ผลไม่ผ่านจะหยุดใช้เครื่องอัตโนมัติ
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <SearchableSelect
              label="เครื่องจักร"
              options={state.machines
                .filter((machine) => machine.farmId === activeDashboardFarm.id)
                .map((machine) => ({
                  value: machine.id,
                  label: `${machine.assetCode} · ${machine.name}`,
                }))}
              value={machineId}
              onChange={(value) => {
                setMachineId(value);
                setMeterHours(
                  String(state.machines.find((machine) => machine.id === value)?.meterHours ?? 0),
                );
              }}
              searchPlaceholder="ค้นหาชื่อหรือรหัสเครื่อง"
            />
            <label className="block text-xs text-muted-foreground">
              ผู้ตรวจ
              <input
                value={inspectedBy}
                onChange={(event) => setInspectedBy(event.target.value)}
                className="mt-1 min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm"
              />
            </label>
            <label className="block text-xs text-muted-foreground">
              ชั่วโมงเครื่อง
              <input
                type="number"
                min={selectedMachine?.meterHours ?? 0}
                value={meterHours}
                onChange={(event) => setMeterHours(event.target.value)}
                className="mt-1 min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm"
              />
            </label>
            {(
              [
                ["fluids", "น้ำมันและของเหลว"],
                ["leaks", "รอยรั่ว/สายและข้อต่อ"],
                ["controls", "ระบบควบคุมและเบรก"],
                ["safety", "อุปกรณ์นิรภัย"],
              ] as const
            ).map(([id, label]) => (
              <div key={id}>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</p>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      ["Pass", "ผ่าน"],
                      ["Attention", "ติดตาม"],
                      ["Fail", "ไม่ผ่าน"],
                    ] as const
                  ).map(([value, text]) => (
                    <button
                      type="button"
                      key={value}
                      onClick={() => setChecks((current) => ({ ...current, [id]: value }))}
                      className={`min-h-10 rounded-lg border text-xs font-semibold ${checks[id] === value ? (value === "Fail" ? "border-destructive bg-destructive text-white" : value === "Attention" ? "border-amber-500 bg-amber-500 text-white" : "border-primary bg-primary text-primary-foreground") : "border-border bg-card"}`}
                    >
                      {text}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <label className="block text-xs text-muted-foreground">
              หมายเหตุ
              <textarea
                rows={3}
                value={inspectionNotes}
                onChange={(event) => setInspectionNotes(event.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
              />
            </label>
            <button
              type="button"
              onClick={() => {
                const numericMeter = Number(meterHours);
                if (!machineId || !inspectedBy.trim() || !Number.isFinite(numericMeter)) {
                  setMessage("เลือกเครื่อง ระบุผู้ตรวจ และชั่วโมงเครื่องให้ครบ");
                  return;
                }
                const values = Object.values(checks);
                const result = values.includes("Fail")
                  ? "Failed"
                  : values.includes("Attention")
                    ? "Needs Attention"
                    : "Passed";
                const saved = addMachineInspection({
                  machineId,
                  inspectedBy: inspectedBy.trim(),
                  meterHours: numericMeter,
                  result,
                  checklist: [
                    { name: "น้ำมันและของเหลว", result: checks.fluids },
                    { name: "รอยรั่ว/สายและข้อต่อ", result: checks.leaks },
                    { name: "ระบบควบคุมและเบรก", result: checks.controls },
                    { name: "อุปกรณ์นิรภัย", result: checks.safety },
                  ],
                  notes: inspectionNotes.trim() || undefined,
                });
                if (saved.ok) {
                  setInspectionOpen(false);
                  setMessage(
                    `บันทึกผลตรวจ ${selectedMachine?.name ?? machineId} แล้ว · ผล ${resultLabel[result]}`,
                  );
                  setView("inspections");
                }
              }}
              className="min-h-11 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground"
            >
              บันทึกผลตรวจ
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={maintenanceOpen} onOpenChange={setMaintenanceOpen}>
        <DialogContent className="max-h-[88vh] w-[94vw] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>แจ้งซ่อม/วางแผนบำรุง</DialogTitle>
            <DialogDescription>
              งานที่สร้างจะอยู่ในคิวซ่อมและเปลี่ยนสถานะเครื่องตามขั้นตอน
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <SearchableSelect
              label="เครื่องจักร"
              options={state.machines
                .filter((machine) => machine.farmId === activeDashboardFarm.id)
                .map((machine) => ({
                  value: machine.id,
                  label: `${machine.assetCode} · ${machine.name}`,
                }))}
              value={machineId}
              onChange={setMachineId}
              searchPlaceholder="ค้นหาชื่อหรือรหัสเครื่อง"
            />
            <SearchableSelect
              label="ประเภทงาน"
              options={[
                { value: "Repair", label: "ซ่อมแก้ไข" },
                { value: "Preventive", label: "บำรุงรักษาเชิงป้องกัน" },
              ]}
              value={maintenanceType}
              onChange={(value) => setMaintenanceType(value as "Preventive" | "Repair")}
              searchPlaceholder="ค้นหาประเภทงาน"
            />
            <label className="block text-xs text-muted-foreground">
              ชื่องาน
              <input
                value={maintenanceTitle}
                onChange={(event) => setMaintenanceTitle(event.target.value)}
                className="mt-1 min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm"
              />
            </label>
            <label className="block text-xs text-muted-foreground">
              วันที่นัดหมาย
              <input
                type="date"
                value={scheduledFor}
                onChange={(event) => setScheduledFor(event.target.value)}
                className="mt-1 min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm"
              />
            </label>
            <label className="block text-xs text-muted-foreground">
              ผู้รับผิดชอบ/ผู้ให้บริการ
              <input
                value={assignedTo}
                onChange={(event) => setAssignedTo(event.target.value)}
                className="mt-1 min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm"
              />
            </label>
            <label className="block text-xs text-muted-foreground">
              งบประมาณโดยประมาณ
              <input
                type="number"
                min="0"
                value={estimatedCost}
                onChange={(event) => setEstimatedCost(event.target.value)}
                className="mt-1 min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm"
              />
            </label>
            <button
              type="button"
              onClick={() => {
                if (!machineId || !maintenanceTitle.trim() || !scheduledFor || !assignedTo.trim()) {
                  setMessage("กรอกเครื่องจักร ชื่องาน วันที่ และผู้รับผิดชอบให้ครบ");
                  return;
                }
                const saved = addMaintenanceRecord({
                  machineId,
                  title: maintenanceTitle.trim(),
                  type: maintenanceType,
                  scheduledFor,
                  assignedTo: assignedTo.trim(),
                  estimatedCost: Number(estimatedCost) || 0,
                });
                if (saved.ok) {
                  setMaintenanceOpen(false);
                  setMessage(`สร้างงาน “${maintenanceTitle.trim()}” แล้ว`);
                  setView("maintenance");
                }
              }}
              className="min-h-11 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground"
            >
              สร้างงานซ่อมบำรุง
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function Responsibility({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof Tractor;
  title: string;
  detail: string;
}) {
  return (
    <Card className="flex items-start gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
        <Icon className="size-5" />
      </span>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{detail}</p>
      </div>
    </Card>
  );
}
