import { useState } from "react";
import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

interface ChecklistInterativoProps {
  title: string;
  items: ChecklistItem[];
  onToggle: (id: string) => void;
  className?: string;
}

export function ChecklistInterativo({ title, items, onToggle, className }: ChecklistInterativoProps) {
  const completedCount = items.filter(item => item.completed).length;
  const progress = (completedCount / items.length) * 100;

  return (
    <div className={cn("card-premium p-6 space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-display font-semibold text-foreground">
          {title}
        </h3>
        <span className="text-sm text-muted-foreground">
          {completedCount}/{items.length} concluídos
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="absolute left-0 top-0 h-full bg-gradient-primary rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="space-y-2">
        {items.map((item, index) => (
          <button
            key={item.id}
            onClick={() => onToggle(item.id)}
            className={cn(
              "checklist-item w-full text-left",
              item.completed && "checklist-item-completed"
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className={cn(
              "flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all duration-200",
              item.completed 
                ? "bg-success border-success" 
                : "border-border hover:border-primary"
            )}>
              {item.completed ? (
                <Check className="w-4 h-4 text-success-foreground" />
              ) : (
                <Circle className="w-3 h-3 text-muted-foreground/30" />
              )}
            </div>
            <span className={cn(
              "flex-1 text-sm transition-colors",
              item.completed 
                ? "text-muted-foreground line-through" 
                : "text-foreground"
            )}>
              {item.text}
            </span>
          </button>
        ))}
      </div>

      {completedCount === items.length && (
        <div className="flex items-center justify-center gap-2 p-4 bg-success/10 rounded-lg border border-success/30 animate-scale-in">
          <span className="text-2xl">🎉</span>
          <span className="text-success font-medium">Parabéns! Checklist concluído!</span>
        </div>
      )}
    </div>
  );
}
