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
    
    // Check if it's a mobile number (starts with 06, 08, 09) or citizen ID (13 digits) or e-wallet (15 digits)
    const isMobile = cleanId.length === 10 && /^0[689]/.test(cleanId);
    const isCitizenId = cleanId.length === 13;
    const isEWallet = cleanId.length === 15;
    const isValidPromptPay = isMobile || isCitizenId || isEWallet;

    if (!isValidPromptPay)
      return { payload: null, error: "เลขบัญชีไม่รองรับ QR", isBankNum: true };
    try {
      return { payload: generatePayload(cleanId, { amount }), error: null };
    } catch {
      return { payload: null, error: "Format ผิด" };
    }
  }, [id, amount]);

  if (isBankNum) return null;
  if (error || !payload)
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-dashed text-slate-400 text-xs h-[180px] w-[180px] text-center",
          className,
        )}
      >
        <AlertCircle className="mb-2 opacity-50" />
        <span>{error}</span>
      </div>
    );

  return (
    <div
      className={cn(
        "p-4 bg-white rounded-2xl shadow-sm border border-slate-100 inline-block",
        className,
      )}
    >
      <div className="relative flex justify-center">
        <QRCodeCanvas
          className="qr-canvas"
          value={payload}
          size={200}
          level="L"
          marginSize={0}
          imageSettings={{
            src: "/promptpay-logo.png",
            height: 24,
            width: 50,
            excavate: true,
          }}
        />
      </div>
      <div className="text-center mt-3 space-y-1">
        <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 font-mono tracking-widest uppercase">
          <QrCode size={10} /> Scan to Pay
        </div>
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
