const BASE_URL = "/api";

export type ApiError = {
  message: string;
  details?: any;
};

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(BASE_URL + url, {
    headers: {
      ...(options?.body ? { "Content-Type": "application/json" } : {}),
      ...options?.headers,
    },
    ...options,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw {
      message: data?.error || "Request failed",
      details: data,
    } as ApiError;
  }

  return data;
}

export const apiClient = {
  get: <T>(url: string) => request<T>(url, { method: "GET" }),

  post: <T, B = unknown>(url: string, body?: B) =>
  request<T>(url, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
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
