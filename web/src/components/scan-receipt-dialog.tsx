// web/src/components/scan-receipt-dialog.tsx

"use client";

import { useState, useRef, useEffect } from "react";
import { useScanReceipt } from "@/hooks/use-ocr";
import { useAddBillItem } from "@/hooks/use-bills";
import { OcrResult, OcrItem } from "@/types/ocr";

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

  // State สำหรับรายการที่ "แก้ไขได้" (Editable Items)
  const [editableItems, setEditableItems] = useState<OcrItem[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hooks
  const { mutate: scan, isPending: isScanning } = useScanReceipt();
  const { mutateAsync: addItem } = useAddBillItem(billId);
  const [isAddingItems, setIsAddingItems] = useState(false);

  // 1. Handle File Select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleScan(file);
    }
  };

  // 2. Scan Process
  const handleScan = (file: File) => {
    scan(file, {
      onSuccess: (data) => {
        // เมื่อ Scan เสร็จ ให้ Copy ข้อมูลมาใส่ State ที่แก้ไขได้
        setEditableItems(data.items);
        setStep("PREVIEW");
        toast.success(`เจอรายการอาหาร ${data.items.length} รายการ!`);
      },
    });
  };

  // --- 🛠️ Edittable Logic Functions ---

  // แก้ไขค่าในแต่ละ Row
  const updateItem = (
    index: number,
    field: keyof OcrItem,
    value: string | number,
  ) => {
    const newItems = [...editableItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setEditableItems(newItems);
  };

  // ลบรายการ
  const removeItem = (index: number) => {
    const newItems = editableItems.filter((_, i) => i !== index);
    setEditableItems(newItems);
  };

  // คำนวณยอดรวม Real-time
  const totalAmount = editableItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  // --- End Logic ---

  // 3. Confirm & Add to Bill
  const handleConfirmAdd = async () => {
    if (editableItems.length === 0) return;
    setIsAddingItems(true);

    try {
      // วน Loop เพิ่มเฉพาะรายการที่เหลืออยู่ใน List (ที่ผ่านการแก้ไขแล้ว)
      const promises = editableItems.map((item) =>
        addItem({
          name: item.name || "รายการไม่ระบุชื่อ",
          price: Number(item.price) || 0,
          quantity: Number(item.quantity) || 1,
        }),
      );

      await Promise.all(promises);

      toast.success(`เพิ่ม ${editableItems.length} รายการเรียบร้อย! 🎉`);
      setOpen(false);
      // รอ Animation ปิด Dialog จบแล้วค่อย Reset
      setTimeout(resetState, 300);
    } catch (error) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาดในการเพิ่มรายการ");
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
          className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 shadow-sm"
        >
          <Camera size={16} />
          <span className="hidden sm:inline">สแกนสลิป</span>
          <span className="sm:hidden">สแกน</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ScanLine className="text-indigo-600" />
            {step === "UPLOAD" ? "สแกนใบเสร็จ" : "ตรวจสอบรายการ"}
          </DialogTitle>
          <DialogDescription>
            {step === "UPLOAD"
              ? "รองรับสลิปยาวๆ และลายมือ (บางส่วน)"
              : "เช็คความถูกต้องและแก้ไขก่อนบันทึก"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 pt-2">
          {/* STEP 1: UPLOAD UI */}
          {step === "UPLOAD" && (
            <div
              className="flex flex-col items-center justify-center gap-4 py-12 border-2 border-dashed border-indigo-100 rounded-xl bg-indigo-50/30 hover:bg-indigo-50/50 transition-colors cursor-pointer group mt-4"
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
                    กำลังแกะลายแทงจากสลิป...
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    อาจใช้เวลาสักครู่
                  </p>
                </div>
              ) : (
                <>
                  <div className="h-16 w-16 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Upload className="h-8 w-8 text-indigo-600" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="font-semibold text-gray-700">
                      แตะเพื่ออัปโหลดรูป
                    </p>
                    <p className="text-xs text-gray-400">
                      JPG, PNG (ชัดๆ ยิ่งดี)
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP 2: PREVIEW & EDIT UI */}
          {step === "PREVIEW" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-gray-100 p-2 rounded-lg text-xs text-gray-500 mb-2">
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
                      className="flex flex-col gap-2 p-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-indigo-200 transition-colors group"
                    >
                      {/* แถวบน: ชื่อรายการ + ปุ่มลบ */}
                      <div className="flex gap-2">
                        <Input
                          value={item.name}
                          onChange={(e) =>
                            updateItem(index, "name", e.target.value)
                          }
                          className="h-8 text-sm font-medium border-transparent hover:border-gray-200 focus:border-indigo-500 bg-transparent px-0 focus:px-2 transition-all"
                          placeholder="ชื่อรายการ..."
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>

                      {/* แถวล่าง: จำนวน x ราคา */}
                      <div className="flex items-center gap-3">
                        {/* Quantity Control */}
                        <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-200">
                          <button
                            className="p-1 hover:bg-white rounded-md text-gray-500 hover:text-indigo-600 transition-colors"
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
                            className="p-1 hover:bg-white rounded-md text-gray-500 hover:text-indigo-600 transition-colors"
                            onClick={() =>
                              updateItem(index, "quantity", item.quantity + 1)
                            }
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        <span className="text-gray-400 text-xs">x</span>

                        {/* Price Input */}
                        <div className="flex-1 relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
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
                            className="h-8 text-sm pl-5 border-gray-200 focus:border-indigo-500"
                          />
                        </div>

                        {/* Total per row */}
                        <div className="font-bold text-gray-700 text-sm min-w-[60px] text-right">
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

        {/* Footer Summary */}
        {step === "PREVIEW" && (
          <div className="p-4 border-t bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-gray-500 font-medium">
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
                )}
                บันทึก {editableItems.length} รายการ
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
