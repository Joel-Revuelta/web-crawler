"use client";

import { useWebSocket } from '@/hooks/useWebSocket';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { PaginatedUrls, URL } from '@/types/urls.types';

export default function WebSocketManager() {
  const { lastMessage } = useWebSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (lastMessage) {
      console.log("Received WebSocket message:", lastMessage);
      queryClient.setQueriesData<PaginatedUrls>({ queryKey: ['urls'] }, (oldData) => {
        if (!oldData) return oldData;

        const newData = oldData.data.map((url: URL) => {
          if (url.ID === lastMessage.id) {
            return { ...url, status: lastMessage.status };
          }
          return url;
        });

        return { ...oldData, data: newData };
      });
    }
  }, [lastMessage, queryClient]);

  return null;
}
