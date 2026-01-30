// web/src/app/providers/query-provider.tsx

"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // ข้อมูลถือว่าสดใหม่ 1 นาที (ไม่ fetch ซ้ำ)
            retry: 1, // ถ้า error ให้ลองใหม่แค่ 1 ครั้งพอ
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="top-center" richColors /> {/* ตัวแจ้งเตือนสวยๆ */}
    </QueryClientProvider>
  );
}
