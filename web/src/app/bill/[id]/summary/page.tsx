// web/src/app/bill/[id]/summary/page.tsx

"use client";

import { useState, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

import {
  useBillSummary,
  useTogglePaid,
  useCloseBill,
  useVerifyPayment,
  useSubmitSlip,
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
  Share2,
  Upload,
  Image as ImageIcon,
  CheckCircle,
  AlertTriangle,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { PromptPayQR } from "@/components/promptpay-qr";
import { PaymentSettingsDialog } from "@/components/payment-settings-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface EnhancedMember {
  memberId: string;
  userId: string | null;
  name: string;
  isPaid: boolean;
  verifiedAt: Date | null;
  baseAmount: number;
  scAmount: number;
  vatAmount: number;
  netAmount: number;
  items: Array<{ name: string; amount: number }>;
  paymentProofUrl?: string | null;
  slipAmount?: number | null;
  slipSender?: string | null;
  slipRefId?: string | null;
  slipMatchStatus?: 'MATCHED' | 'MISMATCHED' | 'DUPLICATE' | 'UNVERIFIED' | null;
}

export default function SummaryPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const billId = params?.id as string;
  const { data: summary, isLoading } = useBillSummary(billId);
  const togglePaidMutation = useTogglePaid(billId);
  const closeBillMutation = useCloseBill(billId);
  const verifyMutation = useVerifyPayment(billId);
  const submitSlipMutation = useSubmitSlip(billId);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedVerifyMember, setSelectedVerifyMember] = useState<EnhancedMember | null>(null);



  const mySummary = useMemo(() => {
    if (!summary) return null;
    return summary.members.find((m) => m.userId === user?.id) as EnhancedMember | undefined;
  }, [summary, user?.id]);

  const isBillCompleted = summary?.status === "COMPLETED";
  const isOwner = user?.id === summary?.ownerId;

  const handleCopy = (text: string | null | undefined, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`คัดลอก${label}แล้ว`);
  };

  const handleShare = async () => {
    if (!summary) return;

    const membersText = summary.members
      .map((m, idx) => `${idx + 1}. ${m.name}: ฿${m.netAmount.toLocaleString()}`)
      .join("\n");

    const paymentInfo = summary.promptPayNumber
      ? `โอนเงินผ่านพร้อมเพย์: ${summary.promptPayNumber}\nชื่อบัญชี: ${summary.promptPayName || "-"}`
      : summary.bankAccount
      ? `ธนาคาร: ${summary.bankName || "-"}\nเลขบัญชี: ${summary.bankAccount}`
      : "ยังไม่ได้ตั้งค่าช่องทางชำระเงิน";

    const shareUrl = window.location.href.replace("/summary", "");

    const shareText = `💸 สรุปยอดบิล: ${summary.title}
--------------------------
${membersText}
--------------------------
💰 ยอดรวมทั้งหมด: ฿${summary.grandTotal.toLocaleString()}
${paymentInfo}

ดูรายละเอียดเพิ่มเติมและเช็คเมนู:
${shareUrl}
`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `สรุปบิล: ${summary.title}`,
          text: shareText,
          url: shareUrl,
        });
        toast.success("แชร์สรุปบิลสำเร็จ 📲");
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          navigator.clipboard.writeText(shareText);
          toast.success("คัดลอกสรุปบิลลง Clipboard แล้ว! 📋");
        }
      }
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success("คัดลอกสรุปบิลลง Clipboard แล้ว! 📋");
    }
  };

  const handleDownloadTicket = async () => {
    if (!summary) return;

    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Calculate sizes dynamically
      const width = 450;
      const memberCount = summary.members.length;
      const qrSpacing = summary.promptPayNumber ? 200 : 0;
      const height = 340 + memberCount * 35 + qrSpacing;
      
      canvas.width = width;
      canvas.height = height;

      // Draw Background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);

      // Stroke border
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, width - 20, height - 20);

      // Title
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 20px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(summary.title, width / 2, 55);

      // Subtitle
      ctx.fillStyle = "#64748b";
      ctx.font = "12px system-ui, sans-serif";
      ctx.fillText("สรุปยอดบิลหารค่าอาหาร • Kiddbill", width / 2, 80);

      // Dashed Line 1
      ctx.strokeStyle = "#cbd5e1";
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(30, 105);
      ctx.lineTo(width - 30, 105);
      ctx.stroke();

      // Total Label
      ctx.fillStyle = "#64748b";
      ctx.font = "bold 13px system-ui, sans-serif";
      ctx.fillText("ยอดเงินรวมสุทธิของบิล", width / 2, 140);

      // Total Value
      ctx.fillStyle = "#4f46e5";
      ctx.font = "black 38px system-ui, sans-serif";
      ctx.fillText(`฿${summary.grandTotal.toLocaleString()}`, width / 2, 185);

      // Dashed Line 2
      ctx.beginPath();
      ctx.moveTo(30, 215);
      ctx.lineTo(width - 30, 215);
      ctx.stroke();
      ctx.setLineDash([]); // Reset to solid

      // List Members Title
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 14px system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("รายการชำระรายคน", 40, 245);

      let currentY = 280;
      summary.members.forEach((m, idx) => {
        // Dot marker
        ctx.fillStyle = "#cbd5e1";
        ctx.beginPath();
        ctx.arc(45, currentY - 5, 3, 0, Math.PI * 2);
        ctx.fill();

        // Name
        ctx.fillStyle = "#334155";
        ctx.font = "14px system-ui, sans-serif";
        ctx.fillText(`${idx + 1}. ${m.name}`, 60, currentY);

        // Paid status indicator
        ctx.font = "10px system-ui, sans-serif";
        if (m.isPaid) {
          ctx.fillStyle = "#10b981"; // emerald-500
          ctx.fillText("✓ จ่ายแล้ว", 220, currentY);
        } else {
          ctx.fillStyle = "#94a3b8"; // slate-400
          ctx.fillText("⏳ รอจ่าย", 220, currentY);
        }

        // Amount
        ctx.fillStyle = "#0f172a";
        ctx.font = "bold 14px system-ui, sans-serif";
        ctx.textAlign = "right";
        ctx.fillText(`฿${m.netAmount.toLocaleString()}`, width - 40, currentY);
        ctx.textAlign = "left"; // reset

        currentY += 35;
      });

      // Dashed Line 3
      ctx.strokeStyle = "#cbd5e1";
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(30, currentY - 10);
      ctx.lineTo(width - 30, currentY - 10);
      ctx.stroke();
      ctx.setLineDash([]);

      currentY += 20;

      // Payment Details
      if (summary.promptPayNumber) {
        ctx.fillStyle = "#0f172a";
        ctx.font = "bold 14px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`พร้อมเพย์: ${summary.promptPayNumber}`, width / 2, currentY);

        if (summary.promptPayName) {
          ctx.fillStyle = "#64748b";
          ctx.font = "12px system-ui, sans-serif";
          ctx.fillText(`ชื่อบัญชี: ${summary.promptPayName}`, width / 2, currentY + 20);
        }

        // Capture canvas from DOM
        const qrCanvas = document.querySelector(".qr-canvas") as HTMLCanvasElement;
        if (qrCanvas) {
          const qrSize = 130;
          const qrX = (width - qrSize) / 2;
          const qrY = currentY + 35;
          ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);
        }
      } else if (summary.bankAccount) {
        ctx.fillStyle = "#0f172a";
        ctx.font = "bold 14px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`ธนาคาร: ${summary.bankName || "-"}`, width / 2, currentY);
        ctx.fillText(`เลขที่บัญชี: ${summary.bankAccount}`, width / 2, currentY + 20);
      }

      // Download
      const dataUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `kiddbill-${summary.title}-summary.png`;
      downloadLink.href = dataUrl;
      downloadLink.click();
      toast.success("บันทึกรูปภาพสลิปสรุปยอดเรียบร้อย! 📸");
    } catch (e) {
      console.error("Canvas export failed", e);
      toast.error("ดาวน์โหลดรูปภาพไม่สำเร็จ");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && mySummary) {
      submitSlipMutation.mutate({
        memberId: mySummary.memberId,
        file,
      });
    }
  };

  if (isLoading)
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600 w-10 h-10" />
      </div>
    );
  if (!summary) return null;

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 pb-32">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* --- Header --- */}
        <div className="flex items-center justify-between">
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
          
          <div className="flex gap-2">
            <Button
              onClick={handleDownloadTicket}
              variant="outline"
              className="rounded-full border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm gap-2 h-10 px-3 sm:px-4"
            >
              <ImageIcon className="w-4 h-4 text-slate-500" />
              <span className="hidden xs:inline">บันทึกรูป</span>
            </Button>

            <Button
              onClick={handleShare}
              variant="outline"
              className="rounded-full border-indigo-200 text-indigo-700 hover:bg-indigo-50 shadow-sm gap-2 h-10 px-3 sm:px-4"
            >
              <Share2 className="w-4 h-4" />
              <span>แชร์ยอด</span>
            </Button>
          </div>
        </div>

        {/* 1. Grand Total Card */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-2xl shadow-indigo-900/20 p-8 text-center animate-in fade-in duration-500">
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
                          ? mySummary.verifiedAt
                            ? "โอนเงินเรียบร้อยแล้ว 🎉"
                            : "แจ้งโอนแล้ว (รอตรวจสลิป) ⏳"
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
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                
                <Button
                  className={cn(
                    "w-full h-12 rounded-xl text-base shadow-md transition-all active:scale-[0.98]",
                    mySummary.isPaid
                      ? "bg-white border-2 border-slate-200 text-slate-500 hover:bg-slate-50 shadow-none"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200",
                  )}
                  onClick={() => {
                    if (mySummary.isPaid) {
                      togglePaidMutation.mutate(mySummary.memberId);
                    } else {
                      fileInputRef.current?.click();
                    }
                  }}
                  disabled={togglePaidMutation.isPending || submitSlipMutation.isPending}
                >
                  {submitSlipMutation.isPending ? (
                    <Loader2 className="animate-spin mr-2" />
                  ) : togglePaidMutation.isPending ? (
                    <Loader2 className="animate-spin mr-2" />
                  ) : mySummary.isPaid ? null : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  {submitSlipMutation.isPending
                    ? "กำลังส่งตรวจสลิป..."
                    : mySummary.isPaid
                    ? "ยกเลิกสถานะจ่าย"
                    : "อัปโหลดสลิปแจ้งโอนเงิน"}
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
              currentPromptPay={summary.promptPayNumber || undefined}
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
              .map((member: EnhancedMember) => (
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
                        <div className="flex items-center gap-1.5">
                          {member.slipMatchStatus === 'MATCHED' && (
                            <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
                              ยอดตรง
                            </span>
                          )}
                          {member.slipMatchStatus === 'MISMATCHED' && (
                            <span className="text-[10px] text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded font-bold">
                              ยอดไม่ตรง
                            </span>
                          )}
                          {member.slipMatchStatus === 'DUPLICATE' && (
                            <span className="text-[10px] text-red-700 bg-red-50 px-1.5 py-0.5 rounded font-bold">
                              สลิปซ้ำ
                            </span>
                          )}
                          <Button
                            size="sm"
                            className="h-7 px-3 text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm"
                            onClick={() => setSelectedVerifyMember(member)}
                          >
                            ตรวจสอบ
                          </Button>
                        </div>
                      ) : (
                        <span
                          className={cn(
                            "text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-medium",
                            member.isPaid
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-slate-100 text-slate-400",
                          )}
                        >
                          {member.isPaid ? <CheckCheck size={10} /> : null}{" "}
                          {member.isPaid
                            ? member.verifiedAt
                              ? "ตรวจสอบแล้ว"
                              : "รอตรวจสอบ"
                            : "รอจ่าย"}
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

      {/* --- 6. AI Verification Details Modal for Owner --- */}
      {selectedVerifyMember && (
        <Dialog
          open={!!selectedVerifyMember}
          onOpenChange={(open) => !open && setSelectedVerifyMember(null)}
        >
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-800">
                ตรวจสอบสลิปของ: {selectedVerifyMember.name}
              </DialogTitle>
              <DialogDescription>
                เปรียบเทียบรูปภาพสลิปกับผลการตรวจด้วยปัญญาประดิษฐ์ (AI)
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {selectedVerifyMember.paymentProofUrl ? (
                <div className="relative border border-slate-100 rounded-2xl overflow-hidden bg-slate-50 aspect-[3/4] max-h-[300px] flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedVerifyMember.paymentProofUrl}
                    alt="หลักฐานการโอนเงิน"
                    className="object-contain w-full h-full"
                  />
                </div>
              ) : (
                <div className="h-40 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400">
                  <ImageIcon size={36} className="opacity-40 mb-2" />
                  <p className="text-sm">ไม่พบรูปภาพหลักฐานการโอน</p>
                </div>
              )}

              <div className="bg-slate-50 rounded-2xl p-4 space-y-3 text-sm border border-slate-100">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                  <span className="font-bold text-slate-600">วิเคราะห์โดย AI</span>
                  {selectedVerifyMember.slipMatchStatus === 'MATCHED' && (
                    <Badge className="bg-emerald-500 text-white flex gap-1 items-center hover:bg-emerald-500">
                      <CheckCircle size={12} /> ยอดเงินตรง
                    </Badge>
                  )}
                  {selectedVerifyMember.slipMatchStatus === 'MISMATCHED' && (
                    <Badge className="bg-rose-500 text-white flex gap-1 items-center hover:bg-rose-500">
                      <AlertTriangle size={12} /> ยอดเงินไม่ตรง!
                    </Badge>
                  )}
                  {selectedVerifyMember.slipMatchStatus === 'DUPLICATE' && (
                    <Badge className="bg-red-700 text-white flex gap-1 items-center hover:bg-red-700">
                      <XCircle size={12} /> สลิปซ้ำซ้อน!
                    </Badge>
                  )}
                  {selectedVerifyMember.slipMatchStatus === 'UNVERIFIED' && (
                    <Badge className="bg-amber-500 text-white flex gap-1 items-center hover:bg-amber-500">
                      <HelpCircle size={12} /> ไม่ได้ตรวจสอบ
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">ยอดเงินจริงในสลิป:</span>
                    <span className="font-bold text-slate-800 text-base">
                      {selectedVerifyMember.slipAmount !== null && selectedVerifyMember.slipAmount !== undefined
                        ? `฿${selectedVerifyMember.slipAmount.toLocaleString()}`
                        : "ไม่พบข้อมูล"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">ยอดที่ต้องจ่าย:</span>
                    <span className="font-bold text-indigo-600 text-base">
                      ฿{selectedVerifyMember.netAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block font-medium">ผู้โอนในสลิป:</span>
                    <span className="font-bold text-slate-800">
                      {selectedVerifyMember.slipSender || "ไม่พบข้อมูล"}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block font-medium">รหัสรายการ (Ref ID):</span>
                    <span className="font-mono text-[10px] text-slate-500">
                      {selectedVerifyMember.slipRefId || "ไม่พบข้อมูล"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setSelectedVerifyMember(null)}
              >
                ปิดหน้าต่าง
              </Button>
              <Button
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={() => {
                  verifyMutation.mutate(selectedVerifyMember.memberId, {
                    onSuccess: () => setSelectedVerifyMember(null),
                  });
                }}
                disabled={verifyMutation.isPending}
              >
                {verifyMutation.isPending && (
                  <Loader2 className="animate-spin mr-1 h-3 w-3" />
                )}
                อนุมัติและยืนยันยอดเงิน ✅
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
