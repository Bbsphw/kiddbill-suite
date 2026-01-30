import * as dotenv from 'dotenv';
dotenv.config(); // <--- 1. ใส่บรรทัดนี้เป็นบรรทัดแรกๆ เลย!

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // --- Debug Start ---
  // console.log('------------------------------------------------');
  // console.log(
  //   'Loaded Env Keys:',
  //   Object.keys(process.env).filter(
  //     (k) => k.startsWith('CLERK') || k === 'DATABASE_URL',
  //   ),
  // );
  // console.log(
  //   'JWT Key Length:',
  //   process.env.CLERK_JWT_KEY ? process.env.CLERK_JWT_KEY.length : '0',
  // );
  // console.log('------------------------------------------------');
  // --- Debug End ---

  app.enableCors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'], // อนุญาตเฉพาะ Web ของเรา
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // await app.listen(process.env.PORT ?? 3000);
  await app.listen(process.env.PORT ?? 3001);
  console.log(`Application is running on: ${await app.getUrl()}`);
  // console.log(
  //   'JWT Key Check:',
  //   process.env.CLERK_JWT_KEY ? 'Loaded ✅' : 'Missing ❌',
  // );
}
bootstrap();
