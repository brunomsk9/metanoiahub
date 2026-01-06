import { useRef, memo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/lib/utils';

interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  estimateSize?: number;
  className?: string;
  overscan?: number;
}

export const VirtualizedList = memo(function VirtualizedList<T>({
  items,
  renderItem,
  estimateSize = 60,
  className,
  overscan = 5,
}: VirtualizedListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  const virtualItems = virtualizer.getVirtualItems();

  if (items.length === 0) {
    return null;
  }

  return (
    <div
      ref={parentRef}
      className={cn("overflow-auto", className)}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {renderItem(items[virtualItem.index], virtualItem.index)}
          </div>
        ))}
      </div>
    </div>
  );
}) as <T>(props: VirtualizedListProps<T>) => JSX.Element;

interface VirtualizedTableProps<T> {
  items: T[];
  renderRow: (item: T, index: number) => React.ReactNode;
  header: React.ReactNode;
  estimateSize?: number;
  maxHeight?: string;
  emptyMessage?: string;
}

export const VirtualizedTable = memo(function VirtualizedTable<T>({
  items,
  renderRow,
  header,
  estimateSize = 56,
  maxHeight = "500px",
  emptyMessage = "Nenhum item encontrado",
}: VirtualizedTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan: 10,
  });

  const virtualItems = virtualizer.getVirtualItems();

  if (items.length === 0) {
    return (
      <div className="bg-card/50 rounded-xl border border-border/50 overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/30 border-b border-border/50">
            {header}
          </thead>
        </table>
        <div className="p-8 text-center text-muted-foreground">
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card/50 rounded-xl border border-border/50 overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted/30 border-b border-border/50">
          {header}
        </thead>
      </table>
      <div
        ref={parentRef}
        style={{ maxHeight, overflow: 'auto' }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          <table className="w-full">
            <tbody>
              {virtualItems.map((virtualItem) => (
                <tr
                  key={virtualItem.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                    display: 'table',
                    tableLayout: 'fixed',
                  }}
                  className="border-b border-border/30 hover:bg-muted/20 transition-colors"
                >
                  {renderRow(items[virtualItem.index], virtualItem.index)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}) as <T>(props: VirtualizedTableProps<T>) => JSX.Element;
