export class SendNotificationDto {
  channel: 'email' | 'slack' | 'push' | 'webhook';
  to: string;
  subject: string;
  message: string;
  data?: Record<string, any>;
}
