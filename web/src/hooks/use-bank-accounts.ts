// web/src/hooks/use-bank-accounts.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api";
import { BankAccount, CreateBankAccountDto } from "@/types/bank";
import { toast } from "sonner";

// 1. ดึงบัญชีทั้งหมดของฉัน
export const useBankAccounts = () => {
  const api = useApiClient();
  return useQuery<BankAccount[]>({
    queryKey: ["my-bank-accounts"],
    queryFn: async () => {
      const res = await api.get("/bank-accounts");
      return res.data;
    },
  });
};

// 2. สร้างบัญชีใหม่
export const useCreateBankAccount = () => {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBankAccountDto) => {
      const res = await api.post("/bank-accounts", data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("บันทึกบัญชีใหม่แล้ว ✨");
      queryClient.invalidateQueries({ queryKey: ["my-bank-accounts"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "สร้างบัญชีไม่สำเร็จ");
    },
  });
};

// 3. ลบบัญชี
export const useDeleteBankAccount = () => {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/bank-accounts/${id}`);
    },
    onSuccess: () => {
      toast.success("ลบบัญชีแล้ว 🗑️");
      queryClient.invalidateQueries({ queryKey: ["my-bank-accounts"] });
    },
    onError: () => toast.error("ลบไม่สำเร็จ"),
  });
};
