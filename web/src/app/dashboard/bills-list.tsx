"use client";

import Link from "next/link";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { useMyBills } from "@/hooks/use-bills";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Receipt, Calendar, Users, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function BillsList() {
  const { data: bills, isLoading: isBillsLoading } = useMyBills();

  if (isBillsLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-48 rounded-3xl bg-white p-6 shadow-sm animate-pulse border border-slate-100"
          ></div>
        ))}
      </div>
    );
  }

  if (!bills || bills.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/30 py-20 text-center">
        <div className="mb-4 rounded-full bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <Receipt className="h-10 w-10 text-slate-300" />
        </div>
        <h4 className="text-lg font-bold text-slate-900">ยังไม่มีรายการบิล</h4>
        <p className="mx-auto mt-2 max-w-xs text-sm text-slate-500">
          เริ่มใช้งานด้วยการสร้างบิลใหม่ด้านบน
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {bills.map((bill) => (
        <Link href={`/bill/${bill.id}`} key={bill.id} className="group block h-full">
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
                      {format(new Date(bill.createdAt), "d MMM yy", { locale: th })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 border border-slate-100">
                    <Users className="h-3.5 w-3.5" />
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {bill._count?.members ?? (bill as any).members?.length ?? 1} สมาชิก
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
  );
}
