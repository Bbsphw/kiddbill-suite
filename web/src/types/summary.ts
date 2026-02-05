// web/src/types/summary.ts

export interface SummaryItem {
  name: string;
  amount: number;
  weight?: number;
}

export interface MemberSummary {
  memberId: string;
  userId: string | null;
  name: string;
  baseAmount: number; // ยอดค่าอาหารเพียวๆ
  scAmount: number; // ยอด Service Charge ที่ต้องรับผิดชอบ
  vatAmount: number; // ยอด VAT ที่ต้องรับผิดชอบ
  netAmount: number; // ยอดสุทธิที่ต้องจ่าย (ปัดเศษแล้ว)
  items: SummaryItem[];
  isPaid: boolean; // (ต้องเพิ่ม field นี้ใน backend response หรือดึงจาก member object)
}

export interface BillConfig {
  vat: number;
  sc: number;
}

export interface BillSummary {
  billId: string;
  title: string;
  status: "DRAFT" | "COMPLETED";
  config: BillConfig;
  members: MemberSummary[];
  grandTotal: number;

  // Bank Info (สำหรับโอนเงิน)
  bankName?: string;
  bankAccount?: string;
  promptPayName?: string;
  promptPayNumber?: string;
}
