import { Injectable, Logger } from '@nestjs/common';
import { Processor, Process } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { EmailService } from '../../common/services/email.service';
import { SlackService } from '../../common/services/slack.service';
import { SendNotificationDto } from './dto';

@Processor('notifications')
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly slackService: SlackService,
  ) {}

  async sendNotification(dto: SendNotificationDto) {
    this.logger.log(`Sending notification via ${dto.channel}`);

    switch (dto.channel) {
      case 'email':
        await this.emailService.sendEmail(dto.to, dto.subject, dto.message);
        break;
      case 'slack':
        await this.slackService.sendMessage(dto.message, dto.to);
        break;
      default:
        this.logger.warn(`Unknown notification channel: ${dto.channel}`);
    }
  }

  @Process('send-notification')
  async processNotification(job: Job<SendNotificationDto>) {
    this.logger.log(`Processing notification job: ${job.id}`);
    try {
      await this.sendNotification(job.data);
    } catch (error) {
      this.logger.error(`Failed to process job: ${job.id}`, error.stack);
      throw error;
    }
  }
}
