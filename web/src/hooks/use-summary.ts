// web/src/hooks/use-summary.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '@/lib/api';
import { BillSummary } from '@kiddbill/shared';
import { toast } from 'sonner';
import { queryKeys } from './query-keys';

// 1. ดึงข้อมูลสรุป
export const useBillSummary = (billId: string) => {
  const api = useApiClient();
  return useQuery<BillSummary>({
    queryKey: queryKeys.summaries.detail(billId),
    queryFn: async () => {
      const res = await api.get<BillSummary>(`/bills/${billId}/summary`);
      return res.data;
    },
    enabled: !!billId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && (data.status === 'COMPLETED' || data.status === 'CANCELLED')) {
        return false;
      }
      return 10000; // 10 seconds
    },
    refetchIntervalInBackground: false,
  });
};

// 2. สลับสถานะ จ่ายแล้ว <-> ยังไม่จ่าย
export const useTogglePaid = (billId: string) => {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberId: string) => {
      const res = await api.patch<unknown>(`/bill-members/${memberId}/toggle-paid`);
      return res.data;
    },
    onSuccess: () => {
      // Refresh ข้อมูลหน้า Summary
      queryClient.invalidateQueries({ queryKey: queryKeys.summaries.detail(billId) });
      toast.success("อัปเดตสถานะการจ่ายแล้ว 💰");
    },
    onError: (error: Error) => {
      toast.error(error.message || "ทำรายการไม่สำเร็จ");
    },
  });
};

// 3. ปิดบิล (Close Bill) - สำหรับ Owner
export const useCloseBill = (billId: string) => {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await api.patch<unknown>(`/bills/${billId}/close`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bills.detail(billId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.summaries.detail(billId) });
      toast.success("ปิดบิลเรียบร้อย! 🎉");
    },
    onError: (error: Error) => toast.error(error.message || "ปิดบิลไม่สำเร็จ"),
  });
};

// 4. เจ้าของกดยืนยันยอด (Verify)
export const useVerifyPayment = (billId: string) => {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberId: string) => {
      const res = await api.patch<unknown>(`/bill-members/${memberId}/verify`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.summaries.detail(billId) });
      toast.success("ยืนยันยอดเงินแล้ว ✅");
    },
    onError: (error: Error) => toast.error(error.message || "ยืนยันไม่สำเร็จ"),
  });
};

// 5. แจ้งโอนเงินพร้อมแนบสลิป (Submit Slip with AI matching)
export const useSubmitSlip = (billId: string) => {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ memberId, file }: { memberId: string; file: File }) => {
      // 1. ขอ Presigned URL และ File URL
      const { data: presigned } = await api.post<{
        uploadUrl: string;
        fileUrl: string;
        key: string;
      }>("/storage/upload-url", {
        fileName: file.name,
        contentType: file.type,
      });

      // 2. อัปโหลดรูปสลิป
      const uploadRes = await fetch(presigned.uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadRes.ok) {
        throw new Error("อัปโหลดสลิปไม่สำเร็จ");
      }

      // 3. ส่งข้อมูลไปตรวจเช็คสลิปและบันทึก
      const res = await api.patch<unknown>(`/bill-members/${memberId}/submit-slip`, {
        paymentProofUrl: presigned.fileUrl,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.summaries.detail(billId) });
      toast.success("ส่งสลิปแจ้งโอนเรียบร้อย ระบบ AI กำลังตรวจสอบให้ ⏳");
    },
    onError: (error: Error) => {
      const apiError = (error as unknown) as Record<string, unknown> & {
        response?: { data?: { message?: string | string[] } };
      };
      const msg = apiError.response?.data?.message || apiError.message || "ส่งสลิปไม่สำเร็จ";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    },
  });
};
