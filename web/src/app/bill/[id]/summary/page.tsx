// web/src/app/bill/[id]/summary/page.tsx

"use client";

import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  useBillSummary,
  useTogglePaid,
  useCloseBill,
} from "@/hooks/use-summary";
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
  CheckCircle2,
  Loader2,
  Wallet,
  Receipt,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SummaryPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const billId = params?.id as string;

  const { data: summary, isLoading } = useBillSummary(billId);
  const togglePaidMutation = useTogglePaid(billId);
  const closeBillMutation = useCloseBill(billId);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        <p className="text-gray-500">กำลังคำนวณยอด...</p>
      </div>
    );
  }

  if (!summary) return null;

  // หาข้อมูลของ "ฉัน" (User ที่ Login อยู่)
  const mySummary = summary.members.find((m) => m.userId === user?.id);
  const isOwner = true; // TODO: เช็คจาก backend หรือ user.id === ownerId จริงๆ

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
            <p className="text-xs text-gray-500">สรุปยอดค่าใช้จ่ายทั้งหมด</p>
          </div>
        </div>

        {/* 1. Grand Total Card */}
        <Card className="bg-indigo-600 text-white border-none shadow-lg shadow-indigo-200">
          <CardContent className="p-6 text-center space-y-2">
            <p className="text-indigo-100 font-medium">ยอดรวมทั้งบิล</p>
            <div className="text-4xl font-bold tracking-tight">
              ฿{summary.grandTotal.toLocaleString()}
            </div>
            <div className="flex justify-center gap-4 text-xs text-indigo-200 mt-2">
              <span>VAT {summary.config.vat}%</span>
              <span>Service {summary.config.sc}%</span>
            </div>
          </CardContent>
        </Card>

        {/* 2. My Summary (Card เด่นสุดสำหรับ User) */}
        {mySummary && (
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-gray-700 ml-1">
              ยอดของคุณ 👈
            </h2>
            <Card className="border-indigo-200 bg-indigo-50/50 overflow-hidden">
              <CardHeader className="pb-3 border-b border-indigo-100 bg-white/50">
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
                          "text-xs font-medium",
                          mySummary.isPaid
                            ? "text-green-600"
                            : "text-orange-500",
                        )}
                      >
                        {mySummary.isPaid ? "จ่ายแล้ว ✅" : "ยังไม่ได้จ่าย"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-indigo-700">
                      ฿{mySummary.netAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-2 bg-white/50">
                {mySummary.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.name}</span>
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

              <CardFooter className="bg-white p-3 border-t border-indigo-100 flex gap-2">
                <Button
                  className={cn(
                    "w-full",
                    mySummary.isPaid
                      ? "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      : "bg-indigo-600 hover:bg-indigo-700",
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

        {/* 3. All Members List */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-gray-700 ml-1">
            สมาชิกทั้งหมด
          </h2>
          {summary.members
            .filter((m) => m.userId !== user?.id)
            .map((member) => (
              <Card key={member.memberId} className="overflow-hidden">
                <div className="p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
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
                    <p className="font-bold text-gray-900">
                      ฿{member.netAmount.toLocaleString()}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-6 text-xs px-2 mt-1",
                        member.isPaid
                          ? "text-green-600 bg-green-50"
                          : "text-gray-400",
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

        {/* 4. Payment Info (Bank) - Mockup ไว้ก่อน */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 flex gap-3 items-center">
          <div className="h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center">
            <Wallet className="text-blue-500 h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500">ช่องทางชำระเงิน</p>
            <p className="font-medium text-gray-900">012-3-45678-9 (KBank)</p>
            <p className="text-xs text-gray-400">นายสมชาย ใจดี</p>
          </div>
        </div>
      </div>
    </div>
  );
}
