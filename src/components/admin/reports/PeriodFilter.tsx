import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "lucide-react";
import { subDays, subMonths, subYears } from "date-fns";

export type PeriodOption = "30d" | "3m" | "6m" | "1y" | "all";

interface PeriodFilterProps {
  value: PeriodOption;
  onChange: (value: PeriodOption) => void;
}

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

export function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <Select value={value} onValueChange={(v) => onChange(v as PeriodOption)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Selecione o período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="30d">Últimos 30 dias</SelectItem>
          <SelectItem value="3m">Últimos 3 meses</SelectItem>
          <SelectItem value="6m">Últimos 6 meses</SelectItem>
          <SelectItem value="1y">Último ano</SelectItem>
          <SelectItem value="all">Todo o período</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
