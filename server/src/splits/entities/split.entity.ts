// server/src/splits/entities/split.entity.ts

// ปกติเราใช้ Prisma Client Type แต่สร้างไว้เพื่อความ Clean Architecture
export class ItemSplit {
  id: string;
  itemId: string;
  memberId: string;
  weight: number;
  fixedAmount?: number | null;
}
