// web/src/components/bill-members-dialog.tsx

"use client";

import { useState } from "react";
import { BillMember } from "@/types/bill";
import { useAddGuestMember } from "@/hooks/use-bills";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, UserPlus, Loader2, Crown, Sparkles } from "lucide-react";

interface BillMembersDialogProps {
  billId: string;
  members: BillMember[];
  ownerId: string;
}

export function BillMembersDialog({
  billId,
  members,
  ownerId,
}: BillMembersDialogProps) {
  const [open, setOpen] = useState(false);
  const [guestName, setGuestName] = useState("");

  const addGuestMutation = useAddGuestMember(billId);

  const handleAddGuest = () => {
    if (!guestName.trim()) return;

    addGuestMutation.mutate(guestName, {
      onSuccess: () => {
        setGuestName("");
        // ไม่ต้องปิด Dialog เพื่อให้เพิ่มคนต่อได้เรื่อยๆ
      },
    });
  };

  // Helper: ดึงตัวอักษรแรกของชื่อมาทำ Avatar (เช่น "Somchai" -> "S")
  const getInitials = (name: string) => {
    return name?.charAt(0).toUpperCase() || "?";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          className="gap-2 bg-white/50 hover:bg-white border border-transparent hover:border-indigo-100 shadow-sm transition-all"
        >
          <Users size={14} className="text-indigo-600" />
          <span className="text-gray-700 font-medium">
            {members.length} สมาชิก
          </span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="text-indigo-600" /> สมาชิกในห้อง ({members.length}
            )
          </DialogTitle>
          <DialogDescription>
            จัดการสมาชิก หรือเพิ่มเพื่อนที่ไม่มีแอป (Guest)
          </DialogDescription>
        </DialogHeader>

        {/* 1. Add Guest Form */}
        <div className="flex gap-2 py-4 border-b border-gray-100">
          <Input
            placeholder="ชื่อเพื่อน (เช่น ไอ้อ้วน, น้องบี)"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddGuest()}
            className="flex-1"
          />
          <Button
            onClick={handleAddGuest}
            disabled={!guestName.trim() || addGuestMutation.isPending}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {addGuestMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* 2. Members List */}
        <div className="max-h-[300px] overflow-y-auto space-y-3 py-2 pr-1">
          {members.map((member) => {
            const isOwner = member.userId === ownerId; // เช็คว่าเป็นเจ้าของห้องไหม? (ต้องแก้ Logic นี้ให้ตรงกับ ID จริงจาก backend)
            // หมายเหตุ: ปกติ member.userId จะเป็น ID ของ user table, ส่วน ownerId ใน bill ก็เป็น user table ดังนั้นเทียบกันได้เลย

            // ตรวจสอบว่าเป็น User จริง หรือ Guest
            // (User จริงจะมี userId, Guest จะเป็น null)
            const isRealUser = !!member.userId;

            return (
              <div
                key={member.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 border border-gray-100">
                    {/* ถ้ามี Avatar URL (ต้องแก้ Type BillMember ให้รับ avatarUrl ถ้า backend ส่งมา) */}
                    {/* <AvatarImage src={member.avatarUrl} /> */}
                    <AvatarFallback
                      className={
                        isRealUser
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-orange-100 text-orange-700"
                      }
                    >
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-sm text-gray-900">
                        {member.name}
                      </span>
                      {/* Owner Icon (ถ้ามี logic เช็ค owner) */}
                      {/* {isOwner && <Crown size={12} className="text-yellow-500" />} */}
                    </div>

                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      {isRealUser ? (
                        <span className="flex items-center gap-0.5 text-indigo-400">
                          <Sparkles size={8} /> ผู้ใช้งาน
                        </span>
                      ) : (
                        "Guest (ไม่มีบัญชี)"
                      )}
                    </span>
                  </div>
                </div>

                {/* Status Badge (จ่ายแล้ว/ยังไม่จ่าย) - ทำเผื่อไว้ */}
                <div
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    member.isPaid
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {member.isPaid ? "จ่ายแล้ว" : "รอจ่าย"}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
