import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  async check() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    };
  }

  async ready() {
    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
    };
  }
}
