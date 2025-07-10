import { env } from "@/lib/env";
import axios from "axios";

const apiUrl = env.NEXT_PUBLIC_API_URL;

export function postNewUrl(url: string) {
    return axios.post(`${apiUrl}/urls`, { url });
}
