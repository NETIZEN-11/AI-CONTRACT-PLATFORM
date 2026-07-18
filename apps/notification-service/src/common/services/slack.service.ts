import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebClient } from '@slack/web-api';

@Injectable()
export class SlackService {
  private readonly logger = new Logger(SlackService.name);
  private client: WebClient;

  constructor(private configService: ConfigService) {
    const botToken = this.configService.get<string>('slack.botToken');
    if (botToken) {
      this.client = new WebClient(botToken);
    }
  }

  async sendMessage(text: string, channel?: string): Promise<void> {
    if (!this.client) {
      this.logger.warn('Slack client not configured, skipping message');
      return;
    }

    const targetChannel = channel || this.configService.get<string>('slack.channelId');
    if (!targetChannel) {
      this.logger.warn('No Slack channel configured');
      return;
    }

    try {
      await this.client.chat.postMessage({
        channel: targetChannel,
        text,
      });
      this.logger.log(`Slack message sent to ${targetChannel}`);
    } catch (error) {
      this.logger.error('Failed to send Slack message', error.stack);
      throw error;
    }
  }
}
