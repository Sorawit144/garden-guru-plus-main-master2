import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { AppShell, Badge, Card, Progress, SectionTitle, baht } from "@/components/AppShell";
import { yieldForecast, yieldTrend } from "@/lib/farm-data";
import { useDragonflyData } from "@/hooks/useDragonflyData";
import { toast } from "sonner";
import { SearchableSelect } from "@/components/SearchableSelect";

type SalesChannelPlan = {
  id: string;
  label: string;
  enabled: boolean;
  allocation: number;
  pricePerKg: number;
  transportPerKg: number;
  commissionPercent: number;
  grade: string;
};

const initialSalesChannels: SalesChannelPlan[] = [
  { id: "retail", label: "ขายปลีก", enabled: true, allocation: 15, pricePerKg: 165, transportPerKg: 8, commissionPercent: 0, grade: "เกรดคละ" },
  { id: "farm-gate", label: "ขายหน้าสวน", enabled: false, allocation: 0, pricePerKg: 120, transportPerKg: 0, commissionPercent: 0, grade: "เกรดคละ" },
  { id: "wholesale", label: "ขายส่ง", enabled: false, allocation: 0, pricePerKg: 138, transportPerKg: 4, commissionPercent: 2, grade: "เกรด A" },
  { id: "collector", label: "ล้ง/ผู้รวบรวม", enabled: true, allocation: 50, pricePerKg: 130, transportPerKg: 2, commissionPercent: 1, grade: "เกรดคละ" },
  { id: "central-market", label: "ตลาดกลาง", enabled: true, allocation: 25, pricePerKg: 145, transportPerKg: 7, commissionPercent: 3, grade: "เกรด A" },
  { id: "factory", label: "โรงงาน", enabled: false, allocation: 0, pricePerKg: 92, transportPerKg: 5, commissionPercent: 0, grade: "เกรดโรงงาน" },
  { id: "export", label: "ส่งออก", enabled: true, allocation: 10, pricePerKg: 172, transportPerKg: 12, commissionPercent: 5, grade: "เกรดส่งออก" },
  { id: "other", label: "อื่นๆ", enabled: false, allocation: 0, pricePerKg: 110, transportPerKg: 0, commissionPercent: 0, grade: "ระบุภายหลัง" },
];

export const Route = createFileRoute("/yield")({
  head: () => ({
    meta: [
      { title: "คาดการณ์ผลผลิต — สวนอัจฉริยะ" },
      { name: "description", content: "AI คาดการณ์ปริมาณผลผลิต รายได้ และกำไรของแต่ละแปลงในฤดูกาลนี้" },
      { property: "og:title", content: "คาดการณ์ผลผลิต — สวนอัจฉริยะ" },
      { property: "og:description", content: "พยากรณ์ผลผลิตและรายได้ล่วงหน้าเพื่อวางแผนการขาย" },
    ],
  }),
  component: YieldPage,
});

function YieldPage() {
  const { addTask, state, dashboardFarms, activeDashboardFarm, setActiveDashboardFarm } = useDragonflyData();
  const [year, setYear] = useState("2569");
  const [siteFilter, setSiteFilter] = useState("ทั้งหมด");
  const [plotFilter, setPlotFilter] = useState("ทั้งหมด");
  const [confidenceFilter, setConfidenceFilter] = useState("ทั้งหมด");
  const [sellRate, setSellRate] = useState(85);
  const [salesChannels, setSalesChannels] = useState<SalesChannelPlan[]>(initialSalesChannels);
  const selectedYear = Number(year) || 2569;
  const selectedSite = state.sites.find((site) => site.id === siteFilter);
  const scopedPlots = useMemo(() => state.plots.filter((plot) => {
    const matchesFarm = (plot.farmId ?? "FARM-PRIMARY") === activeDashboardFarm.id;
    const matchesSite = siteFilter === "ทั้งหมด" || plot.siteId === siteFilter || (!plot.siteId && selectedSite?.plotPrefixes.some((prefix) => plot.id.startsWith(prefix)));
    return matchesFarm && matchesSite;
  }), [state.plots, activeDashboardFarm.id, siteFilter, selectedSite]);
  const scopeForecast = useMemo(() => scopedPlots.map((plot, index) => {
    const template = yieldForecast[index % yieldForecast.length]!;
    return { ...template, plot: plot.id, plotName: plot.name, kg: Math.max(100, Math.round(template.kg * Math.max(0.35, plot.area / 42))) };
  }), [scopedPlots]);
  const baseYield = scopeForecast.reduce((sum, item) => sum + item.kg, 0) || yieldForecast.reduce((sum, item) => sum + item.kg, 0);
  const historicalRecord = yieldTrend.find((item) => Number(item.year.replace(/\D/g, "")) === selectedYear);
  const activeSeason = useMemo(() => {
    if (selectedYear === 2569) {
      return { yieldFactor: 1, priceFactor: 1, source: "ประมาณการจาก AI จากข้อมูลแปลงและราคาตัวอย่าง", confidence: "AI ประมาณการ" };
    }
    if (historicalRecord) {
      return { yieldFactor: historicalRecord.kg / baseYield, priceFactor: Math.max(0.4, 1 + (selectedYear - 2569) * 0.02), source: "ข้อมูลย้อนหลังตัวอย่างจากระบบ", confidence: "ข้อมูลย้อนหลัง" };
    }
    const yearsFromBase = selectedYear - 2569;
    return {
      yieldFactor: Math.max(0.35, 1 + yearsFromBase * 0.04),
      priceFactor: Math.max(0.4, 1 + yearsFromBase * 0.02),
      source: yearsFromBase > 0 ? "ประมาณการระยะยาวจาก AI ไม่ใช่ข้อมูลตลาดจริง" : "AI สร้างค่าประมาณย้อนหลัง เพราะระบบไม่มีข้อมูลจริงของปีนี้",
      confidence: yearsFromBase > 0 ? "AI ประมาณการระยะยาว" : "AI ประมาณการย้อนหลัง",
    };
  }, [baseYield, historicalRecord, selectedYear]);
  const yearForecast = useMemo(
    () => scopeForecast.map((item) => ({ ...item, kg: Math.round(item.kg * activeSeason.yieldFactor), pricePerKg: Math.round(item.pricePerKg * activeSeason.priceFactor) })),
    [activeSeason, scopeForecast]
  );
  const filteredForecast = yearForecast.filter((item) =>
    (plotFilter === "ทั้งหมด" || item.plot === plotFilter) &&
    (confidenceFilter === "ทั้งหมด" || (confidenceFilter === "สูง" ? item.confidence >= 80 : item.confidence < 80))
  );
  const totalKg = filteredForecast.reduce((sum, item) => sum + item.kg, 0);
  const revenue = filteredForecast.reduce((sum, item) => sum + item.kg * item.pricePerKg, 0);
  const cost = filteredForecast.length ? Math.round(268000 * (filteredForecast.length / Math.max(1, yearForecast.length))) : 0;
  const activeSalesChannels = salesChannels.filter((item) => item.enabled);
  const allocationTotal = activeSalesChannels.reduce((sum, item) => sum + item.allocation, 0);
  const expectedSellableKg = totalKg * (sellRate / 100);
  const salesForecast = activeSalesChannels.reduce((sum, item) => {
    const kg = expectedSellableKg * (item.allocation / 100);
    const gross = kg * item.pricePerKg;
    const net = gross - kg * item.transportPerKg - gross * (item.commissionPercent / 100);
    return sum + net;
  }, 0);
  const lowConfidence = yearForecast.filter((item) => item.confidence < 80);
  const updateSalesChannel = (id: string, patch: Partial<SalesChannelPlan>) => setSalesChannels((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));

  return (
    <AppShell title="คาดการณ์ผลผลิต" subtitle={`ฤดูกาล ${selectedYear} · เลือกปี แปลง และแผนขายได้`}>
      <SectionTitle>ขอบเขตการคาดการณ์</SectionTitle>
      <Card className="space-y-3">
        <SearchableSelect label="ฟาร์ม" options={dashboardFarms.map((farm) => ({ value: farm.id, label: `${farm.name} · ${farm.location}` }))} value={activeDashboardFarm.id} onChange={(value) => { setActiveDashboardFarm(value); setSiteFilter("ทั้งหมด"); setPlotFilter("ทั้งหมด"); }} searchPlaceholder="ค้นหาชื่อฟาร์มหรือพื้นที่" />
        <SearchableSelect label="โซน" options={["ทั้งหมด", ...state.sites.filter((site) => (site.farmId ?? "FARM-PRIMARY") === activeDashboardFarm.id).map((site) => ({ value: site.id, label: `${site.code} · ${site.name}` }))]} value={siteFilter} onChange={(value) => { setSiteFilter(value); setPlotFilter("ทั้งหมด"); }} allLabel="ทุกโซนในฟาร์ม" searchPlaceholder="ค้นหารหัสหรือชื่อโซน" />
        <SearchableSelect label="แปลง" options={["ทั้งหมด", ...scopedPlots.map((plot) => ({ value: plot.id, label: `${plot.id} · ${plot.name} · ${plot.crop}` }))]} value={plotFilter} onChange={setPlotFilter} allLabel="ทุกแปลงในขอบเขต" searchPlaceholder="ค้นหารหัส ชื่อแปลง หรือพืช" />
      </Card>
      <Card className="space-y-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">ฤดูกาล (พ.ศ.)
            <input type="number" value={year} onInput={(event) => setYear(event.currentTarget.value)} onChange={(event) => setYear(event.target.value)} inputMode="numeric" placeholder="เช่น 2575" className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-semibold text-foreground outline-none focus:border-primary" />
          </label>
          <div className="mt-2 grid grid-cols-4 gap-2">{[2567, 2568, 2569, 2570].map((quickYear) => <button key={quickYear} onClick={() => setYear(String(quickYear))} className={`min-h-9 rounded-lg border px-2 py-1.5 text-xs font-semibold ${selectedYear === quickYear ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>{quickYear}</button>)}</div>
          <p className="mt-2 text-xs text-muted-foreground">พิมพ์ปี พ.ศ. ใดก็ได้ ปุ่มด้านล่างเป็นเพียงปีลัด</p>
        </div>
        <p className="rounded-xl bg-muted/60 px-3 py-2 text-xs text-muted-foreground"><span className="font-semibold text-foreground">{activeSeason.confidence}:</span> {activeSeason.source}</p>
      </Card>
      <Card className="bg-primary border-0 text-primary-foreground">
        <p className="text-sm opacity-80">ผลผลิตรวม {selectedYear}</p>
        <p className="text-4xl font-bold">{totalKg.toLocaleString("th-TH")} กก.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-white/30 p-2">
            <p className="text-[11px] opacity-80">รายได้คาดการณ์</p>
            <p className="text-sm font-bold">{baht(revenue)}</p>
          </div>
          <div className="rounded-xl bg-white/30 p-2">
            <p className="text-[11px] opacity-80">กำไรคาดการณ์</p>
            <p className="text-sm font-bold">{baht(revenue - cost)}</p>
          </div>
        </div>
      </Card>

      <SectionTitle>แนวโน้มผลผลิตย้อนหลัง</SectionTitle>
      <Card>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={yieldTrend}>
              <XAxis dataKey="year" tickLine={false} axisLine={false} fontSize={11} />
              <Tooltip
                formatter={(v: number) => `${v.toLocaleString("th-TH")} กก.`}
                contentStyle={{ borderRadius: 12, fontSize: 12 }}
              />
              <Area
                type="monotone"
                dataKey="kg"
                stroke="var(--color-primary)"
                fill="var(--color-primary-soft)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-muted-foreground">ปีที่มีในกราฟคือข้อมูลย้อนหลังตัวอย่าง ส่วนปีที่พิมพ์เพิ่มจะสร้างเป็นค่าประมาณจาก AI และระบุแหล่งที่มาให้เสมอ</p>
      </Card>

      <SectionTitle>คาดการณ์ยอดขาย</SectionTitle>
      <Card className="space-y-3">
        <div>
          <div className="flex items-center justify-between gap-3"><p className="text-xs font-medium text-muted-foreground">สัดส่วนผลผลิตที่คาดว่าจะขายได้</p><input type="number" min="0" max="100" value={sellRate} onChange={(event) => setSellRate(Math.min(100, Math.max(0, Number(event.target.value) || 0)))} className="w-20 rounded-lg border border-border bg-card px-2 py-1.5 text-right text-sm font-semibold" /></div>
          <input type="range" min="0" max="100" value={sellRate} onChange={(event) => setSellRate(Number(event.target.value))} className="mt-2 w-full accent-primary" />
          <p className="mt-1 text-[11px] text-muted-foreground">{sellRate}% ของผลผลิตตามขอบเขตที่เลือก หรือ {Math.round(expectedSellableKg).toLocaleString("th-TH")} กก.</p>
        </div>
        <div className="space-y-2 border-t border-border pt-3"><div className="flex items-center justify-between gap-2"><p className="text-xs font-semibold">แผนกระจายช่องทางขาย</p><Badge tone={allocationTotal === 100 ? "good" : allocationTotal > 100 ? "bad" : "warn"}>รวม {allocationTotal}%</Badge></div><p className="text-[11px] text-muted-foreground">เปิดหลายช่องทางพร้อมกันได้ สัดส่วนของช่องทางที่เปิดควรรวมเป็น 100%</p>{salesChannels.map((item) => <div key={item.id} className={`rounded-lg border p-3 ${item.enabled ? "border-primary/30 bg-primary-soft/25" : "border-border bg-card"}`}><div className="flex items-center justify-between gap-3"><label className="flex min-w-0 items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={item.enabled} onChange={(event) => updateSalesChannel(item.id, { enabled: event.target.checked })} />{item.label}</label><div className="flex items-center gap-1 text-xs"><input type="number" min="0" max="100" disabled={!item.enabled} value={item.allocation} onChange={(event) => updateSalesChannel(item.id, { allocation: Math.min(100, Math.max(0, Number(event.target.value) || 0)) })} className="w-14 rounded-md border border-border bg-card px-1.5 py-1 text-right disabled:opacity-50" />%</div></div>{item.enabled ? <div className="mt-2 grid grid-cols-2 gap-2"><label className="text-[11px] text-muted-foreground">ราคา/กก.<input type="number" min="0" value={item.pricePerKg} onChange={(event) => updateSalesChannel(item.id, { pricePerKg: Math.max(0, Number(event.target.value) || 0) })} className="mt-1 block w-full rounded-md border border-border bg-card px-2 py-1.5 text-xs text-foreground" /></label><label className="text-[11px] text-muted-foreground">เกรด<select value={item.grade} onChange={(event) => updateSalesChannel(item.id, { grade: event.target.value })} className="mt-1 block w-full rounded-md border border-border bg-card px-2 py-1.5 text-xs text-foreground"><option>เกรดส่งออก</option><option>เกรด A</option><option>เกรดคละ</option><option>เกรดโรงงาน</option><option>ระบุภายหลัง</option></select></label><label className="text-[11px] text-muted-foreground">ขนส่ง/กก.<input type="number" min="0" value={item.transportPerKg} onChange={(event) => updateSalesChannel(item.id, { transportPerKg: Math.max(0, Number(event.target.value) || 0) })} className="mt-1 block w-full rounded-md border border-border bg-card px-2 py-1.5 text-xs text-foreground" /></label><label className="text-[11px] text-muted-foreground">ค่านายหน้า %<input type="number" min="0" max="100" value={item.commissionPercent} onChange={(event) => updateSalesChannel(item.id, { commissionPercent: Math.min(100, Math.max(0, Number(event.target.value) || 0)) })} className="mt-1 block w-full rounded-md border border-border bg-card px-2 py-1.5 text-xs text-foreground" /></label></div> : null}</div>)}</div>
        <div className="rounded-xl bg-primary-soft/60 p-3">
          <p className="text-xs text-muted-foreground">รายได้สุทธิคาดการณ์จากช่องทางที่เปิดและสัดส่วนที่ระบุ</p>
          <p className="mt-1 text-2xl font-bold text-primary">{baht(Math.round(salesForecast))}</p>
          <p className="mt-1 text-xs text-muted-foreground">หักค่าขนส่งและค่านายหน้าตามแต่ละช่องทางแล้ว แต่ยังไม่หักค่าคัดบรรจุ ภาษี หรือค่าใช้จ่ายอื่น</p>
        </div>
      </Card>

      <SectionTitle>แยกตามแปลง</SectionTitle>
      <Card className="space-y-3">
        <SearchableSelect label="แปลง" options={["ทั้งหมด", ...yearForecast.map((item) => ({ value: item.plot, label: `${item.plot} · ${item.plotName}` }))]} value={plotFilter} onChange={setPlotFilter} allLabel="ทุกแปลงในขอบเขต" searchPlaceholder="ค้นหารหัสหรือชื่อแปลง" />
        <SearchableSelect label="ความมั่นใจของโมเดล" options={["ทั้งหมด", "สูง", "ต้องตรวจเพิ่ม"]} value={confidenceFilter} onChange={setConfidenceFilter} allLabel="ทุกระดับความมั่นใจ" searchPlaceholder="ค้นหาระดับความมั่นใจ" />
        <p className="text-xs text-muted-foreground">ความมั่นใจสูงคือ 80% ขึ้นไป · กำลังแสดง {filteredForecast.length} แปลง</p>
      </Card>
      {filteredForecast.map((y) => (
        <Card key={y.plot}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">{y.plot} · {y.plotName}</p>
            <p className="text-sm font-bold text-primary">{y.kg.toLocaleString("th-TH")} กก.</p>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            ราคาประเมิน {y.pricePerKg} บาท/กก. · รายได้ {baht(y.kg * y.pricePerKg)}
          </p>
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>ความมั่นใจของโมเดล</span>
              <span>{y.confidence}%</span>
            </div>
            <Progress value={y.confidence} />
          </div>
        </Card>
      ))}
      {filteredForecast.length === 0 ? <Card className="py-8 text-center text-sm text-muted-foreground">ไม่มีแปลงที่ตรงกับตัวกรอง</Card> : null}

      <SectionTitle>คำแนะนำจาก AI</SectionTitle>
      <div className="space-y-3">
        <Card className="border-primary/30 bg-primary-soft/50">
          <div className="flex gap-3"><Sparkles className="mt-0.5 size-5 shrink-0 text-primary" /><div><p className="text-sm font-semibold">วางแผนคัดเกรดก่อนเลือกช่องทางขาย</p><p className="mt-1 text-xs text-muted-foreground">หากขายส่งออก ระบบคาดราคาเพิ่มขึ้น แต่ควรยืนยันเปอร์เซ็นต์ผลที่ผ่านเกรดก่อนใช้ยอดขายนี้ตัดสินใจ</p><Badge tone="warn">ประมาณการจาก AI</Badge></div></div>
        </Card>
        <Card>
          <p className="text-sm font-semibold">ตรวจแปลงที่ความมั่นใจต่ำก่อนล็อกยอดขาย</p>
          <p className="mt-1 text-xs text-muted-foreground">มี {lowConfidence.length} แปลงที่โมเดลมั่นใจต่ำกว่า 80% การสำรวจจำนวนผลและสุขภาพพืชจะช่วยให้ยอดขายแม่นขึ้น</p>
          <button onClick={() => { const target = lowConfidence[0]; if (!target) return; addTask({ title: "สำรวจจำนวนผลเพื่อยืนยันประมาณการ", plot: target.plot, type: "Inspection", status: "Planned" }); toast.success(`สร้างงานสำรวจ ${target.plotName} แล้ว`); }} className="mt-3 w-full rounded-xl border border-primary/30 py-2.5 text-xs font-semibold text-primary">สร้างงานสำรวจแปลงที่ต้องตรวจเพิ่ม</button>
        </Card>
      </div>
    </AppShell>
  );
}
