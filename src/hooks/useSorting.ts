import * as React from "react";

export type SortDirection = "asc" | "desc" | null;

interface UseSortingOptions<T> {
  data: T[];
  defaultSortKey?: keyof T;
  defaultDirection?: SortDirection;
}

interface UseSortingReturn<T> {
  sortedData: T[];
  sortKey: keyof T | null;
  sortDirection: SortDirection;
  toggleSort: (key: keyof T) => void;
  getSortIcon: (key: keyof T) => "asc" | "desc" | "none";
}

export function useSorting<T>({ 
  data, 
  defaultSortKey = null, 
  defaultDirection = null 
}: UseSortingOptions<T>): UseSortingReturn<T> {
  const [sortKey, setSortKey] = React.useState<keyof T | null>(defaultSortKey);
  const [sortDirection, setSortDirection] = React.useState<SortDirection>(defaultDirection);

  const toggleSort = React.useCallback((key: keyof T) => {
    if (sortKey === key) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortDirection(null);
        setSortKey(null);
      } else {
        setSortDirection("asc");
      }
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  }, [sortKey, sortDirection]);

  const sortedData = React.useMemo(() => {
    if (!sortKey || !sortDirection) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      // Handle null/undefined
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortDirection === "asc" ? 1 : -1;
      if (bVal == null) return sortDirection === "asc" ? -1 : 1;

      // Handle different types
      if (typeof aVal === "string" && typeof bVal === "string") {
        const comparison = aVal.localeCompare(bVal, "pt-BR", { sensitivity: "base" });
        return sortDirection === "asc" ? comparison : -comparison;
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }

      // Fallback to string comparison
      const comparison = String(aVal).localeCompare(String(bVal));
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [data, sortKey, sortDirection]);

  const getSortIcon = React.useCallback((key: keyof T): "asc" | "desc" | "none" => {
    if (sortKey !== key) return "none";
    return sortDirection || "none";
  }, [sortKey, sortDirection]);

  return {
    sortedData,
    sortKey,
    sortDirection,
    toggleSort,
    getSortIcon,
  };
}
