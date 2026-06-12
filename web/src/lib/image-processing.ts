// web/src/lib/image-processing.ts

/**
 * Image Processing Pipeline สำหรับเตรียมรูปภาพก่อนส่งให้ OCR Engine (Gemini)
 * ช่วยประหยัดแบนด์วิดท์, ประหยัด Token และเพิ่มความแม่นยำในการอ่านตัวหนังสือ
 */
export async function processReceiptImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          return reject(new Error("Canvas context is not available"));
        }

        // 1. Resize (ไม่เกิน 1280x1280 px เพื่อประหยัด Token)
        const MAX_SIZE = 1280;
        let width = img.width;
        let height = img.height;

        if (width > height && width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }

        canvas.width = width;
        canvas.height = height;

        // วาดภาพต้นฉบับลง Canvas
        ctx.drawImage(img, 0, 0, width, height);

        // ดึงพิกเซลข้อมูลมาจัดการ
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // 2. Grayscale & Contrast Enhancement
        const contrast = 30; // ปรับความสว่าง/ความต่างสี +30
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

        for (let i = 0; i < data.length; i += 4) {
          // ดึงสี RGB
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // แปลงเป็นขาวดำ (Grayscale)
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;

          // ปรับ Contrast ให้ตัวหนังสือดำเข้มและพื้นหลังขาวชัดเจนขึ้น
          let newGray = factor * (gray - 128) + 128;
          newGray = Math.max(0, Math.min(255, newGray)); // limit 0-255

          data[i] = newGray;     // Red
          data[i + 1] = newGray; // Green
          data[i + 2] = newGray; // Blue
          // data[i+3] คือ Alpha (ไม่เปลี่ยน)
        }

        // เอากลับไปวาดบน Canvas
        ctx.putImageData(imageData, 0, 0);

        // 3. Output as Base64 JPEG (Quality 0.8)
        const base64Data = canvas.toDataURL("image/jpeg", 0.8);
        resolve(base64Data);
      };

      img.onerror = () => reject(new Error("Failed to load image"));
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
  });
}
