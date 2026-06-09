// web/src/app/bill/[id]/summary/page.tsx

"use client";

import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useBill } from "@/hooks/use-bills";
import {
  useBillSummary,
  useTogglePaid,
  useCloseBill,
  useVerifyPayment,
} from "@/hooks/use-summary";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Loader2,
  Wallet,
  Copy,
  Lock,
  CheckCheck,
  Banknote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { PromptPayQR } from "@/components/promptpay-qr";
import { PaymentSettingsDialog } from "@/components/payment-settings-dialog";

export default function SummaryPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const billId = params?.id as string;
  const { data: summary, isLoading: isSummaryLoading } = useBillSummary(billId);
  const { data: bill, isLoading: isBillLoading } = useBill(billId);
  const togglePaidMutation = useTogglePaid(billId);
  const closeBillMutation = useCloseBill(billId);
  const verifyMutation = useVerifyPayment(billId);

  const isLoading = isSummaryLoading || isBillLoading;

  if (isLoading)
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600 w-10 h-10" />
      </div>
    );
  if (!summary) return null;

  const mySummary = summary.members.find((m) => m.userId === user?.id);
  const isBillCompleted = summary.status === "COMPLETED";
  const isOwner = user?.id === bill?.ownerId;
  const handleCopy = (text: string | null | undefined, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`คัดลอก${label}แล้ว`);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 pb-32">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full h-10 w-10 bg-white border-slate-200 shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {summary.title}
            </h1>
            <p className="text-xs text-slate-500 font-medium">สรุปยอดทั้งหมด</p>
          </div>
        </div>

        {/* 1. Grand Total Card (Dark Theme for contrast) */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-2xl shadow-indigo-900/20 p-8 text-center">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-indigo-500 opacity-20 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-64 w-64 rounded-full bg-purple-500 opacity-20 blur-3xl"></div>
          <p className="text-slate-300 text-sm font-medium uppercase tracking-widest relative z-10">
            Total Amount
          </p>
          <div className="text-5xl font-black mt-2 tracking-tight relative z-10">
            ฿{summary.grandTotal.toLocaleString()}
          </div>
          <div className="flex justify-center gap-6 text-xs text-slate-400 mt-4 relative z-10 font-mono">
            <span>VAT {summary.config.vat}%</span>
            <span>SC {summary.config.sc}%</span>
          </div>
        </div>

        {/* 2. My Summary */}
        {mySummary && (
          <section className="animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 mb-3 px-2">
              <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                ยอดของคุณ
              </h2>
            </div>
            <Card
              className={cn(
                "border-none shadow-lg overflow-hidden rounded-3xl transition-all",
                mySummary.isPaid
                  ? "bg-emerald-50/50 ring-1 ring-emerald-100"
                  : "bg-white ring-1 ring-slate-100",
              )}
            >
              <CardHeader className="pb-4 border-b border-slate-100/80">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border-4 border-white shadow-sm">
                      <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold">
                        ME
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-slate-900 text-lg">
                        {mySummary.name}
                      </p>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "mt-1",
                          mySummary.isPaid
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700",
                        )}
                      >
                        {mySummary.isPaid
                          ? "จ่ายแล้วเรียบร้อย 🎉"
                          : "รอชำระเงิน ⏳"}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-slate-800">
                      ฿{mySummary.netAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-3 bg-white/40">
                {mySummary.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm group">
                    <span className="text-slate-600 font-medium group-hover:text-slate-900 transition-colors">
                      {item.name}
                    </span>
                    <span className="font-mono text-slate-900">
                      ฿{item.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
                {(mySummary.vatAmount > 0 || mySummary.scAmount > 0) && (
                  <div className="pt-2 mt-2 border-t border-dashed border-slate-200 flex justify-between text-xs text-slate-400">
                    <span>Fee (VAT/SC)</span>
                    <span>
                      ฿
                      {(
                        mySummary.vatAmount + mySummary.scAmount
                      ).toLocaleString()}
                    </span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="p-4 bg-white border-t border-slate-100">
                <Button
                  className={cn(
                    "w-full h-12 rounded-xl text-base shadow-md transition-all active:scale-[0.98]",
                    mySummary.isPaid
                      ? "bg-white border-2 border-slate-200 text-slate-500 hover:bg-slate-50 shadow-none"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200",
                  )}
                  onClick={() => togglePaidMutation.mutate(mySummary.memberId)}
                  disabled={togglePaidMutation.isPending}
                >
                  {togglePaidMutation.isPending && (
                    <Loader2 className="animate-spin mr-2" />
                  )}
                  {mySummary.isPaid ? "ยกเลิกสถานะจ่าย" : "แจ้งโอนเงิน"}
                </Button>
              </CardFooter>
            </Card>
          </section>
        )}

        {/* 3. Payment & QR */}
        <section>
          <div className="flex items-center justify-between mb-3 px-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                ช่องทางชำระเงิน
              </h2>
            </div>
            <PaymentSettingsDialog
              billId={billId}
              currentPromptPay={summary.promptPayNumber}
            />
          </div>

          {!summary.promptPayNumber && !summary.bankAccount ? (
            <div className="bg-slate-100 rounded-3xl border-2 border-dashed border-slate-200 p-8 text-center text-slate-400">
              <Wallet className="mx-auto h-10 w-10 mb-2 opacity-50" />
              <p>ยังไม่ได้ระบุช่องทางชำระเงิน</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-6">
              {summary.promptPayNumber && (
                <div className="flex flex-col items-center">
                  <div className="bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-xs font-bold mb-4 uppercase tracking-wider">
                    Scan to Pay{" "}
                    {mySummary &&
                      !mySummary.isPaid &&
                      `฿${mySummary.netAmount}`}
                  </div>
                  <div className="p-4 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-slate-100">
                    <PromptPayQR
                      id={summary.promptPayNumber}
                      amount={
                        mySummary && !mySummary.isPaid
                          ? mySummary.netAmount
                          : undefined
                      }
                    />
                  </div>
                </div>
              )}
              <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-slate-400 shadow-sm">
                    <Banknote size={20} />
                  </div>
                  <div>
                    <p className="font-mono font-bold text-slate-800 text-lg">
                      {summary.promptPayNumber || summary.bankAccount}
                    </p>
                    <p className="text-xs text-slate-500">
                      {summary.bankName}{" "}
                      {summary.promptPayName && `• ${summary.promptPayName}`}
                    </p>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() =>
                    handleCopy(
                      summary.promptPayNumber || summary.bankAccount,
                      "เลขบัญชี",
                    )
                  }
                >
                  <Copy className="h-5 w-5 text-slate-400" />
                </Button>
              </div>
            </div>
          )}
        </section>

        {/* 4. Members List */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-4 flex justify-between items-center">
            <span>สถานะเพื่อน ({summary.members.length})</span>
            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
              {summary.members.filter((m) => m.isPaid).length} คนจ่ายแล้ว
            </span>
          </h3>
          <div className="space-y-4">
            {summary.members
              .filter((m) => m.userId !== user?.id)
              .map((member) => (
                <div
                  key={member.memberId}
                  className="flex justify-between items-center group"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 bg-slate-100">
                      <AvatarFallback className="text-xs font-bold text-slate-500">
                        {member.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-slate-700 text-sm">
                        {member.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {member.items.length} รายการ
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-800 text-sm">
                      ฿{member.netAmount.toLocaleString()}
                    </p>
                    <div className="flex items-center justify-end gap-2 mt-1">
                      {isOwner && member.isPaid && !member.verifiedAt ? (
                        <Button
                          size="sm"
                          className="h-6 px-2 text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white"
                          onClick={() => verifyMutation.mutate(member.memberId)}
                        >
                          ยืนยัน
                        </Button>
                      ) : (
                        <span
                          className={cn(
                            "text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1",
                            member.isPaid
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-slate-100 text-slate-400",
                          )}
                        >
                          {member.isPaid ? <CheckCheck size={10} /> : null}{" "}
                          {member.isPaid ? "จ่ายแล้ว" : "รอจ่าย"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </section>

        {/* 5. Owner Action */}
        {!isBillCompleted && isOwner && (
          <div className="pt-4">
            <Button
              variant="outline"
              className="w-full h-12 border-dashed border-slate-300 text-slate-500 hover:bg-slate-50 hover:text-red-500 hover:border-red-200"
              onClick={() => closeBillMutation.mutate()}
            >
              <Lock className="mr-2 h-4 w-4" /> ปิดบิล (สรุปยอด)
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
