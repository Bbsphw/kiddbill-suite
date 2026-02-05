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

      // 👇 แก้ตรงนี้: ยัด Config เข้าไปเพื่อ "ล้าง" Content-Type
      const res = await api.post<OcrResult>("/ocr/scan", formData, {
        headers: {
          "Content-Type": "multipart/form-data", // บอก Axios ว่านี่คือไฟล์ (เดี๋ยว Axios จะจัดการ Boundary ให้เอง หรือบางทีต้องใช้ undefined)
        },
      });
      return res.data;
    },
    onError: (error: any) => {
      console.error("OCR Error:", error);
      // แสดงข้อความ Error ที่ชัดเจนขึ้น
      const msg =
        error.response?.data?.message || error.message || "ลองใหม่อีกครั้ง";
      toast.error(`สแกนไม่สำเร็จ: ${Array.isArray(msg) ? msg[0] : msg}`);
    },
  });
};
