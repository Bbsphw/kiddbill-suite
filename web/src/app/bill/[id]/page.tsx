// web/src/app/bill/[id]/page.tsx

"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useBill, useAddBillItem, useDeleteBillItem } from "@/hooks/use-bills";
import { useUser } from "@clerk/nextjs";

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Plus,
  Trash2,
  Receipt,
  Users,
  ArrowLeft,
  Copy,
  ChefHat,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function BillDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { user } = useUser();

  const { data: bill, isLoading, error } = useBill(id);
  const addItemMutation = useAddBillItem(id);
  const deleteItemMutation = useDeleteBillItem(id);

  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");

  const handleAddItem = () => {
    if (!itemName || !itemPrice) return;
    addItemMutation.mutate(
      { name: itemName, price: parseFloat(itemPrice), quantity: 1 },
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
      toast.success("Copied Code: " + bill.joinCode);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
        <p className="text-gray-500 animate-pulse">กำลังโหลดรายการ...</p>
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h2 className="text-2xl font-bold text-gray-800">ไม่พบบิลนี้ 😢</h2>
        <Link href="/dashboard">
          <Button variant="outline">กลับหน้าหลัก</Button>
        </Link>
      </div>
    );
  }

  // คำนวณ Grand Total (แบบบ้านๆ Frontend, จริงๆ ควรเอามาจาก Backend Summary)
  // แต่แบบนี้ก็เร็วดีสำหรับการแสดงผลเบื้องต้น
  const calculateTotal = () => {
    const subtotal = bill.items.reduce(
      (sum, item) => sum + Number(item.totalPrice),
      0,
    );
    // Logic นี้อาจจะไม่ตรงกับ Backend 100% ถ้ามีการปัดเศษ แต่เอาไว้โชว์คร่าวๆ
    // แนะนำ: ให้ Backend ส่ง field 'grandTotal' มาใน object bill จะดีที่สุด
    return subtotal;
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 pb-40">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-gray-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> กลับ Dashboard
        </Link>

        {/* Bill Header */}
        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500 w-full" />
          <CardHeader className="flex flex-col md:flex-row justify-between items-start gap-4 pb-4">
            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                {bill.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="outline" className="gap-1 px-3 py-1">
                  <Users size={12} /> {bill.members.length} สมาชิก
                </Badge>

                <div
                  onClick={copyJoinCode}
                  className="flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100 cursor-pointer hover:bg-indigo-100 transition-colors active:scale-95"
                >
                  <span className="font-mono font-bold tracking-wider">
                    {bill.joinCode}
                  </span>
                  <Copy size={12} />
                </div>
              </div>
            </div>

            <Badge
              className={
                bill.status === "COMPLETED" ? "bg-green-500" : "bg-indigo-600"
              }
            >
              {bill.status}
            </Badge>
          </CardHeader>
        </Card>

        {/* Items Section */}
        <Card className="shadow-sm border-gray-100">
          <CardHeader className="pb-4 border-b bg-gray-50/50 flex flex-row justify-between items-center">
            <h3 className="font-semibold flex items-center gap-2 text-gray-800">
              <Receipt className="text-indigo-500" size={20} /> รายการอาหาร
            </h3>
            <div className="text-right">
              <span className="text-xs text-gray-500 block">
                ยอดรวมโดยประมาณ
              </span>
              <span className="font-bold text-indigo-600 text-xl">
                ฿{calculateTotal().toLocaleString()}
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[60vh] overflow-y-auto p-2 space-y-2">
              {bill.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400 space-y-3">
                  <div className="bg-gray-100 p-4 rounded-full">
                    <ChefHat size={32} className="opacity-50" />
                  </div>
                  <p>ยังไม่มีรายการอาหาร</p>
                  <p className="text-sm">เพิ่มเมนูแรกเลย 👇</p>
                </div>
              ) : (
                bill.items.map((item) => (
                  <div
                    key={item.id}
                    className="group flex justify-between items-center bg-white p-3 rounded-lg border border-transparent hover:border-gray-200 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-700 font-bold text-sm">
                        {item.quantity}x
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">
                          @{item.price.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="font-bold text-gray-800">
                        ฿{Number(item.totalPrice).toLocaleString()}
                      </span>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-300 hover:text-red-500 hover:bg-red-50"
                        onClick={() => deleteItemMutation.mutate(item.id)}
                        disabled={deleteItemMutation.isPending}
                      >
                        {deleteItemMutation.isPending &&
                        deleteItemMutation.variables === item.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Input Bar (Fixed Bottom) */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t p-4 z-20 pb-8 md:pb-4">
          <div className="max-w-3xl mx-auto flex gap-3 items-center">
            <div className="flex-1 grid grid-cols-[2fr_1fr] gap-3">
              <Input
                id="item-name-input"
                placeholder="ชื่อเมนู..."
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="h-12 shadow-sm border-gray-200 focus:border-indigo-500"
                onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                disabled={addItemMutation.isPending}
                autoComplete="off"
              />
              <Input
                type="number"
                placeholder="ราคา"
                value={itemPrice}
                onChange={(e) => setItemPrice(e.target.value)}
                className="h-12 shadow-sm border-gray-200 focus:border-indigo-500"
                onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                disabled={addItemMutation.isPending}
              />
            </div>
            <Button
              onClick={handleAddItem}
              disabled={!itemName || !itemPrice || addItemMutation.isPending}
              className="h-12 w-14 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 shadow-lg transition-all active:scale-95"
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
  );
}
