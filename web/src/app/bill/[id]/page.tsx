// web/src/app/bill/[id]/page.tsx

"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

// Hooks & Components
import { useBill, useAddBillItem } from "@/hooks/use-bills"; // 👈 ลบ useDeleteBillItem ออกได้เลย เพราะย้ายไปใน Row แล้ว
import { ScanReceiptDialog } from "@/components/scan-receipt-dialog";
import { BillItemRow } from "@/components/bill-item-row"; // 👈 Import ตัวใหม่

// UI Components
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Icons
import {
  Loader2,
  Plus,
  Receipt,
  Users,
  ArrowLeft,
  Copy,
  ChefHat,
  Wallet,
} from "lucide-react";

export default function BillDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  // 1. Fetch Data
  const { data: bill, isLoading, error } = useBill(id);
  const addItemMutation = useAddBillItem(id);
  // ไม่ต้องใช้ deleteItemMutation ตรงนี้แล้ว

  // 2. Local State for Manual Add
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");

  const handleAddItem = () => {
    if (!itemName || !itemPrice) return;
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

  const grandTotal = useMemo(() => {
    if (!bill?.items) return 0;
    return bill.items.reduce((sum, item) => sum + Number(item.totalPrice), 0);
  }, [bill?.items]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        <p className="text-gray-500 animate-pulse text-sm">กำลังโหลด...</p>
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-4">
        <Wallet className="w-12 h-12 text-gray-300" />
        <h2 className="text-xl font-bold text-gray-800">ไม่พบบิลนี้</h2>
        <Link href="/dashboard">
          <Button variant="outline">กลับหน้าหลัก</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 pb-48 md:pb-80">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm text-gray-500 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> กลับ Dashboard
          </Link>
          <span className="text-xs text-gray-400">
            {new Date(bill.createdAt).toLocaleDateString("th-TH")}
          </span>
        </div>

        {/* Header */}
        <Card className="border-none shadow-sm bg-white ring-1 ring-black/5">
          <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 w-full" />
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start">
              <h1 className="text-2xl font-bold text-gray-900">{bill.title}</h1>
              <Badge
                variant={bill.status === "COMPLETED" ? "secondary" : "default"}
              >
                {bill.status}
              </Badge>
            </div>
            <div className="flex gap-2 mt-2">
              <Badge variant="secondary" className="font-normal text-gray-600">
                <Users size={12} className="mr-1" /> {bill.members.length}
              </Badge>
              <div
                onClick={copyJoinCode}
                className="cursor-pointer flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-100 hover:bg-indigo-100"
              >
                {bill.joinCode} <Copy size={10} />
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Items List */}
        <Card className="shadow-sm border-gray-100 ring-1 ring-black/5 bg-gray-50/30">
          <CardHeader className="pb-2 border-b bg-white sticky top-0 z-10 px-4 py-3 flex flex-row justify-between items-center">
            <h3 className="font-semibold flex items-center gap-2 text-gray-800 text-sm">
              <Receipt className="text-indigo-500" size={18} /> รายการอาหาร
            </h3>
            <span className="font-bold text-indigo-600 text-lg">
              ฿{grandTotal.toLocaleString()}
            </span>
          </CardHeader>

          <CardContent className="p-2 space-y-2">
            {bill.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400 space-y-2">
                <ChefHat size={32} className="opacity-40" />
                <p className="text-sm">ยังไม่มีรายการอาหาร</p>
              </div>
            ) : (
              // 👇 เปลี่ยนมาใช้ Component ใหม่ตรงนี้
              bill.items.map((item) => (
                <BillItemRow key={item.id} item={item} billId={id} />
              ))
            )}
          </CardContent>
        </Card>

        {/* Sticky Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-indigo-100 p-4 shadow-lg z-30 pb-8 md:pb-6">
          <div className="max-w-3xl mx-auto space-y-3">
            <div className="flex justify-end px-1">
              <ScanReceiptDialog billId={id} />
            </div>
            <div className="flex gap-2 items-center">
              <div className="flex-1 grid grid-cols-[2fr_1fr] gap-2">
                <Input
                  id="item-name-input"
                  placeholder="เพิ่มรายการ..."
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                  className="h-12 bg-gray-50 border-gray-200 focus:bg-white text-base"
                />
                <Input
                  type="number"
                  placeholder="ราคา"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                  className="h-12 bg-gray-50 border-gray-200 focus:bg-white text-base text-center"
                />
              </div>
              <Button
                onClick={handleAddItem}
                disabled={!itemName || !itemPrice || addItemMutation.isPending}
                className="h-12 w-12 md:w-16 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg flex-shrink-0"
              >
                {addItemMutation.isPending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Plus size={24} />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
