import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Building2,
  Check,
  Crown,
  HardHat,
  ShieldCheck,
  Sparkles,
  Users,
  UserRoundCog,
} from "lucide-react";
import { AppShell, Badge, Card } from "@/components/AppShell";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDragonflyData } from "@/hooks/useDragonflyData";

export const Route = createFileRoute("/plans")({
  head: () => ({
    meta: [
      { title: "แผนและสมาชิก — EasyPlants" },
      {
        name: "description",
        content: "เปรียบเทียบแผน Free, Pro และ Pro Max พร้อมสิทธิ์สมาชิกและฟีเจอร์",
      },
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
    features: [
      "สวนและแปลงพื้นฐาน",
      "Todo และปฏิทินงานส่วนตัว",
      "อากาศ ราคาตลาด ตรวจโรค",
      "ต้นทุนและรายได้พื้นฐาน",
      "EasyPlants Academy",
    ],
  },
  {
    id: "Pro",
    name: "Pro",
    audience: "สวนเชิงพาณิชย์ที่เริ่มมีคนและหลายแปลง",
    description: "ใช้บริหารงานทีม ผลผลิต สต็อก และรายงานในขอบเขตองค์กรเดียว",
    features: [
      "ทีม บทบาท และ Work Order",
      "ปฏิทินพืช AI และคาดการณ์ผลผลิต",
      "คลัง การจัดซื้อ และเครื่องจักร",
      "รายงาน PDF/Excel",
      "IoT Rules และการแจ้งเตือน",
    ],
  },
  {
    id: "Pro Max",
    name: "Pro Max",
    audience: "องค์กรหลายสวนที่ต้องควบคุมมาตรฐานและตรวจสอบย้อนหลัง",
    description: "เพิ่มการควบคุมข้ามฟาร์ม การอนุมัติ และการจัดการข้อมูลระดับองค์กร",
    features: [
      "หลายสวน หลายหน่วยงาน",
      "Role และสิทธิ์กำหนดเอง",
      "Approval flow และ Audit log",
      "Traceability เอกสาร PHI/QA",
      "Analytics และ IoT Automation ระดับองค์กร",
    ],
  },
] as const;

const comparisons = [
  ["ขอบเขตการใช้งาน", "สวนส่วนตัว", "สวนเชิงพาณิชย์", "องค์กรหลายสวน"],
  [
    "สมาชิกและทีม",
    "ผู้ช่วยสวนพื้นฐาน",
    "ทีม หัวหน้าทีม และ Work Order",
    "ทีมข้ามสวน และ Role กำหนดเอง",
  ],
  [
    "การเงินและผลผลิต",
    "บันทึกรายรับรายจ่าย",
    "ต้นทุน/แปลง และคาดการณ์ยอดขาย",
    "วิเคราะห์ข้ามสวนและมาตรฐานองค์กร",
  ],
  ["เอกสารและตรวจสอบ", "บันทึกกิจกรรม", "รายงาน PDF/Excel", "PHI, QA, Traceability และ Audit log"],
  ["IoT", "ดูข้อมูลพื้นฐาน", "อุปกรณ์ กฎ และแจ้งเตือน", "Automation และการควบคุมหลายฟาร์ม"],
] as const;

function PlansPage() {
  const navigate = useNavigate();
  const [detailPlanId, setDetailPlanId] = useState<(typeof plans)[number]["id"] | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const {
    workspaceContext,
    workspaceLabel,
    effectiveRole,
    effectiveSubscription,
    persona,
    isDemoMode,
    setPersona,
    setWorkspaceContext,
    organizationTeam,
    setOrganizationTeam,
    state,
  } = useDragonflyData();
  const currentPlan =
    persona.id === "export" ? "Pro Max" : effectiveSubscription === "Farm Pro" ? "Pro" : "Free";
  const planPersona = { Free: "owner", Pro: "commercial", "Pro Max": "export" } as const;
  const organizationRoles = [
    { id: "employee", label: "พนักงานภาคสนาม", detail: "รับงานและส่งงานให้ตรวจ", icon: HardHat },
    { id: "supervisor", label: "หัวหน้าทีม", detail: "ตรวจรับเฉพาะทีมที่เลือก", icon: Users },
    {
      id: "commercial",
      label: "ผู้จัดการฟาร์ม",
      detail: "มอบหมายและอนุมัติงานทุกทีม",
      icon: UserRoundCog,
    },
    {
      id: "export",
      label: "ผู้จัดการองค์กร / QA",
      detail: "ตรวจรับ QA และกำกับหลายฟาร์ม",
      icon: ShieldCheck,
    },
  ] as const;
  const simulatePlan = (planId: keyof typeof planPersona) => {
    if (!isDemoMode) return;
    setWorkspaceContext(planId === "Free" ? "personal" : "organization");
    setPersona(planPersona[planId]);
    void navigate({ to: planId === "Free" ? "/" : "/farm-pro" });
  };
  const detailPlan = plans.find((plan) => plan.id === detailPlanId);

  return (
    <AppShell title="แผนและสมาชิก" subtitle="เลือกแผนและมุมมองการใช้งาน">
      <Card className="border-primary/30 bg-primary-soft/45" data-tour="plans-current-plan">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-primary">แผนที่กำลังใช้: {currentPlan}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {workspaceLabel} · {effectiveRole}
            </p>
          </div>
          <Badge tone={currentPlan === "Free" ? "muted" : "good"}>{currentPlan}</Badge>
        </div>
      </Card>

      <Card className="flex items-center justify-between gap-3">
        <Users className="mt-0.5 size-5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">จัดการสมาชิกและสิทธิ์</p>
        </div>
        <Link
          to="/workers"
          className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-primary/30 bg-primary-soft px-3 text-xs font-semibold text-primary"
        >
          <Users className="size-4" />
          จัดการ
        </Link>
      </Card>

      {workspaceContext === "organization" ? (
        <Card className="space-y-4 border-primary/25 bg-primary-soft/30">
          <div className="flex items-start gap-3">
            <UserRoundCog className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-semibold">จำลองตำแหน่งและทีมในองค์กร</p>
            </div>
          </div>
          <label className="block text-xs font-semibold text-muted-foreground">
            ทีมที่รับผิดชอบ
            <select
              value={organizationTeam}
              onChange={(event) => setOrganizationTeam(event.target.value)}
              className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            >
              {state.workforce.crews.map((crew) => (
                <option key={crew.name} value={crew.name}>
                  {crew.name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            {organizationRoles.map((role) => {
              const Icon = role.icon;
              const isActive = persona.id === role.id;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => {
                    setWorkspaceContext("organization");
                    setPersona(role.id);
                  }}
                  className={`flex items-start gap-3 rounded-2xl border p-3 text-left ${isActive ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-card hover:border-primary/40"}`}
                >
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${isActive ? "bg-primary-foreground/15" : "bg-primary-soft text-primary"}`}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span>
                    <span className="block text-xs font-semibold">{role.label}</span>
                    <span
                      className={`mt-0.5 block text-[11px] ${isActive ? "text-primary-foreground/75" : "text-muted-foreground"}`}
                    >
                      {role.detail}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </Card>
      ) : null}

      <div className="px-1">
        <p className="text-sm font-semibold text-primary">แพ็กเกจสำหรับคุณ</p>
        <h2 className="mt-1 font-display text-2xl font-bold tracking-tight">เลือกตามขนาดของสวน</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          เริ่มจากสิ่งที่จำเป็น แล้วขยายเมื่อทีมของคุณเติบโต
        </p>
      </div>
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:overflow-visible">
        {plans.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          const isRecommended = plan.id === "Pro";
          const icon = plan.id === "Free" ? Sparkles : plan.id === "Pro" ? Building2 : Crown;
          const Icon = icon;
          return (
            <Card
              key={plan.id}
              className={`relative flex min-w-[17.5rem] snap-center flex-col overflow-hidden p-5 md:min-w-0 ${isCurrent ? "border-2 border-primary bg-primary-soft/35" : ""} ${isRecommended && !isCurrent ? "border-primary/45" : ""}`}
            >
              {isRecommended ? (
                <span className="absolute right-4 top-4 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold text-primary-foreground">
                  แนะนำ
                </span>
              ) : null}
              <span className="flex size-11 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                <Icon className="size-5" />
              </span>
              <div className="mt-4">
                <p className="font-display text-xl font-bold">{plan.name}</p>
                <p className="mt-1 min-h-9 text-xs leading-relaxed text-muted-foreground">
                  {plan.audience}
                </p>
              </div>
              <div className="mt-4 border-t border-border pt-4">
                {plan.features.slice(0, 3).map((feature) => (
                  <p key={feature} className="mb-2 flex items-start gap-2 text-xs">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
                    {feature}
                  </p>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setDetailPlanId(plan.id)}
                className="mt-2 text-left text-xs font-semibold text-primary"
              >
                ดูสิทธิ์ทั้งหมด
              </button>
              {isDemoMode ? (
                <button
                  type="button"
                  onClick={() => simulatePlan(plan.id)}
                  className={`mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl text-xs font-semibold ${isCurrent ? "border border-primary/30 bg-card text-primary" : "bg-primary text-primary-foreground"}`}
                >
                  <Icon className="size-4" />
                  {isCurrent ? "แพ็กเกจที่กำลังใช้งาน" : "ลองใช้แพ็กเกจนี้"}
                </button>
              ) : null}
            </Card>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => setShowComparison(true)}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card text-sm font-semibold text-foreground"
      >
        <ShieldCheck className="size-4 text-primary" />
        เปรียบเทียบแผนทั้งหมด
      </button>

      <Dialog open={Boolean(detailPlan)} onOpenChange={(open) => !open && setDetailPlanId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{detailPlan?.name}</DialogTitle>
            <DialogDescription>{detailPlan?.description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {detailPlan?.features.map((feature) => (
              <p key={feature} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                {feature}
              </p>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showComparison} onOpenChange={setShowComparison}>
        <DialogContent className="gap-4">
          <DialogHeader>
            <DialogTitle>เปรียบเทียบแผน</DialogTitle>
            <DialogDescription>ภาพรวมสิทธิ์สำคัญของแต่ละแผน</DialogDescription>
          </DialogHeader>
          <div className="overflow-hidden rounded-2xl border border-border">
            <div className="grid grid-cols-4 bg-muted/60 text-[10px] font-semibold text-muted-foreground">
              <p className="p-2">หัวข้อ</p>
              <p className="p-2">Free</p>
              <p className="p-2">Pro</p>
              <p className="p-2">Max</p>
            </div>
            {comparisons.map(([topic, free, pro, proMax]) => (
              <div
                key={topic}
                className="grid grid-cols-4 border-t border-border text-[10px] leading-relaxed"
              >
                <p className="p-2 font-semibold">{topic}</p>
                <p className="p-2 text-muted-foreground">{free}</p>
                <p className="p-2 text-muted-foreground">{pro}</p>
                <p className="p-2 text-muted-foreground">{proMax}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
