import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';

// In-memory rate limits tracking: map of userId/IP -> request timestamps
const ocrLimitsStore = new Map<string, number[]>();
const slipLimitsStore = new Map<string, number[]>();

// Automatic cleanup every 30 minutes to prevent memory leaks in production
setInterval(
  () => {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    for (const [key, timestamps] of ocrLimitsStore.entries()) {
      const active = timestamps.filter((t) => now - t < oneHour);
      if (active.length === 0) {
        ocrLimitsStore.delete(key);
      } else {
        ocrLimitsStore.set(key, active);
      }
    }

    for (const [key, timestamps] of slipLimitsStore.entries()) {
      const active = timestamps.filter((t) => now - t < oneHour);
      if (active.length === 0) {
        slipLimitsStore.delete(key);
      } else {
        slipLimitsStore.set(key, active);
      }
    }
  },
  30 * 60 * 1000,
).unref(); // unref so it does not block application exit in tests

function checkRateLimit(
  key: string,
  store: Map<string, number[]>,
  limit: number,
  windowMs: number,
  errorMessage: string,
): boolean {
  const now = Date.now();
  const requests = store.get(key) || [];

  // Filter requests inside the window
  const activeRequests = requests.filter(
    (timestamp) => now - timestamp < windowMs,
  );

  if (activeRequests.length >= limit) {
    throw new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: errorMessage,
        error: 'Too Many Requests',
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  activeRequests.push(now);
  store.set(key, activeRequests);
  return true;
}

interface RequestWithUser extends Request {
  user?: { id: string };
}

@Injectable()
export class OcrRateLimitGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const userId = request.user?.id || request.ip || 'anonymous';

    // Limits: 5 requests per 1 hour (3,600,000 ms)
    const limit = 5;
    const windowMs = 60 * 60 * 1000;
    const msg =
      'คุณใช้งานโควตาสแกนภาพเต็มแล้ว (จำกัด 5 ครั้ง/ชม.) เพื่อให้ใช้งานได้ทันที คุณสามารถพิมพ์รายการอาหารด้วยตนเอง หรือรออีกสักครู่';

    return checkRateLimit(userId, ocrLimitsStore, limit, windowMs, msg);
  }
}

@Injectable()
export class SlipRateLimitGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const userId = request.user?.id || request.ip || 'anonymous';

    // Limits: 10 requests per 1 hour (3,600,000 ms)
    const limit = 10;
    const windowMs = 60 * 60 * 1000;
    const msg =
      'คุณใช้งานโควตาสแกนสลิปเต็มแล้ว (จำกัด 10 ครั้ง/ชม.) เพื่อให้ใช้งานได้ทันที เจ้าของบิลสามารถตรวจสอบยอดโอนและกดยืนยันยอดแบบแมนนวลได้';

    return checkRateLimit(userId, slipLimitsStore, limit, windowMs, msg);
  }
}
