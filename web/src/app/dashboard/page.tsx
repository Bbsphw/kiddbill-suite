// web/src/app/dashboard/page.tsx

"use client";

import { useUser, UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useMyBills } from "@/hooks/use-bills";
import { CreateBillDialog } from "@/components/create-bill-dialog";
import { JoinBillDialog } from "@/components/join-bill-dialog"; // Import อันใหม่

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Receipt, Calendar } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns"; // (ถ้ายังไม่มีลง pnpm add date-fns)

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  // ดึงข้อมูลบิล
  const { data: bills, isLoading } = useMyBills();

  // Loading State (User Check)
  if (!isLoaded) return null;
  if (!user) {
    router.push("/sign-in");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Header */}
      <header className="mx-auto max-w-5xl flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            KiddBill 💸
          </h1>
          <p className="text-gray-500 text-sm">
            สวัสดีคุณ {user.firstName || "เศรษฐีใหม่"}!
          </p>
        </div>
        <UserButton />
      </header>

      <main className="mx-auto max-w-5xl space-y-8">
        {/* Action Grid (ปุ่มสร้าง/เข้าห้อง) */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-4">
          {/* ปุ่ม 1: สร้างบิล */}
          <Card className="hover:shadow-lg transition-all border-dashed border-2 border-indigo-200 bg-indigo-50/30 h-40 flex items-center justify-center">
            <CardContent className="w-full h-full p-0 flex items-center justify-center">
              <CreateBillDialog />
            </CardContent>
          </Card>

          {/* ปุ่ม 2: เข้าห้อง (New!) */}
          <Card className="hover:shadow-lg transition-all border-dashed border-2 border-orange-200 bg-orange-50/30 h-40 flex items-center justify-center">
            <CardContent className="w-full h-full p-0 flex items-center justify-center">
              <JoinBillDialog />
            </CardContent>
          </Card>
        </div>

        {/* My Bills List */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Receipt className="text-indigo-600" /> บิลล่าสุดของคุณ
          </h2>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-indigo-600 h-8 w-8" />
            </div>
          ) : bills?.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100 shadow-sm">
              <p className="text-gray-400 mb-2">ยังไม่มีบิลเลย...</p>
              <p className="text-sm text-gray-500">
                สร้างบิลใหม่ หรือขอ Code เพื่อนเข้าห้องได้เลย!
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {bills?.map((bill) => (
                <Link href={`/bill/${bill.id}`} key={bill.id}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-indigo-500 h-full">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-gray-900 truncate pr-2">
                          {bill.title}
                        </h3>
                        <Badge
                          variant={
                            bill.status === "COMPLETED"
                              ? "secondary"
                              : "default"
                          }
                          className="text-[10px]"
                        >
                          {bill.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          <span>
                            {format(new Date(bill.createdAt), "dd/MM/yyyy")}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users size={14} />
                          {/* (API อาจจะต้อง return members count มาด้วย ถ้าไม่มีใช้ 1 ไปก่อน) */}
                          <span>{bill.members?.length || 1} คน</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
