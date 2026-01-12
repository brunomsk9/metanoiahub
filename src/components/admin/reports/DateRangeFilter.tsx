import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

export function DateRangeFilter({ value, onChange, className }: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasRange = value.from || value.to;

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({ from: undefined, to: undefined });
  };

  const formatDateRange = () => {
    if (value.from && value.to) {
      return `${format(value.from, "dd/MM/yy", { locale: ptBR })} - ${format(value.to, "dd/MM/yy", { locale: ptBR })}`;
    }
    if (value.from) {
      return `A partir de ${format(value.from, "dd/MM/yy", { locale: ptBR })}`;
    }
    if (value.to) {
      return `Até ${format(value.to, "dd/MM/yy", { locale: ptBR })}`;
    }
    return "Selecionar período";
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal gap-2",
            "bg-background/50 border-border/50",
            "hover:bg-background/80 hover:border-primary/30",
            hasRange && "border-primary/30 bg-primary/5",
            className
          )}
        >
          <CalendarIcon className={cn(
            "h-4 w-4",
            hasRange ? "text-primary" : "text-muted-foreground"
          )} />
          <span className={cn(
            "text-sm",
            hasRange ? "text-primary font-medium" : "text-muted-foreground"
          )}>
            {formatDateRange()}
          </span>
          {hasRange && (
            <button
              onClick={handleClear}
              className="ml-1 p-0.5 rounded-sm hover:bg-destructive/20 hover:text-destructive transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-card/95 backdrop-blur-xl border-primary/20" align="start">
        <div className="p-3 border-b border-border/50">
          <p className="text-sm font-medium">Selecione o período</p>
          <p className="text-xs text-muted-foreground mt-1">
            Clique em duas datas para definir o intervalo
          </p>
        </div>
        <Calendar
          mode="range"
          selected={{ from: value.from, to: value.to }}
          onSelect={(range) => {
            onChange({ from: range?.from, to: range?.to });
            if (range?.from && range?.to) {
              setIsOpen(false);
            }
          }}
          numberOfMonths={1}
          locale={ptBR}
          disabled={(date) => date > new Date()}
          className={cn("p-3 pointer-events-auto")}
        />
        <div className="p-3 border-t border-border/50 flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={() => {
              onChange({ from: undefined, to: undefined });
              setIsOpen(false);
            }}
          >
            Limpar
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={() => setIsOpen(false)}
          >
            Aplicar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
