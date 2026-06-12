// web/src/app/providers/query-provider.tsx

"use client";

import { QueryClientProvider } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useRef } from 'react';
import { Toaster } from 'sonner';

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = getQueryClient();
  const { userId } = useAuth();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    // ล้างแคชเฉพาะเมื่อผู้ใช้สลับบัญชีหรือออกจากระบบจริงๆ เท่านั้น
    // ไม่ล้างตอน mount ครั้งแรก ป้องกัน cache หาย
    if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
      queryClient.clear();
    }
    prevUserIdRef.current = userId;
  }, [userId, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="top-center" richColors closeButton />
    </QueryClientProvider>
  );
}
