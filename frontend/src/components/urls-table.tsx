import { AlertTriangle, ArrowUpDown, ChevronLeft, Loader2, Pause, Play, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Checkbox } from "./ui/checkbox";
import { fetchUrls } from "@/services/urlsService";
import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CrawlStatus, URL } from "@/types/urls";
import { Badge } from "./ui/badge";

export default function UrlsTable() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedUrls, setSelectedUrls] = useState<number[]>([]);

  
  const { isPending, isError, error, data, isFetching, isPlaceholderData } = useQuery({
    queryKey: ["urls", page, pageSize],
    queryFn: () => getUrls(page, pageSize),
    placeholderData: keepPreviousData
  });
  
  const getUrls = async (page: number, pageSize: number) => {
    const response = await fetchUrls(page, pageSize);
    return response.data;
  }

  const allCurrentPageSelected = data?.data && data.data.length > 0 && selectedUrls.length === data.data.length;

  const rerunAnalysis = async () => {
    console.log("Rerunning analysis...");
  }

  const deleteUrls = async () => {
    console.log("Deleting URLs...");
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
      [CrawlStatus.Crawling]: "bg-blue-100 text-blue-800"
    };

    return (
      <Badge className={`text-xs font-medium ${colors[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const onStopCrawling = (urlId: number) => {
    console.log(`Stopping crawling for URL ID: ${urlId}`);
  }

  const onStartCrawling = (urlId: number) => {
    console.log(`Starting crawling for URL ID: ${urlId}`);
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
          <Button variant="destructive" size="sm" onClick={deleteUrls} disabled={selectedUrls.length === 0}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Selected
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
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
              {error instanceof Error ? error.message : "An unexpected error occurred."}
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
                      <Checkbox checked={allCurrentPageSelected} onCheckedChange={handleSelectAll} />
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                      <Button variant="ghost" className="h-auto p-0!">
                        Title
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>
                      <Button variant="ghost" className="h-auto p-0!">
                        HTML Version
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" className="h-auto p-0!">
                        Internal Links
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" className="h-auto p-0!">
                        External Links
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" className="h-auto p-0!">
                        Broken Links
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
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
                      <TableCell>{url.internalLinks}</TableCell>
                      <TableCell>{url.externalLinks}</TableCell>
                      <TableCell>{url.brokenLinks}</TableCell>
                      <TableCell className="flex gap-1">
                        {url.status === CrawlStatus.Crawling ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={e => {
                              e.stopPropagation();
                              onStopCrawling(url.ID);
                            }}
                          >
                            <Pause className="w-3 h-3" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={e => {
                              e.stopPropagation();
                              onStartCrawling(url.ID);
                            }}
                          >
                            <Play className="w-3 h-3" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {(data.pagination.currentPage - 1) * data.pagination.pageSize + 1} to{" "}
                  {Math.min(data.pagination.currentPage * data.pagination.pageSize, data.pagination.totalItems)}
                  {" "}of {data.pagination.totalItems} URLs
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
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
