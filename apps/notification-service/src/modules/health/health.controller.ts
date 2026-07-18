import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  healthCheck() {
    return {
      status: 'healthy',
      service: 'notification-service',
      version: '0.1.0',
    };
  }

  @Get('ready')
  readinessCheck() {
    return {
      status: 'ready',
    };
  }
}
