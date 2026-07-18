import { Controller, Post, Body, Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { NotificationsService } from './notifications.service';
import { SendNotificationDto } from './dto';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    @InjectQueue('notifications') private notificationsQueue: Queue
  ) {}

  @Post('send')
  async send(@Body() dto: SendNotificationDto) {
    // Add to queue for async processing
    await this.notificationsQueue.add('send-notification', dto);
    return {
      success: true,
      message: 'Notification queued for delivery',
    };
  }

  @Post('send-sync')
  async sendSync(@Body() dto: SendNotificationDto) {
    // Send immediately (for testing)
    await this.notificationsService.sendNotification(dto);
    return {
      success: true,
      message: 'Notification sent',
    };
  }
}
