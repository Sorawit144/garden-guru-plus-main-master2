import { Apple, Coffee, Leaf, Sprout, Trees, type LucideIcon } from "lucide-react";

export function FarmIcon({ crop, className = "size-5" }: { crop?: string; className?: string }) {
  const value = crop?.toLowerCase() ?? "";
  const Icon: LucideIcon = value.includes("กาแฟ")
    ? Coffee
    : value.includes("มะพร้าว") || value.includes("ปาล์ม")
      ? Trees
      : value.includes("ทุเรียน") || value.includes("มังคุด") || value.includes("ผล")
        ? Apple
        : value
          ? Leaf
          : Sprout;
  return <Icon aria-hidden="true" className={className} />;
}
