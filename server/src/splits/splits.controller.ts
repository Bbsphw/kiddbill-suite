import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { SplitsService } from './splits.service';
import { AssignSplitDto } from './dto/assign-split.dto';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('splits')
@UseGuards(ClerkAuthGuard)
export class SplitsController {
  constructor(private readonly splitsService: SplitsService) {}

  @Post('assign')
  assign(@CurrentUser() user: { id: string }, @Body() dto: AssignSplitDto) {
    return this.splitsService.assignSplits(user.id, dto);
  }

  @Get(':itemId')
  getSplits(@Param('itemId') itemId: string) {
    return this.splitsService.getItemSplits(itemId);
  }
}
