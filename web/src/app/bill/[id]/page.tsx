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
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function BillDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { user } = useUser();

  // 1. เรียกใช้ Hooks
  const { data: bill, isLoading, error } = useBill(id);
  const addItemMutation = useAddBillItem(id);
  const deleteItemMutation = useDeleteBillItem(id);

  // Form State
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");

  // ฟังก์ชันเพิ่มรายการ
  const handleAddItem = () => {
    if (!itemName || !itemPrice) return;

    addItemMutation.mutate(
      { name: itemName, price: parseFloat(itemPrice), quantity: 1 },
      {
        onSuccess: () => {
          setItemName("");
          setItemPrice("");
          // Focus ช่องชื่อเมนู ให้พิมพ์ต่อได้เลย
          document.getElementById("item-name-input")?.focus();
        },
      },
    );
  };

  // ฟังก์ชัน Copy Code
  const copyJoinCode = () => {
    if (bill?.joinCode) {
      navigator.clipboard.writeText(bill.joinCode);
      toast.success("ก๊อปปี้รหัสห้องแล้ว ส่งให้เพื่อนเลย!");
    }
  };

  // --- Render Loading ---
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
        <p className="text-gray-500 animate-pulse">กำลังโหลดบิล...</p>
      </div>
    );
  }

  // --- Render Error ---
  if (error || !bill) {
    return (
      <div className="text-center mt-20 p-8">
        <h2 className="text-2xl font-bold text-red-500 mb-2">หาบิลไม่เจอ 😢</h2>
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> กลับหน้าหลัก
        </Button>
      </div>
    );
  }

  // คำนวณยอดรวม (Frontend Side)
  const grandTotal = bill.items.reduce(
    (sum, item) => sum + Number(item.totalPrice),
    0,
  );
  const isOwner = user?.id === bill.ownerId;

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 pb-32">
      {" "}
      {/* pb-32 เผื่อที่ให้ Mobile Bar */}
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-gray-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> กลับ Dashboard
        </Link>

        {/* Header Section */}
        <Card className="border-none shadow-md bg-white overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500 w-full" />
          <CardHeader className="flex flex-col md:flex-row justify-between items-start gap-4 pb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                {bill.title}
              </h1>
              <div className="flex items-center gap-3 text-gray-500 text-sm mt-2">
                <div className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full">
                  <Users size={14} />
                  <span>สมาชิก {bill.members.length} คน</span>
                </div>

                {/* Join Code Display */}
                <div
                  className="flex items-center gap-2 font-mono text-sm bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-100 cursor-pointer hover:bg-indigo-100 active:scale-95 transition-all"
                  onClick={copyJoinCode}
                >
                  <span className="font-bold tracking-widest">
                    {bill.joinCode}
                  </span>
                  <Copy size={12} />
                </div>
              </div>
            </div>
            <Badge
              variant={bill.status === "DRAFT" ? "default" : "secondary"}
              className="px-3 py-1 text-sm"
            >
              {bill.status}
            </Badge>
          </CardHeader>
        </Card>

        {/* Items List */}
        <Card className="shadow-md border-none">
          <CardHeader className="pb-4 border-b bg-gray-50/50 flex flex-row justify-between items-center">
            <h3 className="font-semibold flex items-center gap-2 text-gray-800 text-lg">
              <Receipt className="text-indigo-500" size={24} /> รายการอาหาร
            </h3>
            <div className="text-right">
              <span className="text-xs text-gray-500 block">ยอดรวม</span>
              <span className="font-bold text-indigo-600 text-xl md:text-2xl">
                ฿{grandTotal.toLocaleString()}
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3">
              {bill.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                  <Receipt size={48} className="mb-2 opacity-20" />
                  <p>ยังไม่มีรายการอาหาร</p>
                  <p className="text-sm">เพิ่มรายการแรกด้านล่างได้เลย 👇</p>
                </div>
              ) : (
                bill.items.map((item) => (
                  <div
                    key={item.id}
                    className="group flex justify-between items-center bg-white p-3 md:p-4 rounded-xl border border-gray-100 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 font-bold text-xs md:text-sm">
                        {item.quantity}x
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">
                          @{item.price.toLocaleString()} บาท
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-800">
                        ฿{Number(item.totalPrice).toLocaleString()}
                      </span>

                      {/* ปุ่มลบ (โชว์เฉพาะถ้าเป็นเจ้าของ หรือจะปรับ Logic ในอนาคต) */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-300 hover:text-red-600 hover:bg-red-50"
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

        {/* Sticky Add Form (อยู่ด้านล่างตลอด) */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
          <div className="max-w-3xl mx-auto flex gap-2 md:gap-3">
            <Input
              id="item-name-input"
              placeholder="ชื่อเมนู..."
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="flex-[2] h-12 text-base shadow-sm"
              onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
              disabled={addItemMutation.isPending}
            />
            <Input
              type="number"
              placeholder="ราคา"
              value={itemPrice}
              onChange={(e) => setItemPrice(e.target.value)}
              className="flex-1 h-12 text-base shadow-sm"
              onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
              disabled={addItemMutation.isPending}
            />
            <Button
              onClick={handleAddItem}
              disabled={!itemName || !itemPrice || addItemMutation.isPending}
              className="h-12 w-14 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200"
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
