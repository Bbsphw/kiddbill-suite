// web/src/types/bill.ts

export interface ItemSplit {
  memberId: string;
  weight: number;
}

export interface BillItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  totalPrice: number; // คำนวณเป็น string/decimal จาก backend แต่ใน frontend อาจจะแปลงเป็น number
  billId: string;
  type?: "FOOD" | "BEVERAGE" | "OTHER";
  splits?: ItemSplit[]; // 👈 เพิ่มบรรทัดนี้ (ใส่ ? ไว้เผื่อบางที backend ไม่ส่งมา)
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
