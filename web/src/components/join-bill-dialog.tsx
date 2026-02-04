// web/src/components/join-bill-dialog.tsx

"use client";

import { useState } from "react";
import { useJoinBill } from "@/hooks/use-bills";
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
import { LogIn, Loader2 } from "lucide-react";

export function JoinBillDialog() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const { mutate, isPending } = useJoinBill();

  const handleJoin = () => {
    if (!code || code.length < 6) return;

    mutate(code.toUpperCase(), {
      onSuccess: () => {
        setOpen(false);
        setCode("");
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="flex flex-col items-center justify-center h-full w-full cursor-pointer hover:bg-orange-50/80 transition-colors rounded-lg group">
          <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mb-4 shadow-sm group-hover:scale-110 transition-transform">
            <LogIn size={28} />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-lg text-orange-900">
              เข้าร่วมบิล
            </h3>
            <p className="text-sm text-orange-600/80">ใส่รหัสห้องเพื่อน</p>
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>กรอกรหัสเข้าร่วม (6 หลัก) 🔑</DialogTitle>
          <DialogDescription>ขอรหัสจากเพื่อนเจ้าของบิลได้เลย</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Input
            autoFocus
            placeholder="เช่น A8K9X"
            className="text-center text-2xl tracking-widest uppercase font-mono h-14"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
          />
          <Button
            onClick={handleJoin}
            disabled={isPending || code.length < 6}
            className="w-full bg-orange-500 hover:bg-orange-600 h-12 text-lg"
          >
            {isPending ? (
              <Loader2 className="animate-spin mr-2 h-4 w-4" />
            ) : null}
            เข้าร่วมเลย
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
