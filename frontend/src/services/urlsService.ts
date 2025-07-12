import { FiltersState } from "@/hooks/useUrlFilters";
import { env } from "@/lib/env";
import { PaginatedUrls, URL } from "@/types/urls.types";
import axios from "axios";

const apiUrl = env.NEXT_PUBLIC_API_URL;

export function postNewUrl(newUrl: string) {
    return axios.post<URL>(`${apiUrl}/urls`, { url: newUrl });
}

export function fetchUrls(page: number, pageSize: number, filters: FiltersState) {
    console.log("Fetching URLs with filters:", filters);
    const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
    });

    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && value !== 'all') {
            if (value instanceof Date) {
                params.append(key, value.toISOString());
            } else {
                params.append(key, String(value));
            }
        }
    });

    return axios.get<PaginatedUrls>(`${apiUrl}/urls`, { params });
}
