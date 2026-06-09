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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, UserPlus, Loader2, Sparkles } from "lucide-react";

interface BillMembersDialogProps {
  billId: string;
  members: BillMember[];
}

export function BillMembersDialog({
  billId,
  members,
}: BillMembersDialogProps) {
  const [open, setOpen] = useState(false);
  const [guestName, setGuestName] = useState("");
  const addGuestMutation = useAddGuestMember(billId);

  const handleAddGuest = () => {
    if (!guestName.trim()) return;
    addGuestMutation.mutate(guestName, { onSuccess: () => setGuestName("") });
  };
  const getInitials = (name: string) => name?.charAt(0).toUpperCase() || "?";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          className="gap-2 bg-white/50 hover:bg-white border border-transparent hover:border-indigo-100 shadow-sm transition-all rounded-full"
        >
          <Users size={14} className="text-indigo-600" />
          <span className="text-slate-700 font-medium">
            {members.length} สมาชิก
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-slate-50/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="text-indigo-600" /> สมาชิกในห้อง ({members.length}
            )
          </DialogTitle>
          <DialogDescription>
            จัดการสมาชิก หรือเพิ่มเพื่อน (Guest)
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 py-4 border-b border-slate-100 bg-white p-4 rounded-xl shadow-sm mb-4">
          <Input
            placeholder="ชื่อเพื่อน (เช่น ไอ้อ้วน, น้องบี)"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddGuest()}
            className="flex-1 border-slate-200"
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
        <div className="max-h-[300px] overflow-y-auto space-y-2 py-2 pr-1">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 border border-slate-100">
                  <AvatarFallback
                    className={
                      !!member.userId
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-orange-100 text-orange-700"
                    }
                  >
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm text-slate-900">
                      {member.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    {!!member.userId ? (
                      <span className="flex items-center gap-0.5 text-indigo-400">
                        <Sparkles size={8} /> ผู้ใช้งาน
                      </span>
                    ) : (
                      "Guest"
                    )}
                  </span>
                </div>
              </div>
              <div
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${member.isPaid ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}
              >
                {member.isPaid ? "จ่ายแล้ว" : "รอจ่าย"}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
