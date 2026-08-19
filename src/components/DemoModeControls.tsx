import { useNavigate } from "@tanstack/react-router";
import { RotateCcw, ShieldCheck } from "lucide-react";
import { useDragonflyData } from "@/hooks/useDragonflyData";

export function DemoModeControls() {
  const navigate = useNavigate();
  const { isDemoMode, persona, personas, resetDemo, setPersona } = useDragonflyData();

  if (!isDemoMode) return null;

  const switchView = (personaId: typeof persona.id) => {
    if (personaId === persona.id) return;
    setPersona(personaId);
    void navigate({ to: personaId === "employee" ? "/my-work" : "/" });
  };

  return (
    <div className="border-b border-border/70 bg-card/86 px-4 py-2 text-foreground backdrop-blur-2xl">
      <div className="mx-auto flex w-full max-w-md items-center gap-2 md:max-w-6xl">
        <span className="shrink-0 rounded-full bg-primary-soft px-2 py-1 text-[10px] font-semibold text-primary">
          โหมดสาธิต
        </span>
        <label className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
          <ShieldCheck className="size-3.5 shrink-0 text-primary" />
          <span className="sr-only">เปลี่ยนมุมมองตัวอย่าง</span>
          <select
            aria-label="เปลี่ยนมุมมองตัวอย่าง"
            value={persona.id}
            onChange={(event) => switchView(event.target.value as typeof persona.id)}
            className="min-w-0 flex-1 appearance-none bg-transparent py-0.5 text-xs font-medium text-foreground outline-none"
          >
            {personas.map((view) => (
              <option key={view.id} value={view.id}>{view.role} · {view.subscription}</option>
            ))}
          </select>
        </label>
        <button
          onClick={() => {
            if (window.confirm("Reset all demo changes and restore the original demonstration dataset?")) {
              resetDemo();
            }
          }}
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-primary transition-colors hover:bg-border"
          aria-label="Reset demo data"
          title="Reset demo data"
        >
          <RotateCcw className="size-4" />
        </button>
      </div>
    </div>
  );
}
