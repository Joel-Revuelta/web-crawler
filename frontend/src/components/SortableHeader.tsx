import { FiltersState } from "@/hooks/useUrlFilters";
import { Dispatch } from "react";
import { Button } from "./ui/button";
import { ArrowUp, ArrowUpDown } from "lucide-react";
import { URL } from "@/types/urls.types";

type SortableHeaderProps = {
  label: string;
  value: keyof URL;
  filters: FiltersState;
  dispatch: Dispatch<{ type: "SET_SORT"; payload: { sortBy: keyof URL } }>;
};

export default function SortableHeader({
  label,
  value,
  filters,
  dispatch,
}: SortableHeaderProps) {
  const isSorted = filters.sortBy === value;

  return (
    <Button
      variant="ghost"
      className="h-auto p-0!"
      onClick={() => dispatch({ type: "SET_SORT", payload: { sortBy: value } })}
    >
      {label}
      {isSorted ? (
        <ArrowUp
          className={`ml-2 h-4 w-4 transition-transform ${
            filters.sortOrder === "desc" ? "rotate-180" : ""
          }`}
        />
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
      )}
      </Button>
    );
}
