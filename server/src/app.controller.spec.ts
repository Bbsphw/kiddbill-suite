// server/src/app.controller.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  const mockAppService = {
    getHealthCheck: jest.fn().mockResolvedValue({
      status: 'ok',
      message: 'All systems are running 🚀',
      services: {
        database: 'ok',
        redis: 'ok',
        sentry: 'disabled',
      },
      issues: [],
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    }),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: mockAppService,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return health check status', async () => {
      const result = await appController.getHealthCheck();
      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('message');
    });
  });
});
