// web/src/hooks/use-bills.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '@/lib/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Bill, BillItem } from '@/types/bill';
import { queryKeys } from './query-keys';

// --- DTO Interfaces ---
interface CreateBillDto {
  title: string;
  vatRate?: number;
  serviceChargeRate?: number;
  isVatIncluded?: boolean;
  promptPayNumber?: string;
}

export interface AddItemDto {
  name: string;
  price: number;
  quantity: number;
}

interface UpdateItemDto {
  id: string;
  name?: string;
  price?: number;
  quantity?: number;
}

// เพิ่ม Interface สำหรับ Payload
interface SplitEntry {
  memberId: string;
  weight: number;
}

interface AssignSplitDto {
  itemId: string;
  splits: SplitEntry[];
}

// --- 1. Bill Hooks ---

export const useCreateBill = () => {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: CreateBillDto) => {
      const res = await api.post<Bill>("/bills", data);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success("สร้างบิลสำเร็จ! 🎉");
      queryClient.invalidateQueries({ queryKey: queryKeys.bills.list() });
      // Redirect ไปหน้าบิล
      router.push(`/bill/${data.id}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "สร้างบิลไม่สำเร็จ");
    },
  });
};

export const useMyBills = () => {
  const api = useApiClient();
  return useQuery<Bill[]>({
    queryKey: queryKeys.bills.list(),
    queryFn: async () => {
      const res = await api.get<Bill[]>("/bills");
      return res.data;
    },
    staleTime: 30 * 1000,       // ✅ ข้อมูลสดอยู่ 30 วินาที
    gcTime: 5 * 60 * 1000,      // ✅ เก็บ cache ไว้ 5 นาที
    refetchOnMount: false,      // ✅ ถ้า cache ยังสด ไม่ต้อง re-fetch
  });
};

// 1. ดึงรายละเอียดบิลเดียว (ใช้ในหน้า /bill/[id])
export const useBill = (id: string) => {
  const api = useApiClient();
  return useQuery<Bill>({
    queryKey: queryKeys.bills.detail(id),
    queryFn: async () => {
      const res = await api.get<Bill>(`/bills/${id}`);
      return res.data;
    },
    enabled: !!id, // ทำงานเมื่อมี id เท่านั้น
    // ปิดการ Polling อัตโนมัติ (ประหยัด Server)
    // เปลี่ยนไปพึ่งพา refetchOnWindowFocus (ดึงใหม่เมื่อสลับจอ) และ Manual Sync
    refetchOnWindowFocus: true,
  });
};

// 2. เพิ่มรายการอาหาร
export const useAddBillItem = (billId: string) => {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AddItemDto) => {
      const res = await api.post<BillItem>("/bill-items", { ...data, billId });
      return res.data;
    },
    onSuccess: () => {
      toast.success("เพิ่มรายการแล้ว 🍗");
      // Refresh ข้อมูลบิลทันที
      queryClient.invalidateQueries({ queryKey: queryKeys.bills.detail(billId) });
    },
    onError: (error: Error) => {
      toast.error(error.message || "เพิ่มรายการไม่สำเร็จ");
    },
  });
};

// 2.2 เพิ่มรายการอาหารแบบกลุ่ม (Batch) เพื่อลดการ Re-render และ Network overhead
export const useAddBillItemsBatch = (billId: string) => {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (items: AddItemDto[]) => {
      const promises = items.map((item) =>
        api.post<BillItem>("/bill-items", { ...item, billId })
      );
      return Promise.all(promises);
    },
    onSuccess: (results) => {
      toast.success(`เพิ่ม ${results.length} รายการสำเร็จแล้ว! 🍗`);
      queryClient.invalidateQueries({ queryKey: queryKeys.bills.detail(billId) });
    },
    onError: (error: Error) => {
      toast.error(error.message || "เพิ่มรายการไม่สำเร็จ");
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
      queryClient.invalidateQueries({ queryKey: queryKeys.bills.detail(billId) });
    },
    onError: (error: Error) => {
      toast.error(error.message || "ลบรายการไม่สำเร็จ");
    },
  });
};

export const useUpdateBillItem = (billId: string) => {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateItemDto) => {
      const { id, ...body } = data;
      const res = await api.patch(`/bill-items/${id}`, body);
      return res.data;
    },
    onSuccess: () => {
      // Invalidate เพื่อให้ Grand Total คำนวณใหม่
      queryClient.invalidateQueries({ queryKey: queryKeys.bills.detail(billId) });
    },
    onError: (error: Error) => {
      toast.error(error.message || "แก้ไขรายการไม่สำเร็จ");
    },
  });
};

export const useAddGuestMember = (billId: string) => {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      // ยิง API POST /bill-members
      const res = await api.post("/bill-members", { billId, name });
      return res.data;
    },
    onSuccess: () => {
      toast.success("เพิ่มสมาชิกเรียบร้อย! 🙋‍♂️");
      // Refresh ข้อมูลบิลเพื่ออัปเดตรายชื่อคน
      queryClient.invalidateQueries({ queryKey: queryKeys.bills.detail(billId) });
    },
    onError: (error: Error) => {
      toast.error(error.message || "เพิ่มสมาชิกไม่สำเร็จ");
    },
  });
};

export const useAssignSplit = (billId: string) => {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AssignSplitDto) => {
      const res = await api.post("/splits/assign", data);
      return res.data;
    },
    onSuccess: () => {
      // Refresh เพื่อให้หน้าบิลอัปเดตว่าใครหารบ้าง
      queryClient.invalidateQueries({ queryKey: queryKeys.bills.detail(billId) });
      toast.success("บันทึกเรียบร้อย ✅");
    },
    onError: (error: Error) => {
      toast.error(error.message || "บันทึกไม่สำเร็จ");
    },
  });
};
