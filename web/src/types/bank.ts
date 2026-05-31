// web/src/types/bank.ts

export interface BankAccount {
  id: string;
  bankName: string; // เช่น KBANK, SCB, PROMPTPAY
  accountNumber: string; // เลขบัญชี หรือ เบอร์มือถือ/บัตร ปชช.
  accountName: string; // ชื่อเจ้าของบัญชี
  isDefault: boolean; // บัญชีหลักหรือไม่
}

export interface CreateBankAccountDto {
  bankName: string;
  accountNumber: string;
  accountName: string;
  isDefault?: boolean;
}
