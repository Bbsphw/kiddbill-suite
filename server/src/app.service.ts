// server/src/app.service.ts

import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealthCheck() {
    return {
      status: 'ok',
      message: 'KiddBill API is running 🚀',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }
}
