import {
  Controller,
  Post,
  Req,
  Res,
  Headers,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Webhook } from 'svix';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  @Post('clerk')
  @ApiOperation({ summary: 'Receive Clerk Webhooks for user syncing' })
  handleClerkWebhook(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('svix-id') svixId: string,
    @Headers('svix-timestamp') svixTimestamp: string,
    @Headers('svix-signature') svixSignature: string,
  ) {
    if (!svixId || !svixTimestamp || !svixSignature) {
      throw new BadRequestException('Missing svix headers');
    }

    const payload = req.body as Record<string, unknown>;
    const secret = process.env.CLERK_WEBHOOK_SECRET;

    if (!secret) {
      this.logger.error('CLERK_WEBHOOK_SECRET is not set');
      throw new BadRequestException('Webhook secret not configured');
    }

    const wh = new Webhook(secret);
    let evt: { type: string; data: Record<string, unknown> };

    try {
      evt = wh.verify(JSON.stringify(payload), {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as { type: string; data: Record<string, unknown> };
    } catch (err) {
      const error = err as Error;
      this.logger.error(
        `Webhook signature verification failed: ${error.message}`,
      );
      throw new BadRequestException('Invalid signature');
    }

    const eventType = evt.type;
    this.logger.log(`Received Webhook: ${eventType}`);

    // Handle user.created, user.updated, user.deleted here
    // e.g. await this.usersService.syncUser(evt.data);

    return res.status(200).json({ success: true });
  }
}
