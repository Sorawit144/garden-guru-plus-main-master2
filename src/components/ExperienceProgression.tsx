import { ArrowRight, LockKeyhole, Sparkles } from "lucide-react";
import { Badge, Card } from "@/components/AppShell";
import { experienceStages, type DemoPersona, type DemoPersonaId } from "@/lib/dragonfly-data";

export function ExperienceProgression({ persona, onAdvance }: { persona: DemoPersona; onAdvance: (id: DemoPersonaId) => void }) {
  const currentIndex = experienceStages.findIndex((stage) => stage.id === persona.id);
  if (currentIndex < 0) {
    return <Card className="border-primary/25 bg-primary-soft/55"><p className="text-sm font-semibold text-primary">บัญชีพนักงานภาคสนาม</p><p className="mt-1 text-xs text-muted-foreground">ใช้หน้างานของฉันเพื่อรับงาน เช็กอิน รายงานปัญหา และส่งหลักฐานงาน โดยไม่เห็นข้อมูลการเงินหรือการตั้งค่าระดับผู้จัดการ</p></Card>;
  }
  const next = experienceStages[currentIndex + 1];
  if (!next) {
    return <Card className="border-primary/25 bg-primary-soft/55"><p className="text-sm font-semibold text-primary">คุณอยู่ระดับองค์กร/ส่งออก</p><p className="mt-1 text-xs text-muted-foreground">ใช้ศูนย์ปฏิบัติการ 360 เพื่อติดตามฟาร์ม โซน ทีม และล็อตผลิตในภาพเดียว</p></Card>;
  }

  return (
    <Card className="border-primary/30 bg-primary-soft/55">
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-[11px] font-semibold text-primary">ระดับการใช้งานปัจจุบัน · {experienceStages[currentIndex]?.title}</p><p className="mt-1 text-sm font-semibold">พร้อมไปขั้น {next.title} ไหม?</p></div>
        {next.requiresPro ? <Badge tone="warn"><LockKeyhole className="mr-1 inline size-3" />Farm Pro</Badge> : <Sparkles className="size-5 text-primary" />}
      </div>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{next.summary}</p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        {next.unlocks.map((item) => <div key={item} className="rounded-lg border border-primary/15 bg-card px-2.5 py-2 font-medium text-foreground">{item}</div>)}
      </div>
      <button onClick={() => onAdvance(next.id)} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary py-2.5 text-xs font-semibold text-primary-foreground">
        {next.requiresPro ? "ทดลองมุมมอง Farm Pro" : "ไปขั้นถัดไป"} <ArrowRight className="size-3.5" />
      </button>
      {next.requiresPro ? <p className="mt-2 text-[11px] text-muted-foreground">ในระบบจริง เครื่องมือระดับนี้ต้องสมัคร Farm Pro ก่อนใช้งานและมอบสิทธิ์ให้ผู้ใช้</p> : null}
    </Card>
  );
}
