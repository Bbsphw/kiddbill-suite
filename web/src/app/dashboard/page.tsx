// web/src/app/dashboard/page.tsx

"use client";

import { useUser, UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useMyBills } from "@/hooks/use-bills";
import { CreateBillDialog } from "@/components/create-bill-dialog";
import { JoinBillDialog } from "@/components/join-bill-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Receipt, Calendar } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { data: bills, isLoading } = useMyBills();

  // 1. Loading State (Auth)
  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // 2. Not Logged In
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
            ยินดีต้อนรับคุณ {user.firstName || user.username || "เพื่อนใหม่"}
          </p>
        </div>
        <UserButton />
      </header>

      <main className="mx-auto max-w-5xl space-y-8">
        {/* Action Buttons */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card className="hover:shadow-lg transition-all border-dashed border-2 border-indigo-200 bg-indigo-50/30 h-32 md:h-40 flex items-center justify-center">
            <CardContent className="w-full h-full p-0 flex items-center justify-center">
              <CreateBillDialog />
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all border-dashed border-2 border-orange-200 bg-orange-50/30 h-32 md:h-40 flex items-center justify-center">
            <CardContent className="w-full h-full p-0 flex items-center justify-center">
              <JoinBillDialog />
            </CardContent>
          </Card>
        </div>

        {/* Bills List */}
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
              <Receipt className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">ยังไม่มีบิลเลย...</p>
              <p className="text-sm text-gray-400">
                สร้างบิลใหม่ หรือขอ Code เพื่อนเข้าห้องได้เลย!
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {bills?.map((bill) => (
                <Link href={`/bill/${bill.id}`} key={bill.id}>
                  <Card className="hover:shadow-md transition-all cursor-pointer border-l-4 border-l-indigo-500 h-full group">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-gray-900 truncate pr-2 group-hover:text-indigo-600 transition-colors">
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
