import {
  ChevronLeft,
  Loader2,
  Play,
  RefreshCw,
  StopCircle,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { useQuery, keepPreviousData, useMutation } from "@tanstack/react-query";
import { useDebounce } from "@uidotdev/usehooks";
import { FiltersState, useUrlFilters } from "@/hooks/useUrlFilters";
import UrlsFilters from "./UrlsFilters";
import { URL, CrawlStatus } from "@/types/urls.types";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Checkbox } from "./ui/checkbox";
import { bulkDeleteUrls, cancelScanUrl, fetchUrls, startScanUrl } from "@/services/urlsService";
import { useState, useEffect } from "react";
import { Badge } from "./ui/badge";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import SortableHeader from "./SortableHeader";
import { showErrorToast, showSuccessToast } from "@/lib/toasts";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { AxiosError } from "axios";

export default function UrlsTable() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedUrls, setSelectedUrls] = useState<number[]>([]);
  const { filters, dispatch } = useUrlFilters();
  const debouncedFilters = useDebounce(filters, 300);

  const { isPending, isError, error, data, isFetching, refetch } = useQuery({
    queryKey: ["urls", page, pageSize, debouncedFilters],
    queryFn: () => getUrls(page, pageSize, debouncedFilters),
    placeholderData: keepPreviousData
  });

  const deleteMutation = useMutation({
    mutationFn: (urlIds: number[]) => bulkDeleteUrls(urlIds),
    onSuccess: () => {
      setSelectedUrls([]);
      refetch();
      showSuccessToast("Selected URLs deleted successfully!");
    },
    onError: (error) => {
      console.error("Error deleting URLs:", error);
      showErrorToast(error instanceof AxiosError ? error.response?.data.message : error instanceof Error ? error.message : "An unexpected error occurred.");
    }
  })

  useEffect(() => {
    if (page !== 1) {
      setPage(1);
    }
  }, [debouncedFilters]);

  useEffect(() => {
    selectedUrls.forEach(urlId => {
      if (!data?.data.some(url => url.ID === urlId)) {
        setSelectedUrls(prev => prev.filter(id => id !== urlId));
      }
    });
  }, [data]);

  const getUrls = async (page: number, pageSize: number, filters: FiltersState) => {
    const response = await fetchUrls(page, pageSize, filters);
    return response.data;
  }

  const allCurrentPageSelected = data?.data && data.data.length > 0 && selectedUrls.length === data.data.length;

  const rerunAnalysis = async () => {
    console.log("Rerunning analysis...");
  }

  const deleteUrls = async () => {
    if (selectedUrls.length === 0) {
      return;
    }

    await deleteMutation.mutateAsync(selectedUrls);
  }

  const onRowClick = (url: URL) => {
    console.log(`Row clicked: ${url.url}`);
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUrls(data?.data.map(url => url.ID) || []);
    } else {
      setSelectedUrls([]);
    }
  }

  const handleSelectUrl = (urlId: number, checked: boolean) => {
    setSelectedUrls(prev => {
      if (checked) {
        return [...prev, urlId];
      } else {
        return prev.filter(id => id !== urlId);
      }
    });
  }

  const getStatusBadge = (status: CrawlStatus) => {
    const colors = {
      [CrawlStatus.Queued]: "bg-yellow-100 text-yellow-800",
      [CrawlStatus.Completed]: "bg-green-100 text-green-800",
      [CrawlStatus.Failed]: "bg-red-100 text-red-800",
      [CrawlStatus.Crawling]: "bg-blue-100 text-blue-800",
      [CrawlStatus.Cancelled]: "bg-gray-100 text-gray-800"
    };

    return (
      <Badge className={`text-xs font-medium ${colors[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const onStopCrawling = (urlId: number) => {
    cancelScanUrl(urlId).then(() => {
      showSuccessToast("Crawling stopped successfully!");
    }).catch(error => {
      console.error("Error stopping crawl:", error);
      showErrorToast("Failed to stop crawling. Please try again.");
    });
  }

  const onStartCrawling = (urlId: number) => {
    startScanUrl(urlId).then(() => {
      showSuccessToast("Crawling started successfully!");
    }).catch(error => {
      console.error("Error starting crawl:", error);
      showErrorToast("Failed to start crawling. Please try again.");
    });
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  }

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <div>
          <CardTitle>Crawled URLs</CardTitle>
          <CardDescription>Manage and analyze your crawled websites</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={rerunAnalysis} disabled={selectedUrls.length === 0}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Re-run Analysis
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              {deleteMutation.isPending ? (
                <Button variant="destructive" size="sm" disabled>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </Button>
              ) : (
                <Button variant="destructive" size="sm" disabled={selectedUrls.length === 0}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Selected
                </Button>
              )}
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete the selected URLs? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={deleteUrls}>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <UrlsFilters filters={filters} dispatch={dispatch} />

        {isPending ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">
              Loading URLs...
            </h3>
            <p className="text-muted-foreground mt-1 mb-4">
              Please wait while we fetch the latest data from the server.
            </p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertTriangle className="h-12 w-12 text-red-600 mb-4" />
            <h3 className="text-lg font-medium text-red-600">
              Error loading URLs
            </h3>
            <p className="text-muted-foreground mt-1 mb-4">
              {error instanceof AxiosError ? error.response?.data.message :  error instanceof Error ? error.message : "An unexpected error occurred."}
            </p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        ) : (
          <>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={allCurrentPageSelected}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>
                      <SortableHeader
                        label="Status"
                        value="status"
                        filters={filters}
                        dispatch={dispatch}
                      />
                    </TableHead>
                    <TableHead>
                      <SortableHeader
                        label="Title"
                        value="title"
                        filters={filters}
                        dispatch={dispatch}
                      />
                    </TableHead>
                    <TableHead>
                      <SortableHeader
                        label="URL"
                        value="url"
                        filters={filters}
                        dispatch={dispatch}
                      />
                    </TableHead>
                    <TableHead>
                      <SortableHeader
                        label="HTML Version"
                        value="htmlVersion"
                        filters={filters}
                        dispatch={dispatch}
                      />
                    </TableHead>
                    <TableHead>Login Form</TableHead>
                    <TableHead>
                      <SortableHeader
                        label="Internal Links"
                        value="internalLinks"
                        filters={filters}
                        dispatch={dispatch}
                      />
                    </TableHead>
                    <TableHead>
                      <SortableHeader
                        label="External Links"
                        value="externalLinks"
                        filters={filters}
                        dispatch={dispatch}
                      />
                    </TableHead>
                    <TableHead>
                      <SortableHeader
                        label="Broken Links"
                        value="brokenLinks"
                        filters={filters}
                        dispatch={dispatch}
                      />
                    </TableHead>
                    <TableHead>
                      <SortableHeader
                        label="Created At"
                        value="CreatedAt"
                        filters={filters}
                        dispatch={dispatch}
                      />
                    </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody className={ isFetching ? "opacity-50" : "" }>
                  {data.data.map(url => (
                    <TableRow key={url.ID}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={e => {
                        if (!(e.target as HTMLElement).closest("button, input")) {
                          onRowClick(url);
                        }
                      }}>
                      <TableCell>
                        <Checkbox
                          checked={selectedUrls.includes(url.ID)}
                          onCheckedChange={checked => handleSelectUrl(url.ID, checked as boolean)}
                          onClick={e => e.stopPropagation()}
                        />
                      </TableCell>
                      <TableCell>{getStatusBadge(url.status)}</TableCell>
                      <TableCell className="font-medium">{url.title || "No title"}</TableCell>
                      <TableCell className="max-w-xs truncate">{url.url}</TableCell>
                      <TableCell>{url.htmlVersion || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant={url.hasLoginForm ? "default" : "secondary"} className="text-xs">
                          {url.hasLoginForm ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell>{url.internalLinks}</TableCell>
                      <TableCell>{url.externalLinks}</TableCell>
                      <TableCell>
                        {url.brokenLinks > 0 ? (
                          <Badge variant="destructive" className="text-xs">
                            {url.brokenLinks}
                          </Badge>
                        ) : (
                          <span>0</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {url.CreatedAt ? new Date(url.CreatedAt).toLocaleDateString() : "N/A"}
                      </TableCell>
                      <TableCell className="flex gap-1">
                        {url.status === CrawlStatus.Crawling ? (
                          <Button variant="outline" size="icon" onClick={() => onStopCrawling(url.ID)}>
                            <StopCircle className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button variant="outline" size="icon" onClick={() => onStartCrawling(url.ID)}>
                            <Play className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  Showing {(data.pagination.currentPage - 1) * data.pagination.pageSize + 1} to{" "}
                  {Math.min(data.pagination.currentPage * data.pagination.pageSize, data.pagination.totalItems)}
                  {" "}of {data.pagination.totalItems} URLs
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-muted-foreground">Rows per page:</Label>
                  <Select value={pageSize.toString()} onValueChange={value => handlePageSizeChange(Number(value))}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <span className="text-sm">
                  Page {page} of {data.pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === data.pagination.totalPages}
                  onClick={() => setPage(prev => Math.min(prev + 1, data.pagination.totalPages))}
                >
                  Next
                  <ChevronLeft className="w-4 h-4 transform rotate-180" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

