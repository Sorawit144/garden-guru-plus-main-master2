import { Check, ChevronDown, Search, X } from "lucide-react";
import { useMemo, useState, useRef, useEffect } from "react";

type SelectOption = string | { value: string; label: string };

export function SearchableSelect({ label, value, options, onChange, allLabel = "ทั้งหมด", searchPlaceholder = "ค้นหา" }: { label: string; value: string; options: SelectOption[]; onChange: (value: string) => void; allLabel?: string; searchPlaceholder?: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const normalizedOptions = useMemo(() => options.map((option) => typeof option === "string" ? { value: option, label: option } : option), [options]);
  const filtered = useMemo(() => normalizedOptions.filter((option) => option.label.toLowerCase().includes(query.trim().toLowerCase())), [normalizedOptions, query]);
  const selectedLabel = !value || value === "ทั้งหมด" ? allLabel : normalizedOptions.find((option) => option.value === value)?.label ?? value;

  return (
    <div className="relative" ref={ref}>
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</p>
      <button type="button" onClick={() => { setOpen((current) => !current); setQuery(""); }} className="flex min-h-11 w-full items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 text-left text-sm font-semibold">
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </button>
      {open ? (
        <div className="absolute z-30 mt-1 w-full rounded-lg border border-border bg-card p-2 shadow-lg">
          <div className="relative">
            <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={searchPlaceholder} className="w-full rounded-md border border-border bg-background py-2 pr-8 pl-8 text-sm outline-none focus:border-primary" />
            {query ? <button type="button" onClick={() => setQuery("")} className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground"><X className="size-3.5" /></button> : null}
          </div>
          <div className="mt-2 max-h-52 overflow-y-auto">
            {filtered.map((option) => (
              <button type="button" key={option.value} onClick={() => { onChange(option.value); setOpen(false); }} className={`flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-sm ${value === option.value ? "bg-primary-soft font-semibold text-primary" : "hover:bg-muted"}`}>
                <span className="truncate">{option.value === "ทั้งหมด" ? allLabel : option.label}</span>
                {value === option.value ? <Check className="size-4 shrink-0" /> : null}
              </button>
            ))}
            {filtered.length === 0 ? <p className="px-2.5 py-4 text-center text-xs text-muted-foreground">ไม่พบรายการ</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

