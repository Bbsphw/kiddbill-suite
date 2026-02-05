// web/src/components/promptpay-qr.tsx

"use client";

import { useMemo } from "react";
import { QRCodeCanvas } from "qrcode.react";
import generatePayload from "promptpay-qr";
import { cn } from "@/lib/utils";
import { AlertCircle, QrCode } from "lucide-react";

interface PromptPayQRProps {
  id: string | null | undefined;
  amount?: number;
  className?: string;
}

export function PromptPayQR({ id, amount, className }: PromptPayQRProps) {
  const { payload, error, isBankNum } = useMemo(() => {
    if (!id) return { payload: null, error: "ไม่พบข้อมูล" };

    const cleanId = id.replace(/[^0-9]/g, "");

    // เช็คความยาว: PromptPay ปกติคือ 10 (มือถือ) หรือ 13 (บัตร ปชช) หรือ 15 (E-Wallet)
    // ถ้าความยาวแปลกๆ (เช่น 10-12 หลักของเลขบัญชีธนาคาร) อาจจะไม่ใช่ PromptPay
    const isValidPromptPayLength = [10, 13, 15].includes(cleanId.length);

    if (!isValidPromptPayLength) {
      // สันนิษฐานว่าเป็นเลขบัญชีธนาคารธรรมดา (ไม่ Gen QR)
      return {
        payload: null,
        error: "เลขบัญชีธนาคารไม่รองรับการสร้าง QR",
        isBankNum: true,
      };
    }

    try {
      // ✅ จุดสำคัญ: ใส่ amount ลงไปตรงนี้ คือการทำ Dynamic QR ให้แต่ละคน
      const qrCode = generatePayload(cleanId, { amount });
      return { payload: qrCode, error: null };
    } catch (err) {
      return { payload: null, error: "รูปแบบไม่ถูกต้อง" };
    }
  }, [id, amount]);

  // กรณีเป็นเลขบัญชีธนาคาร (ไม่โชว์ Error แดง แต่ไม่วาด QR)
  if (isBankNum) return null;

  // กรณี Error จริงๆ
  if (error || !payload) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl border border-dashed text-gray-400 text-xs h-[180px] w-[180px] text-center",
          className,
        )}
      >
        <AlertCircle className="mb-2 opacity-50" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "p-4 bg-white rounded-xl shadow-sm border border-gray-100 inline-block",
        className,
      )}
    >
      <div className="relative flex justify-center">
        <QRCodeCanvas
          value={payload}
          size={200}
          level="L"
          marginSize={0}
          imageSettings={{
            src: "https://upload.wikimedia.org/wikipedia/commons/c/c5/PromptPay-logo.png",
            height: 24,
            width: 50,
            excavate: true,
          }}
        />
      </div>
      <div className="text-center mt-3 space-y-1">
        <div className="flex items-center justify-center gap-1 text-[10px] text-gray-400 font-mono tracking-widest uppercase">
          <QrCode size={10} /> Scan to Pay
        </div>
        {/* แสดงยอดเงินใต้ QR เพื่อยืนยัน */}
        {amount !== undefined && amount > 0 && (
          <p className="text-lg font-bold text-indigo-600">
            ฿
            {amount.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        )}
      </div>
    </div>
  );
}
