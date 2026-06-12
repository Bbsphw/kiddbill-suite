import { calculateBillSummary, InputBill } from '@kiddbill/shared';

describe('calculateBillSummary with Dinero.js', () => {
  it('should split 100 THB evenly among 3 members, distributing the extra satang to the first member', () => {
    const mockBill: InputBill = {
      id: 'bill-1',
      title: 'Test Bill',
      status: 'SPLITTING',
      vatRate: 0,
      serviceChargeRate: 0,
      isVatIncluded: true,
      isServiceChargeIncluded: true,
      ownerId: 'user-1',
      members: [
        {
          id: 'member-1',
          name: 'Alice',
          userId: 'user-1',
          isPaid: false,
          verifiedAt: null,
        },
        {
          id: 'member-2',
          name: 'Bob',
          userId: 'user-2',
          isPaid: false,
          verifiedAt: null,
        },
        {
          id: 'member-3',
          name: 'Charlie',
          userId: 'user-3',
          isPaid: false,
          verifiedAt: null,
        },
      ],
      items: [
        {
          id: 'item-1',
          name: 'Steak',
          totalPrice: 100.0,
          applyVat: false,
          applyServiceCharge: false,
          splits: [
            { memberId: 'member-1', weight: 1 },
            { memberId: 'member-2', weight: 1 },
            { memberId: 'member-3', weight: 1 },
          ],
        },
      ],
    };

    const summary = calculateBillSummary(mockBill);
    expect(summary.grandTotal).toBe(100.0);

    const member1 = summary.members.find((m) => m.memberId === 'member-1');
    const member2 = summary.members.find((m) => m.memberId === 'member-2');
    const member3 = summary.members.find((m) => m.memberId === 'member-3');

    expect(member1.netAmount).toBe(33.34);
    expect(member2.netAmount).toBe(33.33);
    expect(member3.netAmount).toBe(33.33);
    expect(member1.netAmount + member2.netAmount + member3.netAmount).toBe(
      100.0,
    );
  });

  it('should handle fractional weights correctly', () => {
    const mockBill: InputBill = {
      id: 'bill-2',
      title: 'Fractional Split',
      status: 'SPLITTING',
      vatRate: 0,
      serviceChargeRate: 0,
      isVatIncluded: true,
      isServiceChargeIncluded: true,
      ownerId: 'user-1',
      members: [
        {
          id: 'member-1',
          name: 'Alice',
          userId: 'user-1',
          isPaid: false,
          verifiedAt: null,
        },
        {
          id: 'member-2',
          name: 'Bob',
          userId: 'user-2',
          isPaid: false,
          verifiedAt: null,
        },
      ],
      items: [
        {
          id: 'item-1',
          name: 'Pizza',
          totalPrice: 200.0,
          applyVat: false,
          applyServiceCharge: false,
          splits: [
            { memberId: 'member-1', weight: 1.5 },
            { memberId: 'member-2', weight: 0.5 },
          ],
        },
      ],
    };

    const summary = calculateBillSummary(mockBill);
    expect(summary.grandTotal).toBe(200.0);

    const member1 = summary.members.find((m) => m.memberId === 'member-1');
    const member2 = summary.members.find((m) => m.memberId === 'member-2');

    // 1.5 / 2 = 75% = 150 THB
    // 0.5 / 2 = 25% = 50 THB
    expect(member1.netAmount).toBe(150.0);
    expect(member2.netAmount).toBe(50.0);
  });

  it('should calculate VAT and Service Charge on top of item base price', () => {
    const mockBill: InputBill = {
      id: 'bill-3',
      title: 'VAT and SC Bill',
      status: 'SPLITTING',
      vatRate: 7.0,
      serviceChargeRate: 10.0,
      isVatIncluded: false,
      isServiceChargeIncluded: false,
      ownerId: 'user-1',
      members: [
        {
          id: 'member-1',
          name: 'Alice',
          userId: 'user-1',
          isPaid: false,
          verifiedAt: null,
        },
      ],
      items: [
        {
          id: 'item-1',
          name: 'Curry',
          totalPrice: 100.0,
          applyVat: true,
          applyServiceCharge: true,
          splits: [{ memberId: 'member-1', weight: 1 }],
        },
      ],
    };

    // Base price = 100 THB
    // SC = 10% of 100 = 10 THB
    // VAT = 7% of (100 + 10) = 7.70 THB
    // Net total = 100 + 10 + 7.70 = 117.70 THB
    const summary = calculateBillSummary(mockBill);
    const member = summary.members[0];

    expect(member.baseAmount).toBe(100.0);
    expect(member.scAmount).toBe(10.0);
    expect(member.vatAmount).toBe(7.7);
    expect(member.netAmount).toBe(117.7);
    expect(summary.grandTotal).toBe(117.7);
  });

  it('should round net amounts to nearest whole Baht when roundingMode is NEAREST', () => {
    const mockBill: InputBill = {
      id: 'bill-4',
      title: 'Rounded Bill',
      status: 'SPLITTING',
      vatRate: 0,
      serviceChargeRate: 0,
      isVatIncluded: true,
      isServiceChargeIncluded: true,
      roundingMode: 'NEAREST',
      ownerId: 'user-1',
      members: [
        {
          id: 'member-1',
          name: 'Alice',
          userId: 'user-1',
          isPaid: false,
          verifiedAt: null,
        },
        {
          id: 'member-2',
          name: 'Bob',
          userId: 'user-2',
          isPaid: false,
          verifiedAt: null,
        },
      ],
      items: [
        {
          id: 'item-1',
          name: 'Lunch',
          totalPrice: 100.5, // Splits into 50.25 each
          applyVat: false,
          applyServiceCharge: false,
          splits: [
            { memberId: 'member-1', weight: 1 },
            { memberId: 'member-2', weight: 1 },
          ],
        },
      ],
    };

    // 50.25 rounded to nearest whole Baht is 50.00
    const summary = calculateBillSummary(mockBill);
    const member1 = summary.members.find((m) => m.memberId === 'member-1');
    const member2 = summary.members.find((m) => m.memberId === 'member-2');

    expect(member1.netAmount).toBe(50.0);
    expect(member2.netAmount).toBe(50.0);
    expect(summary.grandTotal).toBe(100.0);
  });
});
