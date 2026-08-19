import { Link } from "@tanstack/react-router";
import { LockKeyhole, Sparkles } from "lucide-react";
import { Card } from "@/components/AppShell";

export function ProAccessGate({ feature, detail }: { feature: string; detail: string }) {
  return (
    <Card className="border-primary/30 bg-primary-soft/55">
      <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <LockKeyhole className="size-5" />
      </span>
      <p className="mt-3 text-base font-bold">{feature} ใช้ได้ใน Farm Pro</p>
      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{detail}</p>
      <Link
        to="/onboarding"
        className="mt-4 flex items-center justify-center gap-1.5 rounded-lg bg-primary py-2.5 text-xs font-semibold text-primary-foreground"
      >
        ดูระดับและสิทธิ์ Farm Pro <Sparkles className="size-3.5" />
      </Link>
    </Card>
  );
}
