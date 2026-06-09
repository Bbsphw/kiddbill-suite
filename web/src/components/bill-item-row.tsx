// web/src/components/bill-item-row.tsx

"use client";

import { useState, useMemo } from "react";
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
  isLocked?: boolean;
}

export function BillItemRow({
  item,
  billId,
  members,
  isLocked = false,
}: BillItemRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [name, setName] = useState(item.name);
  const [price, setPrice] = useState(item.price.toString());
  const [quantity, setQuantity] = useState(item.quantity);
  const updateMutation = useUpdateBillItem(billId);
  const deleteMutation = useDeleteBillItem(billId);

  const assignedMembers = useMemo(() => {
    if (!item.splits || item.splits.length === 0) return [];
    return item.splits
      .map((s) => members.find((m) => m.id === s.memberId))
      .filter((m): m is BillMember => !!m);
  }, [item.splits, members]);



  const handleSave = () => {
    const numPrice = parseFloat(price);
    if (!name.trim() || isNaN(numPrice) || numPrice < 0)
      return toast.error("ข้อมูลไม่ถูกต้อง");
    updateMutation.mutate(
      { id: item.id, name, price: numPrice, quantity },
      { onSuccess: () => setIsEditing(false) },
    );
  };
  const getInitials = (name: string) => name?.charAt(0).toUpperCase() || "?";

  if (isEditing) {
    return (
      <div className="flex flex-col gap-3 p-3 bg-indigo-50/50 rounded-2xl border border-indigo-200 shadow-sm transition-all">
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
                className="p-1.5 hover:bg-indigo-50 rounded-md text-slate-500 disabled:opacity-30"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus size={14} />
              </button>
              <span className="w-8 text-center text-sm font-bold text-indigo-700">
                {quantity}
              </span>
              <button
                className="p-1.5 hover:bg-indigo-50 rounded-md text-slate-500"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus size={14} />
              </button>
            </div>
            <span className="text-slate-400 text-xs">x</span>
            <div className="relative w-24">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
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
              onClick={() => setIsEditing(false)}
              className="h-8 w-8 p-0 text-slate-500 hover:bg-red-50 hover:text-red-500"
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

  return (
    <>
      <div
        className={cn(
          "group flex justify-between items-start bg-white p-3 md:p-4 rounded-2xl border border-transparent transition-all shadow-[0_2px_8px_rgba(0,0,0,0.02)] select-none",
          isLocked
            ? "opacity-90 bg-slate-50/50 hover:shadow-none"
            : "hover:border-indigo-100 hover:shadow-md",
          !isLocked && assignedMembers.length === 0
            ? "border-dashed border-orange-200 bg-orange-50/10"
            : "",
        )}
      >
        <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
          <div
            className={cn(
              "h-10 w-10 min-w-[40px] rounded-xl flex items-center justify-center font-bold text-sm transition-colors shadow-sm",
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
                isLocked ? "text-slate-600" : "text-slate-900",
              )}
            >
              {item.name}
            </p>
            <div className="flex items-center justify-between mt-2 pr-2">
              <p className="text-xs text-slate-400 font-medium w-16">
                @{item.price.toLocaleString()}
              </p>
              {/* Click to Assign Area */}
              <div
                className={cn(
                  "flex-1 flex justify-start pl-2 transition-all",
                  isLocked
                    ? "cursor-default opacity-80"
                    : "cursor-pointer hover:opacity-80",
                )}
                onClick={(e) => {
                  // ถ้า Lock = ไม่ให้กดอะไรเลย หรือจะให้กดดูได้แต่แก้ไม่ได้ (ในที่นี้เอาแบบกดดูได้)
                  e.stopPropagation();
                  setIsAssignOpen(true);
                }}
              >
                {assignedMembers.length > 0 ? (
                  <div className="flex items-center p-1 -ml-2 rounded-lg hover:bg-slate-100/50 transition-colors">
                    <div className="flex -space-x-2">
                      {assignedMembers.slice(0, 4).map((member, i) => (
                        <Avatar
                          key={i}
                          className="h-6 w-6 border-2 border-white ring-1 ring-slate-100"
                        >
                          <AvatarFallback className="text-[9px] font-bold bg-indigo-100 text-indigo-700">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {assignedMembers.length > 4 && (
                        <div className="h-6 w-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[9px] font-bold text-slate-500 z-10">
                          +{assignedMembers.length - 4}
                        </div>
                      )}
                    </div>
                    {!isLocked && (
                      <span className="ml-2 text-[10px] text-slate-400">
                        แก้ไข
                      </span>
                    )}
                  </div>
                ) : // ถ้าไม่มีคนรับผิดชอบ
                !isLocked ? (
                  <div className="flex items-center gap-1.5 bg-white border border-dashed border-orange-300 px-2 py-1 rounded-full cursor-pointer hover:bg-orange-50 transition-colors animate-pulse hover:animate-none">
                    <UserPlus size={12} className="text-orange-500" />
                    <span className="text-[10px] font-bold text-orange-500">
                      ใครกินบ้าง?
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-400 italic">
                    ไม่มีผู้รับผิดชอบ
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 pl-2">
          <span
            className={cn(
              "font-bold text-sm md:text-base whitespace-nowrap",
              !isLocked && assignedMembers.length === 0
                ? "text-orange-600"
                : "text-slate-800",
            )}
          >
            ฿{Number(item.totalPrice).toLocaleString()}
          </span>
          {/* Action Buttons: Show ONLY if NOT Locked */}
          {!isLocked ? (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setName(item.name);
                  setPrice(item.price.toString());
                  setQuantity(item.quantity);
                  setIsEditing(true);
                }}
                className="h-7 w-7 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
              >
                <Pencil size={14} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteMutation.mutate(item.id)}
                disabled={deleteMutation.isPending}
                className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
              </Button>
            </div>
          ) : (
            <div className="pt-1 opacity-20">
              <Lock size={12} />
            </div>
          )}
        </div>
      </div>
      {isAssignOpen && (
        <AssignMembersDialog
          open={isAssignOpen}
          onOpenChange={setIsAssignOpen}
          item={item}
          members={members}
          billId={billId}
        />
      )}
    </>
  );
}
