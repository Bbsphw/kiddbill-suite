// web/src/components/payment-settings-dialog.tsx

"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api";
import {
  useBankAccounts,
  useCreateBankAccount,
  useDeleteBankAccount,
} from "@/hooks/use-bank-accounts";
import { BankAccount } from "@/types/bank";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Settings,
  Save,
  Loader2,
  Wallet,
  Plus,
  Trash2,
  Check,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface PaymentSettingsDialogProps {
  billId: string;
  currentPromptPay?: string;
}

export function PaymentSettingsDialog({
  billId,
  currentPromptPay,
}: PaymentSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"SELECT" | "CREATE">("SELECT");
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [newPromptPay, setNewPromptPay] = useState("");
  const [newName, setNewName] = useState("");
  const [newBank, setNewBank] = useState("");
  const api = useApiClient();
  const queryClient = useQueryClient();
  const { data: accounts, isLoading } = useBankAccounts();
  const createAccountMutation = useCreateBankAccount();
  const deleteAccountMutation = useDeleteBankAccount();

  // Track previous props/state for safe adjustment in render (prevents useEffect warnings/cascading renders)
  const [prevOpen, setPrevOpen] = useState(false);
  const [prevPromptPay, setPrevPromptPay] = useState<string | undefined>(undefined);
  const [prevAccounts, setPrevAccounts] = useState<BankAccount[] | undefined>(undefined);

  if (open !== prevOpen || currentPromptPay !== prevPromptPay || accounts !== prevAccounts) {
    setPrevOpen(open);
    setPrevPromptPay(currentPromptPay);
    setPrevAccounts(accounts);
    
    if (open) {
      if (open !== prevOpen) {
        setMode("SELECT");
      }
      if (currentPromptPay && accounts) {
        const found = accounts.find(
          (a) => a.accountNumber === currentPromptPay,
        );
        setSelectedBankId(found ? found.id : null);
      }
    } else {
      setSelectedBankId(null);
    }
  }

  const updateBillMutation = useMutation({
    mutationFn: async (account: BankAccount) => {
      await api.patch(`/bills/${billId}`, {
        promptPayNumber: account.accountNumber,
        bankAccount: account.accountNumber,
        promptPayName: account.accountName,
        bankName: account.bankName,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bill-summary", billId] });
      toast.success("บันทึกแล้ว ✅");
      setOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "บันทึกไม่สำเร็จ");
    },
  });

  const handleCreate = () => {
    if (!newPromptPay || !newName) return;
    createAccountMutation.mutate(
      {
        accountNumber: newPromptPay,
        accountName: newName,
        bankName: newBank || "PROMPTPAY",
        isDefault: accounts?.length === 0,
      },
      {
        onSuccess: () => {
          setMode("SELECT");
          setNewPromptPay("");
          setNewName("");
          setNewBank("");
        },
      },
    );
  };
  const handleSelect = (account: BankAccount) => {
    setSelectedBankId(account.id);
    updateBillMutation.mutate(account);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 bg-white hover:bg-slate-50 text-indigo-600 border-indigo-200 shadow-sm rounded-full"
        >
          <Settings size={14} /> ตั้งค่ารับเงิน
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-slate-50/50 p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 bg-white border-b">
          <DialogTitle>
            {mode === "SELECT" ? "เลือกบัญชีรับเงิน 💰" : "เพิ่มบัญชีใหม่ ➕"}
          </DialogTitle>
        </DialogHeader>
        <div className="p-4">
          {mode === "SELECT" && (
            <div className="space-y-3">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="animate-spin text-indigo-600" />
                </div>
              ) : accounts?.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Wallet className="mx-auto h-10 w-10 mb-2 opacity-30" />
                  <p>ยังไม่มีบัญชี</p>
                  <Button
                    variant="link"
                    onClick={() => setMode("CREATE")}
                    className="text-indigo-600"
                  >
                    เพิ่มบัญชีแรกเลย
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                  {accounts?.map((acc) => (
                    <div
                      key={acc.id}
                      className={cn(
                        "group flex items-center justify-between p-3 rounded-2xl border bg-white transition-all cursor-pointer shadow-sm select-none",
                        selectedBankId === acc.id
                          ? "border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50/30"
                          : "border-slate-100 hover:border-indigo-200",
                      )}
                      onClick={() => handleSelect(acc)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs">
                          {acc.bankName.substring(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-900 text-sm">
                              {acc.accountName}
                            </p>
                            {acc.isDefault && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] h-4 px-1"
                              >
                                Default
                              </Badge>
                            )}
                          </div>
                          <p className="font-mono text-xs text-slate-500">
                            {acc.accountNumber}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {updateBillMutation.isPending &&
                        selectedBankId === acc.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                        ) : selectedBankId === acc.id ? (
                          <Check className="h-5 w-5 text-indigo-600" />
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteAccountMutation.mutate(acc.id);
                            }}
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button
                variant="outline"
                className="w-full border-dashed border-slate-300 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50"
                onClick={() => setMode("CREATE")}
              >
                <Plus size={16} className="mr-2" /> เพิ่มบัญชีใหม่
              </Button>
            </div>
          )}
          {mode === "CREATE" && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>เบอร์/เลขบัญชี *</Label>
                <Input
                  placeholder="08x-xxx-xxxx"
                  value={newPromptPay}
                  onChange={(e) => setNewPromptPay(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label>ชื่อบัญชี *</Label>
                <Input
                  placeholder="นายสมชาย ใจดี"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>ธนาคาร (Optional)</Label>
                <Input
                  placeholder="เช่น KBANK"
                  value={newBank}
                  onChange={(e) => setNewBank(e.target.value)}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="ghost"
                  onClick={() => setMode("SELECT")}
                  className="flex-1"
                >
                  <ArrowLeft size={16} className="mr-2" /> กลับ
                </Button>
                <Button
                  className="flex-[2] bg-indigo-600 hover:bg-indigo-700"
                  disabled={
                    !newPromptPay || !newName || createAccountMutation.isPending
                  }
                  onClick={handleCreate}
                >
                  {createAccountMutation.isPending ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Save size={16} className="mr-2" />
                  )}{" "}
                  บันทึก
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
