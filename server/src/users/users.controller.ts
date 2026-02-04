// server/src/users/users.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  UseGuards,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 🔄 Sync Endpoint (Public หรือ Protected ก็ได้ แต่ปกติ Clerk Webhook จะยิงมา)
  // หรือ Frontend ยิงมาหลัง Login สำเร็จ
  @Post('sync')
  syncUser(@Body() dto: CreateUserDto) {
    return this.usersService.syncUser(dto);
  }

  // 👤 Get My Profile
  @Get('me')
  @UseGuards(ClerkAuthGuard)
  getProfile(@CurrentUser() user: { id: string }) {
    return this.usersService.getProfile(user.id);
  }

  // ✏️ Update My Profile
  @Patch('me')
  @UseGuards(ClerkAuthGuard)
  updateProfile(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(user.id, dto);
  }

  // 🔍 Search Users (เอาไว้หาเพื่อน)
  @Get('search')
  @UseGuards(ClerkAuthGuard)
  search(@Query('q') query: string) {
    return this.usersService.searchUsers(query, query);
  }
}
