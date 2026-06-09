// web/src/lib/api.ts

import { useAuth } from "@clerk/nextjs";
import { useMemo } from "react";

// 1. สร้าง Base Config (URL)
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

// 2. ฟังก์ชัน api พื้นฐานสำหรับเรียกฝั่ง Server Components (RSC)
export const api = async (endpoint: string, options: FetchOptions = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (options.body instanceof FormData) {
    delete headers["Content-Type"];
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "An error occurred");
  }

  return response.json();
};

export interface ApiClient {
  (endpoint: string, options?: FetchOptions): Promise<unknown>;
  get<T = unknown>(endpoint: string, options?: FetchOptions): Promise<{ data: T }>;
  post<T = unknown>(endpoint: string, data?: unknown, options?: FetchOptions): Promise<{ data: T }>;
  patch<T = unknown>(endpoint: string, data?: unknown, options?: FetchOptions): Promise<{ data: T }>;
  delete<T = unknown>(endpoint: string, options?: FetchOptions): Promise<{ data: T }>;
}

// 3. สร้าง Hook สำหรับใช้ใน Client Component
// วิธีใช้: const apiClient = useApiClient();
// apiClient.get('/users')
export const useApiClient = (): ApiClient => {
  const { getToken } = useAuth();

  const apiClient = useMemo(() => {
    const clientFn = async (endpoint: string, options: FetchOptions = {}) => {
      // getToken() ของ Clerk จะเช็คให้เองว่า Token หมดอายุหรือยัง
      const token = await getToken();
      
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...options.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      if (options.body instanceof FormData) {
        delete headers["Content-Type"];
      }

      const url = `${BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.error("Unauthorized! Token might be invalid.");
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "An error occurred");
      }

      const text = await response.text();
      return text ? JSON.parse(text) : {};
    };

    const client: ApiClient = Object.assign(clientFn, {
      get: async <T = unknown>(endpoint: string, options: FetchOptions = {}) => {
        const data = await clientFn(endpoint, { ...options, method: "GET" });
        return { data } as { data: T };
      },
      post: async <T = unknown>(endpoint: string, body?: unknown, options: FetchOptions = {}) => {
        const data = await clientFn(endpoint, {
          ...options,
          method: "POST",
          body: body instanceof FormData ? body : (body !== undefined ? JSON.stringify(body) : undefined),
        });
        return { data } as { data: T };
      },
      patch: async <T = unknown>(endpoint: string, body?: unknown, options: FetchOptions = {}) => {
        const data = await clientFn(endpoint, {
          ...options,
          method: "PATCH",
          body: body instanceof FormData ? body : (body !== undefined ? JSON.stringify(body) : undefined),
        });
        return { data } as { data: T };
      },
      delete: async <T = unknown>(endpoint: string, options: FetchOptions = {}) => {
        const data = await clientFn(endpoint, { ...options, method: "DELETE" });
        return { data } as { data: T };
      },
    });

    return client;
  }, [getToken]);

  return apiClient;
};
