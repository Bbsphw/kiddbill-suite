// web/src/app/bill/[id]/page.tsx

"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { useBill, useAddBillItem } from "@/hooks/use-bills";
import { ScanReceiptDialog } from "@/components/scan-receipt-dialog";
import { BillItemRow } from "@/components/bill-item-row";
import { BillMembersDialog } from "@/components/bill-members-dialog";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Plus,
  Receipt,
  ArrowLeft,
  Copy,
  ChefHat,
  Wallet,
  ArrowRight,
  Lock,
} from "lucide-react";

export default function BillDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { user } = useUser();
  const { data: bill, isLoading, error } = useBill(id);
  const addItemMutation = useAddBillItem(id);
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");

  // Logic: เป็นเจ้าของไหม? / บิลปิดหรือยัง?
  const isOwner = user?.id === bill?.ownerId;
  const isLocked = bill?.status === "COMPLETED";

  const handleAddItem = () => {
    // ถ้าถูก Lock หรือไม่ใช่เจ้าของ ห้ามเพิ่ม
    if (isLocked || !isOwner || !itemName || !itemPrice) return;

    const price = parseFloat(itemPrice);
    if (isNaN(price) || price < 0) {
      toast.error("ราคาไม่ถูกต้อง");
      return;
    }

    addItemMutation.mutate(
      { name: itemName, price: price, quantity: 1 },
      {
        onSuccess: () => {
          setItemName("");
          setItemPrice("");
          document.getElementById("item-name-input")?.focus();
        },
      },
    );
  };

  const copyJoinCode = () => {
    if (bill?.joinCode) {
      navigator.clipboard.writeText(bill.joinCode);
      toast.success(`คัดลอกรหัส "${bill.joinCode}" แล้ว`);
    }
  };

  const grandTotal = useMemo(
    () =>
      bill?.items?.reduce((sum, item) => sum + Number(item.totalPrice), 0) || 0,
    [bill?.items],
  );

  if (isLoading)
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );

  if (error || !bill)
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-slate-50">
        <Wallet className="w-16 h-16 text-slate-300" />
        <h2 className="text-xl font-bold text-slate-800">ไม่พบบิลนี้</h2>
        <Link href="/dashboard">
          <Button>กลับหน้าหลัก</Button>
        </Link>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50/50 pb-40">
      {/* 1. Navbar */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 h-14 flex items-center justify-between shadow-sm">
        <Link
          href="/dashboard"
          className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
          {new Date(bill.createdAt).toLocaleDateString("th-TH", {
            day: "numeric",
            month: "short",
          })}
        </span>
      </nav>

      <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
        {/* 2. Bill Header Card */}
        <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden ring-1 ring-slate-100 transition-shadow hover:shadow-md">
          <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 w-full" />
          <CardHeader className="pb-4 pt-6 px-6">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
                  {bill.title}
                </h1>
                {isLocked && (
                  <p className="text-xs text-emerald-600 flex items-center gap-1 mt-2 font-bold bg-emerald-50 w-fit px-2 py-1 rounded-md">
                    <Lock size={12} /> ปิดยอดเรียบร้อย
                  </p>
                )}
              </div>
              <Badge
                variant={isLocked ? "secondary" : "default"}
                className={
                  isLocked
                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }
              >
                {bill.status}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-6">
              <div className="flex items-center gap-2">
                <BillMembersDialog
                  billId={bill.id}
                  members={bill.members!}
                  ownerId={bill.ownerId}
                />
                <div
                  onClick={copyJoinCode}
                  className="cursor-pointer group flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-100 hover:bg-indigo-100 hover:border-indigo-200 transition-all active:scale-95"
                >
                  CODE:{" "}
                  <span className="font-mono text-sm tracking-wide">
                    {bill.joinCode}
                  </span>
                  <Copy
                    size={12}
                    className="opacity-50 group-hover:opacity-100"
                  />
                </div>
              </div>
              <Link href={`/bill/${id}/summary`} className="w-full sm:w-auto">
                <Button
                  size="sm"
                  className="w-full sm:w-auto bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-200 rounded-full px-6 transition-transform active:scale-95"
                >
                  สรุปยอด <ArrowRight size={16} className="ml-2" />
                </Button>
              </Link>
            </div>
          </CardHeader>
        </Card>

        {/* 3. Items Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <Receipt className="text-indigo-500" size={20} /> รายการอาหาร
            </h3>
            <span className="font-extrabold text-indigo-600 text-xl">
              ฿{grandTotal.toLocaleString()}
            </span>
          </div>

          <div className="space-y-3 min-h-[200px]">
            {bill.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 rounded-3xl bg-white border border-dashed border-slate-200 text-slate-400">
                <ChefHat size={48} className="opacity-20 mb-3" />
                <p className="font-medium">ยังไม่มีรายการอาหาร</p>
                {/* ถ้ายังไม่ปิด และเป็น Owner ถึงจะเห็นคำแนะนำนี้ */}
                {!isLocked && isOwner && (
                  <p className="text-xs mt-1 text-slate-400">
                    เพิ่มรายการได้ที่แถบด้านล่าง 👇
                  </p>
                )}
              </div>
            ) : (
              bill.items.map((item) => (
                <BillItemRow
                  key={item.id}
                  item={item}
                  billId={id}
                  members={bill.members!}
                  // 🔒 Locked ถ้า: บิลปิดแล้ว หรือ ไม่ใช่เจ้าของ
                  isLocked={isLocked || !isOwner}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* 4. Floating Action Bar (Bottom) - เฉพาะ Owner และยังไม่ปิด */}
      {!isLocked && isOwner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/90 backdrop-blur-xl border-t border-slate-200 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] pb-safe animate-in slide-in-from-bottom-4 duration-500">
          <div className="max-w-3xl mx-auto space-y-3">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Add New Item
              </span>
              <ScanReceiptDialog billId={id} />
            </div>
            <div className="flex gap-3 items-center">
              <div className="flex-1 flex gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300 transition-all">
                <Input
                  id="item-name-input"
                  placeholder="ชื่อรายการ..."
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                  className="flex-[2] h-10 bg-transparent border-none focus-visible:ring-0 shadow-none text-base pl-3"
                />
                <div className="w-px bg-slate-200 my-1" />
                <Input
                  type="number"
                  placeholder="฿"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                  className="flex-1 h-10 bg-transparent border-none focus-visible:ring-0 shadow-none text-center text-base font-medium text-slate-900"
                />
              </div>
              <Button
                onClick={handleAddItem}
                disabled={!itemName || !itemPrice || addItemMutation.isPending}
                className="h-12 w-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex-shrink-0 transition-transform active:scale-95"
              >
                {addItemMutation.isPending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Plus size={28} />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
