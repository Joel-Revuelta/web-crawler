"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader, Plus } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postNewUrl } from "@/services/urlsService";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { showErrorToast, showSuccessToast } from "@/lib/toasts";

const formSchema = z.object({
  url: z.url()
})

export default function AddURL() {
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: ''
    }
  })

  const mutation = useMutation({
    mutationFn: (newUrl: string) => {
      return postNewUrl(newUrl);
    }
  })

  function onSubmit(data: z.infer<typeof formSchema>) {
    mutation.mutate(data.url, {
      onSuccess: () => {
        showSuccessToast("URL added successfully!");
        queryClient.invalidateQueries({
          queryKey: ['urls']
        })
        form.reset();
      },
      onError: (error) => {
        console.error("Error adding URL:", error);
        if (error instanceof AxiosError && error.response?.data?.error) {
          showErrorToast(error.response.data.error);
        } else {
          showErrorToast("An unexpected error occurred. Please try again.");
        }
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Url</CardTitle>
        <CardDescription>Enter a website URL to start crawling and analysis</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Website URL</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://example.com"
                        {...field}
                      />
                    </FormControl>
                    <Button type="submit" disabled={mutation.isPending}>
                      {mutation.isPending ? (
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4 mr-2"/>
                      )}
                      Add URL
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
