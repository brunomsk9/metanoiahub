import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface SearchableSelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  showClearButton?: boolean;
  size?: "sm" | "default" | "lg";
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Selecione...",
  searchPlaceholder = "Buscar...",
  emptyMessage = "Nenhum resultado encontrado.",
  className,
  triggerClassName,
  disabled = false,
  icon,
  showClearButton = true,
  size = "default",
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const selectedOption = options.find((opt) => opt.value === value);
  const hasValue = value && value !== "all" && value !== "";

  const filteredOptions = React.useMemo(() => {
    if (!search.trim()) return options;
    const searchLower = search.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(searchLower) ||
        opt.description?.toLowerCase().includes(searchLower)
    );
  }, [options, search]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange("all");
  };

  const sizeClasses = {
    sm: "h-8 text-xs px-2.5",
    default: "h-9 text-sm px-3",
    lg: "h-10 text-sm px-4"
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "justify-between font-normal w-full",
            "bg-background/50 border-border/50",
            "hover:bg-background/80 hover:border-primary/30",
            "focus:ring-1 focus:ring-primary/20 focus:border-primary/50",
            "transition-all duration-200",
            !value && "text-muted-foreground",
            hasValue && "border-primary/30 bg-primary/5",
            sizeClasses[size],
            triggerClassName
          )}
        >
          <span className="flex items-center gap-2 truncate flex-1">
            {icon && <span className="shrink-0 text-muted-foreground">{icon}</span>}
            {selectedOption ? (
              <span className="truncate flex items-center gap-2">
                {selectedOption.icon}
                <span className={cn(hasValue && "text-foreground font-medium")}>
                  {selectedOption.label}
                </span>
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </span>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            {showClearButton && hasValue && (
              <span
                onClick={handleClear}
                className="p-0.5 rounded-sm hover:bg-destructive/20 hover:text-destructive transition-colors cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className={cn(
          "p-0 w-[--radix-popover-trigger-width]",
          "bg-card/95 backdrop-blur-xl border-primary/20",
          className
        )} 
        align="start"
      >
        <Command shouldFilter={false} className="bg-transparent">
          <div className="border-b border-border/50">
            <CommandInput
              placeholder={searchPlaceholder}
              value={search}
              onValueChange={setSearch}
              className="border-0 focus:ring-0 bg-transparent"
            />
          </div>
          <CommandList className="max-h-[280px]">
            <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </CommandEmpty>
            <CommandGroup className="p-1">
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => {
                    onValueChange(option.value);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={cn(
                    "flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer",
                    "hover:bg-primary/10",
                    value === option.value && "bg-primary/10 text-primary"
                  )}
                >
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0 text-primary",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.icon && <span className="shrink-0">{option.icon}</span>}
                  <span className="flex-1 truncate">
                    <span className={cn(value === option.value && "font-medium")}>
                      {option.label}
                    </span>
                    {option.description && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    )}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
