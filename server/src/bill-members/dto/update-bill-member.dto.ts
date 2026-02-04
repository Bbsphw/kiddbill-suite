// server/src/bill-members/dto/update-bill-member.dto.ts

import { PartialType } from '@nestjs/mapped-types';
import { CreateBillMemberDto } from './create-bill-member.dto';

export class UpdateBillMemberDto extends PartialType(CreateBillMemberDto) {}
