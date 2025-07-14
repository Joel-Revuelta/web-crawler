"use client";

import { useWebSocket } from '@/hooks/useWebSocket';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { PaginatedUrls, URL } from '@/types/urls.types';
import { fetchUrlById } from '@/services/urlsService';

export default function WebSocketManager() {
  const { lastMessage } = useWebSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (lastMessage) {
      const updateUrlData = async () => {
        try {
          const response = await fetchUrlById(lastMessage.id);
          const updatedUrl = response.data;

          queryClient.setQueriesData<PaginatedUrls>({ queryKey: ['urls'] }, (oldData) => {
            if (!oldData) return oldData;

            const newData = oldData.data.map((url: URL) => {
              if (url.ID === updatedUrl.ID) {
                return updatedUrl;
              }
              return url;
            });

            return { ...oldData, data: newData };
          });
        } catch (error) {
          console.error("Failed to fetch URL by ID:", error);
        }
      };

      updateUrlData();
    }
  }, [lastMessage, queryClient]);

  return null;
}
