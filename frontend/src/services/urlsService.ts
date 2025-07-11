import { env } from "@/lib/env";
import { PaginatedUrls, URL } from "@/types/urls";
import axios from "axios";

const apiUrl = env.NEXT_PUBLIC_API_URL;

export function postNewUrl(newUrl: string) {
    return axios.post<URL>(`${apiUrl}/urls`, { url: newUrl });
}

export function fetchUrls(page: number, pageSize: number) {
    return axios.get<PaginatedUrls>(`${apiUrl}/urls`, {
        params: {
            page: page,
            limit: pageSize
        }
    });
}
