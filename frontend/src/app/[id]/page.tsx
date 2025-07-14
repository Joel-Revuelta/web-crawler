"use client"

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getStatusBadge } from "@/lib/urls";
import { fetchUrlById } from "@/services/urlsService";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function DetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const numericId = id ? parseInt(Array.isArray(id) ? id[0] : id, 10) : NaN;

  if (isNaN(numericId)) {
    router.push('/');
    return null;
  }

  const { isPending, isError, error, data: url } = useQuery({
    queryKey: ['url', numericId],
    queryFn: () => getUrl(),
  });

  const getUrl = async () => {
    const response = await fetchUrlById(numericId);
    return response.data;
  }

  const linkData = useMemo(() => {
    if (!url) return [];
    return [
      { name: 'Internal Links', value: url.internalLinks || 0, fill: '#3b82f6' },
      { name: 'External Links', value: url.externalLinks || 0, fill: '#22c55e' },
      { name: 'Broken Links', value: url.brokenLinks || 0, fill: '#ef4444' }
    ];
  }, [url]);

  const headingData = useMemo(() => {
    if (!url || !url.headingsCount) return [];
    return [
      { name: 'H1', value: url.headingsCount.h1 || 0 },
      { name: 'H2', value: url.headingsCount.h2 || 0 },
      { name: 'H3', value: url.headingsCount.h3 || 0 },
      { name: 'H4', value: url.headingsCount.h4 || 0 },
      { name: 'H5', value: url.headingsCount.h5 || 0 },
      { name: 'H6', value: url.headingsCount.h6 || 0 }
    ];
  }, [url]);

  if (isPending) {
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Loader2 className="h-6 w-6 animate-spin" />
      <p className="mt-4 text-lg">Loading URL details...</p>
    </div>
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg text-red-500">Error loading URL details: {error.message}</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  if (!url) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg">No URL found with ID: {numericId}</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.push('/')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{url.title || "No Title"}</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            {url.url}
          </p>
        </div>
        {getStatusBadge(url.status)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">HTML Version</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{url.htmlVersion}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Internal Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{url.internalLinks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">External Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{url.externalLinks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Broken Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{url.brokenLinks}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Link Distribution</CardTitle>
            <CardDescription>Breakdown of internal vs external vs broken links</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={linkData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {linkData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Heading Structure</CardTitle>
            <CardDescription>Distribution of heading tags (H1, H2, etc.)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {headingData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={headingData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No heading data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center gap-4">
        <Card className="w-1/2">
          <CardHeader>
            <CardTitle>Page Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="font-medium">Has Login Form:</span>
              <Badge variant={url.hasLoginForm ? "default" : "secondary"}>
                {url.hasLoginForm ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Crawled At:</span>
              <span className="text-muted-foreground">
                {url.crawlStartedAt ? new Date(url.crawlStartedAt).toLocaleString() : "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Created At:</span>
              <span className="text-muted-foreground">
                {url.CreatedAt ? new Date(url.CreatedAt).toLocaleString() : "N/A"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
