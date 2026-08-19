type TimeOption = { value: string; label: string };
export type DateRange = { start: string; end: string };

export function TimeRangeFilter({
  value,
  onChange,
  options,
  label = "ช่วงเวลา",
  dateRange,
  onDateRangeChange,
}: {
  value: string;
  onChange: (value: string) => void;
  options: TimeOption[];
  label?: string;
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange) => void;
}) {
  const hasCustomRange = Boolean(dateRange && onDateRangeChange);
  const allOptions = hasCustomRange ? [...options, { value: "custom", label: "กำหนดเอง" }] : options;
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</p>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm font-semibold text-foreground outline-none focus:border-primary"
      >
        {allOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      {hasCustomRange && value === "custom" ? (
        <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg border border-border bg-muted/40 p-3">
          <label className="min-w-0 text-[11px] font-medium text-muted-foreground">
            ตั้งแต่
            <input
              type="date"
              value={dateRange!.start}
              onChange={(event) => onDateRangeChange!({ ...dateRange!, start: event.target.value })}
              className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-xs text-foreground outline-none focus:border-primary"
            />
          </label>
          <label className="min-w-0 text-[11px] font-medium text-muted-foreground">
            ถึง
            <input
              type="date"
              min={dateRange!.start || undefined}
              value={dateRange!.end}
              onChange={(event) => onDateRangeChange!({ ...dateRange!, end: event.target.value })}
              className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-xs text-foreground outline-none focus:border-primary"
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}
