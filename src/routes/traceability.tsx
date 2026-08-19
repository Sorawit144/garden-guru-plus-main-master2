import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell, Badge, Card, SectionTitle } from "@/components/AppShell";
import { useDragonflyData } from "@/hooks/useDragonflyData";
import { ProAccessGate } from "@/components/ProAccessGate";
import { SearchableSelect } from "@/components/SearchableSelect";

export const Route = createFileRoute("/traceability")({
  head: () => ({
    meta: [
      { title: "Traceability — EasyPlants" },
      { name: "description", content: "Search lot IDs and view complete production history" },
    ],
  }),
  component: TraceabilityPage,
});

function TraceabilityPage() {
  const { state, persona, dashboardFarms } = useDragonflyData();
  const [query, setQuery] = useState("EXPORT-2026-001");
  const [searchedQuery, setSearchedQuery] = useState("EXPORT-2026-001");
  const [farmFilter, setFarmFilter] = useState("ทั้งหมด");
  const [plotFilter, setPlotFilter] = useState("ทั้งหมด");
  const [siteFilter, setSiteFilter] = useState("ทั้งหมด");
  const [cropFilter, setCropFilter] = useState("ทั้งหมด");
  const [openedRecord, setOpenedRecord] = useState<{ title: string; detail: string }>();
  const sites = useMemo(() => ["ทั้งหมด", ...Array.from(new Map(state.traceability.filter((item) => farmFilter === "ทั้งหมด" || item.farmId === farmFilter).map((item) => [item.siteId ?? "ไม่ระบุโซน", { value: item.siteId ?? "ไม่ระบุโซน", label: item.siteName ?? item.siteId ?? "ไม่ระบุโซน" }])).values())], [farmFilter, state.traceability]);
  const plots = useMemo(() => ["ทั้งหมด", ...Array.from(new Map(state.traceability.filter((item) => (farmFilter === "ทั้งหมด" || item.farmId === farmFilter) && (siteFilter === "ทั้งหมด" || item.siteId === siteFilter)).map((item) => [item.plot, { value: item.plot, label: `${item.plot} · ${item.crop}` }])).values())], [farmFilter, siteFilter, state.traceability]);
  const crops = useMemo(() => ["ทั้งหมด", ...Array.from(new Set(state.traceability.filter((item) => (farmFilter === "ทั้งหมด" || item.farmId === farmFilter) && (siteFilter === "ทั้งหมด" || item.siteId === siteFilter) && (plotFilter === "ทั้งหมด" || item.plot === plotFilter)).map((item) => item.crop)))], [farmFilter, plotFilter, siteFilter, state.traceability]);
  const availableLots = state.traceability.filter((item) =>
    (farmFilter === "ทั้งหมด" || item.farmId === farmFilter) && (siteFilter === "ทั้งหมด" || item.siteId === siteFilter) && (plotFilter === "ทั้งหมด" || item.plot === plotFilter) && (cropFilter === "ทั้งหมด" || item.crop === cropFilter)
  );
  const result = availableLots.find((item) => item.lotId.toLowerCase() === searchedQuery.trim().toLowerCase());
  const relatedDocuments = result ? state.documents.filter((document) => document.lotId === result.lotId || (!document.lotId && document.plotId === result.plot && document.farmId === result.farmId)) : [];

  if (persona.subscription !== "Farm Pro") {
    return <AppShell title="ตรวจสอบย้อนหลัง" subtitle="ล็อตขาย → แพ็ก → เก็บเกี่ยว → แปลง → บันทึก"><ProAccessGate feature="Traceability และ Compliance" detail="ใช้ติดตามล็อตตั้งแต่แปลงถึงการคัดบรรจุ สืบค้นย้อนหลัง และเตรียมหลักฐานสำหรับการตรวจรับ" /></AppShell>;
  }

  return (
    <AppShell title="ตรวจสอบย้อนหลัง" subtitle="ล็อตขาย → แพ็ก → เก็บเกี่ยว → แปลง → บันทึก">
      <Card className="border-primary/25 bg-primary-soft/45"><p className="text-sm font-semibold text-primary">Traceability คืออะไร</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">คือการตามย้อนกลับได้ว่าสินค้าล็อตนี้มาจากแปลงไหน ใครทำอะไร ใช้วัสดุอะไร และผ่านขั้นตอนใดบ้าง เพื่อแก้ปัญหา เรียกคืนสินค้า หรือเตรียมตรวจมาตรฐานได้รวดเร็ว</p></Card>
      <Card className="space-y-3">
        <SearchableSelect label="สวน/ฟาร์ม" options={["ทั้งหมด", ...dashboardFarms.map((farm) => ({ value: farm.id, label: `${farm.name} · ${farm.location}` }))]} value={farmFilter} onChange={(value) => { setFarmFilter(value); setSiteFilter("ทั้งหมด"); setPlotFilter("ทั้งหมด"); setCropFilter("ทั้งหมด"); setSearchedQuery(""); }} allLabel="ทุกสวนในองค์กร" searchPlaceholder="ค้นหาชื่อสวนหรือพื้นที่" />
        <SearchableSelect label="โซน" options={sites} value={siteFilter} onChange={(value) => { setSiteFilter(value); setPlotFilter("ทั้งหมด"); setCropFilter("ทั้งหมด"); setSearchedQuery(""); }} allLabel="ทุกโซน" searchPlaceholder="ค้นหารหัสหรือชื่อโซน" />
        <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); setSearchedQuery(query); }}>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ค้นหารหัสล็อต เช่น EXPORT-2026-001"
            className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <button type="submit" className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground" aria-label="ค้นหา Lot ID" title="ค้นหา Lot ID">
            <Search className="size-4" />
          </button>
        </form>
        <SearchableSelect label="แปลง" options={plots} value={plotFilter} onChange={(value) => { setPlotFilter(value); setSearchedQuery(""); }} allLabel="ทุกแปลงในขอบเขต" searchPlaceholder="ค้นหารหัส ชื่อแปลง หรือพืช" />
        <SearchableSelect label="พืช/สินค้า" options={crops} value={cropFilter} onChange={(value) => { setCropFilter(value); setSearchedQuery(""); }} allLabel="ทุกพืชและสินค้า" searchPlaceholder="ค้นหาพืชหรือสินค้า" />
        <p className="text-xs text-muted-foreground">พบ {availableLots.length} ล็อต จาก {new Set(availableLots.map((item) => item.farmId)).size} สวน และ {new Set(availableLots.map((item) => item.plot)).size} แปลง</p>
      </Card>

      <SectionTitle>ล็อตในขอบเขตที่เลือก</SectionTitle>
      <div className="space-y-2">{availableLots.map((item) => <button type="button" key={item.lotId} onClick={() => { setQuery(item.lotId); setSearchedQuery(item.lotId); setOpenedRecord(undefined); }} className="block w-full text-left"><Card className={result?.lotId === item.lotId ? "border-primary/50 bg-primary-soft/35" : ""}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-semibold">{item.lotId}</p><p className="mt-1 text-xs text-muted-foreground">{item.farmName ?? item.farmId} · {item.siteName ?? item.siteId} · แปลง {item.plot}</p></div><Badge tone={item.chemicalRecords.some((record) => record.includes("PHI")) ? "warn" : "good"}>{item.crop}</Badge></div></Card></button>)}</div>
      {availableLots.length === 0 ? <Card className="py-8 text-center text-sm text-muted-foreground">ไม่มีล็อตในสวน โซน หรือแปลงที่เลือก</Card> : null}

      {!result ? (
        <Card className="py-8 text-center">
          <p className="text-sm text-muted-foreground">{searchedQuery ? "ไม่พบข้อมูลล็อตในขอบเขตตัวกรองนี้" : "เลือกล็อตจากรายการด้านบนเพื่อดูเส้นทางข้อมูลและประวัติการผลิต"}</p>
        </Card>
      ) : (
        <>
          <Card className="bg-primary text-primary-foreground">
            <p className="text-xs text-primary-foreground/75">ล็อตขาย / ล็อตส่งออก</p>
            <p className="text-2xl font-bold">{result.lotId}</p>
            <p className="mt-1 text-xs text-primary-foreground/80">
              ข้อมูลตัวอย่างเพื่อสาธิตการตรวจสอบย้อนหลัง ไม่ใช่การรับรองมาตรฐานอย่างเป็นทางการ
            </p>
          </Card>

          <SectionTitle>เส้นทางข้อมูล</SectionTitle>
          <Card className="space-y-3">
            {[
              ["ล็อตคัดบรรจุ", result.packingLot],
              ["ล็อตเก็บเกี่ยว", result.harvestLot],
              ["สวน/ฟาร์ม", result.farmName ?? result.farmId ?? "ไม่ระบุ"],
              ["โซน", result.siteName ?? result.siteId ?? "ไม่ระบุ"],
              ["แปลง", result.plot],
              ["พืช", result.crop],
              ["พันธุ์", result.variety],
            ].map(([label, value], index) => (
              <div key={label} className="flex items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">
                  {index + 1}
                </span>
                <div>
                  <p className="text-[11px] text-muted-foreground">{label}</p>
                  <p className="text-sm font-semibold">{value}</p>
                </div>
              </div>
            ))}
          </Card>

          <SectionTitle>เอกสารและ Compliance</SectionTitle>
          <Card className="space-y-2"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold">เอกสารที่เชื่อมกับล็อต</p><p className="text-xs text-muted-foreground">PHI, QA, Lab, ใบรับรอง และเอกสารส่งออก</p></div><Badge tone={relatedDocuments.length ? "good" : "warn"}>{relatedDocuments.length} รายการ</Badge></div>{relatedDocuments.map((document) => <div key={document.id} className="flex items-center justify-between gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs"><span className="truncate">{document.title}</span><Badge tone={document.status === "Approved" ? "good" : "warn"}>{document.status === "Approved" ? "อนุมัติแล้ว" : "รอตรวจ"}</Badge></div>)}<Link to="/documents" className="block rounded-lg border border-primary/30 py-2.5 text-center text-xs font-semibold text-primary">เปิดศูนย์เอกสาร</Link></Card>

          <SectionTitle>ประวัติการผลิต</SectionTitle>
          <TraceList title="กิจกรรม" rows={result.activities} onOpen={setOpenedRecord} />
          <TraceList title="บันทึกสาร" rows={result.chemicalRecords} tone="warn" onOpen={setOpenedRecord} />
          <TraceList title="บันทึกการให้น้ำ" rows={result.irrigationRecords} onOpen={setOpenedRecord} />
          <TraceList title="ผู้ปฏิบัติงาน" rows={result.workers} tone="good" onOpen={setOpenedRecord} />
          {openedRecord ? <Card className="border-primary/25"><div className="flex gap-2"><FileText className="size-5 shrink-0 text-primary" /><div><p className="text-sm font-semibold">{openedRecord.title}</p><p className="mt-1 text-xs text-muted-foreground">{openedRecord.detail}</p><p className="mt-2 text-[11px] text-muted-foreground">Demo: ระบบจริงควรเปิดไฟล์ต้นฉบับ เช่น รูปใบงาน, PDF ใบรับรอง, ใบพ่นสาร หรือใบชั่งน้ำหนักจากพื้นที่เก็บไฟล์ที่มีสิทธิ์เข้าถึง</p></div></div></Card> : null}
        </>
      )}
    </AppShell>
  );
}

function TraceList({
  title,
  rows,
  tone = "info",
  onOpen,
}: {
  title: string;
  rows: string[];
  tone?: "info" | "warn" | "good";
  onOpen: (record: { title: string; detail: string }) => void;
}) {
  return (
    <Card className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{title}</p>
        <Badge tone={tone}>{rows.length}</Badge>
      </div>
      {rows.map((row, index) => (
        <button key={row} onClick={() => onOpen({ title: `${title} ${index + 1}`, detail: row })} className="flex w-full items-center justify-between gap-2 rounded-xl bg-muted/60 px-3 py-2 text-left text-xs text-muted-foreground"><span>{row}</span><FileText className="size-3.5 shrink-0 text-primary" /></button>
      ))}
    </Card>
  );
}
