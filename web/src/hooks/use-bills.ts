// web/src/hooks/use-bills.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Bill } from "@/types/bill";

// --- DTO Interfaces ---
interface CreateBillDto {
  title: string;
  vatRate?: number;
  serviceChargeRate?: number;
  isVatIncluded?: boolean;
  promptPayNumber?: string;
}

interface AddItemDto {
  name: string;
  price: number;
  quantity: number;
}

// --- 1. Bill Hooks ---

export const useCreateBill = () => {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: CreateBillDto) => {
      const res = await api.post("/bills", data);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success("สร้างบิลสำเร็จ! 🎉");
      queryClient.invalidateQueries({ queryKey: ["my-bills"] });
      // Redirect ไปหน้าบิล
      router.push(`/bill/${data.id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "สร้างบิลไม่สำเร็จ");
    },
  });
};

export const useMyBills = () => {
  const api = useApiClient();
  return useQuery<Bill[]>({
    queryKey: ["my-bills"],
    queryFn: async () => {
      const res = await api.get("/bills");
      return res.data;
    },
  });
};

export const useJoinBill = () => {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (joinCode: string) => {
      const res = await api.post("/bill-members/join", { joinCode });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success("เข้าร่วมสำเร็จ!");
      queryClient.invalidateQueries({ queryKey: ["my-bills"] });
      // Backend ควรส่ง billId กลับมา หรือ member object ที่มี billId
      const billId = data.billId || data.bill?.id;
      if (billId) router.push(`/bill/${billId}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "ไม่พบห้องนี้");
    },
  });
};

// 1. ดึงรายละเอียดบิลเดียว (ใช้ในหน้า /bill/[id])
export const useBill = (id: string) => {
  const api = useApiClient();
  return useQuery<Bill>({
    queryKey: ["bill", id],
    queryFn: async () => {
      const res = await api.get(`/bills/${id}`);
      return res.data;
    },
    enabled: !!id, // ทำงานเมื่อมี id เท่านั้น
  });
};

// 2. เพิ่มรายการอาหาร
export const useAddBillItem = (billId: string) => {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AddItemDto) => {
      const res = await api.post("/bill-items", { ...data, billId });
      return res.data;
    },
    onSuccess: () => {
      toast.success("เพิ่มรายการแล้ว 🍗");
      // Refresh ข้อมูลบิลทันที
      queryClient.invalidateQueries({ queryKey: ["bill", billId] });
    },
    onError: (error: any) => {
      toast.error("เพิ่มรายการไม่สำเร็จ");
    },
  });
};

// 3. ลบรายการอาหาร
export const useDeleteBillItem = (billId: string) => {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      await api.delete(`/bill-items/${itemId}`);
    },
    onSuccess: () => {
      toast.success("ลบรายการแล้ว 🗑️");
      queryClient.invalidateQueries({ queryKey: ["bill", billId] });
    },
  });
};
