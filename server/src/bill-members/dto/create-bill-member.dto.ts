// server/src/bill-members/dto/create-bill-member.dto.ts

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateBillMemberSchema = z.object({
  billId: z.string().uuid('Invalid Bill ID format'),
  name: z.string().min(1, 'Name is required'), // ชื่อเพื่อน (เช่น "ไอ้อ้วน", "น้องบี")
});

export class CreateBillMemberDto extends createZodDto(CreateBillMemberSchema) {}
