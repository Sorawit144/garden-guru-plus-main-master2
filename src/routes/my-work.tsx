import { createFileRoute } from "@tanstack/react-router";
import { Camera, CheckCircle2, Clock3, MapPin, ShieldAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell, Badge, Card, SectionTitle } from "@/components/AppShell";
import { useDragonflyData } from "@/hooks/useDragonflyData";
import { getLocalDateKey } from "@/lib/dragonfly-data";

export const Route = createFileRoute("/my-work")({
  head: () => ({ meta: [{ title: "งานของฉัน — EasyPlants" }] }),
  component: MyWorkPage,
});

function MyWorkPage() {
  const { state, persona, workspaceContext, workspaceLabel, effectiveRole, updateTaskStatus, startTeamTask } = useDragonflyData();
  const [checkedIn, setCheckedIn] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ทั้งหมด");
  const [timeView, setTimeView] = useState<"today" | "open">("today");
  const [message, setMessage] = useState("");
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [completionNote, setCompletionNote] = useState("");
  const [completionHealth, setCompletionHealth] = useState("");
  const [evidenceCount, setEvidenceCount] = useState(0);
  const [laborHours, setLaborHours] = useState("");
  const [laborCost, setLaborCost] = useState("");
  const [materialCost, setMaterialCost] = useState("");
  const assignee = state.workers.find((worker) => worker.id === "W-004") ?? state.workers[0];
  const today = getLocalDateKey();
  const isEmployee = workspaceContext === "organization" && persona.id === "employee";
  const taskList = useMemo(() => state.tasks.filter((task) => {
    const belongsToCurrentUser = isEmployee ? task.assignedWorkerId === assignee?.id || (!task.assignedWorkerId && Boolean(task.team) && task.team === assignee?.crew) : task.origin === "personal" && task.ownerPersonaId === persona.id;
    return belongsToCurrentUser && (statusFilter === "ทั้งหมด" || task.status === statusFilter) && (timeView === "today" ? task.scheduledFor === today : task.status !== "Completed");
  }), [state.tasks, statusFilter, assignee?.id, timeView, today, isEmployee, persona.id]);
  const statuses = ["ทั้งหมด", "Assigned", "In Progress", "Supervisor Review", "Completed", "Delayed"];

  return (
    <AppShell title="งานของฉัน" subtitle={isEmployee ? `${workspaceLabel} · ${assignee?.name ?? "พนักงาน"} · งานที่องค์กรส่งให้` : `${workspaceLabel} · ${effectiveRole} · Todo งานส่วนตัว`}>
      {isEmployee ? <Card data-tour="employee-checkin" className="border-primary/25 bg-primary-soft/45">
        <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">สถานะเข้างาน</p><p className="mt-1 text-xs text-muted-foreground">{checkedIn ? "เช็กอินแล้ว 08:02 · เขตงาน D04" : "ยังไม่ได้เช็กอินวันนี้"}</p></div><Badge tone={checkedIn ? "good" : "warn"}>{checkedIn ? "ปฏิบัติงาน" : "รอเช็กอิน"}</Badge></div>
        <button onClick={() => setCheckedIn((value) => !value)} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary py-2.5 text-xs font-semibold text-primary-foreground"><MapPin className="size-3.5" />{checkedIn ? "เช็กเอาต์" : "เช็กอินที่เขตงาน"}</button>
        <p className="mt-2 text-[11px] text-muted-foreground">Demo Mode: ระบบจริงควรยืนยันตำแหน่งและเวลาตามนโยบายบริษัท</p>
      </Card> : <Card className="border-primary/25 bg-primary-soft/45"><p className="text-sm font-semibold">Todo งานส่วนตัว</p><p className="mt-1 text-xs text-muted-foreground">สร้างจากปฏิทินในโหมด “งานส่วนตัว” งานทีมจะอยู่ที่ “งานและทีม” เพื่อไม่ปะปนกัน</p></Card>}

      <SectionTitle>ตัวกรองงานของฉัน</SectionTitle>
      <Card data-tour="employee-work-filters"><p className="text-[11px] text-muted-foreground">{isEmployee ? "เป็น Todo จากงานทีมที่ผู้จัดการมอบหมาย ไม่ใช่รายการงานของทั้งทีม" : "เป็น Todo จากงานส่วนตัวที่คุณสร้างเอง ไม่รวมงานทีมที่คุณใช้มอบหมายและควบคุม"}</p><div className="mt-3 grid grid-cols-2 gap-2"><button onClick={() => setTimeView("today")} className={`rounded-lg border py-2 text-xs font-semibold ${timeView === "today" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>งานวันนี้</button><button onClick={() => setTimeView("open")} className={`rounded-lg border py-2 text-xs font-semibold ${timeView === "open" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>งานค้างของฉัน</button></div><div className="mt-2 grid grid-cols-2 gap-2">{statuses.map((status) => <button key={status} onClick={() => setStatusFilter(status)} className={`rounded-lg border px-2 py-2 text-xs font-semibold ${statusFilter === status ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>{status === "ทั้งหมด" ? "ทุกสถานะ" : status}</button>)}</div></Card>

      <div data-tour="employee-task-queue"><SectionTitle>คิวงานที่รับผิดชอบ · {taskList.length} งาน</SectionTitle></div>
      <div className="space-y-3">
        {taskList.map((task) => <Card key={task.id}>
          <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-sm font-semibold">{task.title}</p><p className="mt-1 text-xs text-muted-foreground">{task.plot} · {task.type} · {task.scheduledFor ?? "ไม่ระบุวัน"}</p>{!task.assignedWorkerId && task.team ? <p className="mt-1 text-[11px] font-medium text-primary">งานมอบหมายทั้งทีม {task.team} · กดเริ่มงานเพื่อรับเป็นผู้ปฏิบัติงาน</p> : null}</div><Badge tone={task.status === "Completed" ? "good" : task.status === "Delayed" ? "bad" : task.status === "In Progress" ? "info" : task.status === "Supervisor Review" ? "warn" : "warn"}>{task.status === "Supervisor Review" ? "รอหัวหน้าอนุมัติ" : task.status}</Badge></div>
          {task.reason ? <p className="mt-2 flex gap-1 text-xs text-destructive"><ShieldAlert className="size-3.5 shrink-0" />{task.reason}</p> : null}
          <div className="mt-3 grid grid-cols-2 gap-2">
            {task.status === "Supervisor Review" ? <span className="flex items-center justify-center gap-1 rounded-lg bg-primary-soft py-2 text-xs font-semibold text-primary">รอตรวจรับ</span> : task.status !== "Completed" ? <button onClick={() => { if (task.status === "In Progress") { setCompletingTaskId(task.id); setCompletionNote(""); setCompletionHealth(""); setEvidenceCount(0); setLaborHours(""); setLaborCost(""); setMaterialCost(""); } else { if (isEmployee && assignee?.id) startTeamTask(task.id, assignee.id); else updateTaskStatus(task.id, "In Progress"); setMessage(!task.assignedWorkerId && task.team ? "รับงานของทีมแล้ว และเริ่มบันทึกเวลาปฏิบัติงาน" : "เริ่มบันทึกเวลาปฏิบัติงานแล้ว"); } }} className="rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground">{task.status === "In Progress" ? "ส่งตรวจ" : !task.assignedWorkerId && task.team ? "รับและเริ่มงาน" : "เริ่มงาน"}</button> : <span className="flex items-center justify-center gap-1 rounded-lg bg-primary-soft py-2 text-xs font-semibold text-primary"><CheckCircle2 className="size-3.5" />อนุมัติแล้ว</span>}
            <button onClick={() => { setEvidenceCount((count) => count + 1); setMessage(`เพิ่มหลักฐานภาพของงาน ${task.id} แล้ว (Demo)`); }} className="flex items-center justify-center gap-1 rounded-lg border border-border py-2 text-xs font-semibold"><Camera className="size-3.5" />รูปหลักฐาน (ไม่บังคับ) {evidenceCount || ""}</button>
          </div>
          {completingTaskId === task.id ? <div className="mt-3 space-y-2 rounded-xl border border-primary/25 bg-primary-soft/35 p-3"><p className="text-xs font-semibold text-primary">{task.origin === "team" || task.team ? "สรุปผลเพื่อส่งให้ผู้มีสิทธิ์ตรวจรับ" : "สรุปผลและปิดงานส่วนตัว"}</p><textarea value={completionNote} onChange={(event) => setCompletionNote(event.target.value)} rows={2} placeholder="ผลที่ทำ ข้อสังเกต หรืออุปสรรค" className="w-full resize-none rounded-lg border border-border bg-card px-2 py-2 text-xs outline-none focus:border-primary" />{task.type === "Inspection" ? <input type="number" min="0" max="100" value={completionHealth} onChange={(event) => setCompletionHealth(event.target.value)} placeholder="คะแนนสุขภาพ 0-100 (ถ้ามี)" className="w-full rounded-lg border border-border bg-card px-2 py-2 text-xs outline-none focus:border-primary" /> : null}<div className="grid grid-cols-3 gap-2"><input inputMode="decimal" value={laborHours} onChange={(event) => setLaborHours(event.target.value)} placeholder="ชม." className="min-w-0 rounded-lg border border-border bg-card px-2 py-2 text-xs outline-none focus:border-primary" /><input inputMode="numeric" value={laborCost} onChange={(event) => setLaborCost(event.target.value)} placeholder="ค่าแรง ฿" className="min-w-0 rounded-lg border border-border bg-card px-2 py-2 text-xs outline-none focus:border-primary" /><input inputMode="numeric" value={materialCost} onChange={(event) => setMaterialCost(event.target.value)} placeholder="วัสดุ ฿" className="min-w-0 rounded-lg border border-border bg-card px-2 py-2 text-xs outline-none focus:border-primary" /></div><p className="text-[11px] text-muted-foreground">รูปหลักฐานเป็นตัวเลือก ส่งงานได้แม้ไม่มีรูป</p><div className="grid grid-cols-2 gap-2"><button onClick={() => setCompletingTaskId(null)} className="rounded-lg border border-border py-2 text-xs font-semibold">กลับไปแก้</button><button onClick={() => { const health = completionHealth ? Number(completionHealth) : undefined; if (health !== undefined && (!Number.isFinite(health) || health < 0 || health > 100)) { setMessage("คะแนนสุขภาพต้องอยู่ระหว่าง 0-100"); return; } const isTeamTask = task.origin === "team" || Boolean(task.team); updateTaskStatus(task.id, isTeamTask ? "Supervisor Review" : "Completed", undefined, { note: completionNote || "ส่งงานตามแผน", health, evidenceCount, laborHours: Number(laborHours) || undefined, laborCost: Number(laborCost) || undefined, materialCost: Number(materialCost) || undefined, completedBy: isTeamTask ? assignee?.name : persona.label, approvedBy: isTeamTask ? undefined : `${persona.label} · ยืนยันงานส่วนตัว` }); setCompletingTaskId(null); setMessage(isTeamTask ? "ส่งงานให้ผู้มีสิทธิ์ตรวจรับแล้ว ประวัติแปลงจะอัปเดตหลังอนุมัติ" : "ปิดงานส่วนตัวแล้ว และเพิ่มลงประวัติการดูแลแปลง"); }} className="rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground">{task.origin === "team" || task.team ? "ส่งให้ผู้มีสิทธิ์ตรวจรับ" : "ยืนยันและปิดงาน"}</button></div></div> : null}
        </Card>)}
        {taskList.length === 0 ? <Card className="border-dashed text-center"><p className="text-sm font-semibold">ยังไม่มีงานใน {workspaceLabel}</p><p className="mt-1 text-xs text-muted-foreground">{isEmployee ? "งานจะปรากฏเมื่อผู้จัดการมอบหมายให้คุณหรือทีมของคุณ" : "สร้าง Todo ส่วนตัวจากหน้าปฏิทิน งานนี้จะไม่ถูกส่งให้องค์กร"}</p></Card> : null}
      </div>
      {message ? <Card className="flex gap-2 border-primary/25 bg-primary-soft/45 text-xs text-primary"><Clock3 className="size-4 shrink-0" />{message}</Card> : null}
    </AppShell>
  );
}
