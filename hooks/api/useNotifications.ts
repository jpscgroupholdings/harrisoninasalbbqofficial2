/**
 * useNotifications — real-time notification hook for the admin panel.
 *
 * Connects to the SSE stream for instant push, fetches the initial
 * list via REST, and exposes mark-as-read mutations.
 *
 * Auto-reconnects when the SSE connection drops (Vercel timeout, network).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import type {
  NotificationItem,
  NotificationsResponse,
} from "@/types/notification";

const QUERY_KEY = ["admin-notifications"] as const;
const SSE_RECONNECT_DELAY = 3000; // 3s base delay
const SSE_MAX_RECONNECT_DELAY = 30000; // cap exponential backoff

interface UseNotificationsOptions {
  /** Branch ID to filter by — pass "all" for superadmin */
  branchId: string;
  /** Number of notifications to fetch initially */
  limit?: number;
}

export function useNotifications({ branchId, limit = 20 }: UseNotificationsOptions) {
  const queryClient = useQueryClient();

  // ── REST: fetch notifications ──
  const { data, isLoading, isFetching } = useQuery<NotificationsResponse>({
    queryKey: [...QUERY_KEY, branchId],
    queryFn: () =>
      apiClient.get(
        `/admin/notifications?branchId=${branchId}&limit=${limit}`,
      ),
    staleTime: 1000 * 60 * 2, // 2 min
    refetchOnWindowFocus: true,
  });

  // Local state for unread count — updated optimistically by SSE and mutations
  const [unreadCount, setUnreadCount] = useState(data?.unreadCount ?? 0);

  // Sync when REST data arrives
  useEffect(() => {
    if (data?.unreadCount !== undefined) {
      setUnreadCount(data.unreadCount);
    }
  }, [data?.unreadCount]);

  // ── SSE: real-time stream ──
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const reconnectDelayRef = useRef(SSE_RECONNECT_DELAY);

  const connectSSE = useCallback(() => {
    // Close any existing connection
    eventSourceRef.current?.close();

    const url = `/api/admin/notifications/stream?branchId=${branchId}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);

        if (parsed.type === "init") {
          setUnreadCount(parsed.payload.unreadCount);
          reconnectDelayRef.current = SSE_RECONNECT_DELAY; // reset backoff
        }

        if (parsed.type === "notification") {
          const notification: NotificationItem = parsed.payload;
          setUnreadCount((prev) => prev + 1);

          // Prepend to cached list so the dropdown shows it immediately
          queryClient.setQueryData<NotificationsResponse>(
            [...QUERY_KEY, branchId],
            (old) => {
              if (!old) return old;
              return {
                ...old,
                notifications: [notification, ...old.notifications],
                unreadCount: old.unreadCount + 1,
                totalCount: old.totalCount + 1,
              };
            },
          );
        }
        // "heartbeat" — do nothing
      } catch {
        // Ignore malformed messages
      }
    };

    es.onerror = () => {
      es.close();
      eventSourceRef.current = null;

      // Exponential backoff reconnection
      const delay = Math.min(
        reconnectDelayRef.current,
        SSE_MAX_RECONNECT_DELAY,
      );
      reconnectDelayRef.current = delay * 1.5;

      reconnectTimeoutRef.current = setTimeout(connectSSE, delay);
    };
  }, [branchId, queryClient]);

  useEffect(() => {
    connectSSE();

    return () => {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
      clearTimeout(reconnectTimeoutRef.current);
    };
  }, [connectSSE]);

  // ── Mutation: mark single as read ──
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      apiClient.patch(`/admin/notifications/${notificationId}/read`),
    onSuccess: () => {
      setUnreadCount((prev) => Math.max(0, prev - 1));
      // Refetch to get accurate read state
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, branchId] });
    },
  });

  // ── Mutation: mark all as read ──
  const markAllAsReadMutation = useMutation({
    mutationFn: () =>
      apiClient.patch(`/admin/notifications/read-all?branchId=${branchId}`),
    onMutate: async () => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: [...QUERY_KEY, branchId] });
      setUnreadCount(0);
      queryClient.setQueryData<NotificationsResponse>(
        [...QUERY_KEY, branchId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            unreadCount: 0,
            notifications: old.notifications.map((n) => ({
              ...n,
              isRead: true,
            })),
          };
        },
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, branchId] });
    },
  });

  return {
    notifications: data?.notifications ?? [],
    unreadCount,
    totalCount: data?.totalCount ?? 0,
    isLoading,
    isFetching,
    markAsRead: (id: string) => markAsReadMutation.mutate(id),
    markAllAsRead: () => markAllAsReadMutation.mutate(),
    isMarkingAllRead: markAllAsReadMutation.isPending,
  };
}
