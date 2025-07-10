import { z } from "zod";

const envSchema = z.object({
    NEXT_PUBLIC_API_URL: z.string().url(),
});

const { data, error } = envSchema.safeParse({
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
} as z.infer<typeof envSchema>);

if (error) {
    throw new Error(
        "❌ Invalid environment variables:" +
            JSON.stringify(z.treeifyError(error), null, 4),
    );
}

export const env = data;
