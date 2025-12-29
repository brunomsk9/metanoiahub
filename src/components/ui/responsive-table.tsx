import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ResponsiveTableProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Minimum width for the table on mobile (default: 600px) */
  minWidth?: number | string;
  children: React.ReactNode;
}

const ResponsiveTableContainer = React.forwardRef<
  HTMLDivElement,
  ResponsiveTableProps
>(({ className, minWidth = 600, children, ...props }, ref) => {
  const minWidthValue = typeof minWidth === "number" ? `${minWidth}px` : minWidth;
  
  return (
    <div
      ref={ref}
      className={cn("overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0", className)}
      {...props}
    >
      <Table style={{ minWidth: minWidthValue }}>
        {children}
      </Table>
    </div>
  );
});
ResponsiveTableContainer.displayName = "ResponsiveTableContainer";

export {
  ResponsiveTableContainer,
  // Re-export table parts for convenience
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
};
