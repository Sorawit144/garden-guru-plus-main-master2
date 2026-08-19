import { createFileRoute } from "@tanstack/react-router";
import { Bug, Camera, FlaskConical, Image as ImageIcon, Loader2, Trash2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { AppShell, Badge, Card, Progress, SectionTitle } from "@/components/AppShell";
import { usePlots } from "@/hooks/usePlots";
import { toast } from "sonner";
import { useDragonflyData } from "@/hooks/useDragonflyData";
import { SearchableSelect } from "@/components/SearchableSelect";

export const Route = createFileRoute("/diagnose")({
  head: () => ({
    meta: [
      { title: "AI วิเคราะห์โรคพืช — สวนอัจฉริยะ" },
      { name: "description", content: "ถ่ายรูปใบพืชเพื่อวิเคราะห์โรค แมลง และการขาดธาตุอาหาร พร้อมวิธีรักษา" },
      { property: "og:title", content: "AI วิเคราะห์โรคพืช — สวนอัจฉริยะ" },
      { property: "og:description", content: "วิเคราะห์โรคพืชจากรูปถ่ายพร้อมระดับความรุนแรงและวิธีรักษา" },
    ],
  }),
  component: DiagnosePage,
});

// โรคพืชและคำแนะนำแยกตามชนิดพืช
const DISEASE_DB: Record<string, {
  disease: string; severity: string; confidence: number;
  pest: string; nutrient: string; treatment: string[];
}[]> = {
  ทุเรียน: [
    {
      disease: "โรครากเน่าโคนเน่า (Phytophthora palmivora)",
      severity: "รุนแรง",
      confidence: 91,
      pest: "ไม่พบแมลงศัตรู",
      nutrient: "ควรเพิ่ม Calcium และ Phosphorus เพื่อเสริมความแข็งแรงราก",
      treatment: [
        "หยุดการให้น้ำ 5-7 วัน เพื่อลดความชื้นในดิน",
        "ฉีดพ่น Metalaxyl + Mancozeb รอบโคนต้นทุก 7 วัน ติดต่อ 3 ครั้ง",
        "ขูดแผลที่โคนต้น ทาด้วยปูนขาวหรือสารกำจัดเชื้อรา",
        "ใส่ปุ๋ยโพแทสเซียม (0-0-60) เพื่อกระตุ้นภูมิต้านทาน",
        "ปรับปรุงระบบระบายน้ำในแปลงปลูก",
      ],
    },
    {
      disease: "โรคใบจุดสนิม (Pestalotiopsis sp.)",
      severity: "เบา",
      confidence: 84,
      pest: "พบเพลี้ยแป้งที่ยอดอ่อนบางส่วน",
      nutrient: "ขาดธาตุ Boron — ใบม้วนและปลายใบไหม้",
      treatment: [
        "ตัดใบที่แสดงอาการออกและเผาทำลาย ห่างจากแปลง",
        "ฉีดพ่น Iprodione หรือ Carbendazim ทุก 10 วัน",
        "พ่นด้วย Boric Acid (0.1%) ทางใบเพื่อเสริม Boron",
        "ลดการให้น้ำมากเกินไปในช่วงพักต้น",
      ],
    },
  ],
  มังคุด: [
    {
      disease: "โรคผลแตก-น้ำยางไหล (Physiological disorder)",
      severity: "ปานกลาง",
      confidence: 87,
      pest: "พบเพลี้ยไฟ Scirtothrips dorsalis ที่ยอด",
      nutrient: "ขาดธาตุ Calcium — ส่งผลให้ผลแตกง่าย",
      treatment: [
        "ให้น้ำอย่างสม่ำเสมอ หลีกเลี่ยงดินแห้งกลับเปียกสลับ",
        "ฉีดพ่น Calcium Chloride 0.5% ทุก 2 สัปดาห์ก่อนเก็บเกี่ยว",
        "กำจัดเพลี้ยไฟด้วย Spinosad หรือ Abamectin",
        "คลุมโคนต้นด้วยฟางหรือเปลือกไม้เพื่อรักษาความชื้น",
      ],
    },
    {
      disease: "โรคเปลือกแข็ง-ยางในผล (Gamboge disorder)",
      severity: "ปานกลาง",
      confidence: 78,
      pest: "ไม่พบแมลงศัตรู",
      nutrient: "ขาดน้ำในช่วงก่อนเก็บเกี่ยว",
      treatment: [
        "รักษาระดับความชื้นดินให้คงที่ 60-70% ตลอดฤดูกาล",
        "งดการให้ปุ๋ยไนโตรเจนสูงในช่วงออกผล",
        "เพิ่มปุ๋ยอินทรีย์เพื่อปรับสมดุล pH ดิน",
      ],
    },
  ],
  ลำไย: [
    {
      disease: "โรคใบไหม้-ขาดแมกนีเซียม (Mg Deficiency)",
      severity: "เบา",
      confidence: 92,
      pest: "ไม่พบแมลง",
      nutrient: "ขาดธาตุ Magnesium และ Sulfur อย่างเห็นได้ชัด",
      treatment: [
        "พ่น Magnesium Sulfate (Epsom Salt) 1-2% ทางใบทุก 2 สัปดาห์",
        "ปรับ pH ดินให้อยู่ที่ 5.5-6.5 ด้วยปูนโดโลไมต์",
        "ใส่ปุ๋ยสูตร 15-15-15 หรือ 16-16-16 ทุก 2 เดือน",
        "ตรวจสอบค่า pH น้ำชลประทานไม่ให้เกิน 7.0",
      ],
    },
    {
      disease: "โรคราแป้ง (Powdery Mildew)",
      severity: "เบา",
      confidence: 81,
      pest: "พบไรแดง (Spider mite) ระหว่างแล้ง",
      nutrient: "สมดุลธาตุอาหารดี แต่ควรเพิ่ม Potassium",
      treatment: [
        "ฉีดพ่น Sulfur-based fungicide ทุก 7-10 วัน",
        "กำจัดไรแดงด้วย Abamectin หรือ Spiromesifen",
        "ปรับปรุงการระบายอากาศในทรงพุ่มโดยตัดแต่งกิ่ง",
        "พ่น Potassium Silicate เพื่อเสริมความแข็งแรงของเซลล์ใบ",
      ],
    },
  ],
};

// ฟังก์ชัน random โรคพืชตามชนิดพืชในสวน
function pickDisease(cropName: string) {
  const key = Object.keys(DISEASE_DB).find((k) => cropName.includes(k)) ?? "ทุเรียน";
  const list = DISEASE_DB[key] ?? DISEASE_DB["ทุเรียน"]!;
  return list[Math.floor(Math.random() * list.length)] ?? list[0]!;
}

type ScanRecord = {
  id: string;
  date: string;
  imageUrl: string;
  plotName: string;
  disease: string;
  severity: string;
};

function DiagnosePage() {
  const { plots } = usePlots();
  const { state: farmState, dashboardFarms, activeDashboardFarm, setActiveDashboardFarm } = useDragonflyData();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [result, setResult] = useState<ReturnType<typeof pickDisease> | null>(null);
  const [selectedPlotId, setSelectedPlotId] = useState<string>("");
  const [siteId, setSiteId] = useState("ทั้งหมด");
  const [history, setHistory] = useState<ScanRecord[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const scoped = siteId === "ทั้งหมด" ? plots : plots.filter((plot) => farmState.sites.find((site) => site.id === siteId)?.plotPrefixes.some((prefix) => plot.id.startsWith(prefix)));
    if (scoped.length > 0 && scoped[0] && !scoped.some((plot) => plot.id === selectedPlotId)) {
      setSelectedPlotId(scoped[0].id);
    }
  }, [plots, siteId, selectedPlotId, farmState.sites]);

  const scopedPlots = siteId === "ทั้งหมด" ? plots : plots.filter((plot) => farmState.sites.find((site) => site.id === siteId)?.plotPrefixes.some((prefix) => plot.id.startsWith(prefix)));

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("garden_guru_diagnose_history");
      if (stored) {
        try {
          setHistory(JSON.parse(stored));
        } catch (e) {}
      }
    }
  }, []);

  const analyze = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setImageUrl(url);
      setState("loading");

      const selectedPlot = plots.find((p) => p.id === selectedPlotId) ?? plots[0];
      const cropName = selectedPlot?.crop ?? "ทุเรียน";

      setTimeout(() => {
        const res = pickDisease(cropName);
        setResult(res);
        setState("done");

        const record: ScanRecord = {
          id: `scan-${Date.now()}`,
          date: new Date().toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" }),
          imageUrl: url,
          plotName: selectedPlot?.name ?? "แปลงที่เลือก",
          disease: res.disease.split(" ")[0] ?? res.disease,
          severity: res.severity,
        };

        const updated = [record, ...history].slice(0, 10);
        setHistory(updated);
        localStorage.setItem("garden_guru_diagnose_history", JSON.stringify(updated));
        toast.success("วิเคราะห์โรคพืชสำเร็จ!");
      }, 2000);
    };
    reader.readAsDataURL(file);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) analyze(file);
  };

  const reset = () => {
    setImageUrl(null);
    setState("idle");
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
    if (camRef.current) camRef.current.value = "";
  };

  const deleteHistory = (id: string) => {
    const updated = history.filter((h) => h.id !== id);
    setHistory(updated);
    localStorage.setItem("garden_guru_diagnose_history", JSON.stringify(updated));
  };

  return (
    <AppShell title="AI ตรวจโรคพืช" subtitle="ถ่ายรูปใบหรือผล แล้วให้ AI วิเคราะห์ให้">
      {/* hidden file inputs */}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />

      {/* ขอบเขตที่จะบันทึกผลตรวจ */}
      {plots.length > 0 && (
        <Card className="space-y-3">
          <p className="text-sm font-semibold">ตำแหน่งที่บันทึกผลตรวจ</p>
          <label className="block text-xs font-semibold text-muted-foreground">ฟาร์ม<select value={activeDashboardFarm.id} onChange={(event) => setActiveDashboardFarm(event.target.value)} className="mt-1.5 block w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-semibold text-foreground outline-none focus:border-primary">{dashboardFarms.map((farm) => <option key={farm.id} value={farm.id}>{farm.name} · {farm.location}</option>)}</select></label>
          <label className="block text-xs font-semibold text-muted-foreground">โซน<select value={siteId} onChange={(event) => setSiteId(event.target.value)} className="mt-1.5 block w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-semibold text-foreground outline-none focus:border-primary"><option value="ทั้งหมด">ทุกโซน</option>{farmState.sites.map((site) => <option key={site.id} value={site.id}>{site.code} · {site.name}</option>)}</select></label>
          <SearchableSelect label="แปลงและชนิดพืช" options={scopedPlots.map((plot) => ({ value: plot.id, label: `${plot.emoji} ${plot.id} · ${plot.name} · ${plot.crop}` }))} value={selectedPlotId} onChange={setSelectedPlotId} searchPlaceholder="ค้นหารหัส ชื่อแปลง หรือพืช" />
          <p className="text-[11px] text-muted-foreground">ผลตรวจจะผูกกับฟาร์ม โซน แปลง และพืชที่เลือก เพื่อส่งต่อเป็นประวัติหรือสร้างงานตรวจซ้ำได้</p>
        </Card>
      )}

      {/* upload area */}
      <Card className={`flex flex-col items-center gap-3 border-dashed py-6 text-center ${imageUrl ? "border-primary" : ""}`}>
        {imageUrl ? (
          <img src={imageUrl} alt="ภาพที่เลือก" className="h-48 w-full rounded-xl object-cover" />
        ) : (
          <span className="flex size-16 items-center justify-center rounded-full bg-primary-soft text-3xl">🌿</span>
        )}
        <p className="text-sm text-muted-foreground">
          {imageUrl ? "ภาพถูกเลือกแล้ว — กำลังประมวลผล" : "ถ่ายภาพให้เห็นใบชัดเจนในที่แสงสว่างเพียงพอ"}
        </p>
        {!imageUrl && (
          <div className="flex w-full gap-2">
            <button
              onClick={() => camRef.current?.click()}
              className="bg-primary flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-primary-foreground cursor-pointer"
            >
              <Camera className="size-4" /> ถ่ายรูป
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-semibold cursor-pointer"
            >
              <ImageIcon className="size-4" /> เลือกรูป
            </button>
          </div>
        )}
      </Card>

      {state === "loading" && (
        <Card className="flex flex-col items-center gap-3 py-6">
          <Loader2 className="size-8 animate-spin text-primary" />
          <div className="text-center">
            <p className="text-sm font-medium">กำลังวิเคราะห์ภาพด้วย AI…</p>
            <p className="text-xs text-muted-foreground mt-1">ตรวจสอบรูปแบบโรค เชื้อรา แมลง และธาตุอาหาร</p>
          </div>
        </Card>
      )}

      {state === "done" && result && (
        <>
          <SectionTitle>ผลการวิเคราะห์</SectionTitle>
          <Card>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold leading-snug">{result.disease}</p>
                <p className="text-xs text-muted-foreground mt-0.5">ความมั่นใจ {result.confidence}%</p>
              </div>
              <Badge tone={result.severity === "รุนแรง" ? "warn" : result.severity === "ปานกลาง" ? "info" : "good"}>
                {result.severity}
              </Badge>
            </div>
            <div className="mt-3">
              <Progress value={result.confidence} />
            </div>
          </Card>

          <Card className="space-y-3">
            <div className="flex items-start gap-3">
              <Bug className="mt-0.5 size-5 text-primary" />
              <div>
                <p className="text-sm font-medium">แมลงศัตรูพืช</p>
                <p className="text-xs text-muted-foreground">{result.pest}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FlaskConical className="mt-0.5 size-5 text-primary" />
              <div>
                <p className="text-sm font-medium">ธาตุอาหาร</p>
                <p className="text-xs text-muted-foreground">{result.nutrient}</p>
              </div>
            </div>
          </Card>

          <SectionTitle>วิธีรักษาที่แนะนำ</SectionTitle>
          <Card>
            <ol className="space-y-3">
              {result.treatment.map((t, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <p className="text-sm text-foreground/90">{t}</p>
                </li>
              ))}
            </ol>
          </Card>

          <button
            onClick={reset}
            className="w-full rounded-xl border border-border py-3 text-sm font-medium cursor-pointer hover:bg-muted/50 transition-colors"
          >
            วิเคราะห์รูปใหม่
          </button>
        </>
      )}

      <SectionTitle>ประวัติการวิเคราะห์</SectionTitle>
      {history.length === 0 ? (
        <Card className="text-center py-6">
          <p className="text-sm text-muted-foreground">ยังไม่มีประวัติการตรวจ — ลองอัปโหลดรูปแรกได้เลย!</p>
        </Card>
      ) : (
        <Card className="space-y-3">
          {history.map((h) => (
            <div key={h.id} className="flex items-center gap-3">
              <img src={h.imageUrl} alt="" className="size-10 rounded-lg object-cover shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{h.disease}</p>
                <p className="text-xs text-muted-foreground">{h.date} · {h.plotName}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge tone={h.severity === "รุนแรง" ? "warn" : h.severity === "ปานกลาง" ? "info" : "good"}>
                  {h.severity}
                </Badge>
                <button onClick={() => deleteHistory(h.id)} className="text-muted-foreground hover:text-destructive cursor-pointer">
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </Card>
      )}
    </AppShell>
  );
}
