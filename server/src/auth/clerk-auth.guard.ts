// server/src/auth/clerk-auth.guard.ts

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user?: { id: string };
}

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly logger = new Logger(ClerkAuthGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    // --- Dev Bypass ---
    const testUserId = request.headers['x-test-user-id'] as string | undefined;
    const isProduction = process.env.NODE_ENV === 'production';
    if (testUserId && !isProduction) {
      this.logger.warn(`⚠️ Using Dev Bypass for User: ${testUserId}`);
      request.user = { id: testUserId };
      return true;
    }

    // --- Real Token Check ---
    const authHeader = request.headers.authorization;
    if (!authHeader) throw new UnauthorizedException('No token provided');

    const token = authHeader.split(' ')[1];
    if (!token) throw new UnauthorizedException('No token provided');

    try {
      const verifiedToken = await clerkClient.verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });
      request.user = { id: verifiedToken.sub };
      return true;
    } catch (error) {
      this.logger.error(error);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
