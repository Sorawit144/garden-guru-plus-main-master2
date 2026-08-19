import { ArrowRight, Check, ChevronLeft, X } from "lucide-react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useRef } from "react";
import { useDragonflyData } from "@/hooks/useDragonflyData";
import {
  findGuidedTutorial,
  getGuidedTutorialSession,
  GUIDED_TUTORIAL_EVENT,
  stopGuidedTutorial,
  updateGuidedTutorialStep,
  type GuidedTutorialSession,
} from "@/lib/guided-tutorial";

type TargetRect = { top: number; left: number; right: number; bottom: number; width: number; height: number };

export function GuidedTutorial() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (routerState) => routerState.location.pathname });
  const { persona, completeTutorialStep } = useDragonflyData();
  const [session, setSession] = useState<GuidedTutorialSession | null>(null);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const tour = useMemo(() => session ? findGuidedTutorial(session.tourId, persona.id) : null, [session, persona.id]);
  const step = tour && session ? tour.steps[session.stepIndex] : undefined;

  useEffect(() => {
    const update = () => setSession(getGuidedTutorialSession());
    update();
    window.addEventListener(GUIDED_TUTORIAL_EVENT, update);
    return () => window.removeEventListener(GUIDED_TUTORIAL_EVENT, update);
  }, []);

  useEffect(() => {
    if (!session || !tour) return;
    if (session.stepIndex >= tour.steps.length) stopGuidedTutorial();
  }, [session, tour]);

  const lastStepIdRef = useRef(step?.id);

  useEffect(() => {
    if (!step) {
      setTargetRect(null);
      lastStepIdRef.current = undefined;
      return;
    }
    if (pathname !== step.route) {
      if (lastStepIdRef.current !== step.id) {
        setTargetRect(null);
        void navigate({ to: step.route });
        lastStepIdRef.current = step.id;
      } else {
        stopGuidedTutorial();
      }
      return;
    }
    lastStepIdRef.current = step.id;

    let cancelled = false;
    let attempt = 0;
    const locateTarget = () => {
      if (cancelled) return;
      const element = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
      if (!element) {
        attempt += 1;
        if (attempt < 20) window.setTimeout(locateTarget, 100);
        return;
      }
      element.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      window.setTimeout(() => {
        if (cancelled) return;
        const rect = element.getBoundingClientRect();
        setTargetRect({ top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height });
      }, 320);
    };
    locateTarget();
    const updateRect = () => {
      const element = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
      if (!element) return;
      const rect = element.getBoundingClientRect();
      setTargetRect({ top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height });
    };
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, { passive: true });
    return () => {
      cancelled = true;
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect);
    };
  }, [navigate, pathname, step]);

  useEffect(() => {
    if (!session) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") stopGuidedTutorial();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [session]);

  if (!session || !tour || !step || !targetRect) return null;

  const padding = 7;
  const top = Math.max(0, targetRect.top - padding);
  const left = Math.max(0, targetRect.left - padding);
  const right = Math.min(window.innerWidth, targetRect.right + padding);
  const bottom = Math.min(window.innerHeight, targetRect.bottom + padding);
  const isLast = session.stepIndex === tour.steps.length - 1;

  const goToStep = (stepIndex: number) => {
    completeTutorialStep(step.id);
    setTargetRect(null);
    updateGuidedTutorialStep(session, stepIndex);
  };

  const finish = () => {
    completeTutorialStep(tour.steps.map((tutorialStep) => tutorialStep.id));
    stopGuidedTutorial();
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-[80]" aria-live="polite">
      <div className="pointer-events-auto absolute left-0 top-0 w-full bg-black/55" style={{ height: top }} />
      <div className="pointer-events-auto absolute left-0 bg-black/55" style={{ top, width: left, height: bottom - top }} />
      <div className="pointer-events-auto absolute right-0 bg-black/55" style={{ top, width: window.innerWidth - right, height: bottom - top }} />
      <div className="pointer-events-auto absolute bottom-0 left-0 w-full bg-black/55" style={{ top: bottom }} />
      <div className="pointer-events-none fixed rounded-lg border-2 border-primary bg-primary/5 shadow-[0_0_0_4px_oklch(0.7_0.135_158_/_0.2)]" style={{ top, left, width: right - left, height: bottom - top }} />

      <section role="dialog" aria-label={`ขั้นตอน ${session.stepIndex + 1}: ${step.title}`} className="pointer-events-auto fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] left-1/2 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-lg border border-white/20 bg-card p-4 text-foreground shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold text-primary">{tour.title} · {session.stepIndex + 1}/{tour.steps.length}</p>
            <h2 className="mt-1 text-base font-semibold">{step.title}</h2>
          </div>
          <button type="button" onClick={stopGuidedTutorial} className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted" aria-label="ยกเลิกการฝึกสอน"><X className="size-4" /></button>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{step.description}</p>
        <p className="mt-2 rounded-lg bg-primary-soft px-3 py-2 text-xs font-medium text-primary">{step.instruction}</p>
        <div className="mt-3 flex items-center gap-2">
          <button type="button" onClick={stopGuidedTutorial} className="min-h-10 px-2 text-xs font-semibold text-muted-foreground">ยกเลิก</button>
          {session.stepIndex > 0 ? <button type="button" onClick={() => goToStep(session.stepIndex - 1)} className="flex min-h-10 items-center gap-1 rounded-lg border border-border px-3 text-xs font-semibold"><ChevronLeft className="size-3.5" />ย้อนกลับ</button> : null}
          <button type="button" onClick={isLast ? finish : () => goToStep(session.stepIndex + 1)} className="ml-auto flex min-h-10 items-center gap-1 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground">
            {isLast ? <>เสร็จสิ้น <Check className="size-3.5" /></> : <>ถัดไป <ArrowRight className="size-3.5" /></>}
          </button>
        </div>
      </section>
    </div>
  );
}
