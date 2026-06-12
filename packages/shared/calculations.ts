import { dinero, add, multiply, allocate, transformScale, halfUp, up, down, Dinero } from "dinero.js";
import { THB, createMoney, moneyToNumber } from "./money";

export interface InputSplit {
  memberId: string;
  weight: number;
}

export interface InputItem {
  id: string;
  name: string;
  totalPrice: number;
  applyVat: boolean;
  applyServiceCharge: boolean;
  splits: InputSplit[];
}

export interface InputMember {
  id: string;
  name: string;
  userId: string | null;
  isPaid: boolean;
  verifiedAt: string | Date | null;
}

export interface InputBill {
  id: string;
  title: string;
  status: string;
  vatRate: number; // e.g., 7.00
  serviceChargeRate: number; // e.g., 10.00
  isVatIncluded: boolean;
  isServiceChargeIncluded: boolean;
  discountAmount?: number;
  discountPercent?: number;
  roundingMode?: "NONE" | "UP" | "DOWN" | "NEAREST";
  ownerId: string;
  promptPayNumber?: string | null;
  promptPayName?: string | null;
  bankName?: string | null;
  bankAccount?: string | null;
  items: InputItem[];
  members: InputMember[];
}

export interface MemberTotalItem {
  memberId: string;
  userId: string | null;
  name: string;
  isPaid: boolean;
  verifiedAt: Date | null;
  baseAmount: number;
  scBasis: number;
  vatBasis: number;
  vatOnScBasis: number;
  scAmount: number;
  vatAmount: number;
  netAmount: number;
  items: Array<{
    name: string;
    amount: number;
    weight?: number;
  }>;
}

export interface BillSummary {
  billId: string;
  title: string;
  status: string;
  ownerId: string;
  config: {
    vat: number;
    sc: number;
  };
  members: MemberTotalItem[];
  grandTotal: number;
  promptPayNumber: string | null;
  promptPayName: string | null;
  bankName: string | null;
  bankAccount: string | null;
}

/**
 * แปลงตัวเลขน้ำหนัก (Weight) เช่น 1.5 หรือ 0.33 เป็น Scaled Ratio เพื่อใช้ใน Dinero.js
 */
export function toScaledRatio(weight: number): { amount: number; scale: number } {
  if (Number.isInteger(weight)) {
    return { amount: weight, scale: 0 };
  }
  const str = weight.toString();
  const decimalIndex = str.indexOf(".");
  if (decimalIndex === -1) {
    return { amount: weight, scale: 0 };
  }
  const exponent = str.length - decimalIndex - 1;
  const amount = Math.round(weight * Math.pow(10, exponent));
  return { amount, scale: exponent };
}

/**
 * แปลงเปอร์เซ็นต์ (เช่น 7% หรือ 10%) เป็น ตัวคูณแบบ Scaled Multiplier เพื่อใช้ในการคูณใน Dinero.js
 */
export function rateToMultiplier(rate: number): { amount: number; scale: number } {
  const ratio = toScaledRatio(rate);
  return {
    amount: ratio.amount,
    scale: ratio.scale + 2, // หาร 100 เพื่อแปลงเป็นทศนิยม
  };
}

/**
 * ฟังก์ชันหลักในการคำนวณหารค่าใช้จ่ายในบิลด้วย Dinero.js
 */
export function calculateBillSummary(bill: InputBill): BillSummary {
  const memberTotals: Record<
    string,
    {
      memberId: string;
      userId: string | null;
      name: string;
      isPaid: boolean;
      verifiedAt: Date | null;
      baseAmount: Dinero<number, "THB">;
      scBasis: Dinero<number, "THB">;
      vatBasis: Dinero<number, "THB">;
      vatOnScBasis: Dinero<number, "THB">;
      items: Array<{ name: string; amount: number; weight?: number }>;
    }
  > = {};

  // 1. เตรียมข้อมูลสมาชิกทั้งหมด
  bill.members.forEach((m) => {
    memberTotals[m.id] = {
      memberId: m.id,
      userId: m.userId,
      name: m.name,
      isPaid: m.isPaid,
      verifiedAt: m.verifiedAt ? new Date(m.verifiedAt) : null,
      baseAmount: dinero({ amount: 0, currency: THB }),
      scBasis: dinero({ amount: 0, currency: THB }),
      vatBasis: dinero({ amount: 0, currency: THB }),
      vatOnScBasis: dinero({ amount: 0, currency: THB }),
      items: [],
    };
  });

  // ค้นหา Owner Member ID เพื่อเป็นคนรับกรรม (Unassigned Items)
  const ownerMember = bill.members.find((m) => m.userId === bill.ownerId);
  const ownerKey = ownerMember ? ownerMember.id : (bill.members[0]?.id || "owner-fallback");

  // หากไม่มี Owner ในระบบเลย ให้สร้างขึ้นมาใน object ชั่วคราว
  if (ownerKey === "owner-fallback" && !memberTotals[ownerKey]) {
    memberTotals[ownerKey] = {
      memberId: "owner-fallback",
      userId: bill.ownerId,
      name: "Owner (Fallback)",
      isPaid: true,
      verifiedAt: new Date(),
      baseAmount: dinero({ amount: 0, currency: THB }),
      scBasis: dinero({ amount: 0, currency: THB }),
      vatBasis: dinero({ amount: 0, currency: THB }),
      vatOnScBasis: dinero({ amount: 0, currency: THB }),
      items: [],
    };
  }

  // 2. คำนวณแจกแจงราคาแต่ละรายการอาหาร (Items)
  bill.items.forEach((item) => {
    const itemMoney = createMoney(item.totalPrice);
    const totalWeight = item.splits.reduce((sum, s) => sum + s.weight, 0);

    // กรองเอาเฉพาะ split ที่มีน้ำหนัก > 0
    const activeSplits = item.splits.filter((s) => s.weight > 0);

    if (totalWeight > 0 && activeSplits.length > 0) {
      // ทำการจัดสรรราคาอาหารด้วยการแบ่งตามสัดส่วน (Allocation) จาก Dinero.js
      const ratios = activeSplits.map((s) => toScaledRatio(s.weight));
      const shares = allocate(itemMoney, ratios);

      activeSplits.forEach((split, idx) => {
        const targetKey = split.memberId;
        const share = shares[idx];

        if (memberTotals[targetKey]) {
          memberTotals[targetKey].baseAmount = add(memberTotals[targetKey].baseAmount, share);

          if (item.applyServiceCharge) {
            memberTotals[targetKey].scBasis = add(memberTotals[targetKey].scBasis, share);
          }
          if (item.applyVat) {
            memberTotals[targetKey].vatBasis = add(memberTotals[targetKey].vatBasis, share);
          }
          if (item.applyServiceCharge && item.applyVat) {
            memberTotals[targetKey].vatOnScBasis = add(memberTotals[targetKey].vatOnScBasis, share);
          }

          memberTotals[targetKey].items.push({
            name: item.name,
            amount: moneyToNumber(share),
            weight: split.weight,
          });
        }
      });
    } else {
      // ไม่มีคนหาร หรือผลรวมน้ำหนักเป็น 0 -> เข้าเจ้าของบิล (Owner)
      if (memberTotals[ownerKey]) {
        memberTotals[ownerKey].baseAmount = add(memberTotals[ownerKey].baseAmount, itemMoney);

        if (item.applyServiceCharge) {
          memberTotals[ownerKey].scBasis = add(memberTotals[ownerKey].scBasis, itemMoney);
        }
        if (item.applyVat) {
          memberTotals[ownerKey].vatBasis = add(memberTotals[ownerKey].vatBasis, itemMoney);
        }
        if (item.applyServiceCharge && item.applyVat) {
          memberTotals[ownerKey].vatOnScBasis = add(memberTotals[ownerKey].vatOnScBasis, itemMoney);
        }

        memberTotals[ownerKey].items.push({
          name: `${item.name} (ไม่มีคนหาร)`,
          amount: moneyToNumber(itemMoney),
        });
      }
    }
  });

  // 3. คำนวณ VAT และ Service Charge รายบุคคล
  const summaryMembers = Object.values(memberTotals).map((data) => {
    let scAmount = dinero({ amount: 0, currency: THB });
    let vatAmount = dinero({ amount: 0, currency: THB });

    // 3.1 คำนวณ Service Charge (กรณีที่ยังไม่ได้รวมมาในราคาอาหาร)
    if (!bill.isServiceChargeIncluded && bill.serviceChargeRate > 0) {
      const scMultiplier = rateToMultiplier(bill.serviceChargeRate);
      const computedSc = multiply(data.scBasis, scMultiplier);
      scAmount = transformScale(computedSc, 2, halfUp);
    }

    // 3.2 คำนวณ VAT (กรณีที่ยังไม่ได้รวมมาในราคาอาหาร)
    if (!bill.isVatIncluded && bill.vatRate > 0) {
      // หา Service Charge ที่คิดบนรายการที่คิด VAT ด้วย (SC on VAT items)
      let scOnVatBasis = dinero({ amount: 0, currency: THB });
      if (!bill.isServiceChargeIncluded && bill.serviceChargeRate > 0) {
        const scMultiplier = rateToMultiplier(bill.serviceChargeRate);
        const computedScOnVat = multiply(data.vatOnScBasis, scMultiplier);
        scOnVatBasis = transformScale(computedScOnVat, 2, halfUp);
      }

      const vatBasisTotal = add(data.vatBasis, scOnVatBasis);
      const vatMultiplier = rateToMultiplier(bill.vatRate);
      const computedVat = multiply(vatBasisTotal, vatMultiplier);
      vatAmount = transformScale(computedVat, 2, halfUp);
    }

    // 3.3 รวมยอดสุทธิรายคน
    let netAmount = add(add(data.baseAmount, scAmount), vatAmount);

    // 3.4 จัดการเรื่องปัดเศษหลักบาท (ถ้ามีการระบุการปัดเศษ)
    if (bill.roundingMode && bill.roundingMode !== "NONE") {
      let roundedBaht: Dinero<number, "THB">;
      if (bill.roundingMode === "UP") {
        roundedBaht = transformScale(netAmount, 0, up);
      } else if (bill.roundingMode === "DOWN") {
        roundedBaht = transformScale(netAmount, 0, down);
      } else {
        roundedBaht = transformScale(netAmount, 0, halfUp); // NEAREST
      }
      // แปลงสเกลกลับเป็น 2 (สตางค์)
      netAmount = transformScale(roundedBaht, 2, halfUp);
    }

    return {
      memberId: data.memberId,
      userId: data.userId,
      name: data.name,
      isPaid: data.isPaid,
      verifiedAt: data.verifiedAt,
      baseAmount: moneyToNumber(data.baseAmount),
      scBasis: moneyToNumber(data.scBasis),
      vatBasis: moneyToNumber(data.vatBasis),
      vatOnScBasis: moneyToNumber(data.vatOnScBasis),
      scAmount: moneyToNumber(scAmount),
      vatAmount: moneyToNumber(vatAmount),
      netAmount: moneyToNumber(netAmount),
      items: data.items,
    };
  });

  // 4. คำนวณยอดรวมของทั้งบิล (Grand Total)
  const grandTotalMoney = summaryMembers.reduce((sum, m) => {
    return add(sum, createMoney(m.netAmount));
  }, dinero({ amount: 0, currency: THB }));

  return {
    billId: bill.id,
    title: bill.title,
    status: bill.status,
    ownerId: bill.ownerId,
    config: {
      vat: bill.vatRate,
      sc: bill.serviceChargeRate,
    },
    members: summaryMembers,
    grandTotal: moneyToNumber(grandTotalMoney),
    promptPayNumber: bill.promptPayNumber || null,
    promptPayName: bill.promptPayName || null,
    bankName: bill.bankName || null,
    bankAccount: bill.bankAccount || null,
  };
}
