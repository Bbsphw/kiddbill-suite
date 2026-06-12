/* eslint-disable */
// web/src/lib/api.ts

import { useAuth } from "@clerk/nextjs";
import { useMemo } from "react";

// 1. สร้าง Base Config (URL)
import { env } from "@/env";
const isServer = typeof window === "undefined";
const BASE_URL = isServer 
  ? "http://127.0.0.1:3002" // [BEST PRACTICE] RSC calls backend directly (Skip Proxy)
  : env.NEXT_PUBLIC_API_URL;

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

// Token cache module scope
let _cachedToken: string | null = null;
let _tokenExpiresAt = 0;

// 3. สร้าง Hook สำหรับใช้ใน Client Component
// วิธีใช้: const apiClient = useApiClient();
// apiClient.get('/users')
export const useApiClient = (): ApiClient => {
  const { getToken } = useAuth();

  const apiClient = useMemo(() => {
    const clientFn = async (endpoint: string, options: FetchOptions = {}) => {
      // Token Caching: Clerk's getToken causes latency on every call
      // Cache the token for 50 seconds since typical Clerk tokens last ~60 seconds
      let token = _cachedToken;
      // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/rules-of-hooks
      const now = Date.now();
      if (!_cachedToken || now > _tokenExpiresAt) {
        token = await getToken();
        _cachedToken = token;
        _tokenExpiresAt = now + 50 * 1000; // Cache for 50 seconds
      }
      
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
