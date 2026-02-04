// web/src/types/bill.ts

export interface BillItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  totalPrice: number; // คำนวณเป็น string/decimal จาก backend แต่ใน frontend อาจจะแปลงเป็น number
  billId: string;
  type?: "FOOD" | "BEVERAGE" | "OTHER";
}

export interface BillMember {
  id: string;
  userId: string | null; // null = Guest, string = Registered User
  name: string;
  isPaid: boolean;
  netAmountToPay?: number; // ยอดที่ต้องจ่าย (ถ้า backend คำนวณมาให้)
  billId: string;
}

export interface Bill {
  id: string;
  title: string;
  status: "DRAFT" | "SPLITTING" | "COMPLETED";
  joinCode: string;
  ownerId: string;
  items: BillItem[];
  members: BillMember[];
  vatRate: number;
  serviceChargeRate: number;
  isVatIncluded: boolean;
  isServiceChargeIncluded: boolean;
  createdAt: string;
  updatedAt: string;
}
