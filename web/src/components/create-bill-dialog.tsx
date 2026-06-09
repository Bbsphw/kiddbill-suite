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
import { Loader2 } from "lucide-react";

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
        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-200">
          เริ่มเลย 👉
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>ตั้งชื่อบิลหน่อย 📝</DialogTitle>
          <DialogDescription>
            เช่น &ldquo;หมูกระทะซอย 8&rdquo;, &ldquo;ทริปหัวหิน&rdquo; หรือ &ldquo;ข้าวเที่ยง&rdquo;
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
            ) : null}{" "}
            สร้างเลย 🚀
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
