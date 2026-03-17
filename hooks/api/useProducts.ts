// =========================
// QUERIES (GET data)
// ============================

import { Product } from "@/types/adminType";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ProductPayload } from "@/types/adminType";
import { toast } from "sonner";
import { apiClient } from "@/lib/apiClient";

/**
 * Fetch all product
 *
 * How it works
 * 1. First call: Fetches from API, shows loading
 * 2. Subsequent calls: Returns cached data instanly
 * 3. Background : Refetches if data is stale
 *
 */

export const useProducts = () => {
  return useQuery<Product[]>({
    // unique key for this query - like an ID for the cache
    queryKey: ["products"],

    // Function that fetches the data
    queryFn: () => apiClient.get<Product[]>("/products"),

    // Optional: Custom settings for this specific query
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
};

/**
 * Fetch single product by ID
 *
 * The querykey inludes ID, so each product gets its own cache entry
 */

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ["products", id], // ['products', '123'] is different from ['products', '456']
    queryFn: () => apiClient.get(`/products/${id}`),
    enabled: !!id, // Only run query if ID exists
  });
};

// ============================================
// MUTATIONS (CREATE/UPDATE/DELETE data)
// ============================================

/**
 * Create a new product
 *
 * Mutations handle side effects and cache updates
 */

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    // The actual API call
    mutationFn: (productData: ProductPayload) =>
      apiClient.post("/products", productData),

    // what happens after successful creation
    onSuccess: () => {
      // Invalidate products cache - forces a refetch
      // This ensures the list shows the new product
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product created successfully");
    },

    // What happens if creation fails
    onError: (error: any) => {
      console.error("Create failed:", error);
      if (error?.details?.length) {
        const message = error.details
          .map((issue: any) => issue.message)
          .join("\n");

        toast.error(message);
      } else {
        toast.error(error?.error || "Something went wrong");
      }
    },
  });
};

/**
 * Update an existing product
 *
 * Shows optimistic updates - UI updates before API responds
 */

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  type mutationProps = {
    id: string;
    data: ProductPayload; // ✅ not Partial — all fields are sent on update
  };

  return useMutation({
    mutationFn: ({ id, data }: mutationProps) =>
      apiClient.put(`/products/${id}`, data),

    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["products"] });

      const previousProducts = queryClient.getQueryData(["products"]);

      queryClient.setQueryData(["products"], (old: Product[] = []) => {
        return old.map((p) => {
          if (p._id !== id) return p;
          return {
            ...p,
            ...data,
            // ✅ Preserve populated objects — payload only has ObjectId strings
            // but the cache holds full populated objects
            category: p.category,
            subcategory: p.subcategory,
            includedItems: p.includedItems,
          };
        });
      });

      return { previousProducts };
    },

    onError: (err, variables, context) => {
      if (context?.previousProducts) {
        queryClient.setQueryData(["products"], context.previousProducts);
      }
      toast.error("Failed to update product");
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

/**
 * Delete a product
 */
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn:  (id) => apiClient.delete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted successfully");
    },
    onError: () => [
      toast.error("Failed to delete product!")
    ]
  });
};
