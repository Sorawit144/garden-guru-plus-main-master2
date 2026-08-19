import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, ArrowRight, BellRing, CheckCircle2, ExternalLink, Gauge, MapPin, Plus, RadioTower, ShoppingCart, Trash2, TriangleAlert, Wifi, Wrench, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell, Badge, Card, SectionTitle } from "@/components/AppShell";
import { useDragonflyData } from "@/hooks/useDragonflyData";
import { toast } from "sonner";
import { SearchableSelect } from "@/components/SearchableSelect";

const iotOrderUrl = import.meta.env.VITE_IOT_ORDER_URL ?? "https://easyplants.example/iot-order";

export const Route = createFileRoute("/iot")({
  head: () => ({
    meta: [
      { title: "IoT — EasyPlants" },
      { name: "description", content: "IoT devices, simulator, rules and alerts without real hardware in Demo Mode" },
    ],
  }),
  component: IoTPage,
});

function IoTPage() {
  const { isDemoMode, state, dashboardFarms, activeDashboardFarm, setActiveDashboardFarm, updateDevice, addTask, addIoTRule, updateIoTRule, deleteIoTRule } = useDragonflyData();
  const [siteFilter, setSiteFilter] = useState("ทั้งหมด");
  const [plotFilter, setPlotFilter] = useState("ทั้งหมด");
  const [statusFilter, setStatusFilter] = useState("ทั้งหมด");
  const [typeFilter, setTypeFilter] = useState("ทั้งหมด");
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [ruleName, setRuleName] = useState("");
  const [ruleDeviceId, setRuleDeviceId] = useState("");
  const [ruleOperator, setRuleOperator] = useState<"<" | ">">("<");
  const [ruleThreshold, setRuleThreshold] = useState("30");
  const [ruleSeverity, setRuleSeverity] = useState<"Info" | "Warning" | "Critical">("Warning");
  const [ruleRecipients, setRuleRecipients] = useState("หัวหน้าสวน");
  const soilDevice = state.iotDevices.find((device) => device.id === "SM-D01-001");
  const selectedSite = state.sites.find((site) => site.id === siteFilter);
  const scopedPlots = useMemo(() => state.plots.filter((plot) => {
    const matchesFarm = (plot.farmId ?? "FARM-PRIMARY") === activeDashboardFarm.id;
    const matchesSite = siteFilter === "ทั้งหมด" || plot.siteId === siteFilter || (!plot.siteId && selectedSite?.plotPrefixes.some((prefix) => plot.id.startsWith(prefix)));
    return matchesFarm && matchesSite;
  }), [state.plots, activeDashboardFarm.id, siteFilter, selectedSite]);
  const plots = useMemo(() => ["ทั้งหมด", "Farm", ...scopedPlots.map((plot) => ({ value: plot.id, label: `${plot.id} · ${plot.name} · ${plot.crop}` }))], [scopedPlots]);
  const statuses = useMemo(() => ["ทั้งหมด", ...Array.from(new Set(state.iotDevices.map((device) => device.status)))], [state.iotDevices]);
  const types = useMemo(() => ["ทั้งหมด", ...Array.from(new Set(state.iotDevices.map((device) => device.type)))], [state.iotDevices]);
  const filteredDevices = state.iotDevices.filter((device) =>
    (plotFilter === "ทั้งหมด" || device.plot === plotFilter || (plotFilter === "Farm" && device.plot === "Farm")) &&
    (statusFilter === "ทั้งหมด" || device.status === statusFilter) &&
    (typeFilter === "ทั้งหมด" || device.type === typeFilter)
  );
  const selectedDevice = state.iotDevices.find((device) => device.id === selectedDeviceId) ?? filteredDevices[0] ?? state.iotDevices[0];
  const selectedUsage = selectedDevice ? getDeviceUsage(selectedDevice.type) : undefined;
  const onlineCount = filteredDevices.filter((device) => device.status === "Online").length;
  const needsAttention = filteredDevices.filter((device) => device.status !== "Online").length + state.iotAlerts.length;

  return (
    <AppShell title="ศูนย์ควบคุม IoT" subtitle={`${activeDashboardFarm.name} · อุปกรณ์ ข้อมูล และการตัดสินใจหน้างาน`}>
      <section className="rounded-lg bg-primary px-5 py-5 text-primary-foreground">
        <div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex items-center gap-2"><RadioTower className="size-5" /><p className="text-sm font-semibold">สถานะระบบเกษตรอัจฉริยะ</p></div><p className="mt-2 text-xs leading-relaxed text-primary-foreground/80">ติดตามค่าหน้างาน เปลี่ยนเป็นกฎแจ้งเตือน และส่งต่อเป็นงานให้ทีมตรวจสอบ</p></div><span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold">{isDemoMode ? "ข้อมูลจำลอง" : "เชื่อมต่อระบบจริง"}</span></div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center"><div className="rounded-lg bg-white/15 p-2"><p className="text-lg font-bold">{onlineCount}</p><p className="text-[10px] text-primary-foreground/80">เชื่อมต่อแล้ว</p></div><div className="rounded-lg bg-white/15 p-2"><p className="text-lg font-bold">{needsAttention}</p><p className="text-[10px] text-primary-foreground/80">ต้องติดตาม</p></div><div className="rounded-lg bg-white/15 p-2"><p className="text-lg font-bold">{scopedPlots.length}</p><p className="text-[10px] text-primary-foreground/80">แปลงในขอบเขต</p></div></div>
      </section>

      <SectionTitle>ตัวกรองอุปกรณ์</SectionTitle>
      <Card className="space-y-3">
        <SearchableSelect label="ฟาร์ม" options={dashboardFarms.map((farm) => ({ value: farm.id, label: `${farm.name} · ${farm.location}` }))} value={activeDashboardFarm.id} onChange={(value) => { setActiveDashboardFarm(value); setSiteFilter("ทั้งหมด"); setPlotFilter("ทั้งหมด"); }} searchPlaceholder="ค้นหาชื่อฟาร์มหรือพื้นที่" />
        <SearchableSelect label="โซน" options={["ทั้งหมด", ...state.sites.filter((site) => (site.farmId ?? "FARM-PRIMARY") === activeDashboardFarm.id).map((site) => ({ value: site.id, label: `${site.code} · ${site.name}` }))]} value={siteFilter} onChange={(value) => { setSiteFilter(value); setPlotFilter("ทั้งหมด"); }} allLabel="ทุกโซนในฟาร์ม" searchPlaceholder="ค้นหารหัสหรือชื่อโซน" />
        <SearchableSelect label="แปลง/จุดติดตั้ง" options={plots} value={plotFilter} onChange={setPlotFilter} allLabel="ทุกแปลงและจุดกลาง" searchPlaceholder="ค้นหารหัส ชื่อแปลง หรือจุดติดตั้ง" />
        <SearchableSelect label="การเชื่อมต่อ" options={statuses.map((status) => status === "ทั้งหมด" ? status : ({ value: status, label: status === "Online" ? "เชื่อมต่อแล้ว" : "ออฟไลน์" }))} value={statusFilter} onChange={setStatusFilter} allLabel="ทุกสถานะ" searchPlaceholder="ค้นหาสถานะการเชื่อมต่อ" />
        <SearchableSelect label="ชนิดอุปกรณ์" options={types} value={typeFilter} onChange={setTypeFilter} allLabel="ทุกชนิด" searchPlaceholder="ค้นหาชนิดอุปกรณ์" />
        <p className="text-xs text-muted-foreground">กำลังแสดง {filteredDevices.length} จาก {state.iotDevices.length} อุปกรณ์</p>
      </Card>

      <SectionTitle>อุปกรณ์ IoT สำหรับสวนของคุณ</SectionTitle>
      <Card className="border-primary/30 bg-primary-soft/45"><div className="flex items-start gap-3"><ShoppingCart className="mt-0.5 size-5 shrink-0 text-primary" /><div className="min-w-0 flex-1"><p className="text-sm font-semibold">ขอคำแนะนำและสั่งซื้ออุปกรณ์</p><p className="mt-1 text-xs text-muted-foreground">เลือกชุดเซนเซอร์ให้เหมาะกับพืช พื้นที่ ระบบน้ำ และงบประมาณ พร้อมให้ทีมช่วยวางจุดติดตั้ง</p><a href={iotOrderUrl} target="_blank" rel="noreferrer" className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-xs font-semibold text-primary-foreground">ติดต่อเพื่อสั่งซื้ออุปกรณ์ <ExternalLink className="size-3.5" /></a><p className="mt-2 text-[11px] text-muted-foreground">{isDemoMode ? "Demo Mode: ลิงก์ตัวอย่าง ตั้งค่าปลายทางจริงได้ด้วย VITE_IOT_ORDER_URL" : "ลิงก์จะเปิดหน้าสั่งซื้อภายนอก"}</p></div></div></Card>
      <Link to="/iot-guide" className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary/30 bg-card py-3 text-xs font-semibold text-primary"><Wrench className="size-4" />คู่มือใช้งานและบำรุงรักษาอุปกรณ์ IoT</Link>

      <SectionTitle>อุปกรณ์ในขอบเขตที่เลือก</SectionTitle>
      <div className="space-y-3">
        {state.iotDevices.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-sm text-muted-foreground">Persona นี้ยังไม่มี IoT device</p>
          </Card>
        ) : (
          filteredDevices.map((device) => (
            <button key={device.id} onClick={() => setSelectedDeviceId(device.id)} className={`block w-full text-left ${selectedDevice?.id === device.id ? "" : ""}`}>
            <Card className={selectedDevice?.id === device.id ? "border-primary/50 bg-primary-soft/30" : ""}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{device.name}</p>
                  <p className="text-xs text-muted-foreground">{device.id} · {getDeviceUsage(device.type).title} · {device.plot}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    ติดต่อครั้งล่าสุด {device.lastCommunication}
                    {device.battery ? ` · แบตเตอรี่ ${device.battery}%` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <Badge tone={device.status === "Online" ? "good" : "bad"}>{device.status === "Online" ? "เชื่อมต่อแล้ว" : "ออฟไลน์"}</Badge>
                  <p className="mt-2 text-sm font-bold text-primary">{device.latestReading}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-[11px]"><span className="text-muted-foreground">แตะเพื่อดูคู่มือและข้อมูลที่เชื่อมต่อ</span><ArrowRight className="size-3.5 text-primary" /></div>
            </Card>
            </button>
          ))
        )}
        {state.iotDevices.length > 0 && filteredDevices.length === 0 ? <Card className="py-8 text-center text-sm text-muted-foreground">ไม่พบอุปกรณ์ที่ตรงกับตัวกรอง</Card> : null}
      </div>

      {selectedDevice && selectedUsage ? <>
        <SectionTitle>รายละเอียดอุปกรณ์ที่เลือก</SectionTitle>
        <Card className="space-y-4">
          <div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary"><Gauge className="size-5" /></span><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{selectedUsage.title}</p><p className="mt-1 text-xs text-muted-foreground">{selectedDevice.name} · จุดติดตั้ง {selectedDevice.plot} · รหัส {selectedDevice.id}</p></div><Badge tone={selectedDevice.status === "Online" ? "good" : "bad"}>{selectedDevice.status === "Online" ? "พร้อมใช้งาน" : "ต้องตรวจสอบ"}</Badge></div>
          <div className="grid grid-cols-2 gap-2"><div className="rounded-lg bg-muted/60 p-3"><p className="text-[11px] text-muted-foreground">ค่าล่าสุด</p><p className="mt-1 text-base font-bold text-primary">{selectedDevice.latestReading}</p></div><div className="rounded-lg bg-muted/60 p-3"><p className="text-[11px] text-muted-foreground">สื่อสารล่าสุด</p><p className="mt-1 text-xs font-semibold">{selectedDevice.lastCommunication}</p></div></div>
          <div><p className="text-xs font-semibold">ข้อมูลนี้ใช้ทำอะไร</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{selectedUsage.description}</p><div className="mt-2 flex flex-wrap gap-1.5">{selectedUsage.features.map((feature) => <span key={feature} className="rounded-full bg-primary-soft px-2 py-1 text-[10px] font-medium text-primary">{feature}</span>)}</div></div>
          <div className="border-t border-border pt-3"><p className="flex items-center gap-1.5 text-xs font-semibold"><Wrench className="size-3.5 text-primary" />วิธีติดตั้งและเริ่มใช้งาน</p><ol className="mt-2 space-y-2">{selectedUsage.installSteps.map((step, index) => <li key={step} className="flex gap-2 text-xs text-muted-foreground"><span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-foreground">{index + 1}</span>{step}</li>)}</ol></div>
          <div className="border-t border-border pt-3"><p className="flex items-center gap-1.5 text-xs font-semibold"><CheckCircle2 className="size-3.5 text-primary" />การใช้งานประจำ</p><p className="mt-1 text-xs text-muted-foreground">{selectedUsage.routine}</p><p className="mt-2 flex gap-1.5 text-xs text-primary"><TriangleAlert className="size-3.5 shrink-0" />{selectedUsage.actionWhenAlert}</p></div>
        </Card>
      </> : null}

      <SectionTitle>ข้อมูลอุปกรณ์จะช่วยฟีเจอร์ไหน</SectionTitle>
      <Card className="space-y-3">{["Soil moisture", "Weather station", "Flow meter", "Valve"].map((type) => { const usage = getDeviceUsage(type); return <div key={type} className="border-b border-border pb-3 last:border-0 last:pb-0"><p className="text-xs font-semibold">{usage.title}</p><p className="mt-1 text-[11px] text-muted-foreground">{usage.description}</p><p className="mt-1.5 text-[11px] font-medium text-primary">ส่งข้อมูลไปยัง: {usage.features.join(" · ")}</p></div>; })}</Card>

      {isDemoMode && soilDevice ? (
        <>
          <SectionTitle>IoT Simulator</SectionTitle>
          <Card className="space-y-3 border-primary/30 bg-primary-soft/50">
            <div className="flex items-center gap-2">
              <Activity className="size-5 text-primary" />
              <div>
                <p className="text-sm font-semibold">Soil Moisture D01</p>
                <p className="text-xs text-muted-foreground">Current value {soilDevice.latestReading}</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                ["Normal", 34, "Online"],
                ["Low", 29, "Online"],
                ["Critical", 21, "Online"],
                ["Offline", soilDevice.numericValue ?? 0, "Offline"],
              ].map(([label, value, status]) => (
                <button
                  key={label}
                  onClick={() =>
                    updateDevice(soilDevice.id, {
                      numericValue: Number(value),
                      latestReading: status === "Offline" ? "No signal" : `${value}%`,
                      status: status as "Online" | "Offline",
                      lastCommunication: status === "Offline" ? "18 minutes ago" : "just now",
                    })
                  }
                  className="rounded-xl border border-primary/20 bg-card px-2 py-2 text-xs font-semibold"
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              การกดปุ่มนี้เปลี่ยนเฉพาะข้อมูลจำลอง แล้วระบบจะประเมินกฎและสร้างการแจ้งเตือนใหม่ทันที
            </p>
          </Card>
        </>
      ) : null}

      <div className="flex items-center justify-between gap-3"><SectionTitle>กฎแจ้งเตือน</SectionTitle><button type="button" onClick={() => { setShowRuleForm((current) => !current); setRuleDeviceId(selectedDevice?.id ?? state.iotDevices[0]?.id ?? ""); }} className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground"><Plus className="size-3.5" />ตั้งกฎ</button></div>
      {showRuleForm ? <Card className="space-y-3 border-primary/30 bg-primary-soft/35">
        <div><p className="text-sm font-semibold">ตั้งกฎแจ้งเตือนใหม่</p><p className="mt-1 text-xs text-muted-foreground">ระบบจะประเมินทุกครั้งที่อุปกรณ์ส่งค่าใหม่ หรือเมื่อเปลี่ยนข้อมูลจำลอง</p></div>
        <label className="block text-xs font-medium text-muted-foreground">ชื่อกฎ<input value={ruleName} onChange={(event) => setRuleName(event.target.value)} placeholder="เช่น ความชื้นดินต่ำในแปลง D01" className="mt-1.5 min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none focus:border-primary" /></label>
        <SearchableSelect label="อุปกรณ์ที่ใช้ตรวจ" options={state.iotDevices.filter((device) => device.numericValue != null).map((device) => ({ value: device.id, label: `${device.name} · ${device.plot} · ${device.latestReading}` }))} value={ruleDeviceId} onChange={setRuleDeviceId} searchPlaceholder="ค้นหาอุปกรณ์หรือแปลง" />
        <div className="grid grid-cols-2 gap-3"><SearchableSelect label="เงื่อนไข" options={[{ value: "<", label: "ต่ำกว่าเกณฑ์" }, { value: ">", label: "สูงกว่าเกณฑ์" }]} value={ruleOperator} onChange={(value) => setRuleOperator(value as "<" | ">") } searchPlaceholder="เลือกเงื่อนไข" /><label className="block text-xs font-medium text-muted-foreground">ค่าเกณฑ์<input inputMode="decimal" value={ruleThreshold} onChange={(event) => setRuleThreshold(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none focus:border-primary" /></label></div>
        <SearchableSelect label="ระดับการแจ้งเตือน" options={[{ value: "Info", label: "ข้อมูลเพื่อทราบ" }, { value: "Warning", label: "ควรตรวจสอบ" }, { value: "Critical", label: "เร่งด่วน" }]} value={ruleSeverity} onChange={(value) => setRuleSeverity(value as "Info" | "Warning" | "Critical")} searchPlaceholder="เลือกระดับ" />
        <label className="block text-xs font-medium text-muted-foreground">ผู้รับการแจ้งเตือน<input value={ruleRecipients} onChange={(event) => setRuleRecipients(event.target.value)} placeholder="เช่น หัวหน้าสวน, ทีมให้น้ำ" className="mt-1.5 min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none focus:border-primary" /></label>
        <button type="button" onClick={() => { const threshold = Number(ruleThreshold); const device = state.iotDevices.find((item) => item.id === ruleDeviceId); if (!ruleName.trim() || !device || !Number.isFinite(threshold)) { toast.error("กรอกชื่อกฎ เลือกอุปกรณ์ และระบุค่าเกณฑ์ให้ครบ"); return; } addIoTRule({ name: ruleName.trim(), deviceId: device.id, threshold, operator: ruleOperator, action: "สร้างงานตรวจหน้างาน", enabled: true, severity: ruleSeverity, recipients: ruleRecipients.trim() || "หัวหน้าสวน" }); setShowRuleForm(false); setRuleName(""); toast.success("บันทึกกฎและประเมิน Alert แล้ว"); }} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground"><BellRing className="size-4" />บันทึกกฎแจ้งเตือน</button>
      </Card> : null}
      <Card className="space-y-3">
        {state.iotRules.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground">ยังไม่มีกฎ IoT สำหรับอุปกรณ์ชุดนี้</p>
        ) : (
          state.iotRules.map((rule) => (
            <div key={rule.id} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-semibold">{rule.name}</p><p className="mt-1 text-[11px] text-muted-foreground">{state.iotDevices.find((device) => device.id === rule.deviceId)?.name ?? rule.deviceId} · ค่า {rule.operator} {rule.threshold} → {rule.action}</p><p className="mt-1 text-[11px] text-muted-foreground">แจ้ง: {rule.recipients ?? "หัวหน้าสวน"}</p></div><div className="flex shrink-0 items-center gap-2"><Badge tone={rule.severity === "Critical" ? "bad" : rule.severity === "Info" ? "neutral" : "warn"}>{rule.severity === "Critical" ? "เร่งด่วน" : rule.severity === "Info" ? "เพื่อทราบ" : "ควรตรวจ"}</Badge><button type="button" aria-label={rule.enabled === false ? "เปิดใช้งานกฎ" : "ปิดใช้งานกฎ"} onClick={() => updateIoTRule(rule.id, { enabled: rule.enabled === false })} className={`h-6 w-10 rounded-full p-0.5 transition ${rule.enabled === false ? "bg-muted" : "bg-primary"}`}><span className={`block size-5 rounded-full bg-card shadow transition ${rule.enabled === false ? "translate-x-0" : "translate-x-4"}`} /></button><button type="button" aria-label="ลบกฎ" onClick={() => { deleteIoTRule(rule.id); toast.success("ลบกฎแจ้งเตือนแล้ว"); }} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button></div></div>
            </div>
          ))
        )}
      </Card>

      <SectionTitle>การแจ้งเตือนที่กำลังเกิดขึ้น</SectionTitle>
      {state.iotAlerts.length === 0 ? (
        <Card className="text-center py-8">
          <p className="text-sm text-muted-foreground">ยังไม่มีการแจ้งเตือน IoT ที่ต้องดำเนินการ</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {state.iotAlerts.map((alert) => (
            <Card key={alert.id} className={alert.severity === "Critical" ? "border-destructive/30 bg-destructive/10" : "border-amber-500/30 bg-amber-500/10"}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-destructive">{alert.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {alert.plot} · ค่าปัจจุบัน {alert.current} · เกณฑ์ {alert.target}
                  </p>
                </div>
                <Badge tone={alert.severity === "Critical" ? "bad" : "warn"}>{alert.severity === "Critical" ? "เร่งด่วน" : "ต้องตรวจ"}</Badge>
              </div>
              <button
                onClick={() => {
                  addTask({
                    title: `ตรวจจาก IoT: ${alert.title}`,
                    plot: alert.plot,
                    type: "Irrigation",
                    status: "Planned",
                  });
                  toast.success(`สร้างงานตรวจ ${alert.plot} แล้ว`);
                }}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground"
              >
                <Zap className="size-4" /> สร้างงานตรวจหน้างาน
              </button>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}

function getDeviceUsage(type: string) {
  const usage: Record<string, { title: string; description: string; features: string[]; installSteps: string[]; routine: string; actionWhenAlert: string }> = {
    "Soil moisture": { title: "เซนเซอร์ความชื้นดิน", description: "วัดความชื้นในดินบริเวณรากเพื่อดูว่าควรให้น้ำหรือรอดูฝน", features: ["คำแนะนำ AI", "กฎแจ้งเตือน", "งานให้น้ำ", "สุขภาพแปลง"], installSteps: ["เลือกจุดแทนสภาพดินของแปลง หลีกเลี่ยงหัวน้ำและทางน้ำไหล", "ฝังหัววัดที่ระดับรากพืชตามคู่มือของพืชและเซนเซอร์", "จับคู่เกตเวย์ ตั้งชื่ออุปกรณ์ และกำหนดเกณฑ์ความชื้นร่วมกับผู้ดูแลสวน"], routine: "ตรวจค่าช่วงเช้าและหลังให้น้ำ เปรียบเทียบกับสภาพดินจริงใน 1-2 สัปดาห์แรกเพื่อปรับเกณฑ์", actionWhenAlert: "เมื่อค่าต่ำกว่ากำหนด ระบบควรสร้างคำแนะนำและ Task ตรวจความชื้นก่อนเริ่มให้น้ำ" },
    "Weather station": { title: "สถานีอากาศ", description: "เก็บอุณหภูมิ ความชื้น ลม และฝนในตำแหน่งจริงของสวน", features: ["สภาพอากาศ", "ความเสี่ยงโรค", "ปฏิทินงาน", "น้ำท่วม/ภัยแล้ง"], installSteps: ["เลือกพื้นที่เปิดโล่ง ไม่ชิดอาคารหรือต้นไม้ใหญ่", "ยึดเสาให้ได้ระดับและต่อแผงพลังงานตามคู่มือ", "เชื่อมต่อเครือข่าย ตรวจเวลาของอุปกรณ์ และตั้งรอบส่งข้อมูล"], routine: "ตรวจความสะอาดของถ้วยวัดฝนและแผงพลังงานทุกเดือน พร้อมเทียบค่ากับสภาพจริงหลังฝนตก", actionWhenAlert: "ใช้ค่าฝนและความชื้นเป็นเงื่อนไขเลื่อนฉีดพ่น สร้างงานตรวจโรค หรือเตือนความเสี่ยงน้ำท่วม" },
    "Flow meter": { title: "มิเตอร์วัดการไหลของน้ำ", description: "ตรวจปริมาณการไหลและความผิดปกติของน้ำในระบบ", features: ["แจ้งเตือนระบบน้ำ", "งานบำรุงรักษา", "ต้นทุนพลังงาน/น้ำ"], installSteps: ["ติดตั้งตามทิศทางลูกศรบนท่อและเว้นระยะท่อตรงตามคู่มือ", "ทดสอบการรั่วและบันทึกค่าอัตราการไหลมาตรฐานของแต่ละโซน", "ตั้งเกณฑ์ต่ำหรือสูงผิดปกติเพื่อแจ้งเตือน"], routine: "เปรียบเทียบอัตราการไหลกับรอบให้น้ำปกติ และตรวจตะแกรงกรองเมื่อค่าไหลลดลง", actionWhenAlert: "เมื่อการไหลผิดปกติ ให้สร้างงานตรวจปั๊ม วาล์ว ท่อรั่ว และไส้กรองก่อนสั่งน้ำเพิ่ม" },
    Valve: { title: "วาล์วควบคุมน้ำ", description: "แสดงสถานะและรองรับการสั่งเปิดปิดเมื่อเชื่อมระบบอัตโนมัติ", features: ["การให้น้ำอัตโนมัติ", "งานให้น้ำ", "บันทึกการใช้น้ำ"], installSteps: ["ติดตั้งในกล่องกันน้ำและติดป้ายโซนให้ตรงกับแผนผังสวน", "จับคู่ตัวควบคุม ตรวจสถานะเปิดปิด และทดสอบโหมดสั่งงานด้วยคน", "ตั้ง rule อัตโนมัติหลังยืนยันข้อจำกัดความปลอดภัยและสิทธิ์ผู้สั่งงาน"], routine: "ตรวจการตอบสนองของวาล์วและสภาพสายไฟทุกเดือน บันทึกการทดสอบไว้กับงานบำรุงรักษา", actionWhenAlert: "หากวาล์วไม่ตอบสนอง ให้หยุด automation และสร้างงานตรวจภาคสนามก่อนสั่งซ้ำ" },
  };
  return usage[type] ?? { title: type, description: "อุปกรณ์ส่งค่าหน้างานเข้าสู่ระบบ", features: ["แดชบอร์ด", "การแจ้งเตือน"], installSteps: ["ติดตั้งตามคู่มือผู้ผลิต", "เชื่อมต่อเกตเวย์", "ตั้งชื่อและตรวจค่าครั้งแรก"], routine: "ตรวจสถานะการสื่อสารและค่าที่ส่งเข้าระบบสม่ำเสมอ", actionWhenAlert: "สร้างงานตรวจอุปกรณ์เมื่อพบค่าหรือการเชื่อมต่อผิดปกติ" };
}
