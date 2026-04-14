import { apiClient } from "@/lib/apiClient";
import { Category, SubCategory } from "@/types/category";

// ── API helpers ───────────────────────────────────────────────────────────────
export const categories_api = {
  getAll: () => apiClient.get<Category[]>("/categories"),

  create: async (data: {
    name: string;
    position: number;
    imageFile?: string;
  }) => apiClient.post("/categories", data),

  update: async ({
    id,
    data,
  }: {
    id: string;
    data: Partial<Category> & { imageFile?: string };
  }) => apiClient.patch(`/categories/${id}`, data),

  delete: async (id: string) => apiClient.delete(`/categories/${id}`),

  reorder: async (categories: { id: string; position: number }[]) =>
    apiClient.patch(`/categories/reorder`, { categories }),
};

export const subcategories_api = {
  getByCategory: (categoryId: string) =>
    apiClient.get<SubCategory[]>(`/subcategories?category=${categoryId}`),
  create: async (data: { name: string; categoryId: string }) =>
    apiClient.post("/subcategories", data),
  update: async ({ id, data }: { id: string; data: { name?: string } }) =>
    apiClient.patch(`/subcategories/${id}`, data),
  delete: async (id: string) => apiClient.delete(`/subcategories/${id}`),
  reorder: async (subcategories: { id: string; position: number }[]) =>
    apiClient.patch(`/subcategories/reorder`, { subcategories }),
};
