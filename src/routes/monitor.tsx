import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell, Badge, Card, Progress, SectionTitle } from "@/components/AppShell";
import { weeklyChecks, weeklyHealth } from "@/lib/farm-data";
import { TimeRangeFilter } from "@/components/TimeRangeFilter";
import { SearchableSelect } from "@/components/SearchableSelect";
import { useDragonflyData } from "@/hooks/useDragonflyData";

export const Route = createFileRoute("/monitor")({
  head: () => ({
    meta: [
      { title: "เฝ้าระวังความสมบูรณ์พืชรายสัปดาห์ — สวนอัจฉริยะ" },
      { name: "description", content: "ติดตามคะแนนความสมบูรณ์ของพืชทุกสัปดาห์ เห็นแนวโน้มขึ้นลงและสัญญาณเตือนก่อนพืชเสียหายหนัก" },
      { property: "og:title", content: "เฝ้าระวังความสมบูรณ์พืชรายสัปดาห์ — สวนอัจฉริยะ" },
      { property: "og:description", content: "ตรวจสุขภาพพืชทุกสัปดาห์ แก้ปัญหาได้ทันก่อนสาย" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MonitorPage,
});

function MonitorPage() {
  const { state, dashboardFarms, activeDashboardFarm, setActiveDashboardFarm, recordWeeklyInspection } = useDragonflyData();
  const [cropKey, setCropKey] = useState<"durian" | "mangosteen" | "longan">("durian");
  const [statusFilter, setStatusFilter] = useState("ทั้งหมด");
  const [siteFilter, setSiteFilter] = useState("ทั้งหมด");
  const [plotFilter, setPlotFilter] = useState("ทั้งหมด");
  const [trendPeriod, setTrendPeriod] = useState("5w");
  const [saveMessage, setSaveMessage] = useState("");
  const selectedSite = state.sites.find((site) => site.id === siteFilter);
  const scopedPlots = useMemo(() => state.plots.filter((plot) => {
    const matchesFarm = (plot.farmId ?? "FARM-PRIMARY") === activeDashboardFarm.id;
    const matchesSite = siteFilter === "ทั้งหมด" || plot.siteId === siteFilter || (!plot.siteId && selectedSite?.plotPrefixes.some((prefix) => plot.id.startsWith(prefix)));
    return matchesFarm && matchesSite;
  }), [state.plots, activeDashboardFarm.id, siteFilter, selectedSite]);
  const monitorRows = useMemo(() => scopedPlots.map((plot, index) => {
    const template = weeklyChecks[index % weeklyChecks.length]!;
    const score = plot.health;
    return { ...template, id: `monitor-${plot.id}`, plot: plot.name, plotId: plot.id, score, status: score >= 80 ? "สมบูรณ์ดี" : score >= 70 ? "ควรเฝ้าระวัง" : "ต้องแก้ไข" };
  }), [scopedPlots]);
  const filteredChecks = useMemo(() => monitorRows.filter((check) =>
    (plotFilter === "ทั้งหมด" || check.plotId === plotFilter) &&
    (statusFilter === "ทั้งหมด" || check.status === statusFilter)
  ), [monitorRows, plotFilter, statusFilter]);
  const cropLabels = { durian: "ทุเรียน", mangosteen: "มังคุด", longan: "ลำไย" };
  const trendData = trendPeriod === "3w" ? weeklyHealth.slice(-3) : weeklyHealth;

  return (
    <AppShell title="เฝ้าระวังรายสัปดาห์" subtitle="เลือกดูแนวโน้มและความเสี่ยงรายแปลง">
      <SectionTitle>ขอบเขตการเฝ้าระวัง</SectionTitle>
      <Card className="space-y-3">
        <SearchableSelect label="ฟาร์ม" options={dashboardFarms.map((farm) => ({ value: farm.id, label: `${farm.name} · ${farm.location}` }))} value={activeDashboardFarm.id} onChange={(value) => { setActiveDashboardFarm(value); setSiteFilter("ทั้งหมด"); setPlotFilter("ทั้งหมด"); }} searchPlaceholder="ค้นหาชื่อฟาร์มหรือพื้นที่" />
        <SearchableSelect label="โซน" options={["ทั้งหมด", ...state.sites.filter((site) => (site.farmId ?? "FARM-PRIMARY") === activeDashboardFarm.id).map((site) => ({ value: site.id, label: `${site.code} · ${site.name}` }))]} value={siteFilter} onChange={(value) => { setSiteFilter(value); setPlotFilter("ทั้งหมด"); }} allLabel="ทุกโซนในฟาร์ม" searchPlaceholder="ค้นหารหัสหรือชื่อโซน" />
        <SearchableSelect label="แปลง" options={["ทั้งหมด", ...scopedPlots.map((plot) => ({ value: plot.id, label: `${plot.id} · ${plot.name} · ${plot.crop}` }))]} value={plotFilter} onChange={setPlotFilter} allLabel="ทุกแปลงในขอบเขต" searchPlaceholder="ค้นหารหัส ชื่อแปลง หรือพืช" />
        <p className="text-xs text-muted-foreground">กำลังเฝ้าระวัง {filteredChecks.length} จาก {monitorRows.length} แปลงในขอบเขตที่เลือก</p>
      </Card>
      <SectionTitle>แนวโน้ม 5 สัปดาห์</SectionTitle>
      <Card>
        <TimeRangeFilter value={trendPeriod} onChange={setTrendPeriod} options={[{ value: "3w", label: "3 สัปดาห์" }, { value: "5w", label: "5 สัปดาห์" }]} label="ช่วงแนวโน้ม" />
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          {(Object.keys(cropLabels) as Array<keyof typeof cropLabels>).map((key) => <button key={key} onClick={() => setCropKey(key)} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${cropKey === key ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>{cropLabels[key]}</button>)}
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <XAxis dataKey="w" tickLine={false} axisLine={false} fontSize={10} />
              <YAxis domain={[50, 100]} width={26} tickLine={false} axisLine={false} fontSize={10} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Line type="monotone" dataKey={cropKey} name={cropLabels[cropKey]} stroke="var(--color-primary)" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <SectionTitle>ผลตรวจรายแปลง</SectionTitle>
      <SearchableSelect label="สถานะผลตรวจ" options={["ทั้งหมด", "สมบูรณ์ดี", "ควรเฝ้าระวัง", "ต้องแก้ไข"]} value={statusFilter} onChange={setStatusFilter} allLabel="ทุกสถานะ" searchPlaceholder="ค้นหาสถานะผลตรวจ" />
      <div className="space-y-3">
        {filteredChecks.map((c) => (
          <Card key={c.id}>
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{c.plot}</p>
                <p className="text-xs text-muted-foreground">{c.next}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-primary">{c.score}</p>
                <p
                  className={`text-[11px] ${c.trend >= 0 ? "text-primary" : "text-destructive"}`}
                >
                  {c.trend >= 0 ? "▲" : "▼"} {Math.abs(c.trend)} จากสัปดาห์ก่อน
                </p>
              </div>
            </div>
            <div className="mt-3">
              <Progress value={c.score} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge tone={c.score >= 80 ? "good" : c.score >= 70 ? "warn" : "bad"}>{c.status}</Badge>
              {state.plots.find((plot) => plot.id === c.plotId)?.history.some((item) => item.action === "บันทึกเฝ้าระวังรายสัปดาห์" && item.note.includes(`weekly-monitor:${new Date().toISOString().slice(0, 10)}`)) ? <Badge tone="info">บันทึกแล้ววันนี้</Badge> : null}
              {c.issues.map((i) => (
                <span key={i} className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">
                  {i}
                </span>
              ))}
            </div>
          </Card>
        ))}
        {filteredChecks.length === 0 ? <Card className="py-8 text-center text-sm text-muted-foreground">ไม่มีผลตรวจในสถานะนี้</Card> : null}
      </div>

      <Card className="border-primary/30 bg-primary/10">
        <p className="text-sm font-semibold">แจ้งเตือนอัตโนมัติทุกสัปดาห์</p>
        <p className="mt-1 text-xs text-muted-foreground">
          ระบบส่งข้อความสรุปสุขภาพพืชทุกวันจันทร์ 07:00 น. พร้อมเตือนทันทีเมื่อคะแนนลดลงเกิน 5 จุด
        </p>
        <button type="button" disabled={!filteredChecks.length} onClick={() => { const result = recordWeeklyInspection(filteredChecks.map((check) => ({ plotId: check.plotId, score: check.score, issues: check.issues }))); setSaveMessage(result.saved ? `บันทึกผลตรวจ ${result.saved} แปลงลงประวัติแปลงแล้ว${result.skipped ? ` · ข้าม ${result.skipped} แปลงที่บันทึกวันนี้แล้ว` : ""}` : "แปลงในขอบเขตนี้บันทึกผลตรวจวันนี้แล้ว"); }} className="mt-3 w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50">
          บันทึกผลตรวจสัปดาห์นี้
        </button>
        {saveMessage ? <p className="mt-3 rounded-lg bg-card/80 px-3 py-2 text-xs font-medium text-primary">{saveMessage}</p> : null}
      </Card>
    </AppShell>
  );
}
