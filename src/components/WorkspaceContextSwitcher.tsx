import { useState, useRef, useEffect } from "react";
import { Building2, Check, ChevronDown, RotateCcw, Sprout } from "lucide-react";
import { useDragonflyData, type WorkspaceContext } from "@/hooks/useDragonflyData";

export function WorkspaceContextSwitcher() {
  const { isDemoMode, workspaceContext, setWorkspaceContext, workspaceLabel, resetDemo, state } =
    useDragonflyData();

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isOrganization = workspaceContext === "organization";

  const select = (ctx: WorkspaceContext) => {
    setWorkspaceContext(ctx);
    setOpen(false);
  };

  // ปิด dropdown เมื่อคลิกนอกกล่อง
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Pill ใน header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="เลือกพื้นที่ทำงาน"
        className="flex h-10 items-center gap-1.5 rounded-2xl border border-border/70 bg-card px-2.5 text-left text-sm shadow-sm hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          {isOrganization ? <Building2 className="size-3" /> : <Sprout className="size-3" />}
        </span>
        <span className="text-[11px] font-semibold leading-none text-foreground">
          {isOrganization ? "องค์กร" : "สวนฉัน"}
        </span>
        <ChevronDown
          className={`size-3 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-72 rounded-2xl border border-border bg-card p-3 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">
          <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            พื้นที่ทำงาน
          </p>

          <div className="space-y-1.5">
            {/* Personal */}
            <button
              type="button"
              onClick={() => select("personal")}
              className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-colors ${
                !isOrganization
                  ? "border-primary/40 bg-primary-soft/50"
                  : "border-transparent hover:bg-muted"
              }`}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <Sprout className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold text-foreground">สวนของฉัน</span>
                <span className="block text-[10px] text-muted-foreground">
                  ข้อมูลส่วนตัว แยกจากองค์กร
                </span>
              </span>
              {!isOrganization && <Check className="size-4 shrink-0 text-primary" />}
            </button>

            {/* Organization */}
            <button
              type="button"
              onClick={() => select("organization")}
              className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-colors ${
                isOrganization
                  ? "border-primary/40 bg-primary-soft/50"
                  : "border-transparent hover:bg-muted"
              }`}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <Building2 className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold text-foreground">
                  {state.farm.name}
                </span>
                <span className="block text-[10px] text-muted-foreground">
                  ข้อมูลทีม ฟาร์ม และงานขององค์กร
                </span>
              </span>
              {isOrganization && <Check className="size-4 shrink-0 text-primary" />}
            </button>
          </div>

          {/* Reset demo (ซ่อนไว้ใน footer ของ dropdown) */}
          {isDemoMode && (
            <div className="mt-3 border-t border-border pt-3">
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      "Reset all demo changes and restore the original demonstration dataset?",
                    )
                  ) {
                    resetDemo();
                    setOpen(false);
                  }
                }}
                className="flex w-full items-center gap-2 rounded-xl bg-muted px-3 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <RotateCcw className="size-3.5 shrink-0" />
                รีเซ็ตข้อมูลตัวอย่าง
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
