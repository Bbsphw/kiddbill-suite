// web/src/components/create-bill-dialog.tsx

"use client";

import { useState } from "react";
import { useCreateBill } from "@/hooks/use-bills";
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
import { PlusCircle, Loader2 } from "lucide-react";

export function CreateBillDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const { mutate, isPending } = useCreateBill();

  const handleCreate = () => {
    mutate(
      { title: title || "มื้อนี้พี่เลี้ยงเอง (แต่หารนะ)" },
      {
        onSuccess: () => {
          setOpen(false);
          setTitle("");
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="flex flex-col items-center justify-center h-full w-full cursor-pointer hover:bg-indigo-50/80 transition-colors rounded-lg group">
          <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4 shadow-sm group-hover:scale-110 transition-transform">
            <PlusCircle size={28} />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-lg text-indigo-900">
              สร้างบิลใหม่
            </h3>
            <p className="text-sm text-indigo-600/80">เริ่มหารเงินกันเลย</p>
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>ตั้งชื่อบิลหน่อย 📝</DialogTitle>
          <DialogDescription>
            เช่น "หมูกระทะซอย 8", "ทริปหัวหิน" หรือ "ข้าวเที่ยง"
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Input
            autoFocus
            placeholder="ชื่อรายการ..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <Button
            onClick={handleCreate}
            disabled={isPending}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            {isPending ? (
              <Loader2 className="animate-spin mr-2 h-4 w-4" />
            ) : null}
            สร้างเลย 🚀
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
