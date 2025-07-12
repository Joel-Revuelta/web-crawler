import { CrawlStatus } from "@/types/urls.types";
import { useReducer } from "react";
import { z } from "zod";

export const filtersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["all", ...Object.values(CrawlStatus)]).optional(),
  htmlVersion: z.enum(["all", "html5", "html4", "xhtml"]).optional(),
  hasLogin: z.enum(["all", "yes", "no"]).optional(),
  internalLinksMin: z.number().optional(),
  internalLinksMax: z.number().optional(),
  externalLinksMin: z.number().optional(),
  externalLinksMax: z.number().optional(),
  brokenLinksMin: z.number().optional(),
  brokenLinksMax: z.number().optional(),
  dateCreatedFrom: z.date().optional(),
  dateCreatedTo: z.date().optional(),
  dateCrawledFrom: z.date().optional(),
  dateCrawledTo: z.date().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export type FiltersState = z.infer<typeof filtersSchema>;

type FiltersAction =
  | { type: "SET_SEARCH"; payload: string }
  | { type: "SET_STATUS"; payload: "all" | CrawlStatus }
  | { type: "SET_HTML_VERSION"; payload: "all" | "html5" | "html4" | "xhtml" }
  | { type: "SET_HAS_LOGIN"; payload: "all" | "yes" | "no" }
  | { type: "SET_RANGE"; payload: { key: keyof FiltersState; value?: number } }
  | { type: "SET_DATE"; payload: { key: keyof FiltersState; value?: Date } }
  | { type: "SET_SORT"; payload: { sortBy: keyof URL } }
  | { type: "RESET_FILTERS" };

const initialState: FiltersState = {
  search: "",
  status: "all",
  htmlVersion: "all",
  hasLogin: "all",
  sortBy: "CreatedAt",
  sortOrder: "desc",
};

function filtersReducer(state: FiltersState, action: FiltersAction): FiltersState {
  switch (action.type) {
    case "SET_SEARCH":
      return { ...state, search: action.payload };
    case "SET_STATUS":
      return { ...state, status: action.payload };
    case "SET_HTML_VERSION":
      return { ...state, htmlVersion: action.payload };
    case "SET_HAS_LOGIN":
      return { ...state, hasLogin: action.payload };
    case "SET_RANGE":
    case "SET_DATE":
      return { ...state, [action.payload.key]: action.payload.value };
    case "SET_SORT":
      if (state.sortBy === action.payload.sortBy) {
        return { ...state, sortOrder: state.sortOrder === "asc" ? "desc" : "asc" };
      }
      return { ...state, sortBy: action.payload.sortBy, sortOrder: "asc" };
    case "RESET_FILTERS":
      return {
        ...initialState,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
      };
    default:
      return state;
  }
}

export function useUrlFilters() {
  const [filters, dispatch] = useReducer(filtersReducer, initialState);

  return { filters, dispatch };
}
