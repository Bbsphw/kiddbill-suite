// web/src/types/ocr.ts

export interface OcrItem {
  name: string;
  price: number;
  quantity: number;
}

export interface OcrResult {
  merchantName: string;
  date: string;
  items: OcrItem[];
  subtotal: number;
  vat: number;
  serviceCharge: number;
  total: number;
}
