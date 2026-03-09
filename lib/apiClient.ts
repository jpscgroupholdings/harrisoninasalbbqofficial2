const BASE_URL = "/api";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(BASE_URL + url, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}

export const apiClient = {
  get: <T>(url: string) => request<T>(url, { method: "GET" }),

  post: <T>(url: string, body?: unknown) =>
    request<T>(url, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  put: <T>(url: string, body?: unknown) =>
    request<T>(url, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  patch: <T>(url: string, body?: unknown) =>
    request<T>(url, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined
    }),
  delete: <T>(url: string) => request<T>(url, { method: "DELETE" }),
};
