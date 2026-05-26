// web/src/hooks/use-join-bill.ts

import { useMutation } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export const useJoinBill = () => {
  const api = useApiClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (joinCode: string) => {
      // ส่งรหัสไปที่ Backend
      const res = await api.post("/bill-members/join", { joinCode });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success("เข้าร่วมบิลสำเร็จ! 🚀");
      // data.billId คือสิ่งที่ backend ส่งกลับมา (ต้องแน่ใจว่า service return billId)
      router.push(`/bill/${data.billId}`);
    },
    onError: (error: any) => {
      const msg =
        error.response?.data?.message || "ไม่พบรหัสห้อง หรือบิลถูกยกเลิกไปแล้ว";
      toast.error(msg);
    },
  });
};
