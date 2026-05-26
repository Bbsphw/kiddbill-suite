// web/src/app/dashboard/page.tsx

"use client";

import { useUser, UserButton, RedirectToSignIn } from "@clerk/nextjs";
import { useMyBills } from "@/hooks/use-bills";
import Link from "next/link";
import { format } from "date-fns";
import { th } from "date-fns/locale";

// Components
import { CreateBillDialog } from "@/components/create-bill-dialog";
import { JoinBillCard } from "@/components/join-bill-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Icons
import {
  Loader2,
  Receipt,
  Calendar,
  Users,
  Plus,
  ArrowRight,
  Wallet,
  LayoutDashboard,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const { data: bills, isLoading: isBillsLoading } = useMyBills();

  // 1. Loading State (ป้องกัน Hydration Mismatch)
  if (!isLoaded) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  // 2. Not Logged In
  if (!user) {
    return <RedirectToSignIn />;
  }

  // 3. Authenticated Dashboard
  return (
    <div className="min-h-[100dvh] bg-slate-50/50 pb-20 md:pb-24">
      {/* --- Sticky Header --- */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm transition-all supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl p-2 shadow-lg shadow-indigo-200">
              <Wallet className="text-white h-5 w-5" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight hidden xs:block font-sans">
              KiddBill
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                Welcome back
              </p>
              <p className="text-sm font-bold text-slate-700 max-w-[150px] truncate">
                {user.firstName || user.username}
              </p>
            </div>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox:
                    "h-10 w-10 ring-2 ring-white shadow-md hover:scale-105 transition-transform duration-200",
                },
              }}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* --- Hero Section --- */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              ภาพรวมค่าใช้จ่าย <Sparkles className="text-yellow-500 w-6 h-6" />
            </h2>
            <p className="text-slate-500 text-sm sm:text-base max-w-2xl leading-relaxed">
              จัดการบิล แชร์ค่าอาหาร และติดตามสถานะการจ่ายเงินกับเพื่อนๆ
              ได้ง่ายๆ
            </p>
          </div>
        </section>

        {/* --- Action Cards Grid --- */}
        <section className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
          {/* Create Bill Card */}
          <div className="group relative overflow-hidden rounded-3xl bg-white p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 transition-all hover:shadow-[0_8px_30px_rgb(79,70,229,0.15)] hover:border-indigo-100 hover:-translate-y-1 duration-300">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-gradient-to-br from-indigo-50 to-purple-50 blur-3xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10 flex flex-col h-full justify-between gap-6">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                <Plus className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                  สร้างบิลใหม่
                </h3>
                <p className="text-sm text-slate-500 mt-2">
                  เปิดบิลโต๊ะใหม่ เพิ่มรายการอาหาร แล้วแชร์ Link หรือ QR
                </p>
              </div>
              <div className="mt-auto pt-2">
                <CreateBillDialog />
              </div>
            </div>
          </div>

          {/* Join Bill Card */}
          <div className="group relative overflow-hidden rounded-3xl bg-white p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 transition-all hover:shadow-[0_8px_30px_rgb(249,115,22,0.15)] hover:border-orange-100 hover:-translate-y-1 duration-300">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-gradient-to-br from-orange-50 to-yellow-50 blur-3xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10 h-full flex flex-col justify-center">
              <JoinBillCard />
            </div>
          </div>
        </section>

        {/* --- Recent Bills List --- */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-4">
            <LayoutDashboard className="text-slate-400 h-5 w-5" />
            <h3 className="text-lg font-bold text-slate-900">รายการล่าสุด</h3>
          </div>

          {isBillsLoading ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-48 rounded-3xl bg-white p-6 shadow-sm animate-pulse border border-slate-100"
                ></div>
              ))}
            </div>
          ) : bills?.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/30 py-20 text-center">
              <div className="mb-4 rounded-full bg-white p-5 shadow-sm ring-1 ring-slate-100">
                <Receipt className="h-10 w-10 text-slate-300" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">
                ยังไม่มีรายการบิล
              </h4>
              <p className="mx-auto mt-2 max-w-xs text-sm text-slate-500">
                เริ่มใช้งานด้วยการสร้างบิลใหม่ด้านบน
              </p>
            </div>
          ) : (
            <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {bills?.map((bill) => (
                <Link
                  href={`/bill/${bill.id}`}
                  key={bill.id}
                  className="group block h-full"
                >
                  <Card className="h-full border-none shadow-[0_2px_10px_rgb(0,0,0,0.03)] ring-1 ring-slate-200 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:ring-indigo-500/50 hover:-translate-y-1 rounded-3xl overflow-hidden bg-white">
                    <CardContent className="p-0 flex flex-col h-full">
                      <div
                        className={cn(
                          "h-1.5 w-full transition-colors duration-500",
                          bill.status === "COMPLETED"
                            ? "bg-emerald-500"
                            : "bg-indigo-500 group-hover:bg-indigo-600",
                        )}
                      />
                      <div className="p-6 flex-1 flex flex-col">
                        <div className="flex justify-between items-start gap-3 mb-4">
                          <h4 className="font-bold text-slate-800 text-lg leading-tight line-clamp-2 group-hover:text-indigo-600 transition-colors">
                            {bill.title}
                          </h4>
                          <Badge
                            variant="secondary"
                            className={cn(
                              "px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase rounded-lg shadow-sm border border-opacity-50",
                              bill.status === "COMPLETED"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                : "bg-indigo-50 text-indigo-700 border-indigo-100",
                            )}
                          >
                            {bill.status}
                          </Badge>
                        </div>
                        <div className="mt-auto flex flex-wrap gap-2">
                          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 border border-slate-100">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>
                              {format(new Date(bill.createdAt), "d MMM yy", {
                                locale: th,
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 border border-slate-100">
                            <Users className="h-3.5 w-3.5" />
                            {bill._count?.members ?? bill.members?.length ?? 1}
                            สมาชิก
                          </div>
                        </div>
                      </div>
                      <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center group-hover:bg-indigo-50/30 transition-colors">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-indigo-500 transition-colors">
                          View Details
                        </span>
                        <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
