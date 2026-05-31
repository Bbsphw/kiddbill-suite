// web/src/components/scan-receipt-dialog.tsx

"use client";

import { useState, useRef } from "react";
import { useScanReceipt } from "@/hooks/use-ocr";
import { useAddBillItem } from "@/hooks/use-bills";
import { OcrItem } from "@/types/ocr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Camera,
  Upload,
  Loader2,
  CheckCircle2,
  ScanLine,
  Trash2,
  Minus,
  Plus,
  RefreshCcw,
} from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ScanReceiptDialogProps {
  billId: string;
}

export function ScanReceiptDialog({ billId }: ScanReceiptDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"UPLOAD" | "PREVIEW">("UPLOAD");
  const [editableItems, setEditableItems] = useState<OcrItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutate: scan, isPending: isScanning } = useScanReceipt();
  const { mutateAsync: addItem } = useAddBillItem(billId);
  const [isAddingItems, setIsAddingItems] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleScan(file);
  };
  const handleScan = (file: File) => {
    scan(file, {
      onSuccess: (data) => {
        setEditableItems(data.items);
        setStep("PREVIEW");
        toast.success(`เจอ ${data.items.length} รายการ!`);
      },
    });
  };
  const updateItem = (
    index: number,
    field: keyof OcrItem,
    value: string | number,
  ) => {
    const newItems = [...editableItems];
    const currentItem = newItems.find((_, i) => i === index);
    if (!currentItem) return;

    if (field === "name") {
      currentItem.name = value as string;
    } else if (field === "price") {
      currentItem.price = value as number;
    } else if (field === "quantity") {
      currentItem.quantity = value as number;
    }
    setEditableItems(newItems);
  };
  const removeItem = (index: number) => {
    setEditableItems(editableItems.filter((_, i) => i !== index));
  };
  const totalAmount = editableItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const handleConfirmAdd = async () => {
    if (editableItems.length === 0) return;
    setIsAddingItems(true);
    try {
      await Promise.all(
        editableItems.map((item) =>
          addItem({
            name: item.name || "รายการไม่ระบุชื่อ",
            price: Number(item.price) || 0,
            quantity: Number(item.quantity) || 1,
          }),
        ),
      );
      toast.success(`เพิ่ม ${editableItems.length} รายการแล้ว!`);
      setOpen(false);
      setTimeout(resetState, 300);
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsAddingItems(false);
    }
  };
  const resetState = () => {
    setStep("UPLOAD");
    setEditableItems([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        if (!val) setTimeout(resetState, 300);
      }}
    >
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 shadow-sm rounded-full"
        >
          <Camera size={16} />
          <span className="hidden sm:inline">สแกนสลิป</span>
          <span className="sm:hidden">สแกน</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-slate-50/50">
        <DialogHeader className="p-6 pb-2 bg-white border-b border-slate-100">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ScanLine className="text-indigo-600" />{" "}
            {step === "UPLOAD" ? "สแกนใบเสร็จ" : "ตรวจสอบรายการ"}
          </DialogTitle>
          <DialogDescription>
            {step === "UPLOAD"
              ? "รองรับสลิปยาวๆ และลายมือ (บางส่วน)"
              : "เช็คความถูกต้องและแก้ไขก่อนบันทึก"}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-6 pt-2">
          {step === "UPLOAD" && (
            <div
              className="flex flex-col items-center justify-center gap-4 py-12 border-2 border-dashed border-indigo-200 rounded-3xl bg-indigo-50/30 hover:bg-indigo-50/50 transition-colors cursor-pointer group mt-4"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              {isScanning ? (
                <div className="flex flex-col items-center animate-pulse">
                  <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mb-4" />
                  <p className="text-sm font-medium text-indigo-600">
                    กำลังแกะลายแทง...
                  </p>
                </div>
              ) : (
                <>
                  <div className="h-16 w-16 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Upload className="h-8 w-8 text-indigo-600" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="font-semibold text-slate-700">
                      แตะเพื่ออัปโหลดรูป
                    </p>
                    <p className="text-xs text-slate-400">JPG, PNG</p>
                  </div>
                </>
              )}
            </div>
          )}
          {step === "PREVIEW" && (
            <div className="space-y-4 pt-4">
              <div className="flex justify-between items-center bg-white p-2 rounded-lg text-xs text-slate-500 mb-2 border border-slate-100">
                <span>พบ {editableItems.length} รายการ</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetState}
                  className="h-6 text-red-500 hover:text-red-600 hover:bg-red-50 p-0 px-2"
                >
                  <RefreshCcw size={12} className="mr-1" /> สแกนใหม่
                </Button>
              </div>
              <ScrollArea className="h-[40vh] pr-4">
                <div className="space-y-3">
                  {editableItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex flex-col gap-2 p-3 bg-white rounded-xl border border-slate-100 shadow-sm hover:border-indigo-200 transition-colors group"
                    >
                      <div className="flex gap-2">
                        <Input
                          value={item.name}
                          onChange={(e) =>
                            updateItem(index, "name", e.target.value)
                          }
                          className="h-8 text-sm font-medium border-transparent hover:border-slate-200 focus:border-indigo-500 bg-transparent px-0 focus:px-2 transition-all"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center bg-slate-50 rounded-lg p-1 border border-slate-200">
                          <button
                            className="p-1 hover:bg-white rounded-md text-slate-500 hover:text-indigo-600"
                            onClick={() =>
                              updateItem(
                                index,
                                "quantity",
                                Math.max(1, item.quantity - 1),
                              )
                            }
                          >
                            <Minus size={12} />
                          </button>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(
                                index,
                                "quantity",
                                parseFloat(e.target.value),
                              )
                            }
                            className="w-10 h-6 text-center border-none bg-transparent text-xs p-0 focus-visible:ring-0"
                          />
                          <button
                            className="p-1 hover:bg-white rounded-md text-slate-500 hover:text-indigo-600"
                            onClick={() =>
                              updateItem(index, "quantity", item.quantity + 1)
                            }
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <span className="text-slate-400 text-xs">x</span>
                        <div className="flex-1 relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                            ฿
                          </span>
                          <Input
                            type="number"
                            value={item.price}
                            onChange={(e) =>
                              updateItem(
                                index,
                                "price",
                                parseFloat(e.target.value),
                              )
                            }
                            className="h-8 text-sm pl-5 border-slate-200 focus:border-indigo-500"
                          />
                        </div>
                        <div className="font-bold text-slate-700 text-sm min-w-[60px] text-right">
                          ฿{(item.price * item.quantity).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
        {step === "PREVIEW" && (
          <div className="p-4 border-t border-slate-100 bg-white">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-slate-500 font-medium">
                ยอดรวมทั้งหมด
              </span>
              <span className="text-xl font-bold text-indigo-600">
                ฿{totalAmount.toLocaleString()}
              </span>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="ghost" onClick={resetState}>
                ยกเลิก
              </Button>
              <Button
                onClick={handleConfirmAdd}
                disabled={isAddingItems || editableItems.length === 0}
                className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto"
              >
                {isAddingItems ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}{" "}
                บันทึก {editableItems.length} รายการ
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
