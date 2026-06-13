// server/src/users/users.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ClerkAuthGuard } from '@/auth/clerk-auth.guard';
import { CurrentUser } from '@/auth/current-user.decorator';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 🔄 Sync Endpoint (Public หรือ Protected ก็ได้ แต่ปกติ Clerk Webhook จะยิงมา)
  // หรือ Frontend ยิงมาหลัง Login สำเร็จ
  @Post('sync')
  @ApiOperation({ summary: 'Sync user data from Clerk webhook' })
  syncUser(@Body() dto: CreateUserDto) {
    return this.usersService.syncUser(dto);
  }

  // 👤 Get My Profile
  @Get('me')
  @ApiBearerAuth()
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@CurrentUser() user: { id: string }) {
    return this.usersService.getProfile(user.id);
  }

  // ✏️ Update My Profile
  @Patch('me')
  @ApiBearerAuth()
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({ summary: 'Update current user profile' })
  updateProfile(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(user.id, dto);
  }

  // 🔍 Search Users (เอาไว้หาเพื่อน)
  @Get('search')
  @ApiBearerAuth()
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({ summary: 'Search users by query' })
  search(@Query('q') query: string, @CurrentUser() user: { id: string }) {
    return this.usersService.searchUsers(query, user.id);
  }
}
