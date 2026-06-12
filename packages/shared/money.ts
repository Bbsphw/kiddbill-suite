import { dinero, toDecimal, DineroCurrency, Dinero } from "dinero.js";

// 🇹🇭 กำหนดสกุลเงิน THB (บาท) มีทศนิยม 2 ตำแหน่ง (1 บาท = 100 สตางค์)
export const THB = {
  code: "THB",
  base: 10,
  exponent: 2,
} as const satisfies DineroCurrency<number, "THB">;

/**
 * แปลงจำนวนเงินทศนิยม (เช่น 100.50) ให้เป็นหน่วยย่อยที่สุด (สตางค์ เช่น 10050)
 * หลีกเลี่ยง Floating Point Error ใน JavaScript ด้วย Math.round
 */
export function toMinorUnit(amount: number | string): number {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

/**
 * แปลงหน่วยย่อย (สตางค์) กลับเป็นทศนิยม
 */
export function fromMinorUnit(amount: number): number {
  return amount / 100;
}

/**
 * สร้าง Dinero object จากจำนวนเงินหลัก (เช่น 100.50)
 */
export function createMoney(amount: number | string): Dinero<number, "THB"> {
  return dinero({ amount: toMinorUnit(amount), currency: THB });
}

/**
 * แปลง Dinero object กลับมาเป็นตัวเลขทศนิยม (number)
 */
export function moneyToNumber(d: Dinero<number, "THB">): number {
  return parseFloat(toDecimal(d));
}
