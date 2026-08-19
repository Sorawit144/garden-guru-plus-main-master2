import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  Bot,
  CalendarDays,
  CloudSun,
  FileText,
  HandCoins,
  HeartPulse,
  GraduationCap,
  Users,
  Waves,
  Wheat,
  Cpu,
  Factory,
  Building2,
  Route as RouteIcon,
  Settings,
  ClipboardCheck,
  FolderOpen,
  Boxes,
  Wrench,
  Crown,
} from "lucide-react";
import { AppShell, Card, SectionTitle } from "@/components/AppShell";
import { BrandMark } from "@/components/BrandMark";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useDragonflyData } from "@/hooks/useDragonflyData";

export const Route = createFileRoute("/more")({
  head: () => ({
    meta: [
      { title: "เมนูทั้งหมด — สวนอัจฉริยะ" },
      {
        name: "description",
        content: "เข้าถึงทุกฟีเจอร์: อากาศ ปฏิทิน ต้นทุน ผลผลิต แจ้งเตือน ชุมชน และรายงาน",
      },
      { property: "og:title", content: "เมนูทั้งหมด — สวนอัจฉริยะ" },
      { property: "og:description", content: "รวมทุกเครื่องมือจัดการสวนไว้ในหน้าเดียว" },
    ],
  }),
  component: MorePage,
});

const coreMenu = [
  {
    to: "/academy",
    icon: GraduationCap,
    label: "EasyPlants Academy",
    desc: "Guided learning และ tutorial",
  },
  {
    to: "/crop-calendar",
    icon: CalendarDays,
    label: "ปฏิทินพืช AI",
    desc: "Timeline เพาะปลูก → เก็บเกี่ยว",
  },
  { to: "/recommend", icon: Bot, label: "คำแนะนำ AI", desc: "รดน้ำ ใส่ปุ๋ย ฉีดยา เก็บเกี่ยว" },
  { to: "/weather", icon: CloudSun, label: "สภาพอากาศ", desc: "ฝน ความชื้น ลม UV" },
  { to: "/market", icon: HandCoins, label: "ราคาตลาด", desc: "ราคาผลผลิตล่าสุดวันนี้" },
  { to: "/disaster", icon: Waves, label: "น้ำท่วม-ภัยแล้ง", desc: "เฝ้าระวังและหลักฐานชดเชย" },
  { to: "/monitor", icon: HeartPulse, label: "เฝ้าระวังรายสัปดาห์", desc: "ความสมบูรณ์ของพืช" },
  { to: "/calendar", icon: CalendarDays, label: "ปฏิทินงาน", desc: "ตารางงานและแจ้งเตือน" },
  { to: "/costs", icon: BarChart3, label: "ต้นทุน-รายได้", desc: "รายรับ รายจ่าย กำไร" },
  { to: "/yield", icon: Wheat, label: "คาดการณ์ผลผลิต", desc: "ผลผลิตและรายได้ล่วงหน้า" },
] as const;

const proMenu = [
  { to: "/farm-pro", icon: Factory, label: "งานและทีม", desc: "งาน คนในทีม และแผนผลิตในหน้าเดียว" },
  {
    to: "/operations",
    icon: Building2,
    label: "ศูนย์ปฏิบัติการ 360",
    desc: "ฟาร์ม โซน งาน สต็อก และ compliance",
  },
  {
    to: "/inventory",
    icon: Boxes,
    label: "คลังและการจัดซื้อ",
    desc: "สต็อก ใบขอซื้อ อนุมัติ PO และรับสินค้า",
  },
  {
    to: "/machinery",
    icon: Wrench,
    label: "เครื่องจักรและการบำรุง",
    desc: "ทะเบียน ตรวจเช็ก แจ้งซ่อม และประวัติบำรุง",
  },
  {
    to: "/traceability",
    icon: RouteIcon,
    label: "Traceability",
    desc: "ค้นหา Lot และประวัติการผลิต",
  },
  {
    to: "/documents",
    icon: FolderOpen,
    label: "ศูนย์เอกสาร",
    desc: "ไฟล์ PHI, QA, ใบรับรอง และรายงาน",
  },
  { to: "/reports", icon: FileText, label: "รายงาน", desc: "PDF Excel และกราฟ" },
] as const;

const techMenu = [
  { to: "/iot", icon: Cpu, label: "IoT", desc: "Devices Rules Alerts Simulator" },
  { to: "/notifications", icon: Bell, label: "การแจ้งเตือน", desc: "งาน โรค ฝน ดินแห้ง" },
  { to: "/community", icon: Users, label: "ชุมชนชาวสวน", desc: "ถามตอบ แชร์ความรู้" },
  { to: "/settings", icon: Settings, label: "Settings", desc: "Data mode และ reset demo" },
] as const;

function getFeatureAudience(route: string) {
  if (route === "/onboarding") return "เหมาะสำหรับ มือใหม่ · เจ้าของสวน";
  if (route === "/academy") return "เหมาะสำหรับ ทุกบทบาทที่ต้องการฝึกใช้ระบบ";
  if (["/weather", "/market", "/community", "/notifications"].includes(route)) return "เหมาะสำหรับ ทุกบทบาท";
  if (["/calendar", "/monitor", "/disaster"].includes(route)) return "เหมาะสำหรับ เจ้าของสวน · พนักงาน · ผู้จัดการ";
  if (["/crop-calendar", "/recommend", "/costs", "/yield"].includes(route)) return "เหมาะสำหรับ เจ้าของสวน · ผู้จัดการ";
  if (["/inventory", "/machinery"].includes(route)) return "เหมาะสำหรับ เจ้าหน้าที่คลัง · ช่าง · ผู้จัดการ";
  if (["/traceability", "/documents", "/reports"].includes(route)) return "เหมาะสำหรับ QA · ผู้จัดการ · เจ้าขององค์กร";
  if (["/farm-pro", "/operations"].includes(route)) return "เหมาะสำหรับ หัวหน้าทีม · ผู้จัดการ · เจ้าขององค์กร";
  return "เหมาะสำหรับ ผู้ดูแลระบบและผู้จัดการ";
}

function MorePage() {
  const {
    workspaceContext,
    workspaceLabel,
    effectiveSubscription,
    state,
  } = useDragonflyData();

  return (
    <AppShell
      title="เมนูทั้งหมด"
      subtitle={`${workspaceLabel} · ${effectiveSubscription}`}
    >
      <Card className="border-primary/25 bg-primary-soft/45">
        <p className="text-sm font-semibold text-primary">
          {workspaceContext === "organization" ? "กำลังใช้พื้นที่ขององค์กร" : "พื้นที่สวนส่วนตัว"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {workspaceContext === "organization"
            ? "ข้อมูล งาน และคำสั่งในแต่ละหน้าจะเปลี่ยนตามพื้นที่ทำงานและทีมที่คุณสังกัด"
            : "ข้อมูลที่แสดงเป็นของคุณเท่านั้น แยกจากงานและทีมขององค์กร"}
        </p>
      </Card>
      <SectionTitle>งานของฉัน</SectionTitle>
      <Link to="/my-work">
        <Card className="border-primary/30 bg-primary-soft/45">
          <ClipboardCheck className="size-6 text-primary" />
          <p className="mt-2 text-sm font-semibold">งานของฉัน</p>
          <p className="text-xs text-muted-foreground">
            Todo ส่วนตัวและงานที่สร้างจากปฏิทิน
          </p>
        </Card>
      </Link>
      <SectionTitle>ทีมและสมาชิก</SectionTitle>
      <Link to="/workers">
        <Card className="border-primary/25 bg-primary-soft/45">
          <Users className="size-6 text-primary" />
          <p className="mt-2 text-sm font-semibold">สมาชิกและทีม</p>
          <p className="text-xs text-muted-foreground">
            เชิญสมาชิก กำหนดตำแหน่ง ทีม และพื้นที่รับผิดชอบ
          </p>
        </Card>
      </Link>
      <SectionTitle>Smart Farming</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        {coreMenu.map((m) => {
          const tile = <Card className="h-full hover:border-primary/35 hover:bg-primary-soft/10 transition-colors">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                <m.icon className="size-5" strokeWidth={2} />
              </span>
              <p className="mt-2 text-sm font-semibold">{m.label}</p>
              <p className="text-xs text-muted-foreground">{m.desc}</p>
            </Card>;
          return <Link key={m.to} to={m.to} className="group block">{tile}</Link>;
        })}
      </div>

      <>
          <SectionTitle>เครื่องมือระดับสูง (Farm Pro)</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            {proMenu.map((m) => {
              const tile = <Card className="h-full hover:border-primary/35 hover:bg-primary-soft/10 transition-colors">
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                    <m.icon className="size-5" strokeWidth={2} />
                  </span>
                  <p className="mt-2 text-sm font-semibold">{m.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.desc}
                  </p>
                </Card>;
              return <Link key={m.to} to={m.to} className="group block">{tile}</Link>;
            })}
          </div>
        </>

      <SectionTitle>Technology & System</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        {techMenu.map((m) => {
          const tile = <Card className="h-full hover:border-primary/35 hover:bg-primary-soft/10 transition-colors">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                <m.icon className="size-5" strokeWidth={2} />
              </span>
              <p className="mt-2 text-sm font-semibold">{m.label}</p>
              <p className="text-xs text-muted-foreground">{m.desc}</p>
            </Card>;
          return <Link key={m.to} to={m.to} className="group block">{tile}</Link>;
        })}
      </div>

      <SectionTitle>บัญชีของฉัน</SectionTitle>
      <Card className="flex items-center gap-3">
        <BrandMark size="md" />
        <div>
          <p className="text-sm font-semibold">{workspaceLabel}</p>
          <p className="text-xs text-muted-foreground">
            {effectiveSubscription} · {workspaceContext === "organization" ? state.farm.name : "ข้อมูลส่วนตัวแยกจากองค์กร"}
          </p>
        </div>
      </Card>
      <Link to="/plans">
        <Card className="mt-3 flex items-center gap-3 border-primary/25 bg-primary-soft/35">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Crown className="size-5" /></span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">แผนและสมาชิก</p>
            <p className="mt-0.5 text-xs text-muted-foreground">เปรียบเทียบ Free, Pro, Pro Max และจัดการสิทธิ์สมาชิก</p>
          </div>
        </Card>
      </Link>

      <SectionTitle>การแสดงผล</SectionTitle>
      <Card className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">โหมดมืด / โหมดสว่าง</p>
          <p className="text-xs text-muted-foreground">แตะปุ่มเพื่อสลับธีมของแอป</p>
        </div>
        <div className="rounded-full bg-primary p-0.5 text-primary-foreground">
          <ThemeToggle />
        </div>
      </Card>
    </AppShell>
  );
}
