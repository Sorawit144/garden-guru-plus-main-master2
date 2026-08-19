import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, Badge, Card, SectionTitle } from "@/components/AppShell";
import { recommendations } from "@/lib/farm-data";
import { useDragonflyData } from "@/hooks/useDragonflyData";
import { SearchableSelect } from "@/components/SearchableSelect";

export const Route = createFileRoute("/recommend")({
  head: () => ({
    meta: [
      { title: "คำแนะนำอัจฉริยะ — สวนอัจฉริยะ" },
      { name: "description", content: "AI แนะนำว่าวันนี้ควรรดน้ำ ใส่ปุ๋ย ฉีดยา หรือเก็บเกี่ยวหรือยัง" },
      { property: "og:title", content: "คำแนะนำอัจฉริยะ — สวนอัจฉริยะ" },
      { property: "og:description", content: "คำแนะนำการดูแลสวนรายวันจากข้อมูลอากาศและสภาพแปลง" },
    ],
  }),
  component: RecommendPage,
});

function RecommendPage() {
  const dragonfly = useDragonflyData();
  const [farmFilter, setFarmFilter] = useState(dragonfly.activeDashboardFarm.id);
  const [siteFilter, setSiteFilter] = useState("ทั้งหมด");
  const [plotFilter, setPlotFilter] = useState("ทั้งหมด");

  const demoRecommendations = dragonfly.state.recommendations;

  const recommendationRows = useMemo(() => demoRecommendations.map((item) => {
    const plot = dragonfly.state.plots.find((candidate) => candidate.id === item.plot || candidate.name === item.plot);
    const productionPlan = dragonfly.state.productionPlans.find((plan) => plan.plot === item.plot || plan.plot === plot?.id);
    return {
      ...item,
      farmId: plot?.farmId ?? "FARM-PRIMARY",
      siteId: plot?.siteId,
      crop: plot?.crop ?? productionPlan?.crop ?? "ไม่ระบุพืช",
      stage: productionPlan?.stage ?? "ไม่ระบุระยะการผลิต",
      category: getRecommendationCategory(item.title, item.action),
    };
  }), [demoRecommendations, dragonfly.state.plots, dragonfly.state.productionPlans]);

  const scopedSites = useMemo(
    () => dragonfly.state.sites.filter((site) => farmFilter === "ทั้งหมด" || (site.farmId ?? "FARM-PRIMARY") === farmFilter),
    [dragonfly.state.sites, farmFilter]
  );
  const scopedPlots = useMemo(
    () => dragonfly.state.plots.filter((plot) =>
      (farmFilter === "ทั้งหมด" || (plot.farmId ?? "FARM-PRIMARY") === farmFilter) &&
      (siteFilter === "ทั้งหมด" || plot.siteId === siteFilter)
    ),
    [dragonfly.state.plots, farmFilter, siteFilter]
  );

  const filteredRecommendations = recommendationRows.filter((item) => {
    const farmOk = farmFilter === "ทั้งหมด" || item.farmId === farmFilter;
    const siteOk = siteFilter === "ทั้งหมด" || item.siteId === siteFilter;
    const plotOk = plotFilter === "ทั้งหมด" || item.plot === plotFilter;
    return farmOk && siteOk && plotOk;
  });

  const sourceTone = (sourceType: string): "good" | "warn" | "info" | "muted" => {
    if (sourceType === "user-data" || sourceType === "system") return "good";
    if (sourceType === "ai-estimate") return "warn";
    if (sourceType === "demo") return "info";
    return "muted";
  };

  const sourceLabel = (sourceType: string) => {
    const labels: Record<string, string> = {
      "ai-estimate": "AI ประมาณการ",
      demo: "ข้อมูลจำลอง",
      system: "ระบบ",
      "user-data": "ผู้ใช้บันทึก",
      external: "ภายนอก",
    };
    return labels[sourceType] ?? sourceType;
  };

  return (
    <AppShell
      title="คำแนะนำอัจฉริยะ"
      subtitle={
        dragonfly.isDemoMode
          ? "Demo Mode: รวมข้อมูลอากาศ IoT ภาพดาวเทียม และระยะพืชจำลอง"
          : "วิเคราะห์จากอากาศ ความชื้นดิน และอายุพืช"
      }
    >
      {dragonfly.isDemoMode ? (
        <>
          <SectionTitle>ขอบเขตคำแนะนำ</SectionTitle>
          <Card className="space-y-3" data-tour="recommendation-filters">
            <p className="text-xs text-muted-foreground">เลือกพื้นที่ก่อน เพื่อให้คำแนะนำอิงสวน โซน และแปลงเดียวกัน</p>
            <SearchableSelect
              label="สวน/ฟาร์ม"
              options={dragonfly.dashboardFarms.map((farm) => ({ value: farm.id, label: `${farm.name} · ${farm.location}` }))}
              value={farmFilter}
              onChange={(value) => { setFarmFilter(value); setSiteFilter("ทั้งหมด"); setPlotFilter("ทั้งหมด"); }}
              allLabel="ทุกสวนที่เข้าถึงได้"
              searchPlaceholder="ค้นหาชื่อสวนหรือพื้นที่"
            />
            <SearchableSelect
              label="โซน"
              options={["ทั้งหมด", ...scopedSites.map((site) => ({ value: site.id, label: `${site.code} · ${site.name}` }))]}
              value={siteFilter}
              onChange={(value) => { setSiteFilter(value); setPlotFilter("ทั้งหมด"); }}
              allLabel="ทุกโซนในสวน"
              searchPlaceholder="ค้นหารหัสหรือชื่อโซน"
            />
            <SearchableSelect
              label="แปลง"
              options={["ทั้งหมด", ...scopedPlots.map((plot) => ({ value: plot.id, label: `${plot.id} · ${plot.name} · ${plot.crop}` }))]}
              value={plotFilter}
              onChange={(value) => setPlotFilter(value)}
              allLabel="ทุกแปลงในขอบเขต"
              searchPlaceholder="ค้นหารหัส ชื่อแปลง หรือพืช"
            />
            <p className="text-xs text-muted-foreground">กำลังแสดง {filteredRecommendations.length} จาก {recommendationRows.length} คำแนะนำ</p>
          </Card>
        </>
      ) : null}

      <SectionTitle>สรุปสำหรับวันนี้</SectionTitle>
      {dragonfly.isDemoMode
        ? filteredRecommendations.map((r) => (
            <Card key={r.id}>
              <div className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-muted text-xl">✨</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{r.title}</p>
                    <Badge tone={sourceTone(r.sourceType)}>{sourceLabel(r.sourceType)}</Badge>
                  </div>
                  <p className="mt-1 text-[11px] font-semibold text-primary">{r.plot} · {r.crop} · {r.category}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{r.reason}</p>
                  <p className="mt-2 text-xs font-semibold text-primary">แนะนำ: {r.action}</p>
                  <p className="mt-1.5 rounded-xl bg-muted/60 px-3 py-1.5 text-[11px] text-muted-foreground">
                    แหล่งที่มา: {r.sourceLabel} · ความมั่นใจ {r.confidence}
                    {r.generatedAt ? ` · สร้าง ${new Date(`${r.generatedAt}T00:00:00`).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}` : ""}
                  </p>
                </div>
              </div>
            </Card>
          ))
        : recommendations.map((r) => (
            <Card key={r.id}>
              <div className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-muted text-xl">{r.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{r.title}</p>
                    <Badge tone={r.tone as "good" | "warn" | "info"}>{r.answer}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{r.reason}</p>
                </div>
              </div>
            </Card>
          ))}

      <SectionTitle>ปัจจัยที่ระบบใช้ประกอบคำแนะนำ</SectionTitle>
      <Card className="grid grid-cols-2 gap-3">
        {(dragonfly.isDemoMode
          ? [
              { l: "ความชื้นดิน", v: dragonfly.state.iotDevices.find((d) => d.id === "SM-D01-001")?.latestReading ?? "N/A" },
              { l: "โอกาสฝน", v: `${dragonfly.state.weather.rainChance}%` },
              { l: "ระยะการผลิต", v: translateStage(dragonfly.state.productionPlans[0]?.stage ?? "ยังไม่ระบุ") },
              { l: "การเปลี่ยนแปลง NDVI", v: `${dragonfly.state.satellite.changePercent}%` },
              { l: "การแจ้งเตือน IoT ที่ยังเปิดอยู่", v: `${dragonfly.state.iotAlerts.length}` },
              { l: "แหล่งข้อมูล", v: "ข้อมูลจำลอง" },
            ]
          : [
              { l: "ความชื้นดิน", v: "68%" },
              { l: "โอกาสฝน 6 ชม.", v: "65%" },
              { l: "อุณหภูมิสูงสุด", v: "34°C" },
              { l: "ความเร็วลม", v: "12 กม./ชม." },
              { l: "รอบปุ๋ยล่าสุด", v: "21 วัน" },
              { l: "อายุผลทุเรียน", v: "108 วัน" },
            ]
        ).map((f) => (
          <div key={f.l} className="rounded-xl bg-muted/60 p-3">
            <p className="text-[11px] text-muted-foreground">{f.l}</p>
            <p className="text-sm font-semibold">{f.v}</p>
          </div>
        ))}
      </Card>

      {dragonfly.isDemoMode && filteredRecommendations.length === 0 ? (
        <Card className="py-8 text-center">
          <p className="text-sm text-muted-foreground">ไม่มีคำแนะนำที่ตรงกับขอบเขตที่เลือก</p>
        </Card>
      ) : null}

      <Card className="border-primary/30 bg-primary-soft/50">
        <p className="text-sm font-semibold text-primary">คำแนะนำที่อธิบายเหตุผลได้</p>
        <p className="mt-1 text-xs text-muted-foreground">
          คำแนะนำจะแสดงเหตุผลเสมอ และใน Demo Mode จะระบุชัดว่าเป็นข้อมูลจำลอง ไม่ใช่ข้อเท็จจริงรับประกัน
        </p>
      </Card>
    </AppShell>
  );
}

function translateStage(stage: string) {
  const labels: Record<string, string> = {
    "Fruit Development": "พัฒนาผล",
    Flowering: "ออกดอก",
    "Fruit Set": "ติดผล",
    "Pre-Harvest": "ก่อนเก็บเกี่ยว",
    Learning: "กำลังเรียนรู้",
  };
  return labels[stage] ?? stage;
}

function getRecommendationCategory(title: string, action: string) {
  const content = `${title} ${action}`.toLocaleLowerCase("th-TH");
  if (content.includes("ndvi") || content.includes("ตรวจ") || content.includes("monitor")) return "ตรวจแปลงและเฝ้าระวัง";
  if (content.includes("น้ำ") || content.includes("ชื้น") || content.includes("ฝน") || content.includes("irrigation")) return "น้ำและความชื้น";
  if (content.includes("ปุ๋ย") || content.includes("ธาตุอาหาร") || content.includes("fertilizer")) return "ปุ๋ยและธาตุอาหาร";
  if (content.includes("โรค") || content.includes("แมลง") || content.includes("เชื้อ") || content.includes("pest")) return "โรคและศัตรูพืช";
  if (content.includes("เก็บเกี่ยว") || content.includes("harvest")) return "เก็บเกี่ยวและคุณภาพ";
  return "ดูแลทั่วไป";
}
