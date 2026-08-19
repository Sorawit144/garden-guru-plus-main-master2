import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, FileSpreadsheet, FileText, FolderOpen } from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { AppShell, Card, SectionTitle, baht } from "@/components/AppShell";
import { monthlyFinance } from "@/lib/farm-data";
import { useDragonflyData } from "@/hooks/useDragonflyData";
import { SearchableSelect } from "@/components/SearchableSelect";
import { TimeRangeFilter } from "@/components/TimeRangeFilter";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "รายงานสรุป — สวนอัจฉริยะ" },
      { name: "description", content: "ออกรายงาน PDF และ Excel พร้อมกราฟสรุปผลการดำเนินงานรายเดือน" },
      { property: "og:title", content: "รายงานสรุป — สวนอัจฉริยะ" },
      { property: "og:description", content: "สรุปรายเดือน ต้นทุน ผลผลิต และสุขภาพพืชในรูปแบบรายงาน" },
    ],
  }),
  component: ReportsPage,
});

const reportCatalog = [
  { id: "overview", title: "รายงานสรุปผลการดำเนินงานฟาร์ม", type: "ภาพรวม", desc: "ภาพรวมรายรับ ต้นทุน ผลผลิต งาน และประเด็นที่ต้องติดตาม", includes: ["รายรับและต้นทุน", "ผลผลิตตามแปลง", "งานเสร็จและล่าช้า", "Compliance ที่ต้องดำเนินการ"], source: "ธุรกรรม, Task, แผนผลผลิต และศูนย์เอกสาร" },
  { id: "finance", title: "รายงานรายรับ รายจ่าย และกำไร", type: "การเงิน", desc: "สรุปกระแสเงินสดและกำไรตามสวน แปลง และช่วงเวลา", includes: ["รายรับจากการขาย", "ต้นทุนตามหมวด", "กำไรสุทธิ", "ต้นทุนต่อไร่"], source: "รายการรายรับ/รายจ่ายและข้อมูลการขายที่ผู้ใช้บันทึก" },
  { id: "cost-per-rai", title: "รายงานต้นทุนต่อไร่และต่อรอบปลูก", type: "การเงิน", desc: "เปรียบเทียบประสิทธิภาพต้นทุนระหว่างแปลงและรอบการผลิต", includes: ["ปุ๋ยและสาร", "แรงงาน", "น้ำและพลังงาน", "ต้นทุนรวมต่อไร่"], source: "งานที่อนุมัติ, การเบิกคลัง และรายการค่าใช้จ่าย" },
  { id: "yield", title: "รายงานผลผลิตจริงและผลผลิตคาดการณ์", type: "ผลผลิต", desc: "เปรียบเทียบผลผลิตที่เก็บจริงกับค่าคาดการณ์ของระบบ", includes: ["น้ำหนักจริง", "ผลผลิตคาดการณ์", "ความคลาดเคลื่อน", "ผลผลิตต่อไร่"], source: "Harvest Lot, ใบชั่ง และค่าประมาณการจากระบบ/AI" },
  { id: "sales", title: "รายงานผลผลิตและยอดขายตามช่องทาง", type: "ผลผลิต", desc: "แสดงปริมาณขาย ราคา และรายได้แยกตามช่องทางและเกรด", includes: ["ช่องทางขาย", "เกรดผลผลิต", "ราคาขาย", "รายได้คาดหวังและรายได้จริง"], source: "Harvest/Packing Lot และรายการขาย" },
  { id: "labor", title: "รายงานภาระงานและประสิทธิภาพทีม", type: "แรงงาน", desc: "ติดตามจำนวนงานที่รับผิดชอบ งานล่าช้า และการตรวจรับของแต่ละทีม", includes: ["งานเปิดและงานเสร็จ", "งานล่าช้า", "รอตรวจรับ", "ผู้รับผิดชอบ"], source: "Task, Work Order และผลอนุมัติของหัวหน้างาน" },
  { id: "phi", title: "รายงานการใช้สารและสถานะ PHI", type: "Compliance", desc: "ตรวจวันใช้สาร ระยะเว้น และล็อตที่เก็บเกี่ยวได้หรือยัง", includes: ["สารและ Lot สาร", "วันที่ใช้ล่าสุด", "วันเก็บได้เร็วสุด", "ผ่าน/รอ PHI"], source: "แบบปิดงานใช้สารและกฎ PHI ของสารแต่ละชนิด" },
  { id: "documents", title: "รายงานความครบถ้วนของเอกสารและใบรับรอง", type: "Compliance", desc: "ตรวจเอกสารที่อนุมัติ รอตรวจ ขาด หรือใกล้หมดอายุ", includes: ["GAP และใบรับรอง", "ผล Lab", "QA", "เอกสารส่งออก"], source: "ศูนย์เอกสารและประวัติการอนุมัติ" },
] as const;

const yieldChart = [
  { month: "มี.ค.", actual: 18, forecast: 20 }, { month: "เม.ย.", actual: 24, forecast: 25 }, { month: "พ.ค.", actual: 31, forecast: 29 }, { month: "มิ.ย.", actual: 39, forecast: 41 }, { month: "ก.ค.", actual: 46, forecast: 48 },
];
const laborChart = [
  { month: "สัปดาห์ 1", completed: 42, delayed: 5 }, { month: "สัปดาห์ 2", completed: 48, delayed: 3 }, { month: "สัปดาห์ 3", completed: 39, delayed: 8 }, { month: "สัปดาห์ 4", completed: 51, delayed: 2 },
];
const complianceChart = [
  { month: "สาร/PHI", approved: 14, pending: 2 }, { month: "QA", approved: 9, pending: 3 }, { month: "ใบรับรอง", approved: 4, pending: 1 }, { month: "ส่งออก", approved: 7, pending: 2 },
];

function ReportsPage() {
  const { dashboardFarms, activeDashboardFarm, setActiveDashboardFarm, state, persona, addDocument } = useDragonflyData();
  const [plot, setPlot] = useState("ทั้งหมด");
  const [category, setCategory] = useState("ภาพรวม");
  const [period, setPeriod] = useState("ปีนี้");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });
  const [exportMessage, setExportMessage] = useState("");
  const [generatedReport, setGeneratedReport] = useState<{ format: "PDF" | "Excel"; title: string; fileName: string; farm: string; plot: string; period: string }>();
  const reportPlots = ["ทั้งหมด", ...state.plots.map((item) => item.id)];
  const visibleReports = reportCatalog.filter((report) => category === "ภาพรวม" ? report.type === "ภาพรวม" : report.type === category);
  const chart = category === "ผลผลิต"
    ? { title: "ผลผลิตจริงเทียบผลผลิตคาดการณ์", description: "หน่วย: ตันต่อเดือน · ใช้ข้อมูล Harvest Lot เทียบค่าคาดการณ์จากระบบ", data: yieldChart, series: [{ key: "actual", label: "ผลผลิตจริง", color: "var(--color-primary)" }, { key: "forecast", label: "คาดการณ์", color: "var(--chart-3)" }], unit: "ตัน", source: "ข้อมูลตัวอย่างจาก Harvest Lot และแบบจำลองผลผลิต" }
    : category === "แรงงาน"
      ? { title: "จำนวนงานของทีมรายสัปดาห์", description: "หน่วย: งาน · เปรียบเทียบงานที่อนุมัติแล้วกับงานล่าช้า", data: laborChart, series: [{ key: "completed", label: "งานที่อนุมัติแล้ว", color: "var(--color-primary)" }, { key: "delayed", label: "งานล่าช้า", color: "var(--color-destructive)" }], unit: "งาน", source: "ข้อมูลตัวอย่างจาก Task และ Work Order" }
      : category === "Compliance"
        ? { title: "ความครบถ้วนของ Compliance ตามหมวด", description: "หน่วย: เอกสาร/รายการตรวจ · แสดงรายการผ่านและรายการที่ยังรอตรวจ", data: complianceChart, series: [{ key: "approved", label: "อนุมัติแล้ว", color: "var(--color-primary)" }, { key: "pending", label: "รอตรวจ/ขาด", color: "var(--chart-3)" }], unit: "รายการ", source: "ข้อมูลตัวอย่างจากศูนย์เอกสาร, PHI และ QA" }
        : { title: "รายรับและต้นทุนรายเดือน", description: "หน่วย: บาท · เปรียบเทียบรายรับจากการขายกับค่าใช้จ่ายที่บันทึก", data: monthlyFinance, series: [{ key: "income", label: "รายรับ", color: "var(--color-primary)" }, { key: "cost", label: "ต้นทุน", color: "var(--chart-3)" }], unit: "บาท", source: "ข้อมูลการเงินตัวอย่าง ไม่ใช่ข้อมูลบัญชีจริง" };
  const periodLabel = period === "custom" ? `กำหนดเอง ${customRange.start || "ไม่ระบุวันเริ่ม"} ถึง ${customRange.end || "ไม่ระบุวันสิ้นสุด"}` : period;
  const createReportDocument = (format: "PDF" | "Excel", reportTitle: string) => {
    if (period === "custom" && (!customRange.start || !customRange.end)) { setExportMessage("กรุณาเลือกวันที่เริ่มต้นและสิ้นสุดก่อนสร้างรายงาน"); return; }
    const stamp = new Date().toISOString().slice(0, 10);
    const title = `${reportTitle} · ${activeDashboardFarm.name}`;
    const fileName = `${reportTitle.replace(/\s+/g, "-")}-${stamp}.${format === "PDF" ? "pdf" : "xlsx"}`;
    addDocument({ title, typeId: "DOC-TYPE-REPORT", category: "รายงานจากระบบ", source: "system", farmId: activeDashboardFarm.id, plotId: plot === "ทั้งหมด" ? undefined : plot, documentNumber: `REPORT-${Date.now()}`, issuedAt: stamp, fileName, status: "Approved", uploadedBy: persona.role, approvedBy: "ระบบ EasyPlants", notes: `ประเภท ${category} · ช่วงเวลา ${periodLabel}` });
    setExportMessage(`สร้าง ${format}: ${title} · ${plot} · ${periodLabel} และเก็บในศูนย์เอกสารแล้ว`);
    setGeneratedReport({ format, title, fileName, farm: activeDashboardFarm.name, plot: plot === "ทั้งหมด" ? "ทุกแปลง" : `แปลง ${plot}`, period: periodLabel });
  };

  return (
    <AppShell title="รายงาน" subtitle="วิเคราะห์ตามฟาร์ม แปลง ประเภท และช่วงเวลา">
      <SectionTitle>ขอบเขตรายงาน</SectionTitle>
      <Card className="space-y-3">
        <ReportSelect label="ฟาร์ม" value={activeDashboardFarm.id} onChange={setActiveDashboardFarm} options={dashboardFarms.map((farm) => ({ value: farm.id, label: `${farm.name} · ${farm.location}` }))} />
        <SearchableSelect label="แปลง" value={plot} onChange={setPlot} options={reportPlots} allLabel="ทุกแปลง" searchPlaceholder="ค้นหารหัสหรือชื่อแปลง" />
        <ReportSelect label="ประเภทข้อมูล" value={category} onChange={setCategory} options={["ภาพรวม", "การเงิน", "ผลผลิต", "แรงงาน", "Compliance"].map((value) => ({ value, label: value }))} />
        <TimeRangeFilter label="ช่วงเวลา" value={period} onChange={setPeriod} options={["เดือนนี้", "ไตรมาสนี้", "ปีนี้"].map((value) => ({ value, label: value }))} dateRange={customRange} onDateRangeChange={setCustomRange} />
        <p className="text-[11px] text-muted-foreground">Role กำหนดสิทธิ์เข้าถึงรายงาน ส่วนตัวกรองนี้กำหนดเฉพาะข้อมูลในรายงานฉบับที่กำลังดู</p>
      </Card>
      <SectionTitle>{chart.title}</SectionTitle>
      <Card>
        <p className="text-xs leading-relaxed text-muted-foreground">{chart.description}</p>
        <div className="mt-3 flex flex-wrap gap-3">{chart.series.map((series) => <span key={series.key} className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className="size-2.5 rounded-sm" style={{ backgroundColor: series.color }} />{series.label}</span>)}</div>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart.data}>
              <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} />
              <Tooltip formatter={(value: number, name: string) => [chart.unit === "บาท" ? baht(value) : `${value.toLocaleString("th-TH")} ${chart.unit}`, chart.series.find((series) => series.key === name)?.label ?? name]} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              {chart.series.map((series) => <Bar key={series.key} dataKey={series.key} fill={series.color} radius={[4, 4, 0, 0]} />)}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="border-t border-border pt-3 text-[11px] text-muted-foreground">แหล่งข้อมูล: {chart.source} · ขอบเขตปัจจุบัน: {activeDashboardFarm.name} · {plot === "ทั้งหมด" ? "ทุกแปลง" : `แปลง ${plot}`} · {periodLabel}</p>
      </Card>

      <SectionTitle>รายงานประเภท {category}</SectionTitle>
      {visibleReports.map((r) => (
        <Card key={r.id}>
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary"><FileText className="size-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{r.title}</p>
              <p className="mt-1 text-[11px] font-semibold text-primary">ประเภท: {r.type}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{r.desc}</p>
            </div>
          </div>
          <div className="mt-3 border-t border-border pt-3"><p className="text-[11px] font-semibold">ข้อมูลในรายงาน</p><div className="mt-2 flex flex-wrap gap-1.5">{r.includes.map((item) => <span key={item} className="rounded-md bg-muted px-2 py-1 text-[10px] text-muted-foreground">{item}</span>)}</div><p className="mt-2 text-[11px] text-muted-foreground">แหล่งข้อมูล: {r.source}</p><p className="mt-1 text-[11px] text-muted-foreground">ขอบเขตไฟล์: {activeDashboardFarm.name} · {plot === "ทั้งหมด" ? "ทุกแปลง" : plot} · {periodLabel}</p></div>
          <div className="mt-3 flex gap-2">
            <button onClick={() => createReportDocument("PDF", r.title)} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border py-2 text-xs font-medium">
              <FileText className="size-4 text-destructive" /> PDF
            </button>
            <button onClick={() => createReportDocument("Excel", r.title)} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border py-2 text-xs font-medium">
              <FileSpreadsheet className="size-4 text-primary" /> Excel
            </button>
          </div>
        </Card>
      ))}
      {exportMessage ? <Card className="border-primary/25 bg-primary-soft/45 text-xs text-primary">{exportMessage}<p className="mt-1 text-muted-foreground">Demo Mode: สร้าง metadata และชื่อไฟล์ตัวอย่าง ระบบจริงต้องเชื่อมบริการสร้างไฟล์และ Object Storage</p></Card> : null}
      <Dialog open={Boolean(generatedReport)} onOpenChange={(open) => { if (!open) setGeneratedReport(undefined); }}>
        <DialogContent>
          <DialogHeader><div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary-soft text-primary"><CheckCircle2 className="size-7" /></div><DialogTitle className="pt-2 text-center">สร้างรายงานสำเร็จ</DialogTitle><DialogDescription className="text-center">รายงานถูกลงทะเบียนไว้ในศูนย์เอกสารแล้ว</DialogDescription></DialogHeader>
          {generatedReport ? <div className="space-y-3"><div className="rounded-lg border border-border bg-muted/40 p-4"><div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-card text-primary">{generatedReport.format === "PDF" ? <FileText className="size-5" /> : <FileSpreadsheet className="size-5" />}</span><div className="min-w-0"><p className="text-sm font-semibold">{generatedReport.title}</p><p className="mt-1 break-all text-xs text-muted-foreground">{generatedReport.fileName}</p><p className="mt-1 text-[11px] font-semibold text-primary">รูปแบบ {generatedReport.format}</p></div></div><div className="mt-3 space-y-2 border-t border-border pt-3 text-xs"><InfoRow label="สวน" value={generatedReport.farm} /><InfoRow label="แปลง" value={generatedReport.plot} /><InfoRow label="ช่วงเวลา" value={generatedReport.period} /><InfoRow label="จัดเก็บที่" value="ศูนย์เอกสาร / รายงานจากระบบ" /></div></div><div className="rounded-lg bg-primary-soft/50 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">Demo Mode: ตัวอย่างนี้สร้างชื่อไฟล์และ metadata แล้ว แต่ยังไม่มีไฟล์ PDF/Excel จริงให้ดาวน์โหลด เมื่อเชื่อมระบบสร้างไฟล์ ปุ่มดาวน์โหลดจะปรากฏในตำแหน่งนี้</div><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setGeneratedReport(undefined)} className="min-h-11 rounded-lg border border-border text-xs font-semibold">ปิด</button><Link to="/documents" className="flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-primary text-xs font-semibold text-primary-foreground"><FolderOpen className="size-4" />เปิดศูนย์เอกสาร</Link></div></div> : null}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-3"><span className="shrink-0 text-muted-foreground">{label}</span><span className="text-right font-medium">{value}</span></div>;
}

function ReportSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) {
  return <label className="block text-xs font-semibold text-muted-foreground">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1.5 block w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-semibold text-foreground outline-none focus:border-primary">{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}
