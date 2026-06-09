// web/src/hooks/use-ocr.ts

import { useMutation } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api";
import { OcrResult } from "@/types/ocr";
import { toast } from "sonner";

export const useScanReceipt = () => {
  const api = useApiClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      // We do NOT set "Content-Type" so that the browser sets it automatically with the boundary
      const res = await api.post<OcrResult>("/ocr/scan", formData);
      return res.data;
    },
    onError: (error: Error) => {
      console.error("OCR Error:", error);
      const msg = error.message || "ลองใหม่อีกครั้ง";
      toast.error(`สแกนไม่สำเร็จ: ${Array.isArray(msg) ? msg[0] : msg}`);
    },
  });
};
