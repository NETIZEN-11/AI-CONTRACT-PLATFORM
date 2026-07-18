import { Module } from '@nestjs/common';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';
import { StorageService } from '../../common/services/storage.service';
import { PrismaModule } from '@contract-ai/database';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ContractsController],
  providers: [ContractsService, StorageService],
  exports: [ContractsService],
})
export class ContractsModule {}
