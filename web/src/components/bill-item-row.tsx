// web/src/components/bill-item-row.tsx

"use client";

import { useState, useEffect } from "react";
import { BillItem } from "@/types/bill";
import { useUpdateBillItem, useDeleteBillItem } from "@/hooks/use-bills";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Minus, Plus, Loader2, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";

interface BillItemRowProps {
  item: BillItem;
  billId: string;
}

export function BillItemRow({ item, billId }: BillItemRowProps) {
  // 1. State ควบคุมโหมดแก้ไข
  const [isEditing, setIsEditing] = useState(false);

  // 2. Local State สำหรับ Form (ใช้เฉพาะตอน Edit)
  const [name, setName] = useState(item.name);
  const [price, setPrice] = useState(item.price.toString());
  const [quantity, setQuantity] = useState(item.quantity);

  // Sync state เมื่อข้อมูลจาก Server เปลี่ยน (และไม่ได้กำลังแก้อยู่)
  useEffect(() => {
    if (!isEditing) {
      setName(item.name);
      setPrice(item.price.toString());
      setQuantity(item.quantity);
    }
  }, [item, isEditing]);

  // Hooks
  const updateMutation = useUpdateBillItem(billId);
  const deleteMutation = useDeleteBillItem(billId);

  // --- Handlers ---

  const handleEditClick = () => {
    setIsEditing(true);
    // Reset ค่าให้ตรงกับปัจจุบันก่อนเริ่มแก้
    setName(item.name);
    setPrice(item.price.toString());
    setQuantity(item.quantity);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset ค่ากลับไปเป็นของเดิม
    setName(item.name);
    setPrice(item.price.toString());
    setQuantity(item.quantity);
  };

  const handleSave = () => {
    const numPrice = parseFloat(price);

    if (!name.trim()) {
      toast.error("กรุณาใส่ชื่อรายการ");
      return;
    }
    if (isNaN(numPrice) || numPrice < 0) {
      toast.error("ราคาไม่ถูกต้อง");
      return;
    }

    updateMutation.mutate(
      {
        id: item.id,
        name,
        price: numPrice,
        quantity,
      },
      {
        onSuccess: () => {
          setIsEditing(false);
          toast.success("บันทึกแก้ไขเรียบร้อย");
        },
      },
    );
  };

  // --- Render: Edit Mode ---
  if (isEditing) {
    return (
      <div className="flex flex-col gap-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-200 shadow-sm transition-all animate-in fade-in zoom-in-95 duration-200">
        {/* แถวบน: ชื่อรายการ */}
        <div className="flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-9 text-sm font-medium bg-white border-indigo-100 focus:border-indigo-500"
            placeholder="ชื่อรายการ..."
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
        </div>

        {/* แถวล่าง: Controls */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {/* Quantity Stepper */}
            <div className="flex items-center bg-white rounded-lg p-0.5 border border-indigo-100 shadow-sm">
              <button
                className="p-1.5 hover:bg-indigo-50 rounded-md text-gray-500 hover:text-indigo-600 transition-colors disabled:opacity-30"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus size={14} />
              </button>
              <span className="w-8 text-center text-sm font-bold text-indigo-700">
                {quantity}
              </span>
              <button
                className="p-1.5 hover:bg-indigo-50 rounded-md text-gray-500 hover:text-indigo-600 transition-colors"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus size={14} />
              </button>
            </div>

            <span className="text-gray-400 text-xs">x</span>

            {/* Price Input */}
            <div className="relative w-24">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                ฿
              </span>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="h-9 text-sm pl-5 bg-white border-indigo-100 focus:border-indigo-500 text-right pr-2"
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />
            </div>
          </div>

          {/* Action Buttons (Save/Cancel) */}
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              className="h-8 w-8 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50"
            >
              <X size={18} />
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="h-8 w-8 p-0 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
            >
              {updateMutation.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Check size={18} />
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // --- Render: Read Mode (ปกติ) ---
  return (
    <div className="group flex justify-between items-center bg-white p-3 md:p-4 rounded-xl border border-transparent hover:border-gray-200 hover:shadow-sm transition-all shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
      {/* Left: Info */}
      <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
        <div className="h-10 w-10 min-w-[40px] rounded-lg bg-gray-50 group-hover:bg-indigo-50 transition-colors flex items-center justify-center text-gray-600 group-hover:text-indigo-600 font-bold text-sm">
          {item.quantity}x
        </div>
        <div className="min-w-0">
          <p className="font-medium text-gray-900 truncate pr-2 text-sm md:text-base">
            {item.name}
          </p>
          <p className="text-xs text-gray-500">
            @{item.price.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Right: Price & Actions */}
      <div className="flex items-center gap-3 pl-2">
        <span className="font-bold text-gray-800 text-sm md:text-base whitespace-nowrap">
          ฿{Number(item.totalPrice).toLocaleString()}
        </span>

        {/* Actions (Edit / Delete) */}
        <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleEditClick}
            className="h-8 w-8 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
          >
            <Pencil size={16} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => deleteMutation.mutate(item.id)}
            disabled={deleteMutation.isPending}
            className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50"
          >
            {deleteMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 size={16} />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
