import { PartialType } from '@nestjs/mapped-types';
import { CreateBillMemberDto } from './create-bill-member.dto';

export class UpdateBillMemberDto extends PartialType(CreateBillMemberDto) {}
