// web/src/hooks/use-ocr.ts

import { useMutation } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api";
import { OcrResult } from "@/types/ocr";
import { toast } from "sonner";

export const useScanReceipt = () => {
  const api = useApiClient();

  return useMutation({
    mutationFn: async (file: File) => {
      // 1. ขอ Presigned URL และ File URL จากหลังบ้าน
      const { data: presigned } = await api.post<{
        uploadUrl: string;
        fileUrl: string;
        key: string;
      }>("/storage/upload-url", {
        fileName: file.name,
        contentType: file.type,
      });

      // 2. อัปโหลดไฟล์แบบ Binary ด้วย PUT ตรงไปยังพื้นที่จัดเก็บไฟล์ (R2/Local)
      // ใช้ fetch โล่งๆ เพื่อป้องกันการแนบ Clerk Header
      const uploadRes = await fetch(presigned.uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadRes.ok) {
        throw new Error("อัปโหลดไฟล์ใบเสร็จไม่สำเร็จ");
      }

      // 3. ส่ง URL รูปภาพไปทำการ OCR สแกน
      const res = await api.post<OcrResult>("/ocr/scan", {
        imageUrl: presigned.fileUrl,
      });
      return res.data;
    },
    onError: (error: Error) => {
      console.error("OCR Error:", error);
      const msg = error.message || "ลองใหม่อีกครั้ง";
      toast.error(`สแกนไม่สำเร็จ: ${Array.isArray(msg) ? msg[0] : msg}`);
    },
  });
};
