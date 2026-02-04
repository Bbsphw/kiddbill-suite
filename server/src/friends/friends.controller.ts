// server/src/friends/friends.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { FriendsService } from './friends.service';
import { CreateFriendDto } from './dto/create-friend.dto';
import { UpdateFriendDto } from './dto/update-friend.dto';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('friends')
@UseGuards(ClerkAuthGuard) // 🛡️ บังคับ Login
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateFriendDto) {
    return this.friendsService.create(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: { id: string }) {
    return this.friendsService.findAll(user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateFriendDto,
  ) {
    return this.friendsService.update(id, user.id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.friendsService.remove(id, user.id);
  }
}
