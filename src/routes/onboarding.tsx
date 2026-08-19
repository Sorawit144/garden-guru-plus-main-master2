import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Badge, Card, SectionTitle } from "@/components/AppShell";
import { useDragonflyData } from "@/hooks/useDragonflyData";
import { ExperienceProgression } from "@/components/ExperienceProgression";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Onboarding — EasyPlants" },
      { name: "description", content: "ตั้งค่าโปรไฟล์ฟาร์มเพื่อปรับประสบการณ์ EasyPlants ให้เหมาะกับผู้ใช้" },
    ],
  }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const { persona, state, setPersona } = useDragonflyData();
  const p = persona.profile;

  return (
    <AppShell title="ตั้งค่าโปรไฟล์ฟาร์ม" subtitle="แยกความรู้เกษตรออกจากขนาดการดำเนินงาน">
      <Card className="border-primary/30 bg-primary-soft/60">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-primary">{persona.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">{persona.role}</p>
          </div>
          <Badge tone={persona.subscription === "Farm Pro" ? "good" : "muted"}>{persona.subscription}</Badge>
        </div>
      </Card>

      <ExperienceProgression persona={persona} onAdvance={setPersona} />

      <SectionTitle>คำตอบ Onboarding</SectionTitle>
      <Card className="space-y-3">
        {[
          ["Farming Type", p.farmingType],
          ["Experience", p.experience],
          ["Farm Size", p.farmSize],
          ["Workforce", p.workforce],
          ["Technology / IoT", p.technology.join(", ")],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3 border-b border-border pb-2 last:border-b-0 last:pb-0">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className="text-right text-xs font-medium">{value}</span>
          </div>
        ))}
      </Card>

      <SectionTitle>มิติที่ระบบนำไปปรับ UX</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <p className="text-[11px] text-muted-foreground">Knowledge Level</p>
          <p className="mt-1 text-lg font-bold text-primary">{p.knowledgeLevel}</p>
          <p className="mt-1 text-xs text-muted-foreground">ใช้กำหนดคำอธิบาย tutorial และคำแนะนำ</p>
        </Card>
        <Card>
          <p className="text-[11px] text-muted-foreground">Operation Scale</p>
          <p className="mt-1 text-lg font-bold text-primary">{p.operationScale}</p>
          <p className="mt-1 text-xs text-muted-foreground">ใช้กำหนด dashboard และ module ที่เน้น</p>
        </Card>
      </div>

      <SectionTitle>ข้อมูลฟาร์มที่กำลังใช้</SectionTitle>
      <Card>
        <p className="font-semibold">{state.farm.name}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {state.farm.type} · {state.farm.areaRai.toLocaleString("th-TH")} ไร่ · {state.farm.workerCount} คนงาน
        </p>
        <Link
          to="/"
          className="mt-4 block rounded-xl bg-primary py-3 text-center text-sm font-semibold text-primary-foreground"
        >
          ไปหน้า Dashboard ที่ปรับแล้ว
        </Link>
      </Card>
    </AppShell>
  );
}
