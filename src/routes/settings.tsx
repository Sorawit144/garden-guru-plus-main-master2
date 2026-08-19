import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, RotateCcw, UserRoundCog } from "lucide-react";
import { AppShell, Badge, Card, SectionTitle } from "@/components/AppShell";
import { useDragonflyData } from "@/hooks/useDragonflyData";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — EasyPlants" },
      { name: "description", content: "ตั้งค่าบัญชี แพ็กเกจ และโปรไฟล์ฟาร์ม" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { mode, isDemoMode, persona, state, resetDemo } = useDragonflyData();

  return (
    <AppShell title="โปรไฟล์และการตั้งค่า" subtitle="บัญชี แพ็กเกจ และความชอบการแสดงผล">
      <Card>
        <div className="flex items-center gap-3">
          <UserRoundCog className="size-6 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{persona.label}</p>
            <p className="text-xs text-muted-foreground">{persona.profile.operationScale} · {persona.profile.farmingType}</p>
          </div>
          <Badge tone={persona.subscription === "Farm Pro" ? "good" : "muted"}>{persona.subscription}</Badge>
        </div>
      </Card>



      <SectionTitle>องค์กรและแพ็กเกจ</SectionTitle>
      <Card className="flex items-start gap-3">
        <Building2 className="mt-0.5 size-5 shrink-0 text-primary" />
        <div>
          <p className="text-sm font-semibold">{state.farm.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {persona.subscription === "Farm Pro"
              ? "Farm Pro เปิดงานทีม, Workforce, หลายฟาร์ม และการควบคุมปฏิบัติการ"
              : "Free ใช้จัดการสวนส่วนตัวและผู้ช่วยสวนพื้นฐานได้"}
          </p>
        </div>
      </Card>

      {isDemoMode ? (
        <>
          <SectionTitle>Demo</SectionTitle>
          <Card className="space-y-3 border-primary/30 bg-primary-soft/50">
            <p className="text-sm font-semibold text-primary">ข้อมูลตัวอย่าง</p>
            <p className="text-xs text-muted-foreground">
              โหมดข้อมูล: {mode} การรีเซ็ตจะคืนค่าแปลง งาน ทีม IoT และ Traceability ของมุมมองตัวอย่างปัจจุบัน
            </p>
            <button
              onClick={() => {
                if (window.confirm("Reset all demo changes? This will restore the original demonstration dataset.")) {
                  resetDemo();
                }
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground"
            >
              <RotateCcw className="size-4" /> รีเซ็ตข้อมูลตัวอย่าง
            </button>
          </Card>
        </>
      ) : null}
    </AppShell>
  );
}
