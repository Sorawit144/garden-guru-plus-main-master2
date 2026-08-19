import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CircleDollarSign, Info, MapPinned, Sprout } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { AppShell, Badge, Card, SectionTitle } from "@/components/AppShell";
import { SearchableSelect } from "@/components/SearchableSelect";
import { TimeRangeFilter } from "@/components/TimeRangeFilter";
import { useDragonflyData } from "@/hooks/useDragonflyData";
import { marketPrices, priceTrend, yieldForecast } from "@/lib/farm-data";

export const Route = createFileRoute("/market")({
  head: () => ({
    meta: [
      { title: "ราคาผลผลิตวันนี้ — EasyPlants" },
      {
        name: "description",
        content: "สำรวจราคาผลไม้ทุกชนิด ทุกจังหวัด และทุกตลาดในระบบ พร้อมประเมินรายได้ตามแปลง",
      },
      { property: "og:title", content: "ราคาผลผลิตวันนี้ — EasyPlants" },
      {
        property: "og:description",
        content: "เปรียบเทียบราคาตลาดและประเมินรายได้จากแผนผลผลิตของสวน",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MarketPage,
});

const ALL = "ทั้งหมด";

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

function displayChange(value: number) {
  return Math.abs(value) < 0.05 ? 0 : value;
}

function normalizeCropName(crop: string) {
  const normalized = crop.toLowerCase();
  if (normalized.includes("monthong") || normalized.includes("หมอนทอง")) return "ทุเรียนหมอนทอง";
  if (normalized.includes("chanee") || normalized.includes("ชะนี")) return "ทุเรียนชะนี";
  if (normalized.includes("kanyao") || normalized.includes("ก้านยาว")) return "ทุเรียนก้านยาว";
  if (normalized.includes("mangosteen") || normalized.includes("มังคุด")) return "มังคุด";
  if (normalized.includes("longan") || normalized.includes("ลำไย")) return "ลำไยอีดอ";
  if (normalized.includes("rambutan") || normalized.includes("เงาะ")) return "เงาะโรงเรียน";
  return crop;
}

function parseExpectedYield(value?: string) {
  if (!value) return 0;
  const amount = Number(value.replace(/,/g, "").match(/[\d.]+/)?.[0] ?? 0);
  if (!amount) return 0;
  return /ton|ตัน/i.test(value) ? Math.round(amount * 1_000) : Math.round(amount);
}

function formatHarvestPeriod(value?: string) {
  if (!value) return "ยังไม่ระบุช่วงเก็บเกี่ยว";
  const monthNames: Record<string, string> = {
    jan: "ม.ค.",
    feb: "ก.พ.",
    mar: "มี.ค.",
    apr: "เม.ย.",
    may: "พ.ค.",
    jun: "มิ.ย.",
    jul: "ก.ค.",
    aug: "ส.ค.",
    sep: "ก.ย.",
    oct: "ต.ค.",
    nov: "พ.ย.",
    dec: "ธ.ค.",
    january: "ม.ค.",
    february: "ก.พ.",
    march: "มี.ค.",
    april: "เม.ย.",
    june: "มิ.ย.",
    july: "ก.ค.",
    august: "ส.ค.",
    september: "ก.ย.",
    october: "ต.ค.",
    november: "พ.ย.",
    december: "ธ.ค.",
  };
  const matched = value.match(/(?:(\d{1,2})\s+)?([A-Za-z]+)\s+(\d{4})/);
  if (!matched) return value;
  const [, day, month, year] = matched;
  return `${day ? `${day} ` : ""}${monthNames[month!.toLowerCase()] ?? month} ${Number(year) + 543}`;
}

function MarketPage() {
  const { state, dashboardFarms } = useDragonflyData();
  const [cropFilter, setCropFilter] = useState(ALL);
  const [marketFilter, setMarketFilter] = useState(ALL);
  const [provinceFilter, setProvinceFilter] = useState(ALL);
  const [trendPeriod, setTrendPeriod] = useState("7d");
  const [incomeFarmFilter, setIncomeFarmFilter] = useState("FARM-PRIMARY");
  const [incomeSiteFilter, setIncomeSiteFilter] = useState(ALL);
  const [incomePlotFilter, setIncomePlotFilter] = useState(ALL);
  const [incomeCropFilter, setIncomeCropFilter] = useState(ALL);
  const [incomeHarvestFilter, setIncomeHarvestFilter] = useState(ALL);

  const cropOptions = useMemo(
    () => [ALL, ...new Set(marketPrices.map((item) => item.product))],
    [],
  );
  const markets = useMemo(
    () => [
      ALL,
      ...new Set(
        marketPrices
          .filter((item) => cropFilter === ALL || item.product === cropFilter)
          .map((item) => item.market),
      ),
    ],
    [cropFilter],
  );
  const provinces = useMemo(
    () => [
      ALL,
      ...new Set(
        marketPrices
          .filter((item) => cropFilter === ALL || item.product === cropFilter)
          .map((item) => item.province),
      ),
    ],
    [cropFilter],
  );
  const filteredPrices = useMemo(
    () =>
      marketPrices.filter(
        (item) =>
          (cropFilter === ALL || item.product === cropFilter) &&
          (marketFilter === ALL || item.market === marketFilter) &&
          (provinceFilter === ALL || item.province === provinceFilter),
      ),
    [cropFilter, marketFilter, provinceFilter],
  );
  const productSummaries = useMemo(
    () =>
      [...new Set(filteredPrices.map((item) => item.product))].map((product) => {
        const records = filteredPrices.filter((item) => item.product === product);
        return {
          product,
          medianPrice: Math.round(median(records.map((item) => item.price))),
          medianChange: median(records.map((item) => item.change)),
          sources: records.length,
        };
      }),
    [filteredPrices],
  );
  const selectedSummary = cropFilter === ALL ? undefined : productSummaries[0];
  const uniqueMarkets = new Set(filteredPrices.map((item) => item.market)).size;
  const uniqueProvinces = new Set(filteredPrices.map((item) => item.province)).size;
  const trendData = trendPeriod === "3d" ? priceTrend.slice(-3) : priceTrend;
  const showDurianTrend = cropFilter === ALL || cropFilter.startsWith("ทุเรียน");
  const showMangosteenTrend = cropFilter === ALL || cropFilter === "มังคุด";

  const farmOptions = dashboardFarms.map((farm) => ({ value: farm.id, label: farm.name }));
  const incomeSites = state.sites.filter(
    (site) => (site.farmId ?? "FARM-PRIMARY") === incomeFarmFilter,
  );
  const selectedIncomeSite = incomeSites.find((site) => site.id === incomeSiteFilter);
  const incomeBasePlots = state.plots.filter(
    (plot) =>
      (plot.farmId ?? "FARM-PRIMARY") === incomeFarmFilter &&
      (incomeSiteFilter === ALL ||
        plot.siteId === incomeSiteFilter ||
        selectedIncomeSite?.plotPrefixes.some((prefix) => plot.id.startsWith(prefix))),
  );
  const incomeCropOptions = [
    ALL,
    ...new Set(incomeBasePlots.map((plot) => normalizeCropName(plot.crop))),
  ];
  const incomeAvailablePlots = incomeBasePlots.filter(
    (plot) => incomeCropFilter === ALL || normalizeCropName(plot.crop) === incomeCropFilter,
  );

  const incomeRowsBeforeHarvest = incomeAvailablePlots
    .filter((plot) => incomePlotFilter === ALL || plot.id === incomePlotFilter)
    .map((plot, index) => {
      const crop = normalizeCropName(plot.crop);
      const productionPlan = state.productionPlans.find((plan) => plan.plot === plot.id);
      const plannedKg = parseExpectedYield(productionPlan?.expectedYield);
      const template = crop.startsWith("ทุเรียน")
        ? yieldForecast[0]!
        : crop === "มังคุด"
          ? yieldForecast[1]!
          : yieldForecast[2]!;
      const estimatedKg =
        plannedKg || Math.max(100, Math.round(template.kg * Math.max(0.35, plot.area / 42)));
      const priceRecords = marketPrices.filter((item) => item.product === crop);
      const pricePerKg = priceRecords.length
        ? Math.round(median(priceRecords.map((item) => item.price)))
        : template.pricePerKg;
      const harvestPeriod = formatHarvestPeriod(productionPlan?.expectedHarvest);
      return {
        id: plot.id,
        plotName: plot.name,
        crop,
        estimatedKg,
        pricePerKg,
        revenue: estimatedKg * pricePerKg,
        harvestPeriod,
        priceSourceCount: priceRecords.length,
        confidence: productionPlan
          ? Math.min(95, 55 + Math.round(productionPlan.progress * 0.35))
          : template.confidence,
        yieldSource: productionPlan
          ? "แผนผลผลิตในระบบ"
          : `ประมาณการจากพื้นที่แปลง (แบบจำลอง Demo ${index + 1})`,
      };
    });
  const incomeHarvestOptions = [
    ALL,
    ...new Set(incomeRowsBeforeHarvest.map((row) => row.harvestPeriod)),
  ];
  const incomeRows = incomeRowsBeforeHarvest.filter(
    (row) => incomeHarvestFilter === ALL || row.harvestPeriod === incomeHarvestFilter,
  );
  const totalEstimatedRevenue = incomeRows.reduce((sum, row) => sum + row.revenue, 0);

  return (
    <AppShell title="ราคาตลาดวันนี้" subtitle="ทุกผลไม้ · ทุกจังหวัด · ทุกตลาดที่มีในระบบ Demo">
      <Card className="border-0 bg-primary text-primary-foreground">
        {selectedSummary ? (
          <>
            <p className="text-sm text-primary-foreground/85">
              {selectedSummary.product} · ราคากลางจากขอบเขตที่เลือก
            </p>
            <div className="mt-1 flex flex-wrap items-end gap-2">
              <span className="text-4xl font-bold">฿{selectedSummary.medianPrice}</span>
              <span className="mb-1 text-sm text-primary-foreground/85">
                / กก. · {displayChange(selectedSummary.medianChange) >= 0 ? "▲" : "▼"}{" "}
                {Math.abs(displayChange(selectedSummary.medianChange)).toFixed(1)}%
              </span>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-primary-foreground/85">ภาพรวมราคาทั้งระบบ</p>
            <div className="mt-1 flex items-end gap-2">
              <span className="text-4xl font-bold">{productSummaries.length}</span>
              <span className="mb-1 text-sm text-primary-foreground/85">ชนิดผลผลิต</span>
            </div>
            <p className="mt-1 text-sm text-primary-foreground/85">
              {uniqueProvinces} จังหวัด · {uniqueMarkets} ตลาด · {filteredPrices.length} รายการราคา
            </p>
          </>
        )}
        <p className="mt-3 text-xs text-primary-foreground/80">
          Demo: แสดงค่ากลางแบบ Median แยกตามชนิดผลผลิต ไม่เฉลี่ยราคาผลไม้ต่างชนิดรวมกัน
          และยังไม่ใช่ข้อมูล API จริง
        </p>
      </Card>

      <Card className="space-y-3">
        <div className="flex items-start gap-2">
          <MapPinned className="mt-0.5 size-4 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-semibold">สำรวจราคาทั้งระบบ</p>
            <p className="text-xs text-muted-foreground">
              ตัวกรองชุดนี้มีผลเฉพาะข้อมูลราคา ไม่เปลี่ยนขอบเขตสวนด้านล่าง
            </p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <SearchableSelect
            label="ชนิดผลผลิต"
            options={cropOptions}
            value={cropFilter}
            onChange={(value) => {
              setCropFilter(value);
              setMarketFilter(ALL);
              setProvinceFilter(ALL);
            }}
            allLabel="ผลไม้ทุกประเภท"
            searchPlaceholder="ค้นหาผลไม้หรือพันธุ์"
          />
          <SearchableSelect
            label="ตลาด"
            options={markets}
            value={marketFilter}
            onChange={setMarketFilter}
            allLabel="ทุกตลาด"
            searchPlaceholder="ค้นหาชื่อตลาด"
          />
          <SearchableSelect
            label="จังหวัด"
            options={provinces}
            value={provinceFilter}
            onChange={setProvinceFilter}
            allLabel="ทุกจังหวัด"
            searchPlaceholder="ค้นหาจังหวัด"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          พบ {filteredPrices.length} รายการ จาก {uniqueMarkets} ตลาด ใน {uniqueProvinces} จังหวัด
        </p>
      </Card>

      {cropFilter === ALL ? (
        <>
          <SectionTitle>ภาพรวมราคาตามผลผลิต</SectionTitle>
          <Card className="space-y-2">
            {productSummaries.map((summary) => (
              <button
                key={summary.product}
                type="button"
                onClick={() => {
                  setCropFilter(summary.product);
                  setMarketFilter(ALL);
                  setProvinceFilter(ALL);
                }}
                className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted/60"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{summary.product}</p>
                  <p className="text-xs text-muted-foreground">
                    Median จาก {summary.sources} แหล่งราคา
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">฿{summary.medianPrice}/กก.</p>
                  <p
                    className={`text-xs ${summary.medianChange >= 0 ? "text-primary" : "text-destructive"}`}
                  >
                    {displayChange(summary.medianChange) >= 0 ? "+" : ""}
                    {displayChange(summary.medianChange).toFixed(1)}%
                  </p>
                </div>
              </button>
            ))}
          </Card>
        </>
      ) : null}

      <SectionTitle>แนวโน้มราคา</SectionTitle>
      <Card>
        <TimeRangeFilter
          value={trendPeriod}
          onChange={setTrendPeriod}
          options={[
            { value: "3d", label: "3 วัน" },
            { value: "7d", label: "7 วัน" },
          ]}
          label="ช่วงแนวโน้มราคา"
        />
        {showDurianTrend || showMangosteenTrend ? (
          <>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <XAxis dataKey="d" tickLine={false} axisLine={false} fontSize={11} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  {showDurianTrend ? (
                    <Line
                      type="monotone"
                      dataKey="durian"
                      name="ดัชนีทุเรียน"
                      stroke="var(--color-primary)"
                      strokeWidth={2.5}
                      dot={false}
                    />
                  ) : null}
                  {showMangosteenTrend ? (
                    <Line
                      type="monotone"
                      dataKey="mangosteen"
                      name="มังคุด"
                      stroke="var(--chart-3)"
                      strokeWidth={2.5}
                      dot={false}
                    />
                  ) : null}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              ข้อมูลแนวโน้มเป็นชุดตัวอย่าง Demo
              {showDurianTrend ? "; เส้นทุเรียนเป็นดัชนีรวมและยังไม่แยกตามพันธุ์" : ""}
            </p>
          </>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            ยังไม่มีข้อมูลแนวโน้มย้อนหลังของผลผลิตนี้ใน Demo Mode
          </p>
        )}
      </Card>

      <SectionTitle>แหล่งราคาในขอบเขตที่เลือก</SectionTitle>
      <Card className="space-y-2">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-3 border-b border-border pb-2 text-[11px] font-semibold text-muted-foreground">
          <span>ผลผลิต / แหล่งราคา</span>
          <span>ราคา</span>
          <span>เปลี่ยนแปลง</span>
        </div>
        {filteredPrices.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 border-b border-border/60 py-2 last:border-0"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{item.product}</p>
              <p className="truncate text-xs text-muted-foreground">
                {item.market} · {item.province} · {item.updated}
              </p>
            </div>
            <p className="text-sm font-bold">฿{item.price}</p>
            <p
              className={`min-w-12 text-right text-xs font-medium ${item.change >= 0 ? "text-primary" : "text-destructive"}`}
            >
              {item.change >= 0 ? "+" : ""}
              {item.change}%
            </p>
          </div>
        ))}
        {!filteredPrices.length ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            ไม่พบราคาที่ตรงกับตัวกรอง
          </p>
        ) : null}
      </Card>

      <SectionTitle>ประเมินรายได้จากผลผลิตของคุณ</SectionTitle>
      <Card className="space-y-4">
        <div className="flex items-start gap-2 rounded-lg bg-primary-soft/55 p-3">
          <CircleDollarSign className="mt-0.5 size-4 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-semibold">ประเมินตามแผนผลผลิตและแปลงที่เลือก</p>
            <p className="text-xs text-muted-foreground">
              ราคาที่ใช้คือ Median ของผลผลิตชนิดเดียวกันจากทุกตลาดในระบบ ไม่ผูกกับตัวกรองราคาด้านบน
            </p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <SearchableSelect
            label="สวน"
            options={farmOptions}
            value={incomeFarmFilter}
            onChange={(value) => {
              setIncomeFarmFilter(value);
              setIncomeSiteFilter(ALL);
              setIncomePlotFilter(ALL);
              setIncomeCropFilter(ALL);
              setIncomeHarvestFilter(ALL);
            }}
            searchPlaceholder="ค้นหาชื่อสวน"
          />
          <SearchableSelect
            label="โซน"
            options={[
              ALL,
              ...incomeSites.map((site) => ({
                value: site.id,
                label: `${site.code} · ${site.name}`,
              })),
            ]}
            value={incomeSiteFilter}
            onChange={(value) => {
              setIncomeSiteFilter(value);
              setIncomePlotFilter(ALL);
              setIncomeCropFilter(ALL);
              setIncomeHarvestFilter(ALL);
            }}
            allLabel="ทุกโซน"
            searchPlaceholder="ค้นหารหัสหรือชื่อโซน"
          />
          <SearchableSelect
            label="แปลง"
            options={[
              ALL,
              ...incomeAvailablePlots.map((plot) => ({
                value: plot.id,
                label: `${plot.id} · ${plot.name}`,
              })),
            ]}
            value={incomePlotFilter}
            onChange={(value) => {
              setIncomePlotFilter(value);
              setIncomeHarvestFilter(ALL);
            }}
            allLabel="ทุกแปลง"
            searchPlaceholder="ค้นหารหัสหรือชื่อแปลง"
          />
          <SearchableSelect
            label="ชนิดผลผลิต"
            options={incomeCropOptions}
            value={incomeCropFilter}
            onChange={(value) => {
              setIncomeCropFilter(value);
              setIncomePlotFilter(ALL);
              setIncomeHarvestFilter(ALL);
            }}
            allLabel="ทุกผลผลิตในสวน"
            searchPlaceholder="ค้นหาผลไม้หรือพันธุ์"
          />
          <SearchableSelect
            label="ช่วงเก็บเกี่ยว"
            options={incomeHarvestOptions}
            value={incomeHarvestFilter}
            onChange={setIncomeHarvestFilter}
            allLabel="ทุกรอบที่มีข้อมูล"
            searchPlaceholder="ค้นหาเดือนหรือปี"
          />
        </div>
        <div className="space-y-3">
          {incomeRows.map((row) => (
            <div key={row.id} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {row.plotName} · {row.crop}
                  </p>
                  <p className="text-xs text-muted-foreground">คาดเก็บเกี่ยว {row.harvestPeriod}</p>
                </div>
                <p className="shrink-0 text-sm font-bold text-primary">
                  ฿{row.revenue.toLocaleString("th-TH")}
                </p>
              </div>
              <div className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                <p>
                  {row.estimatedKg.toLocaleString("th-TH")} กก. × ฿{row.pricePerKg}/กก.
                </p>
                <p>ความเชื่อมั่นประมาณ {row.confidence}%</p>
                <p>{row.yieldSource}</p>
                <p>
                  {row.priceSourceCount
                    ? `ราคา Median จาก ${row.priceSourceCount} ตลาด`
                    : "ราคาตัวอย่างจากแบบจำลอง Demo"}
                </p>
              </div>
            </div>
          ))}
          {!incomeRows.length ? (
            <div className="flex items-start gap-2 rounded-lg border border-dashed border-border p-4">
              <Sprout className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-semibold">ยังไม่มีผลผลิตในขอบเขตนี้</p>
                <p className="text-xs text-muted-foreground">
                  เพิ่มแปลงและแผนผลผลิต หรือเลือกสวน/โซนอื่นเพื่อประเมินรายได้
                </p>
              </div>
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          <div>
            <p className="text-sm font-semibold">รายได้คาดการณ์รวม</p>
            <p className="text-xs text-muted-foreground">
              จาก {incomeRows.length} แปลงในขอบเขตที่เลือก
            </p>
          </div>
          <Badge tone="good">฿{totalEstimatedRevenue.toLocaleString("th-TH")}</Badge>
        </div>
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          <p>
            ตัวเลขนี้เป็นประมาณการจากระบบ/ข้อมูล Demo ไม่ใช่ยอดขายจริง
            รายได้จริงต้องมาจากบันทึกการขาย และควรหักของเสีย ค่าขนส่ง ค่านายหน้า
            และต้นทุนช่องทางขายก่อนใช้ตัดสินใจ
          </p>
        </div>
      </Card>
    </AppShell>
  );
}
