import { Controller, Get, Query, Logger } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto';

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  async getDashboardMetrics(@Query() query: AnalyticsQueryDto) {
    this.logger.debug(`Getting dashboard metrics with query: ${JSON.stringify(query)}`);
    return this.analyticsService.getDashboardMetrics(query);
  }

  @Get('contracts')
  async getContractAnalytics(@Query() query: AnalyticsQueryDto) {
    this.logger.debug(`Getting contract analytics with query: ${JSON.stringify(query)}`);
    return this.analyticsService.getContractAnalytics(query);
  }

  @Get('risks')
  async getRiskAnalytics(@Query() query: AnalyticsQueryDto) {
    this.logger.debug(`Getting risk analytics with query: ${JSON.stringify(query)}`);
    return this.analyticsService.getRiskAnalytics(query);
  }

  @Get('compliance')
  async getComplianceAnalytics(@Query() query: AnalyticsQueryDto) {
    this.logger.debug(`Getting compliance analytics with query: ${JSON.stringify(query)}`);
    return this.analyticsService.getComplianceAnalytics(query);
  }

  @Get('team')
  async getTeamAnalytics(@Query() query: AnalyticsQueryDto) {
    this.logger.debug(`Getting team analytics with query: ${JSON.stringify(query)}`);
    return this.analyticsService.getTeamAnalytics(query);
  }
}
