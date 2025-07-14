import { Badge } from "@/components/ui/badge";
import { CrawlStatus } from "@/types/urls.types";

export const getStatusBadge = (status: CrawlStatus) => {
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
