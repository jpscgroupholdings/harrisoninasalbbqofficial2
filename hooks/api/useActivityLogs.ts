import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { buildQueryString } from "@/utils/buildQueryString";
import { PaginationMeta } from "@/utils/query-helpers";
import { ActorType } from "@/services/activityLog.service";

export interface ActivityLogEntry {
  _id: string;
  branchId?: string;
  branchName?: string;
  actor: {
    actorType: ActorType;
    customerId?: string;
    staffId?: string;
    customerName?: string;
    staffName?: string;
  };
  target: {
    entityType: string;
    entityId: string;
    label?: string;
  };
  category: string;
  action: string;
  summary: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
  updatedAt: string;
}

interface ActivityLogsResponse {
  logs: ActivityLogEntry[];
  pagination: PaginationMeta;
}

// ---------------------------------------------------------------------------
// Query parameters
// ---------------------------------------------------------------------------

export type ActivityLogParams = {
  page?: number;
  limit?: number;
  actorType?: ActorType;
  category?: string;
  action?: string;
  customerId?: string;
  staffId?: string;
  branchId?: string;
  orderId?: string;
  dateFrom?: string;
  dateTo?: string;
};

// ---------------------------------------------------------------------------
// Admin hook — calls /api/admin/activity-logs
// ---------------------------------------------------------------------------

export function useAdminActivityLogs(params?: ActivityLogParams) {
  return useQuery<ActivityLogsResponse, Error>({
    queryKey: ["admin-activity-logs", params],
    queryFn: () =>
      apiClient.get(`/admin/activity-logs${buildQueryString(params)}`),
    staleTime: 10_000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

// ---------------------------------------------------------------------------
// Customer hook — calls /api/customer/activity-logs
// ---------------------------------------------------------------------------

export function useCustomerActivityLogs(params?: ActivityLogParams) {
  return useQuery<ActivityLogsResponse, Error>({
    queryKey: ["customer-activity-logs", params],
    queryFn: () =>
      apiClient.get(`/customer/activity-logs${buildQueryString(params)}`),
    staleTime: 10_000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
