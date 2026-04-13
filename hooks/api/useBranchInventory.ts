import { InventoryItem } from "@/types/inventory_types";
import { apiClient } from "@/lib/apiClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useBranchInventories = () => {
  return useQuery({
    queryKey: ["inventory_sync"],
    queryFn: () => apiClient.get<InventoryItem[]>("/staff/inventories"),
  });
};

interface UpdateInventoryPayload {
  quantity?: number;
  reorderLevel?: number;
}

interface UpdateInventoryResponse {
  message: string;
  data: {
    productId: string;
    quantity: number;
    reorderLevel: number;
  };
}

export const useUpdateInventory = () => {
  const queryClient = useQueryClient();

  return useMutation<
    UpdateInventoryResponse,
    Error,
    { id: string; payload: UpdateInventoryPayload }
  >({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateInventoryPayload;
    }) => apiClient.put(`/staff/inventories/${id}`, payload),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory_sync"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};
