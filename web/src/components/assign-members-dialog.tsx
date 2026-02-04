// web/src/components/assign-members-dialog.tsx

"use client";

import { useState, useEffect, useMemo } from "react";
import { BillMember, BillItem } from "@/types/bill";
import { useAssignSplit } from "@/hooks/use-bills";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Check, Loader2, Users, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface AssignMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: BillItem;
  members: BillMember[];
  billId: string;
}

export function AssignMembersDialog({
  open,
  onOpenChange,
  item,
  members,
  billId,
}: AssignMembersDialogProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const assignMutation = useAssignSplit(billId);

  // --- 1. Logic Fix: State Synchronization ---
  useEffect(() => {
    if (open) {
      // ตรวจสอบว่า item นี้เคยมีการหารหรือยัง?
      // หมายเหตุ: เช็คว่า splits เป็น array หรือไม่ (ถ้า backend ไม่ส่ง splits มาเลย = ยังไม่เคยหาร)
      const hasSplitsData = Array.isArray(item.splits);

      if (hasSplitsData) {
        // ✅ CASE A: เคยมีการบันทึกแล้ว (แม้จะเป็น Array ว่าง ก็ต้องเชื่อตามนั้น)
        // ใช้ข้อมูลจาก Database เป็นหลัก 100%
        const currentSplitIds = new Set(item.splits!.map((s) => s.memberId));

        // *Edge Case:* ถ้า Database เป็นค่าว่างจริงๆ (เช่น ลบทุกคนออก)
        // เราก็ต้องให้มันว่างตามนั้น ไม่ใช่ Auto Select All
        setSelectedIds(currentSplitIds);
      } else {
        // ⚠️ CASE B: ของใหม่แกะกล่อง (Backend ยังไม่มี data splits)
        // Default: ให้เลือกทุกคน (หารเท่า)
        setSelectedIds(new Set(members.map((m) => m.id)));
      }
    }
  }, [open, item, members]);

  // --- Helpers ---
  const toggleMember = (memberId: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(memberId)) {
      newSet.delete(memberId);
    } else {
      newSet.add(memberId);
    }
    setSelectedIds(newSet);
  };

  const selectAll = () => setSelectedIds(new Set(members.map((m) => m.id)));
  const clearAll = () => setSelectedIds(new Set());

  // คำนวณยอดเงินคร่าวๆ ให้ User เห็นภาพ
  const pricePerPerson = useMemo(() => {
    if (selectedIds.size === 0) return 0;
    return item.price / selectedIds.size;
  }, [item.price, selectedIds.size]);

  const handleSave = () => {
    const splits = Array.from(selectedIds).map((memberId) => ({
      memberId,
      weight: 1,
    }));

    assignMutation.mutate(
      { itemId: item.id, splits },
      {
        onSuccess: () => onOpenChange(false),
      },
    );
  };

  const getInitials = (name: string) => name?.charAt(0).toUpperCase() || "?";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden bg-gray-50/50">
        {/* Header */}
        <div className="p-6 pb-4 bg-white border-b">
          <DialogHeader>
            <DialogTitle className="flex flex-col gap-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                จัดการตัวหาร
              </span>
              <span className="text-xl font-bold text-gray-900 truncate pr-4 leading-tight">
                {item.name}
              </span>
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2 mt-1">
              <span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                ฿{item.price.toLocaleString()}
              </span>
              <span className="text-gray-400 text-xs">
                {selectedIds.size > 0
                  ? `หาร ${selectedIds.size} คน = ตกคนละ ฿${pricePerPerson.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                  : "ยังไม่ได้เลือกใคร"}
              </span>
            </DialogDescription>
          </DialogHeader>

          {/* Quick Actions Bar */}
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={selectAll}
              className="flex-1 bg-white border-gray-200 text-gray-600 hover:text-indigo-600 hover:border-indigo-200"
            >
              <Users size={14} className="mr-2" /> เลือกทุกคน
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearAll}
              className="flex-1 bg-white border-gray-200 text-gray-600 hover:text-red-600 hover:border-red-200"
            >
              <X size={14} className="mr-2" /> ล้าง
            </Button>
          </div>
        </div>

        {/* Scrollable List */}
        <div className="p-4 max-h-[50vh] overflow-y-auto bg-gray-50/50">
          {members.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Users className="mx-auto h-10 w-10 mb-2 opacity-20" />
              <p>ยังไม่มีสมาชิกในห้อง</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {members.map((member) => {
                const isSelected = selectedIds.has(member.id);
                return (
                  <div
                    key={member.id}
                    onClick={() => toggleMember(member.id)}
                    className={cn(
                      "cursor-pointer flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 group relative",
                      isSelected
                        ? "bg-white border-indigo-600 shadow-md scale-[1.01] z-10"
                        : "bg-white border-gray-100 opacity-70 hover:opacity-100 hover:border-gray-300",
                    )}
                  >
                    {/* Avatar */}
                    <div className="relative">
                      <Avatar
                        className={cn(
                          "h-10 w-10 border-2 transition-colors",
                          isSelected
                            ? "border-indigo-100"
                            : "border-transparent",
                        )}
                      >
                        <AvatarFallback
                          className={cn(
                            "font-bold text-sm",
                            isSelected
                              ? "bg-indigo-100 text-indigo-700"
                              : "bg-gray-100 text-gray-500",
                          )}
                        >
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      {isSelected && (
                        <div className="absolute -bottom-1 -right-1 bg-indigo-600 rounded-full p-0.5 border-2 border-white">
                          <Check size={10} className="text-white" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-sm font-semibold truncate",
                          isSelected ? "text-gray-900" : "text-gray-500",
                        )}
                      >
                        {member.name}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {isSelected ? "ร่วมหาร ✅" : "ไม่หาร"}
                      </p>
                    </div>

                    {/* Price Indicator (Visual Aid) */}
                    {isSelected && selectedIds.size > 0 && (
                      <div className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                        ฿{Math.floor(pricePerPerson)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t">
          <Button
            onClick={handleSave}
            disabled={assignMutation.isPending || selectedIds.size === 0}
            className="w-full h-11 text-base bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95"
          >
            {assignMutation.isPending ? (
              <Loader2 className="animate-spin mr-2" />
            ) : (
              <Check className="mr-2 w-5 h-5" />
            )}
            บันทึกการหาร ({selectedIds.size} คน)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
