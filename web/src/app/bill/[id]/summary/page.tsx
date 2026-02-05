// web/src/app/bill/[id]/summary/page.tsx

"use client";

import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useBillSummary, useTogglePaid } from "@/hooks/use-summary";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Loader2,
  Wallet,
  Copy,
  CheckCircle2,
  Banknote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { PromptPayQR } from "@/components/promptpay-qr";
import { PaymentSettingsDialog } from "@/components/payment-settings-dialog";

export default function SummaryPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const billId = params?.id as string;

  const { data: summary, isLoading } = useBillSummary(billId);
  const togglePaidMutation = useTogglePaid(billId);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        <p className="text-gray-500">กำลังโหลดสรุปยอด...</p>
      </div>
    );
  }

  if (!summary) return null;

  const mySummary = summary.members.find((m) => m.userId === user?.id);

  // Helper: ฟังก์ชัน Copy เลข
  const handleCopy = (text: string | null | undefined, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`คัดลอก${label}แล้ว`);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 pb-32">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{summary.title}</h1>
            <p className="text-xs text-gray-500">สรุปยอดค่าใช้จ่าย</p>
          </div>
        </div>

        {/* 1. Grand Total Card */}
        <Card className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-none shadow-lg shadow-indigo-200 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 bg-white opacity-5 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2 w-32 h-32"></div>
          <CardContent className="p-6 text-center space-y-2 relative z-10">
            <p className="text-indigo-100 font-medium text-sm uppercase tracking-wider">
              ยอดรวมทั้งบิล
            </p>
            <div className="text-4xl font-bold tracking-tight">
              ฿{summary.grandTotal.toLocaleString()}
            </div>
            <div className="flex justify-center gap-4 text-xs text-indigo-200 mt-2">
              <span>VAT {summary.config.vat}%</span>
              <span>•</span>
              <span>Service {summary.config.sc}%</span>
            </div>
          </CardContent>
        </Card>

        {/* 2. My Summary (ยอดของฉัน) */}
        {mySummary && (
          <div className="space-y-2 animate-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-sm font-bold text-gray-700 ml-1">
              ยอดของคุณ 👈
            </h2>
            <Card
              className={cn(
                "border-2 overflow-hidden",
                mySummary.isPaid
                  ? "border-green-200 bg-green-50/30"
                  : "border-indigo-200 bg-indigo-50/30",
              )}
            >
              <CardHeader className="pb-3 border-b border-gray-100 bg-white/60">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                      <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold">
                        ME
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-gray-900">
                        {mySummary.name}
                      </p>
                      <p
                        className={cn(
                          "text-xs font-medium flex items-center gap-1",
                          mySummary.isPaid
                            ? "text-green-600"
                            : "text-orange-500",
                        )}
                      >
                        {mySummary.isPaid
                          ? "จ่ายแล้วเรียบร้อย ✅"
                          : "รอการชำระเงิน ⏳"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {/* ยอดเงินนี้แหละ ที่จะถูกส่งไป Gen QR */}
                    <p className="text-2xl font-bold text-indigo-700">
                      ฿{mySummary.netAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-2 bg-white/60">
                {mySummary.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-600 truncate pr-4">
                      {item.name}
                    </span>
                    <span className="font-medium text-gray-900">
                      ฿
                      {item.amount.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                ))}

                {(mySummary.vatAmount > 0 || mySummary.scAmount > 0) && (
                  <>
                    <Separator className="my-2" />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>ค่าธรรมเนียม (VAT/SC)</span>
                      <span>
                        ฿
                        {(
                          mySummary.vatAmount + mySummary.scAmount
                        ).toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>

              <CardFooter className="bg-white p-3 border-t border-gray-100">
                <Button
                  className={cn(
                    "w-full shadow-sm",
                    mySummary.isPaid
                      ? "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white",
                  )}
                  disabled={togglePaidMutation.isPending}
                  onClick={() => togglePaidMutation.mutate(mySummary.memberId)}
                >
                  {togglePaidMutation.isPending && (
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  )}
                  {mySummary.isPaid ? "ยกเลิกสถานะจ่าย" : "แจ้งโอนเงิน"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {/* 3. Payment Channels (ไฮไลท์สำคัญ) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-700 ml-1">
              ช่องทางชำระเงิน
            </h2>
            <PaymentSettingsDialog
              billId={billId}
              currentPromptPay={summary.promptPayNumber}
            />
          </div>

          {/* ถ้าไม่มีข้อมูลอะไรเลย */}
          {!summary.promptPayNumber && !summary.bankAccount && (
            <div className="bg-gray-100 p-8 rounded-xl border border-dashed border-gray-300 text-center text-gray-400">
              <Wallet className="mx-auto h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">ยังไม่มีข้อมูลรับเงิน</p>
              <p className="text-xs mt-1">เจ้าของบิลกรุณากด "ตั้งค่ารับเงิน"</p>
            </div>
          )}

          {/* A. แสดง PromptPay QR (ถ้ามี) */}
          {summary.promptPayNumber && (
            <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-sm flex flex-col items-center gap-6">
              {/* QR จะโชว์เฉพาะถ้ายังไม่จ่าย */}
              {mySummary && !mySummary.isPaid ? (
                <div className="flex flex-col items-center animate-in zoom-in-95 duration-300">
                  <span className="text-[10px] font-bold text-indigo-600 mb-3 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-wider">
                    สแกนจ่ายยอดของคุณ
                  </span>
                  {/* ✅ ส่ง mySummary.netAmount เข้าไป เพื่อสร้าง QR เฉพาะคน */}
                  <PromptPayQR
                    id={summary.promptPayNumber}
                    amount={mySummary.netAmount}
                    className="shadow-lg"
                  />
                </div>
              ) : (
                // ถ้าจ่ายแล้ว หรือเป็นคนอื่นมาดู ก็โชว์ QR เปล่าๆ (รับเงินทั่วไป)
                <div className="flex flex-col items-center opacity-60 grayscale">
                  <PromptPayQR id={summary.promptPayNumber} />
                  <p className="text-xs text-gray-400 mt-2">
                    QR Code พร้อมเพย์
                  </p>
                </div>
              )}

              {/* รายละเอียด PromptPay */}
              <div className="w-full bg-indigo-50/50 p-4 rounded-xl flex justify-between items-center border border-indigo-100">
                <div>
                  <p className="text-xs text-indigo-400 font-bold mb-0.5">
                    PromptPay
                  </p>
                  <p className="font-mono text-lg font-bold text-indigo-900 tracking-wide">
                    {summary.promptPayNumber}
                  </p>
                  <p className="text-xs text-indigo-600/70">
                    {summary.promptPayName || "ไม่ระบุชื่อ"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 border-indigo-200 text-indigo-600 hover:bg-indigo-100"
                  onClick={() =>
                    handleCopy(summary.promptPayNumber, "เบอร์พร้อมเพย์")
                  }
                >
                  <Copy size={16} />
                </Button>
              </div>
            </div>
          )}

          {/* B. แสดงเลขบัญชีธนาคาร (ถ้ามี) - แยกออกมาเป็นการ์ด Copy ต่างหาก */}
          {summary.bankAccount && (
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                  <Banknote size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-900">
                      {summary.bankName || "ธนาคาร"}
                    </p>
                    <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-500">
                      Bank Account
                    </span>
                  </div>
                  <p className="font-mono text-base font-medium text-gray-600 mt-0.5">
                    {summary.bankAccount}
                  </p>
                  {/* ถ้าชื่อ PromptPay กับชื่อ Bank เป็นคนละชื่อกัน ก็โชว์ */}
                  {summary.promptPayName && (
                    <p className="text-xs text-gray-400">
                      {summary.promptPayName}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(summary.bankAccount, "เลขบัญชี")}
              >
                <Copy size={14} className="mr-2" /> คัดลอก
              </Button>
            </div>
          )}
        </div>

        {/* 4. สมาชิกคนอื่น */}
        <div className="space-y-3 pt-6">
          <h2 className="text-sm font-bold text-gray-700 ml-1">
            สมาชิกทั้งหมด ({summary.members.length})
          </h2>
          {summary.members
            .filter((m) => m.userId !== user?.id)
            .map((member) => (
              <Card
                key={member.memberId}
                className="overflow-hidden border-gray-100 shadow-sm"
              >
                <div className="p-3 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border border-gray-100">
                      <AvatarFallback className="bg-gray-100 text-gray-500 font-medium text-xs">
                        {member.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm text-gray-900">
                        {member.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {member.items.length} รายการ
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 text-sm">
                      ฿{member.netAmount.toLocaleString()}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-6 text-[10px] px-2 mt-1 rounded-full",
                        member.isPaid
                          ? "text-green-600 bg-green-50 hover:bg-green-100"
                          : "text-gray-400 hover:text-gray-600",
                      )}
                      onClick={() => togglePaidMutation.mutate(member.memberId)}
                    >
                      {member.isPaid ? "จ่ายแล้ว" : "รอจ่าย"}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
        </div>
      </div>
    </div>
  );
}
