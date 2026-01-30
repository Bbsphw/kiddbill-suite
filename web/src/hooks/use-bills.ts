// web/src/hooks/use-bills.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, setAuthToken } from "@/lib/api";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { Bill } from "@/types/bill";

// --- Hook: ดึงข้อมูลบิลเดียว (GET) ---
export function useBill(billId: string) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["bill", billId],
    queryFn: async () => {
      const token = await getToken();
      if (token) setAuthToken(token);

      const res = await api.get<Bill>(`/bills/${billId}`);
      return res.data;
    },
    enabled: !!billId,
    retry: 1,
  });
}

// --- Hook: สร้างบิลใหม่ (POST) ---
// *ตัวที่หายไป กลับมาแล้วครับ*
export function useCreateBill() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (title: string) => {
      const token = await getToken();
      if (token) setAuthToken(token);
      // ส่งข้อมูล title ไปสร้างบิล
      return api.post("/bills", { title });
    },
    onSuccess: () => {
      toast.success("สร้างบิลเสร็จแล้ว! 🚀");
      // ถ้ามีหน้า List บิล ก็ควร Invalidate ตรงนี้ด้วย
      // queryClient.invalidateQueries({ queryKey: ['bills'] });
    },
    onError: (error: any) => {
      console.error(error);
      toast.error("สร้างบิลไม่สำเร็จ ลองใหม่นะ");
    },
  });
}

// --- Hook: เพิ่มรายการอาหาร (POST) ---
export function useAddBillItem(billId: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      price: number;
      quantity: number;
    }) => {
      const token = await getToken();
      if (token) setAuthToken(token);

      return api.post("/bill-items", { ...data, billId });
    },
    onSuccess: () => {
      toast.success("เพิ่มรายการแล้ว! 😋");
      queryClient.invalidateQueries({ queryKey: ["bill", billId] });
    },
    onError: (error: any) => {
      console.error(error);
      toast.error("เพิ่มรายการไม่สำเร็จจ้า");
    },
  });
}

// --- Hook: ลบรายการอาหาร (DELETE) ---
export function useDeleteBillItem(billId: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const token = await getToken();
      if (token) setAuthToken(token);
      return api.delete(`/bill-items/${itemId}`);
    },
    onSuccess: () => {
      toast.success("ลบรายการแล้ว");
      queryClient.invalidateQueries({ queryKey: ["bill", billId] });
    },
    onError: () => toast.error("ลบไม่ได้จ้า"),
  });
}

// [เพิ่ม] Hook: ดึงรายการบิลทั้งหมดของฉัน
export function useMyBills() {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["bills"], // Key สำหรับ Cache
    queryFn: async () => {
      const token = await getToken();
      if (token) setAuthToken(token);

      const res = await api.get<Bill[]>("/bills");
      return res.data;
    },
  });
}

// [เพิ่ม] Hook: ขอเข้าร่วมบิล (Join)
export function useJoinBill() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (joinCode: string) => {
      const token = await getToken();
      if (token) setAuthToken(token);
      // ส่ง joinCode ไปที่ API
      return api.post("/bill-members/join", { joinCode });
    },
    onSuccess: () => {
      toast.success("เข้าร่วมบิลสำเร็จ! 🎉");
      // สั่งให้โหลดรายการบิลใหม่ทันที จะได้เห็นบิลที่เพิ่งเข้าโผล่มา
      queryClient.invalidateQueries({ queryKey: ["bills"] });
    },
    onError: (error: any) => {
      // ดึง Error Message จาก Server มาโชว์
      const msg = error.response?.data?.message || "เข้าร่วมไม่สำเร็จ";
      toast.error(msg);
    },
  });
}
