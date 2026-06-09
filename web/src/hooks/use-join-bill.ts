// web/src/hooks/use-join-bill.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BillMember } from "@/types/bill";

interface JoinResponse {
  message: string;
  member: BillMember;
  billId: string;
}

export const useJoinBill = () => {
  const api = useApiClient();
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (joinCode: string) => {
      // ส่งรหัสไปที่ Backend
      const res = await api.post<JoinResponse>("/bill-members/join", { joinCode });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success("เข้าร่วมบิลสำเร็จ! 🚀");
      queryClient.invalidateQueries({ queryKey: ["my-bills"] });
      
      const billId = data.billId || data.member?.billId;
      if (billId) {
        router.push(`/bill/${billId}`);
      }
    },
    onError: (error: Error) => {
      const msg = error.message || "ไม่พบรหัสห้อง หรือบิลถูกยกเลิกไปแล้ว";
      toast.error(msg);
    },
  });
};
