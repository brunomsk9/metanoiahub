import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, X } from "lucide-react";
import { subDays, subMonths, subYears } from "date-fns";
import { cn } from "@/lib/utils";

export type PeriodOption = "30d" | "3m" | "6m" | "1y" | "all";

interface PeriodFilterProps {
  value: PeriodOption;
  onChange: (value: PeriodOption) => void;
  showLabel?: boolean;
  compact?: boolean;
}

const periodLabels: Record<PeriodOption, string> = {
  "30d": "30 dias",
  "3m": "3 meses",
  "6m": "6 meses",
  "1y": "1 ano",
  "all": "Todo período"
};

export function getDateFromPeriod(period: PeriodOption): Date | null {
  const now = new Date();
  switch (period) {
    case "30d":
      return subDays(now, 30);
    case "3m":
      return subMonths(now, 3);
    case "6m":
      return subMonths(now, 6);
    case "1y":
      return subYears(now, 1);
    case "all":
      return null;
  }
}

export function PeriodFilter({ value, onChange, showLabel = false, compact = false }: PeriodFilterProps) {
  const hasFilter = value !== "all";

  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        "flex items-center gap-2 rounded-md border transition-all duration-200",
        "bg-background/50 border-border/50",
        "hover:bg-background/80 hover:border-primary/30",
        hasFilter && "border-primary/30 bg-primary/5",
        compact ? "h-8 px-2" : "h-9 px-3"
      )}>
        <Calendar className={cn(
          "shrink-0 text-muted-foreground",
          compact ? "h-3.5 w-3.5" : "h-4 w-4",
          hasFilter && "text-primary"
        )} />
        <Select value={value} onValueChange={(v) => onChange(v as PeriodOption)}>
          <SelectTrigger className={cn(
            "border-0 bg-transparent p-0 h-auto shadow-none focus:ring-0",
            compact ? "text-xs min-w-[90px]" : "text-sm min-w-[120px]",
            hasFilter && "text-primary font-medium"
          )}>
            <SelectValue placeholder="Período">
              {showLabel ? `Período: ${periodLabels[value]}` : periodLabels[value]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-card/95 backdrop-blur-xl border-primary/20">
            <SelectItem value="30d" className="cursor-pointer hover:bg-primary/10">
              Últimos 30 dias
            </SelectItem>
            <SelectItem value="3m" className="cursor-pointer hover:bg-primary/10">
              Últimos 3 meses
            </SelectItem>
            <SelectItem value="6m" className="cursor-pointer hover:bg-primary/10">
              Últimos 6 meses
            </SelectItem>
            <SelectItem value="1y" className="cursor-pointer hover:bg-primary/10">
              Último ano
            </SelectItem>
            <SelectItem value="all" className="cursor-pointer hover:bg-primary/10">
              Todo o período
            </SelectItem>
          </SelectContent>
        </Select>
        {hasFilter && (
          <button 
            onClick={() => onChange("all")}
            className="p-0.5 rounded-sm hover:bg-destructive/20 hover:text-destructive transition-colors"
          >
            <X className={cn(compact ? "h-3 w-3" : "h-3.5 w-3.5")} />
          </button>
        )}
      </div>
    </div>
  );
}
