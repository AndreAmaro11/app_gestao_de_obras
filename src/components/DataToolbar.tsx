import { useState, useMemo, useCallback, ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, ArrowUpDown, ArrowUp, ArrowDown, X } from "lucide-react";

export interface FilterOption {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

interface DataToolbarProps {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters?: FilterOption[];
  filterValues?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  children?: ReactNode;
}

export const DataToolbar = ({
  searchPlaceholder = "Buscar...",
  searchValue,
  onSearchChange,
  filters = [],
  filterValues = {},
  onFilterChange,
  children,
}: DataToolbarProps) => {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchValue}
          onChange={e => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="pl-9 h-9"
        />
        {searchValue && (
          <button onClick={() => onSearchChange("")} className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {filters.map(f => (
        <Select key={f.key} value={filterValues[f.key] || "todos"} onValueChange={v => onFilterChange?.(f.key, v)}>
          <SelectTrigger className="w-40 h-9">
            <SelectValue placeholder={f.label} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {f.options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      ))}
      {children}
    </div>
  );
};

// Sortable column header
export type SortDir = "asc" | "desc" | null;

interface SortableHeaderProps {
  label: string;
  field: string;
  currentField: string | null;
  currentDir: SortDir;
  onSort: (field: string) => void;
  className?: string;
}

export const SortableHeader = ({ label, field, currentField, currentDir, onSort, className = "" }: SortableHeaderProps) => {
  const isActive = currentField === field;
  return (
    <button
      onClick={() => onSort(field)}
      className={`flex items-center gap-1 hover:text-foreground transition-colors ${className}`}
    >
      {label}
      {isActive && currentDir === "asc" && <ArrowUp className="h-3.5 w-3.5" />}
      {isActive && currentDir === "desc" && <ArrowDown className="h-3.5 w-3.5" />}
      {!isActive && <ArrowUpDown className="h-3 w-3 opacity-40" />}
    </button>
  );
};

// Hook for sorting
export const useSort = <T,>(data: T[] | undefined, defaultField?: string) => {
  const [sortField, setSortField] = useState<string | null>(defaultField || null);
  const [sortDir, setSortDir] = useState<SortDir>(defaultField ? "asc" : null);

  const toggleSort = useCallback((field: string) => {
    if (sortField === field) {
      if (sortDir === "asc") setSortDir("desc");
      else if (sortDir === "desc") { setSortField(null); setSortDir(null); }
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }, [sortField, sortDir]);

  const sorted = useMemo(() => {
    if (!data || !sortField || !sortDir) return data || [];
    return [...data].sort((a: any, b: any) => {
      const aVal = getNestedValue(a, sortField);
      const bVal = getNestedValue(b, sortField);
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      const strA = String(aVal).toLowerCase();
      const strB = String(bVal).toLowerCase();
      return sortDir === "asc" ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }, [data, sortField, sortDir]);

  return { sorted, sortField, sortDir, toggleSort };
};

function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((acc, key) => acc?.[key], obj);
}

// Hook for search filtering
export const useSearch = <T,>(data: T[] | undefined, searchFields: string[]) => {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!data || !search.trim()) return data || [];
    const q = search.toLowerCase();
    return data.filter((item: any) =>
      searchFields.some(field => {
        const val = getNestedValue(item, field);
        return val != null && String(val).toLowerCase().includes(q);
      })
    );
  }, [data, search, searchFields]);

  return { search, setSearch, filtered };
};

export default DataToolbar;
