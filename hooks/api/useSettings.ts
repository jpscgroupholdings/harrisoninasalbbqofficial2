import { apiClient } from "@/lib/apiClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Days = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

export interface SettingsType {
  _id?: string;
  storeName: string;
  address: string;
  contact: {
    phone?: string;
    email?: string;
    viber?: string;
  };
  operatingHours: {
    days: Days[];      // which days are active
    openTime: string;  // shared open time for all active days
    closeTime: string; // shared close time for all active days
    isClosed: boolean; // override: mark entire store as temporarily closed
  };
}

interface SettingsResponse {
  data: SettingsType | null;
}


// ─── Query Keys ───────────────────────────────────────────────────────────────

export const settingsKeys = {
  all: ["settings"] as const,
  detail: () => [...settingsKeys.all, "detail"] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** Fetch the current store settings. Returns null on first-time setup. */
export function useSettings() {
  return useQuery<SettingsResponse, Error, SettingsType | null>({
    queryKey: settingsKeys.detail(),
    queryFn: () => apiClient.get<SettingsResponse>("/settings"),
    staleTime: 1000 * 60 * 5,
    retry: 2,
    select: (res) => res.data
  });
}

/** Save (upsert) store settings. Handles cache update and toasts automatically. */
export function useSaveSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SettingsType) => apiClient.post("/settings", payload),
    onSuccess: (data) => {
      queryClient.setQueryData(settingsKeys.detail(), data);
      toast.success("Settings saved successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to save settings");
    },
  });
}