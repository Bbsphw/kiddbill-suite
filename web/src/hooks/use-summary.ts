// web/src/hooks/use-summary.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api";
import { BillSummary } from "@/types/summary";
import { toast } from "sonner";

// 1. ดึงข้อมูลสรุป
export const useBillSummary = (billId: string) => {
  const api = useApiClient();
  return useQuery<BillSummary>({
    queryKey: ["bill-summary", billId],
    queryFn: async () => {
      const res = await api.get(`/bills/${billId}/summary`);
      return res.data;
    },
    enabled: !!billId,
  });
};

// 2. สลับสถานะ จ่ายแล้ว <-> ยังไม่จ่าย
export const useTogglePaid = (billId: string) => {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberId: string) => {
      const res = await api.patch(`/bill-members/${memberId}/toggle-paid`);
      return res.data;
    },
    onSuccess: () => {
      // Refresh ข้อมูลหน้า Summary
      queryClient.invalidateQueries({ queryKey: ["bill-summary", billId] });
      toast.success("อัปเดตสถานะการจ่ายแล้ว 💰");
    },
    onError: () => {
      toast.error("ทำรายการไม่สำเร็จ");
    },
  });
};

// 3. ปิดบิล (Close Bill) - สำหรับ Owner
export const useCloseBill = (billId: string) => {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await api.patch(`/bills/${billId}/close`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bill", billId] });
      queryClient.invalidateQueries({ queryKey: ["bill-summary", billId] });
      toast.success("ปิดบิลเรียบร้อย! 🎉");
    },
    onError: () => toast.error("ปิดบิลไม่สำเร็จ"),
  });
};

// 4. เจ้าของกดยืนยันยอด (Verify)
export const useVerifyPayment = (billId: string) => {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberId: string) => {
      const res = await api.patch(`/bill-members/${memberId}/verify`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bill-summary", billId] });
      toast.success("ยืนยันยอดเงินแล้ว ✅");
    },
    onError: () => toast.error("ยืนยันไม่สำเร็จ"),
  });
};
