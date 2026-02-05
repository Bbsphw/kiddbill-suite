// web/src/components/payment-settings-dialog.tsx

"use client";

import { useState, useEffect } from "react";
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

  // Form State (สำหรับสร้างใหม่)
  const [newPromptPay, setNewPromptPay] = useState("");
  const [newName, setNewName] = useState("");
  const [newBank, setNewBank] = useState("");

  const api = useApiClient();
  const queryClient = useQueryClient();

  // Hooks
  const { data: accounts, isLoading } = useBankAccounts();
  const createAccountMutation = useCreateBankAccount();
  const deleteAccountMutation = useDeleteBankAccount();

  // Reset State เมื่อเปิด Dialog
  useEffect(() => {
    if (open) {
      setMode("SELECT");
      // Highlight บัญชีที่ใช้อยู่ปัจจุบัน
      if (currentPromptPay && accounts) {
        const found = accounts.find(
          (a) => a.accountNumber === currentPromptPay,
        );
        if (found) setSelectedBankId(found.id);
      }
    }
  }, [open, currentPromptPay, accounts]);

  // 1. Mutation: อัปเดตข้อมูลบิล (Snapshot)
  const updateBillMutation = useMutation({
    mutationFn: async (account: BankAccount) => {
      // ✅ แก้ไขตรงนี้: Patch ข้อมูลลง Bill ให้ครบทั้ง promptPayNumber และ bankAccount
      // เพื่อให้หน้า Summary แสดงผลได้ทั้ง QR Code และ การ์ด Copy เลขบัญชี
      await api.patch(`/bills/${billId}`, {
        promptPayNumber: account.accountNumber, // ใช้สำหรับ Gen QR
        bankAccount: account.accountNumber, // ใช้สำหรับโชว์การ์ด Copy เลขบัญชี
        promptPayName: account.accountName,
        bankName: account.bankName,
      });
    },
    onSuccess: () => {
      // Invalidate เพื่อให้หน้า Summary โหลดข้อมูลใหม่มาแสดง
      queryClient.invalidateQueries({ queryKey: ["bill-summary", billId] });
      toast.success("ตั้งค่ารับเงินเรียบร้อย ✅");
      setOpen(false);
    },
    onError: () => toast.error("อัปเดตบิลไม่สำเร็จ"),
  });

  // 2. Handle Create New Account
  const handleCreate = () => {
    if (!newPromptPay || !newName) return;

    createAccountMutation.mutate(
      {
        accountNumber: newPromptPay,
        accountName: newName,
        bankName: newBank || "PROMPTPAY",
        isDefault: accounts?.length === 0, // ถ้าเป็นบัญชีแรก ให้เป็น default เลย
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
          className="gap-2 bg-white hover:bg-gray-50 text-indigo-600 border-indigo-200"
        >
          <Settings size={14} /> ตั้งค่ารับเงิน
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md bg-gray-50/50 p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 bg-white border-b">
          <DialogTitle>
            {mode === "SELECT" ? "เลือกบัญชีรับเงิน 💰" : "เพิ่มบัญชีใหม่ ➕"}
          </DialogTitle>
        </DialogHeader>

        <div className="p-4">
          {/* --- MODE: SELECT --- */}
          {mode === "SELECT" && (
            <div className="space-y-3">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="animate-spin text-indigo-600" />
                </div>
              ) : accounts?.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Wallet className="mx-auto h-10 w-10 mb-2 opacity-30" />
                  <p>ยังไม่มีบัญชีที่บันทึกไว้</p>
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
                        "group flex items-center justify-between p-3 rounded-xl border bg-white transition-all cursor-pointer shadow-sm select-none",
                        selectedBankId === acc.id
                          ? "border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50/30"
                          : "border-gray-100 hover:border-indigo-200",
                      )}
                      onClick={() => handleSelect(acc)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs">
                          {acc.bankName.substring(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900 text-sm">
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
                          <p className="font-mono text-xs text-gray-500">
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
                            className="h-8 w-8 text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation(); // กันไม่ให้ trigger select
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
                className="w-full border-dashed border-gray-300 text-gray-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50"
                onClick={() => setMode("CREATE")}
              >
                <Plus size={16} className="mr-2" /> เพิ่มบัญชีใหม่
              </Button>
            </div>
          )}

          {/* --- MODE: CREATE --- */}
          {mode === "CREATE" && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>
                  เบอร์พร้อมเพย์ / เลขบัตร ปชช. / เลขบัญชี{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="08x-xxx-xxxx"
                  value={newPromptPay}
                  onChange={(e) => setNewPromptPay(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label>
                  ชื่อบัญชี <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="นายสมชาย ใจดี"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>ธนาคาร (Optional)</Label>
                <Input
                  placeholder="เช่น KBANK, SCB, PROMPTPAY"
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
                  )}
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
