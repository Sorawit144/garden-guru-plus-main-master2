import { Leaf, Sprout } from "lucide-react";

export function BrandMark({
  className = "",
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "size-8 rounded-xl",
    md: "size-11 rounded-2xl",
    lg: "size-16 rounded-[1.4rem]",
  };

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden bg-primary text-primary-foreground shadow-[0_8px_18px_-10px_oklch(0.3_0.08_145_/_0.7)] ${sizes[size]} ${className}`}
      aria-label="สวนอัจฉริยะ"
    >
      <span className="absolute -right-2 -top-2 size-7 rounded-full bg-white/15" />
      <Sprout className="relative size-[58%]" strokeWidth={2.3} />
      <Leaf
        className="absolute bottom-1.5 right-1.5 size-[25%] text-primary-foreground/60"
        strokeWidth={2.5}
      />
    </span>
  );
}
