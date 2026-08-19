import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Badge, Card, Progress, SectionTitle, baht } from "@/components/AppShell";
import { damageRecords, disasterAreas, disasterStatus } from "@/lib/farm-data";
import { useDragonflyData } from "@/hooks/useDragonflyData";
import { SearchableSelect } from "@/components/SearchableSelect";

export const Route = createFileRoute("/disaster")({
  head: () => ({
    meta: [
      { title: "น้ำท่วมและภัยแล้ง — สวนอัจฉริยะ" },
      { name: "description", content: "ติดตามระดับน้ำ ความชื้นดิน ความเสี่ยงน้ำท่วมและภัยแล้งในแปลงและพื้นที่รอบข้าง พร้อมบันทึกหลักฐานขอชดเชยความเสียหาย" },
      { property: "og:title", content: "น้ำท่วมและภัยแล้ง — สวนอัจฉริยะ" },
      { property: "og:description", content: "เฝ้าระวังภัยธรรมชาติและเก็บหลักฐานความเสียหายไว้ใช้ยื่นขอชดเชย" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DisasterPage,
});

function DisasterPage() {
  const s = disasterStatus;
  const { dashboardFarms, activeDashboardFarm, setActiveDashboardFarm } = useDragonflyData();
  const [riskFilter, setRiskFilter] = useState("ทั้งหมด");
  const [statusFilter, setStatusFilter] = useState("ทั้งหมด");
  const [areaFilter, setAreaFilter] = useState("ทั้งหมด");
  const [hazardFilter, setHazardFilter] = useState("ทั้งหมด");
  const filteredAreas = disasterAreas.filter((area) =>
    (statusFilter === "ทั้งหมด" || area.status === statusFilter) &&
    (areaFilter === "ทั้งหมด" || area.name === areaFilter) &&
    (hazardFilter === "ทั้งหมด" || (hazardFilter === "น้ำท่วม" ? area.status.includes("น้ำท่วม") || area.status === "เฝ้าระวัง" : area.status.includes("แล้ง"))) &&
    (riskFilter === "ทั้งหมด" || (riskFilter === "สูง" ? area.risk > 60 : riskFilter === "กลาง" ? area.risk > 35 && area.risk <= 60 : area.risk <= 35))
  );
  const filteredDamageRecords = damageRecords.filter((record) => areaFilter === "ทั้งหมด" || record.plot === areaFilter);
  return (
    <AppShell title="น้ำท่วม & ภัยแล้ง" subtitle={`${activeDashboardFarm.name} · อัปเดตทุก 1 ชม.`}>
      <Card className="border-primary/25 bg-primary-soft/45">
        <SearchableSelect label="ฟาร์มที่กำลังประเมิน" options={dashboardFarms.map((farm) => ({ value: farm.id, label: `${farm.name} · ${farm.location}` }))} value={activeDashboardFarm.id} onChange={setActiveDashboardFarm} searchPlaceholder="ค้นหาชื่อฟาร์มหรือพื้นที่" />
        <p className="mt-2 text-[11px] text-muted-foreground">ข้อมูลความเสี่ยงด้านล่างเป็นข้อมูลตัวอย่างของพื้นที่และแปลงใน Demo Mode</p>
      </Card>
      <Card className="bg-primary border-0 text-primary-foreground">
        <p className="text-sm text-primary-foreground/85">สถานะพื้นที่ตอนนี้</p>
        <p className="mt-1 text-2xl font-bold">{s.level}</p>
        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
          {[
            { l: "ระดับน้ำ", v: `${s.waterLevel} ม.` },
            { l: "เปลี่ยนแปลง", v: `+${s.waterLevelChange} ม.` },
            { l: "ชื้นดิน", v: `${s.soilMoisture}%` },
            { l: "ฝน 7 วัน", v: `${s.rain7d} มม.` },
          ].map((i) => (
            <div key={i.l} className="rounded-xl bg-white/15 py-2">
              <p className="text-sm font-bold">{i.v}</p>
              <p className="text-[11px] text-primary-foreground/80">{i.l}</p>
            </div>
          ))}
        </div>
      </Card>

      <SectionTitle>ความเสี่ยงรายพื้นที่</SectionTitle>
      <Card className="space-y-3">
        <SearchableSelect label="พื้นที่/แปลงที่ได้รับผลกระทบ" options={["ทั้งหมด", ...disasterAreas.map((area) => area.name)]} value={areaFilter} onChange={setAreaFilter} allLabel="ทุกพื้นที่" searchPlaceholder="ค้นหาชื่อแปลงหรือพื้นที่" />
        <SearchableSelect label="ประเภทความเสี่ยง" options={["ทั้งหมด", "น้ำท่วม", "ภัยแล้ง"]} value={hazardFilter} onChange={setHazardFilter} allLabel="ทุกประเภท" searchPlaceholder="ค้นหาประเภทภัย" />
        <SearchableSelect label="ระดับความเสี่ยง" options={["ทั้งหมด", "สูง", "กลาง", "ต่ำ"]} value={riskFilter} onChange={setRiskFilter} allLabel="ทุกระดับ" searchPlaceholder="ค้นหาระดับความเสี่ยง" />
        <SearchableSelect label="สถานะพื้นที่" options={["ทั้งหมด", ...Array.from(new Set(disasterAreas.map((area) => area.status)))]} value={statusFilter} onChange={setStatusFilter} allLabel="ทุกสถานะ" searchPlaceholder="ค้นหาสถานะพื้นที่" />
        <p className="text-xs text-muted-foreground">กำลังแสดง {filteredAreas.length} จาก {disasterAreas.length} พื้นที่ · ตัวกรองนี้ใช้กับรายการพื้นที่และหลักฐานด้านล่าง</p>
      </Card>
      <div className="space-y-3">
        {filteredAreas.map((a) => (
          <Card key={a.id}>
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-lg">
                {a.status === "เสี่ยงแล้ง" ? "🌵" : a.status === "ปกติ" ? "✅" : "🌊"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{a.name}</p>
                <p className="truncate text-xs text-muted-foreground">{a.note}</p>
              </div>
              <Badge tone={a.risk > 60 ? "bad" : a.risk > 35 ? "warn" : "good"}>{a.status}</Badge>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Progress value={a.risk} />
              <span className="w-10 shrink-0 text-right text-xs text-muted-foreground">{a.risk}%</span>
            </div>
          </Card>
        ))}
        {filteredAreas.length === 0 ? <Card className="py-8 text-center text-sm text-muted-foreground">ไม่มีพื้นที่ที่ตรงกับตัวกรอง</Card> : null}
      </div>

      <SectionTitle>บันทึกความเสียหาย (ใช้เป็นหลักฐาน)</SectionTitle>
      <div className="space-y-3">
        {filteredDamageRecords.map((d) => (
          <Card key={d.id}>
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-lg">
                📋
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{d.event}</p>
                <p className="text-xs text-muted-foreground">
                  {d.date} · {d.plot} · {d.area} ไร่
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  ภาพถ่ายพร้อมพิกัด {d.photos} รูป · ประเมินความเสียหาย{" "}
                  <span className="font-medium text-destructive">{baht(-d.loss)}</span>
                </p>
              </div>
              <Badge tone="info">{d.status}</Badge>
            </div>
          </Card>
        ))}
        {filteredDamageRecords.length === 0 ? <Card className="py-6 text-center text-sm text-muted-foreground">ยังไม่มีบันทึกความเสียหายในขอบเขตที่เลือก</Card> : null}
        <button className="w-full rounded-2xl border border-dashed border-primary/40 bg-primary-soft py-3 text-sm font-medium text-primary active:scale-[0.99]">
          + บันทึกความเสียหายใหม่ (ถ่ายรูป + พิกัด)
        </button>
      </div>

      <Card className="border-primary/30 bg-primary/10">
        <p className="text-sm font-semibold">เอกสารขอชดเชย</p>
        <p className="mt-1 text-xs text-muted-foreground">
          ระบบรวมภาพถ่าย พิกัด GPS วันเวลา และข้อมูลปริมาณฝน/ระดับน้ำ เป็นไฟล์ PDF
          สำหรับยื่นเกษตรอำเภอหรือบริษัทประกันได้ทันที
        </p>
        <button className="mt-3 w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground active:scale-[0.99]">
          สร้างเอกสาร PDF
        </button>
      </Card>
    </AppShell>
  );
}
