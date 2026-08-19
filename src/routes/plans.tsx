import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Check, Crown, ShieldCheck, Sparkles, Users } from "lucide-react";
import { AppShell, Badge, Card, SectionTitle } from "@/components/AppShell";
import { useDragonflyData } from "@/hooks/useDragonflyData";

export const Route = createFileRoute("/plans")({
  head: () => ({
    meta: [
      { title: "แผนและสมาชิก — EasyPlants" },
      { name: "description", content: "เปรียบเทียบแผน Free, Pro และ Pro Max พร้อมสิทธิ์สมาชิกและฟีเจอร์" },
    ],
  }),
  component: PlansPage,
});

const plans = [
  {
    id: "Free",
    name: "Free",
    audience: "เริ่มดูแลสวนส่วนตัว หรือทดลองระบบ",
    description: "มีเครื่องมือพื้นฐานที่จำเป็นสำหรับบันทึก ดูแปลง และติดตามงานของตัวเอง",
    features: ["สวนและแปลงพื้นฐาน", "Todo และปฏิทินงานส่วนตัว", "อากาศ ราคาตลาด ตรวจโรค", "ต้นทุนและรายได้พื้นฐาน", "EasyPlants Academy"],
  },
  {
    id: "Pro",
    name: "Pro",
    audience: "สวนเชิงพาณิชย์ที่เริ่มมีคนและหลายแปลง",
    description: "ใช้บริหารงานทีม ผลผลิต สต็อก และรายงานในขอบเขตองค์กรเดียว",
    features: ["ทีม บทบาท และ Work Order", "ปฏิทินพืช AI และคาดการณ์ผลผลิต", "คลัง การจัดซื้อ และเครื่องจักร", "รายงาน PDF/Excel", "IoT Rules และการแจ้งเตือน"],
  },
  {
    id: "Pro Max",
    name: "Pro Max",
    audience: "องค์กรหลายสวนที่ต้องควบคุมมาตรฐานและตรวจสอบย้อนหลัง",
    description: "เพิ่มการควบคุมข้ามฟาร์ม การอนุมัติ และการจัดการข้อมูลระดับองค์กร",
    features: ["หลายสวน หลายหน่วยงาน", "Role และสิทธิ์กำหนดเอง", "Approval flow และ Audit log", "Traceability เอกสาร PHI/QA", "Analytics และ IoT Automation ระดับองค์กร"],
  },
] as const;

const comparisons = [
  ["ขอบเขตการใช้งาน", "สวนส่วนตัว", "สวนเชิงพาณิชย์", "องค์กรหลายสวน"],
  ["สมาชิกและทีม", "ผู้ช่วยสวนพื้นฐาน", "ทีม หัวหน้าทีม และ Work Order", "ทีมข้ามสวน และ Role กำหนดเอง"],
  ["การเงินและผลผลิต", "บันทึกรายรับรายจ่าย", "ต้นทุน/แปลง และคาดการณ์ยอดขาย", "วิเคราะห์ข้ามสวนและมาตรฐานองค์กร"],
  ["เอกสารและตรวจสอบ", "บันทึกกิจกรรม", "รายงาน PDF/Excel", "PHI, QA, Traceability และ Audit log"],
  ["IoT", "ดูข้อมูลพื้นฐาน", "อุปกรณ์ กฎ และแจ้งเตือน", "Automation และการควบคุมหลายฟาร์ม"],
] as const;

function PlansPage() {
  const { workspaceContext, workspaceLabel, effectiveRole, effectiveSubscription } = useDragonflyData();
  const currentPlan = effectiveSubscription === "Farm Pro" ? "Pro" : "Free";

  return (
    <AppShell title="แผนและสมาชิก" subtitle="เลือกแผนตามขนาดการทำงาน แล้วกำหนดสิทธิ์สมาชิกตามบทบาท">
      <Card className="border-primary/30 bg-primary-soft/45" data-tour="plans-current-plan">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-primary">แผนที่กำลังใช้: {currentPlan}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{workspaceLabel} · {effectiveRole} · สิทธิ์ฟีเจอร์จะขึ้นกับทั้งแผนและบทบาทของสมาชิก</p>
          </div>
          <Badge tone={currentPlan === "Free" ? "muted" : "good"}>{currentPlan}</Badge>
        </div>
      </Card>

      <Card className="flex items-start gap-3">
        <Users className="mt-0.5 size-5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">จัดการสมาชิกและสิทธิ์</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{workspaceContext === "organization" ? "เชิญสมาชิก กำหนด Role ย้ายทีม และกำหนดพื้นที่รับผิดชอบได้จากหน้าทีม" : "เพิ่มผู้ช่วยสวนได้จากหน้าทีม แต่ข้อมูลส่วนตัวจะไม่ปะปนกับองค์กร"}</p>
          <Link to="/workers" className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg border border-primary/30 bg-primary-soft px-3 text-xs font-semibold text-primary"><Users className="size-4" />ไปจัดการสมาชิก</Link>
        </div>
      </Card>

      <SectionTitle>เลือกแผนให้เหมาะกับการทำงาน</SectionTitle>
      <div className="space-y-3">
        {plans.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          const icon = plan.id === "Free" ? Sparkles : plan.id === "Pro" ? Building2 : Crown;
          const Icon = icon;
          return (
            <Card key={plan.id} className={isCurrent ? "border-2 border-primary bg-primary-soft/35" : ""}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary"><Icon className="size-5" /></span>
                  <div>
                    <p className="text-base font-semibold">{plan.name}</p>
                    <p className="mt-0.5 text-xs font-medium text-primary">เหมาะสำหรับ {plan.audience}</p>
                  </div>
                </div>
                {isCurrent ? <Badge tone="good">แผนปัจจุบัน</Badge> : <Badge tone="muted">ดูสิทธิ์</Badge>}
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{plan.description}</p>
              <div className="mt-3 grid gap-1.5 md:grid-cols-2">
                {plan.features.map((feature) => <p key={feature} className="flex items-start gap-2 text-xs"><Check className="mt-0.5 size-3.5 shrink-0 text-primary" />{feature}</p>)}
              </div>
            </Card>
          );
        })}
      </div>

      <SectionTitle>เปรียบเทียบสิทธิ์ฟีเจอร์</SectionTitle>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="grid grid-cols-4 border-b border-border bg-muted/60 text-[11px] font-semibold text-muted-foreground">
          <p className="p-2.5">หัวข้อ</p><p className="p-2.5">Free</p><p className="p-2.5">Pro</p><p className="p-2.5">Pro Max</p>
        </div>
        {comparisons.map(([topic, free, pro, proMax]) => (
          <div key={topic} className="grid grid-cols-4 border-b border-border last:border-b-0 text-[11px] leading-relaxed">
            <p className="p-2.5 font-semibold">{topic}</p><p className="p-2.5 text-muted-foreground">{free}</p><p className="p-2.5 text-muted-foreground">{pro}</p><p className="p-2.5 text-muted-foreground">{proMax}</p>
          </div>
        ))}
      </div>

      <Card className="border-primary/25 bg-primary-soft/35">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-semibold">แผนกับ Role เป็นคนละเรื่อง</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">แผนปลดล็อกความสามารถขององค์กร ส่วน Role กำหนดว่าใครสร้าง แก้ไข อนุมัติ หรือดูข้อมูลนั้นได้ เช่น Pro เปิด Work Order ได้ แต่พนักงานยังส่งงานได้เฉพาะงานที่ตนรับผิดชอบ</p>
          </div>
        </div>
      </Card>
      <p className="px-1 text-center text-[11px] text-muted-foreground">โหมดสาธิตแสดงสิทธิ์ตัวอย่าง การเปลี่ยนแผนจริงจะเชื่อมระบบชำระเงินและการอนุมัติองค์กรในขั้น Production</p>
    </AppShell>
  );
}
