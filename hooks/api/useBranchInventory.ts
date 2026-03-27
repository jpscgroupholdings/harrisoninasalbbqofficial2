import { InventoryItem } from "@/app/admin/(protected)/inventories/InventoryTable"
import { apiClient } from "@/lib/apiClient"
import { useQuery } from "@tanstack/react-query"

export const useBranchInventories = () => {
    return useQuery({
        queryKey: ["inventory_sync"],
        queryFn: () => apiClient.get<InventoryItem[]>("/staff/inventories")
    })
}