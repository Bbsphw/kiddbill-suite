// web/src/lib/api.ts

import { useAuth } from "@clerk/nextjs";
import axios, { AxiosInstance } from "axios";
import { useMemo } from "react";

// 1. สร้าง Base Config (URL)
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// 2. สร้าง Hook สำหรับใช้ใน Client Component
// วิธีใช้: const api = useApiClient();
export const useApiClient = (): AxiosInstance => {
  const { getToken } = useAuth();

  const apiClient = useMemo(() => {
    // สร้าง Instance ใหม่
    const instance = axios.create({
      baseURL: BASE_URL,
      headers: { "Content-Type": "application/json" },
    });

    // ⚡️ Interceptor: แอบใส่ Token ให้เองอัตโนมัติก่อนยิง
    instance.interceptors.request.use(
      async (config) => {
        // getToken() ของ Clerk จะเช็คให้เองว่า Token หมดอายุหรือยัง
        // ถ้าหมดแล้ว มันจะ Refresh ให้เงียบๆ แล้วส่งตัวใหม่มาให้ (สุดยอดมาก!)
        const token = await getToken();

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    // (Optional) Interceptor: จัดการ Error รวมศูนย์
    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        // เช่น ถ้าเจอ 401 ให้เด้งไปหน้า Login หรือแจ้งเตือน
        if (error.response?.status === 401) {
          console.error("Unauthorized! Token might be invalid.");
        }
        return Promise.reject(error);
      },
    );

    return instance;
  }, [getToken]);

  return apiClient;
};
