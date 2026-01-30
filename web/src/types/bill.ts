// web/src/types/bill.ts

export interface BillItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  totalPrice: number;
  billId: string;
}

export interface BillMember {
  id: string;
  userId: string;
  name: string;
  isPaid: boolean;
}

export interface Bill {
  id: string;
  title: string;
  status: "DRAFT" | "SPLITTING" | "COMPLETED";
  joinCode: string;
  ownerId: string;
  items: BillItem[];
  members: BillMember[];
  createdAt: string;
}
