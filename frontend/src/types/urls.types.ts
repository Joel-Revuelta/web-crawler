
export interface PaginatedUrls {
    data:       URL[];
    pagination: Pagination;
}

export interface URL {
    ID:            number;
    CreatedAt:     Date;
    UpdatedAt:     Date;
    DeletedAt:     Date | null;
    url:           string;
    status:        CrawlStatus;
    htmlVersion:   string;
    title:         string;
    headingsCount: HeadingsCount;
    internalLinks: number;
    externalLinks: number;
    brokenLinks:   number;
    hasLoginForm:  boolean;
}

export interface HeadingsCount {
    h1: number;
    h2: number;
    h3: number;
    h4: number;
    h5: number;
    h6: number;
}

export enum CrawlStatus {
    Queued = "queued",
    Crawling = "crawling",
    Completed = "completed",
    Failed = "failed",
}

export interface Pagination {
    currentPage: number;
    pageSize:    number;
    totalItems:  number;
    totalPages:  number;
}
