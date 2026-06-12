import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

// Components
import { CreateBillDialog } from "@/components/create-bill-dialog";
import { JoinBillCard } from "@/components/join-bill-card";
import { BillsList } from "./bills-list";
import { DashboardHeaderUser } from "./dashboard-header-user";

// Icons
import {
  Plus,
  Wallet,
  LayoutDashboard,
  Sparkles,
} from "lucide-react";

export default async function DashboardPage() {
  const user = await currentUser();

  // 1. Not Logged In -> Redirect
  if (!user) {
    redirect("/sign-in");
  }

  // 2. Authenticated Dashboard (Server Rendered)
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
                {user.firstName || user.username || "User"}
              </p>
            </div>
            <DashboardHeaderUser />
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
          
          {/* Delegate data fetching and rendering to the Client Component */}
          <BillsList />
        </section>
      </main>
    </div>
  );
}
