import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card } from "@/components/AppShell";
import { Bell, AlertTriangle, Leaf, CalendarDays, Settings2, SlidersHorizontal, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "การแจ้งเตือน — สวนอัจฉริยะ" },
      { name: "description", content: "การแจ้งเตือนและการอัปเดตต่างๆ ของฟาร์ม" },
    ],
  }),
  component: NotificationsPage,
});

type Notification = {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "alert" | "info" | "success";
  category: "weather" | "organization" | "task";
  read: boolean;
};

const initialNotifications: Notification[] = [
  {
    id: "1",
    title: "แจ้งเตือนความชื้นต่ำ",
    message: "แปลง D01 มีความชื้นในดินต่ำกว่า 40% ระบบแนะนำให้รดน้ำ",
    time: "10 นาทีที่แล้ว",
    type: "alert",
    category: "task",
    read: false,
  },
  {
    id: "2",
    title: "ถึงรอบการใส่ปุ๋ย",
    message: "แปลง M02 ถึงรอบการบำรุงด้วยปุ๋ยเกร็ดทางใบ (รอบที่ 3)",
    time: "2 ชั่วโมงที่แล้ว",
    type: "info",
    category: "task",
    read: false,
  },
  {
    id: "3",
    title: "งานรดน้ำเสร็จสิ้น",
    message: "สมชาย รดน้ำโซน NORTH-A เรียบร้อยแล้ว",
    time: "เมื่อวาน 16:30",
    type: "success",
    category: "organization",
    read: true,
  },
  {
    id: "4",
    title: "แจ้งเตือนสภาพอากาศ",
    message: "พยากรณ์อากาศแจ้งว่าจะมีฝนตกหนักในช่วงบ่ายนี้ โปรดระวังน้ำท่วมขัง",
    time: "เมื่อวาน 08:00",
    type: "alert",
    category: "weather",
    read: true,
  },
];

function NotificationsPage() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [activeFilter, setActiveFilter] = useState<"all" | "alert" | "info" | "success">("all");
  const [showSettings, setShowSettings] = useState(false);
  const [prefs, setPrefs] = useState({
    weather: true,
    organization: true,
    task: true,
  });

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "alert":
        return <AlertTriangle className="size-5 text-warning" />;
      case "info":
        return <CalendarDays className="size-5 text-primary" />;
      case "success":
        return <Leaf className="size-5 text-good" />;
      default:
        return <Bell className="size-5 text-muted-foreground" />;
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    // 1. กรองตามประเภท (Chips)
    if (activeFilter !== "all" && n.type !== activeFilter) return false;
    // 2. กรองตามการตั้งค่าปิด-เปิด
    if (!prefs[n.category]) return false;
    return true;
  });

  const togglePref = (key: keyof typeof prefs) => {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  };

  return (
    <AppShell
      title="การแจ้งเตือน"
      subtitle="อัปเดตและข้อความแจ้งเตือนทั้งหมด"
    >
      <div className="mb-4 space-y-3">
        {/* แถบเครื่องมือด้านบน */}
        <div className="flex items-center justify-between px-1">
          <p className="text-sm font-semibold">
            ยังไม่ได้อ่าน ({filteredNotifications.filter((n) => !n.read).length})
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={markAllAsRead}
              className="text-xs font-medium text-primary hover:underline"
            >
              อ่านทั้งหมด
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                showSettings ? "bg-primary text-primary-foreground" : "bg-primary-soft text-primary hover:bg-primary/20"
              }`}
            >
              <Settings2 className="size-3.5" /> ตั้งค่า
            </button>
          </div>
        </div>

        {/* แผงตั้งค่าการแจ้งเตือน (ซ่อน/แสดงได้) */}
        {showSettings && (
          <Card className="animate-in fade-in slide-in-from-top-2 border-primary/20 bg-primary-soft/30 p-3">
            <p className="mb-2 text-xs font-semibold text-primary">รับการแจ้งเตือนจาก:</p>
            <div className="space-y-2">
              {[
                { key: "weather" as const, label: "พยากรณ์อากาศและภัยพิบัติ" },
                { key: "organization" as const, label: "ความเคลื่อนไหวในองค์กร/ทีม" },
                { key: "task" as const, label: "งานภาคสนามและแปลง" },
              ].map((item) => (
                <label key={item.key} className="flex cursor-pointer items-center justify-between rounded-lg bg-card px-3 py-2 text-sm shadow-sm">
                  <span>{item.label}</span>
                  <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${prefs[item.key] ? "bg-primary" : "bg-muted-foreground/30"}`}>
                    <span className={`inline-block size-3.5 transform rounded-full bg-white transition-transform ${prefs[item.key] ? "translate-x-4.5" : "translate-x-1"}`} />
                  </div>
                  {/* ซ่อน input ไว้ ใช้เป็นแค่ accessibility */}
                  <input type="checkbox" className="hidden" checked={prefs[item.key]} onChange={() => togglePref(item.key)} />
                </label>
              ))}
            </div>
          </Card>
        )}

        {/* แถบตัวกรอง (Chips) */}
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none md:mx-0 md:px-0">
          {[
            { id: "all", label: "ทั้งหมด" },
            { id: "alert", label: "เตือนภัย" },
            { id: "info", label: "ระบบ" },
            { id: "success", label: "สำเร็จ" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id as any)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-[11px] font-semibold transition-colors ${
                activeFilter === f.id
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-border"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filteredNotifications.map((n) => (
          <Card
            key={n.id}
            className={`flex items-start gap-4 transition-colors ${
              !n.read ? "border-primary/30 bg-primary-soft/40" : ""
            }`}
          >
            <div className="mt-1 shrink-0">{getIcon(n.type)}</div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className={`text-sm ${!n.read ? "font-bold text-foreground" : "font-semibold text-foreground/90"}`}>
                  {n.title}
                </p>
                <p className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {n.time}
                </p>
              </div>
              <p className={`mt-1 text-xs leading-relaxed ${!n.read ? "text-foreground/80" : "text-muted-foreground"}`}>
                {n.message}
              </p>
            </div>
            {!n.read && (
              <span className="mt-2.5 size-2 shrink-0 rounded-full bg-primary" />
            )}
          </Card>
        ))}

        {filteredNotifications.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            <Bell className="mx-auto mb-3 size-8 opacity-20" />
            <p className="text-sm font-medium">ไม่มีการแจ้งเตือน</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
