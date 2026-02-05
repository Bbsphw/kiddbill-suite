// web/src/components/bill-item-row.tsx

"use client";

import { useState, useEffect, useMemo } from "react";
import { BillItem, BillMember } from "@/types/bill";
import { useUpdateBillItem, useDeleteBillItem } from "@/hooks/use-bills";
import { AssignMembersDialog } from "@/components/assign-members-dialog";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Trash2,
  Minus,
  Plus,
  Loader2,
  Pencil,
  Check,
  X,
  UserPlus,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BillItemRowProps {
  item: BillItem;
  billId: string;
  members: BillMember[];
  isLocked?: boolean; // 🔒 New Prop: ถ้า true ห้ามแก้
}

export function BillItemRow({
  item,
  billId,
  members,
  isLocked = false,
}: BillItemRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);

  // Form State
  const [name, setName] = useState(item.name);
  const [price, setPrice] = useState(item.price.toString());
  const [quantity, setQuantity] = useState(item.quantity);

  const updateMutation = useUpdateBillItem(billId);
  const deleteMutation = useDeleteBillItem(billId);

  // Logic: Map splits to member objects
  const assignedMembers = useMemo(() => {
    if (!item.splits || item.splits.length === 0) return [];
    return item.splits
      .map((s) => members.find((m) => m.id === s.memberId))
      .filter((m): m is BillMember => !!m);
  }, [item.splits, members]);

  useEffect(() => {
    if (!isEditing) {
      setName(item.name);
      setPrice(item.price.toString());
      setQuantity(item.quantity);
    }
  }, [item, isEditing]);

  // Handlers
  const handleEditClick = (e: React.MouseEvent) => {
    if (isLocked) return; // 🔒 Guard
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setName(item.name);
    setPrice(item.price.toString());
    setQuantity(item.quantity);
  };

  const handleSave = () => {
    const numPrice = parseFloat(price);
    if (!name.trim()) return toast.error("ใส่ชื่อรายการหน่อย");
    if (isNaN(numPrice) || numPrice < 0) return toast.error("ราคาผิด");

    updateMutation.mutate(
      { id: item.id, name, price: numPrice, quantity },
      { onSuccess: () => setIsEditing(false) },
    );
  };

  const getInitials = (name: string) => name?.charAt(0).toUpperCase() || "?";

  // --- Render: Edit Mode ---
  if (isEditing) {
    return (
      <div className="flex flex-col gap-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-200 shadow-sm transition-all">
        {/* ... (Edit Form UI เหมือนเดิม) ... */}
        <div className="flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-9 text-sm bg-white border-indigo-100"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white rounded-lg p-0.5 border border-indigo-100">
              <button
                className="p-1.5 hover:bg-indigo-50 rounded-md text-gray-500 disabled:opacity-30"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus size={14} />
              </button>
              <span className="w-8 text-center text-sm font-bold text-indigo-700">
                {quantity}
              </span>
              <button
                className="p-1.5 hover:bg-indigo-50 rounded-md text-gray-500"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus size={14} />
              </button>
            </div>
            <span className="text-gray-400 text-xs">x</span>
            <div className="relative w-24">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                ฿
              </span>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="h-9 text-sm pl-5 bg-white border-indigo-100 text-right pr-2"
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              className="h-8 w-8 p-0 text-gray-500 hover:bg-red-50 hover:text-red-500"
            >
              <X size={18} />
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="h-8 w-8 p-0 bg-indigo-600 text-white"
            >
              <Check size={18} />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // --- Render: Read Mode ---
  return (
    <>
      <div
        className={cn(
          "group flex justify-between items-start bg-white p-3 md:p-4 rounded-xl border border-transparent transition-all shadow-[0_1px_2px_rgba(0,0,0,0.05)] select-none",
          // ถ้า Lock แล้ว ให้ดูจางๆ นิดนึง
          isLocked
            ? "opacity-90 bg-gray-50/50"
            : "hover:border-indigo-100 hover:shadow-md",
          // Alert: ถ้ายังไม่มีคนหาร และยังไม่ Lock -> เตือนสีส้ม
          !isLocked && assignedMembers.length === 0
            ? "border-dashed border-orange-200 bg-orange-50/10"
            : "",
        )}
      >
        {/* Left: Info */}
        <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
          <div
            className={cn(
              "h-10 w-10 min-w-[40px] rounded-xl flex items-center justify-center font-bold text-sm transition-colors",
              assignedMembers.length > 0
                ? "bg-indigo-50 text-indigo-700"
                : "bg-orange-50 text-orange-600",
              isLocked && "grayscale opacity-70",
            )}
          >
            {item.quantity}x
          </div>

          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "font-medium truncate pr-2 text-sm md:text-base",
                isLocked ? "text-gray-600" : "text-gray-900",
              )}
            >
              {item.name}
            </p>

            <div className="flex items-center justify-between mt-2 pr-2">
              <p className="text-xs text-gray-400 font-medium w-16">
                @{item.price.toLocaleString()}
              </p>

              {/* 🔒 Assignment Click Area */}
              <div
                className={cn(
                  "flex-1 flex justify-start pl-2 transition-all",
                  // ถ้า Lock แล้ว -> ห้ามกด
                  isLocked
                    ? "cursor-default opacity-80"
                    : "cursor-pointer hover:opacity-80",
                )}
                onClick={(e) => {
                  if (isLocked) return; // 🔒 Guard
                  e.stopPropagation();
                  setIsAssignOpen(true);
                }}
              >
                {assignedMembers.length > 0 ? (
                  <div className="flex items-center p-1 -ml-2 rounded-lg hover:bg-gray-100/50 transition-colors">
                    <div className="flex -space-x-2">
                      {assignedMembers.slice(0, 4).map((member, i) => (
                        <Avatar
                          key={i}
                          className="h-6 w-6 border-2 border-white ring-1 ring-gray-100"
                        >
                          <AvatarFallback className="text-[9px] font-bold bg-indigo-100 text-indigo-700">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {assignedMembers.length > 4 && (
                        <div className="h-6 w-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[9px] font-bold text-gray-500 z-10">
                          +{assignedMembers.length - 4}
                        </div>
                      )}
                    </div>
                    {!isLocked && (
                      <span className="ml-2 text-[10px] text-gray-400">
                        แก้ไข
                      </span>
                    )}
                  </div>
                ) : // ถ้ายังไม่มีคนหาร
                !isLocked ? (
                  <div className="flex items-center gap-1.5 bg-white border border-dashed border-orange-300 px-2 py-1 rounded-full cursor-pointer hover:bg-orange-50 transition-colors animate-pulse hover:animate-none">
                    <UserPlus size={12} className="text-orange-500" />
                    <span className="text-[10px] font-bold text-orange-500">
                      ใครกินบ้าง?
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] text-gray-400 italic">
                    ไม่มีผู้รับผิดชอบ
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Total & Actions */}
        <div className="flex flex-col items-end gap-1 pl-2">
          <span
            className={cn(
              "font-bold text-sm md:text-base whitespace-nowrap",
              !isLocked && assignedMembers.length === 0
                ? "text-orange-600"
                : "text-gray-800",
            )}
          >
            ฿{Number(item.totalPrice).toLocaleString()}
          </span>

          {/* 🔒 Show Actions ONLY if NOT locked */}
          {!isLocked ? (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleEditClick}
                className="h-7 w-7 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
              >
                <Pencil size={14} />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteMutation.mutate(item.id)}
                disabled={deleteMutation.isPending}
                className="h-7 w-7 text-gray-400 hover:text-red-500 hover:bg-red-50"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
              </Button>
            </div>
          ) : (
            // ถ้า Lock แล้ว โชว์แม่กุญแจจางๆ แทน
            <div className="pt-1 opacity-20">
              <Lock size={12} />
            </div>
          )}
        </div>
      </div>

      {/* Dialog (Rendered but won't open if locked because of onClick guard) */}
      <AssignMembersDialog
        open={isAssignOpen}
        onOpenChange={setIsAssignOpen}
        item={item}
        members={members}
        billId={billId}
      />
    </>
  );
}
