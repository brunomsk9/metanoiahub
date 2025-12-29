import * as React from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortableHeaderProps {
  children: React.ReactNode;
  sortState: "asc" | "desc" | "none";
  onClick: () => void;
  className?: string;
}

export function SortableHeader({ children, sortState, onClick, className }: SortableHeaderProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer select-none group",
        sortState !== "none" && "text-foreground",
        className
      )}
    >
      {children}
      <span className="inline-flex">
        {sortState === "none" && (
          <ArrowUpDown className="h-3.5 w-3.5 opacity-0 group-hover:opacity-50 transition-opacity" />
        )}
        {sortState === "asc" && <ArrowUp className="h-3.5 w-3.5 text-primary" />}
        {sortState === "desc" && <ArrowDown className="h-3.5 w-3.5 text-primary" />}
      </span>
    </button>
  );
}
