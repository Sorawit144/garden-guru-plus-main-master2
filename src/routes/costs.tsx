import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { AppShell, Badge, Card, SectionTitle, baht } from "@/components/AppShell";
import { transactions as initialTransactions } from "@/lib/farm-data";
import { toast } from "sonner";
import { TimeRangeFilter } from "@/components/TimeRangeFilter";
import { SearchableSelect } from "@/components/SearchableSelect";
import { useDragonflyData } from "@/hooks/useDragonflyData";

export const Route = createFileRoute("/costs")({
  head: () => ({
    meta: [
      { title: "จัดการต้นทุน — สวนอัจฉริยะ" },
      { name: "description", content: "บันทึกรายรับ รายจ่าย ต้นทุน กำไร และวิเคราะห์โครงสร้างต้นทุนของสวน" },
      { property: "og:title", content: "จัดการต้นทุน — สวนอัจฉริยะ" },
      { property: "og:description", content: "ดูรายรับรายจ่ายและกำไรของสวนแบบรายเดือน" },
    ],
  }),
  component: CostsPage,
});

function CostsPage() {
  const { state, dashboardFarms, activeDashboardFarm } = useDragonflyData();
  const [rows, setRows] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"income" | "expense">("income");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [kg, setKg] = useState("");
  const [rowFilter, setRowFilter] = useState("ทั้งหมด");
  const [timeFilter, setTimeFilter] = useState("month");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });
  const [farmFilter, setFarmFilter] = useState(activeDashboardFarm.id);
  const [siteFilter, setSiteFilter] = useState("ทั้งหมด");
  const [plotFilter, setPlotFilter] = useState("ทั้งหมด");

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("garden_guru_transactions");
      if (stored) {
        try {
          setRows(normalizeTransactionDates(JSON.parse(stored), state.plots));
        } catch (e) {
          setRows(normalizeTransactionDates(initialTransactions, state.plots));
        }
      } else {
        const initialRows = normalizeTransactionDates(initialTransactions, state.plots);
        localStorage.setItem("garden_guru_transactions", JSON.stringify(initialRows));
        setRows(initialRows);
      }
    }
  }, [state.plots]);

  const scopedSites = useMemo(() => state.sites.filter((site) => farmFilter === "ทั้งหมด" || (site.farmId ?? "FARM-PRIMARY") === farmFilter), [farmFilter, state.sites]);
  const scopedPlots = useMemo(() => state.plots.filter((plot) =>
    (farmFilter === "ทั้งหมด" || (plot.farmId ?? "FARM-PRIMARY") === farmFilter) &&
    (siteFilter === "ทั้งหมด" || plot.siteId === siteFilter),
  ), [farmFilter, siteFilter, state.plots]);
  const scopeRows = useMemo(() => rows.filter((row) =>
    (farmFilter === "ทั้งหมด" || row.farmId === farmFilter) &&
    (siteFilter === "ทั้งหมด" || row.siteId === siteFilter) &&
    (plotFilter === "ทั้งหมด" || row.plotId === plotFilter),
  ), [farmFilter, plotFilter, rows, siteFilter]);
  const periodRows = useMemo(() => scopeRows.filter((row) => isInTransactionPeriod(row.recordedAt, timeFilter, customRange)), [customRange, scopeRows, timeFilter]);
  const income = periodRows.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const cost = periodRows.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0);
  const filteredRows = periodRows.filter((row) => rowFilter === "ทั้งหมด" || (rowFilter === "รายรับ" ? row.amount > 0 : row.amount < 0));

  const save = () => {
    const n = Number(amount);
    if (!title.trim() || !n) {
      toast.error("กรุณากรอกรายการและจำนวนเงิน");
      return;
    }
    if (farmFilter === "ทั้งหมด") {
      toast.error("เลือกสวนที่จะบันทึกรายการก่อน");
      return;
    }
    
    const thaiDate = new Date().toLocaleDateString("th-TH", { day: "numeric", month: "short" });

    const newTx = {
      id: `new-${Date.now()}`,
      date: thaiDate,
      title: kg ? `${title} (${kg} กก.)` : title,
      category: kind === "income" ? "รายได้" : "ค่าใช้จ่าย",
      amount: kind === "income" ? n : -n,
      recordedAt: new Date().toISOString().slice(0, 10),
      farmId: farmFilter,
      siteId: siteFilter === "ทั้งหมด" ? undefined : siteFilter,
      plotId: plotFilter === "ทั้งหมด" ? undefined : plotFilter,
    };

    const updated = [newTx, ...rows];
    setRows(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("garden_guru_transactions", JSON.stringify(updated));
      window.dispatchEvent(new Event("transactions_updated"));
    }

    setTitle("");
    setAmount("");
    setKg("");
    setOpen(false);
    toast.success("บันทึกรายการเรียบร้อยแล้ว");
  };

  // Recalculate monthly finance chart data dynamically
  const monthlyFinanceComputed = useMemo(() => {
    const augIncome = scopeRows.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const augCost = scopeRows.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

    return [
      { month: "มี.ค.", income: 42000, cost: 18000 },
      { month: "เม.ย.", income: 58000, cost: 21000 },
      { month: "พ.ค.", income: 96000, cost: 27000 },
      { month: "มิ.ย.", income: 74000, cost: 19500 },
      { month: "ก.ค.", income: 88000, cost: 24500 },
      { month: "ส.ค.", income: augIncome, cost: augCost },
    ];
  }, [scopeRows]);

  // Recalculate cost breakdown pie chart dynamically
  const costBreakdownComputed = useMemo(() => {
    let fertilizeVal = 0;
    let laborVal = 0;
    let chemicalVal = 0;
    let energyVal = 0;
    let otherVal = 0;

    scopeRows.filter((t) => t.amount < 0).forEach((t) => {
      const amt = Math.abs(t.amount);
      const name = t.title.toLowerCase();
      if (name.includes("ปุ๋ย") || name.includes("คอก")) {
        fertilizeVal += amt;
      } else if (name.includes("แรง") || name.includes("คนงาน") || name.includes("จ้าง")) {
        laborVal += amt;
      } else if (name.includes("ยา") || name.includes("เคมี") || name.includes("รา") || name.includes("หนอน") || name.includes("แมลง")) {
        chemicalVal += amt;
      } else if (name.includes("น้ำมัน") || name.includes("ไฟ") || name.includes("น้ำ") || name.includes("ปั๊ม")) {
        energyVal += amt;
      } else {
        otherVal += amt;
      }
    });

    const breakdown = [
      { name: "ปุ๋ย", value: fertilizeVal, color: "var(--chart-3)" },
      { name: "แรงงาน", value: laborVal, color: "var(--chart-1)" },
      { name: "สารเคมี", value: chemicalVal, color: "var(--chart-4)" },
      { name: "พลังงาน", value: energyVal, color: "var(--chart-2)" },
    ];

    if (otherVal > 0) {
      breakdown.push({ name: "อื่นๆ", value: otherVal, color: "var(--chart-5)" });
    }

    return breakdown.filter((item) => item.value > 0);
  }, [scopeRows]);

  return (
    <AppShell title="ต้นทุนและรายได้" subtitle="เลือกขอบเขตสวน โซน แปลง และช่วงเวลาที่ต้องการวิเคราะห์">
      <Card className="space-y-3" data-tour="costs-scope-filter">
        <div>
          <p className="text-sm font-semibold">ขอบเขตข้อมูลการเงิน</p>
          <p className="mt-1 text-xs text-muted-foreground">ยอดสรุป กราฟ และรายการด้านล่างจะเปลี่ยนตามขอบเขตที่เลือก</p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <SearchableSelect
            label="สวน/ฟาร์ม"
            options={dashboardFarms.map((farm) => ({ value: farm.id, label: `${farm.name} · ${farm.location}` }))}
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
            onChange={setPlotFilter}
            allLabel="ทุกแปลงในขอบเขต"
            searchPlaceholder="ค้นหารหัส ชื่อแปลง หรือพืช"
          />
        </div>
      </Card>
      <div className="grid grid-cols-3 gap-2">
        <Card className="text-center">
          <p className="text-[11px] text-muted-foreground">รายรับ</p>
          <p className="text-sm font-bold text-primary">{baht(income)}</p>
        </Card>
        <Card className="text-center">
          <p className="text-[11px] text-muted-foreground">รายจ่าย</p>
          <p className="text-sm font-bold text-destructive">{baht(Math.abs(cost))}</p>
        </Card>
        <Card className="text-center">
          <p className="text-[11px] text-muted-foreground">กำไร</p>
          <p className="text-sm font-bold">{baht(income + cost)}</p>
        </Card>
      </div>

      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">จดบันทึกครั้งนี้</p>
            <p className="text-xs text-muted-foreground">รายรับ รายจ่าย และผลผลิตที่ได้ จะผูกกับขอบเขตด้านบน</p>
          </div>
          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded-xl bg-primary px-3 py-2 text-xs font-medium text-primary-foreground active:scale-95 cursor-pointer"
          >
            {open ? "ปิด" : "+ บันทึก"}
          </button>
        </div>
        {open ? (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {(["income", "expense"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setKind(k)}
                  className={`rounded-xl border py-2 text-xs font-medium cursor-pointer ${
                    kind === k ? "border-primary bg-primary-soft text-primary" : "border-border"
                  }`}
                >
                  {k === "income" ? "รายรับ" : "รายจ่าย"}
                </button>
              ))}
            </div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="รายการ เช่น ขายทุเรียนล็อต 4"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                placeholder="จำนวนเงิน (บาท)"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <input
                value={kg}
                onChange={(e) => setKg(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                placeholder="ผลผลิต (กก.)"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <button
              onClick={save}
              className="w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground active:scale-[0.99] cursor-pointer hover:opacity-95"
            >
              บันทึกรายการ
            </button>
          </div>
        ) : null}
      </Card>

      <SectionTitle>รายรับ-รายจ่าย 6 เดือน</SectionTitle>
      <Card>
        <p className="mb-3 text-[11px] text-muted-foreground">กราฟใช้ขอบเขตสวน โซน และแปลงที่เลือก ส่วนเดือนที่ยังไม่มีรายการจริงแสดงข้อมูลตัวอย่าง</p>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyFinanceComputed}>
              <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} />
              <Tooltip
                formatter={(v: number) => baht(v)}
                contentStyle={{ borderRadius: 12, fontSize: 12 }}
              />
              <Bar dataKey="income" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="cost" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <SectionTitle>วิเคราะห์โครงสร้างต้นทุน</SectionTitle>
      <Card>
        {costBreakdownComputed.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-8">ไม่มีรายจ่ายในการคำนวณสัดส่วนต้นทุน</p>
        ) : (
          <>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={costBreakdownComputed} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70}>
                    {costBreakdownComputed.map((c) => (
                      <Cell key={c.name} fill={c.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => baht(v)} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {costBreakdownComputed.map((c) => (
                <div key={c.name} className="flex items-center gap-2 text-xs">
                  <span className="size-2.5 rounded-full" style={{ background: c.color }} />
                  {c.name} · {baht(c.value)}
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      <SectionTitle>รายการล่าสุด</SectionTitle>
      <Card className="space-y-3">
        <TimeRangeFilter value={timeFilter} onChange={setTimeFilter} options={[{ value: "month", label: "เดือนนี้" }, { value: "3m", label: "3 เดือน" }, { value: "all", label: "ทั้งหมด" }]} label="วันที่บันทึกรายการ" dateRange={customRange} onDateRangeChange={setCustomRange} />
        <div className="flex gap-2 overflow-x-auto pb-1">{["ทั้งหมด", "รายรับ", "รายจ่าย"].map((filter) => <button key={filter} onClick={() => setRowFilter(filter)} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${rowFilter === filter ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>{filter}</button>)}</div>
        <p className="text-xs text-muted-foreground">กำลังแสดง {filteredRows.length} จาก {scopeRows.length} รายการในขอบเขตที่เลือก</p>
        {filteredRows.map((t) => (
          <div key={t.id} className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-muted text-sm">
              {t.amount > 0 ? "💵" : "🧾"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{t.title}</p>
              <p className="text-xs text-muted-foreground">
                {t.date} · {t.category}
              </p>
            </div>
            <span
              className={`text-sm font-semibold ${t.amount > 0 ? "text-primary" : "text-destructive"}`}
            >
              {baht(t.amount)}
            </span>
          </div>
        ))}
        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="text-sm font-medium">ทั้งหมด {filteredRows.length} รายการ</span>
          <Badge tone="good">กำไร {baht(income + cost)}</Badge>
        </div>
      </Card>
    </AppShell>
  );
}

function normalizeTransactionDates(rows: any[], plots: Array<{ id: string; farmId?: string; siteId?: string }>) {
  return rows.map((row, index) => {
    const day = Number(String(row.date).match(/\d+/)?.[0] ?? 1);
    const fallbackPlot = plots[index % Math.max(plots.length, 1)];
    return {
      ...row,
      recordedAt: row.recordedAt ?? `2026-08-${String(day).padStart(2, "0")}`,
      farmId: row.farmId ?? fallbackPlot?.farmId ?? "FARM-PRIMARY",
      siteId: row.siteId ?? fallbackPlot?.siteId,
      plotId: row.plotId ?? fallbackPlot?.id,
    };
  });
}

function isInTransactionPeriod(value: string | undefined, period: string, customRange: { start: string; end: string }) {
  if (period === "all" || !value) return true;
  const date = new Date(`${value}T00:00:00`);
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  if (period === "custom") {
    const rangeStart = customRange.start ? new Date(`${customRange.start}T00:00:00`) : undefined;
    const rangeEnd = customRange.end ? new Date(`${customRange.end}T23:59:59`) : undefined;
    return (!rangeStart || date >= rangeStart) && (!rangeEnd || date <= rangeEnd);
  }
  if (period === "month") return date >= start && date <= today;
  const threeMonthsAgo = new Date(today);
  threeMonthsAgo.setMonth(today.getMonth() - 3);
  return date >= threeMonthsAgo && date <= today;
}
