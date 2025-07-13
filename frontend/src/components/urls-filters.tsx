import { CalendarIcon, Filter, Search, X } from "lucide-react";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { CrawlStatus } from "@/types/urls.types";
import { useMemo, useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Label } from "./ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { FiltersState } from "@/hooks/useUrlFilters";
import { Dispatch } from "react";

type UrlsFiltersProps = {
  filters: FiltersState;
  dispatch: Dispatch<any>;
}

export default function UrlsFilters({ filters, dispatch }: UrlsFiltersProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const hasActiveFilters = useMemo(() => {
    const { sortBy, sortOrder, ...rest } = filters;
    return Object.values(rest).some(value => 
      value !== undefined && value !== null && value !== '' && value !== 'all'
    );
  }, [filters]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4"/>
          <Input
            placeholder="Search by title or URL..."
            value={filters.search}
            onChange={(e) => dispatch({ type: "SET_SEARCH", payload: e.target.value })}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={filters.status} onValueChange={(e: "all" | CrawlStatus) => {
            dispatch({ type: "SET_STATUS", payload: e});
          }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.values(CrawlStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.htmlVersion} onValueChange={(e: "all" | "html5" | "html4" | "xhtml") => {
            dispatch({ type: "SET_HTML_VERSION", payload: e });
          }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="HTML Version" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Versions</SelectItem>
              <SelectItem value="html5">HTML5</SelectItem>
              <SelectItem value="html4">HTML4</SelectItem>
              <SelectItem value="xhtml">XHTML</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            Advanced
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">
                !
              </Badge>
            )}
          </Button>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              onClick={() => {dispatch({ type: "RESET_FILTERS" })}}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      {showAdvancedFilters && (
        <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Has Login Form</Label>
              <Select value={filters.hasLogin} onValueChange={(e: "all" | "yes" | "no") => {
                dispatch({ type: "SET_HAS_LOGIN", payload: e });
              }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Has Login Form" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Date Created</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="flex-1/2 justify-start text-left font-normal bg-transparent">
                      <CalendarIcon className="mr-2 w-4 h-4" />
                      {filters.dateCreatedFrom ? filters.dateCreatedFrom.toLocaleDateString() : "From"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateCreatedFrom}
                      onSelect={(date) => dispatch({ type: "SET_DATE", payload: { key: "dateCreatedFrom", value: date } })}
                      autoFocus
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="flex-1/2 justify-start text-left font-normal bg-transparent">
                      <CalendarIcon className="mr-2 w-4 h-4" />
                      {filters.dateCreatedTo ? filters.dateCreatedTo.toLocaleDateString() : "To"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateCreatedTo}
                      onSelect={(date) => dispatch({ type: "SET_DATE", payload: { key: "dateCreatedTo", value: date } })}
                      autoFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Date Crawled</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="flex-1/2 justify-start text-left font-normal bg-transparent">
                      <CalendarIcon className="mr-2 w-4 h-4" />
                      {filters.dateCrawledFrom ? filters.dateCrawledFrom.toLocaleDateString() : "From"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateCrawledFrom}
                      onSelect={(date) => dispatch({ type: "SET_DATE", payload: { key: "dateCrawledFrom", value: date } })}
                      autoFocus
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="flex-1/2 justify-start text-left font-normal bg-transparent">
                      <CalendarIcon className="mr-2 w-4 h-4" />
                      {filters.dateCrawledTo ? filters.dateCrawledTo.toLocaleDateString() : "To"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateCrawledTo}
                      onSelect={(date) => dispatch({ type: "SET_DATE", payload: { key: "dateCrawledTo", value: date } })}
                      autoFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Internal Links</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.internalLinksMin || ''}
                  onChange={(e) => dispatch({ type: "SET_RANGE", payload: { key: "internalLinksMin", value: e.target.value ? Number(e.target.value) : undefined } })}
                  className=""
                />
                <span className="self-center text-muted-foreground">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.internalLinksMax || ''}
                  onChange={(e) => dispatch({ type: "SET_RANGE", payload: { key: "internalLinksMax", value: e.target.value ? Number(e.target.value) : undefined } })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">External Links</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.externalLinksMin || ''}
                  onChange={(e) => dispatch({ type: "SET_RANGE", payload: { key: "externalLinksMin", value: e.target.value ? Number(e.target.value) : undefined } })}
                />
                <span className="self-center text-muted-foreground">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.externalLinksMax || ''}
                  onChange={(e) => dispatch({ type: "SET_RANGE", payload: { key: "externalLinksMax", value: e.target.value ? Number(e.target.value) : undefined } })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Broken Links</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.brokenLinksMin || ''}
                  onChange={(e) => dispatch({ type: "SET_RANGE", payload: { key: "brokenLinksMin", value: e.target.value ? Number(e.target.value) : undefined } })}
                />
                <span className="self-center text-muted-foreground">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.brokenLinksMax || ''}
                  onChange={(e) => dispatch({ type: "SET_RANGE", payload: { key: "brokenLinksMax", value: e.target.value ? Number(e.target.value) : undefined } })}
                />
              </div>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="pt-2 border-t">
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {Object.entries(filters)
                  .map(([key, value]) => {
                  const filterConfig = {
                    search: { label: "Search", value, onClear: () => dispatch({ type: "SET_SEARCH", payload: "" }) },
                    status: { label: "Status", value, onClear: () => dispatch({ type: "SET_STATUS", payload: "all" }) },
                    htmlVersion: { label: "HTML Version", value, onClear: () => dispatch({ type: "SET_HTML_VERSION", payload: "all" }) },
                    hasLogin: { label: "Has Login", value, onClear: () => dispatch({ type: "SET_HAS_LOGIN", payload: "all" }) },
                    dateCreatedFrom: { label: "Created From", value: value ? new Date(value as string | Date).toLocaleDateString() : undefined, onClear: () => dispatch({ type: "SET_DATE", payload: { key: "dateCreatedFrom", value: undefined } }) },
                    dateCreatedTo: { label: "Created To", value: value ? new Date(value as string | Date).toLocaleDateString() : undefined, onClear: () => dispatch({ type: "SET_DATE", payload: { key: "dateCreatedTo", value: undefined } }) },
                    dateCrawledFrom: { label: "Crawled From", value: value ? new Date(value as string | Date).toLocaleDateString() : undefined, onClear: () => dispatch({ type: "SET_DATE", payload: { key: "dateCrawledFrom", value: undefined } }) },
                    dateCrawledTo: { label: "Crawled To", value: value ? new Date(value as string | Date).toLocaleDateString() : undefined, onClear: () => dispatch({ type: "SET_DATE", payload: { key: "dateCrawledTo", value: undefined } }) },
                    internalLinksMin: { label: "Internal Links Min", value, onClear: () => dispatch({ type: "SET_RANGE", payload: { key: "internalLinksMin", value: undefined } }) },
                    internalLinksMax: { label: "Internal Links Max", value, onClear: () => dispatch({ type: "SET_RANGE", payload: { key: "internalLinksMax", value: undefined } }) },
                    externalLinksMin: { label: "External Links Min", value, onClear: () => dispatch({ type: "SET_RANGE", payload: { key: "externalLinksMin", value: undefined } }) },
                    externalLinksMax: { label: "External Links Max", value, onClear: () => dispatch({ type: "SET_RANGE", payload: { key: "externalLinksMax", value: undefined } }) },
                    brokenLinksMin: { label: "Broken Links Min", value, onClear: () => dispatch({ type: "SET_RANGE", payload: { key: "brokenLinksMin", value: undefined } }) },
                    brokenLinksMax: { label: "Broken Links Max", value, onClear: () => dispatch({ type: "SET_RANGE", payload: { key: "brokenLinksMax", value: undefined } }) },
                  }[key];

                  if (!filterConfig || value === undefined || value === null || value === '' || value === 'all') {
                    return null;
                  }

                  return (
                    <Badge key={key} variant="secondary" className="gap-1 cursor-pointer">
                    {filterConfig.label}: {String(filterConfig.value)}
                    <div className="p-0" onClick={filterConfig.onClear}>
                      <X className="w-3 h-3" />
                    </div>
                    </Badge>
                  );
                  })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>    
  )
}
