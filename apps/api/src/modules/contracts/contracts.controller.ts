import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ContractsService } from './contracts.service';
import {
  CreateContractDto,
  UpdateContractDto,
  QueryContractDto,
  ContractResponseDto,
  ContractListResponseDto,
  ContractStatsDto,
  UploadContractFileDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@ApiTags('Contracts')
@Controller({ path: 'contracts', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth()
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('contracts:create')
  @ApiOperation({ summary: 'Create a new contract' })
  @ApiResponse({
    status: 201,
    description: 'Contract created successfully',
    type: ContractResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(
    @Body() dto: CreateContractDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('organizationId') organizationId: string
  ): Promise<ContractResponseDto> {
    return this.contractsService.create(dto, userId, organizationId);
  }

  @Post(':id/upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @RequirePermissions('contracts:update')
  @ApiOperation({ summary: 'Upload contract file' })
  @ApiResponse({
    status: 200,
    description: 'File uploaded successfully',
    type: ContractResponseDto,
  })
  async uploadFile(
    @Param('id') contractId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 }), // 50MB
          new FileTypeValidator({
            fileType: /(pdf|docx|doc|txt|rtf|png|jpg|jpeg)$/,
          }),
        ],
      })
    )
    file: Express.Multer.File,
    @CurrentUser('id') userId: string,
    @CurrentUser('organizationId') organizationId: string
  ): Promise<ContractResponseDto> {
    return this.contractsService.uploadFile(contractId, file, userId, organizationId);
  }

  @Get()
  @RequirePermissions('contracts:read')
  @ApiOperation({ summary: 'Get all contracts with filters' })
  @ApiResponse({
    status: 200,
    description: 'Contracts retrieved successfully',
    type: ContractListResponseDto,
  })
  async findAll(
    @Query() query: QueryContractDto,
    @CurrentUser('organizationId') organizationId: string,
    @CurrentUser('id') userId: string
  ): Promise<ContractListResponseDto> {
    return this.contractsService.findAll(query, organizationId, userId);
  }

  @Get('stats')
  @RequirePermissions('contracts:read')
  @ApiOperation({ summary: 'Get contract statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    type: ContractStatsDto,
  })
  async getStats(@CurrentUser('organizationId') organizationId: string): Promise<ContractStatsDto> {
    return this.contractsService.getStats(organizationId);
  }

  @Get(':id')
  @RequirePermissions('contracts:read')
  @ApiOperation({ summary: 'Get contract by ID' })
  @ApiResponse({
    status: 200,
    description: 'Contract retrieved successfully',
    type: ContractResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('organizationId') organizationId: string
  ): Promise<ContractResponseDto> {
    return this.contractsService.findOne(id, organizationId);
  }

  @Get(':id/download')
  @RequirePermissions('contracts:read')
  @ApiOperation({ summary: 'Get download URL for contract file' })
  @ApiResponse({
    status: 200,
    description: 'Download URL generated',
    schema: { type: 'object', properties: { url: { type: 'string' } } },
  })
  async getDownloadUrl(
    @Param('id') id: string,
    @CurrentUser('organizationId') organizationId: string
  ) {
    const url = await this.contractsService.getDownloadUrl(id, organizationId);
    return { url };
  }

  @Get(':id/versions')
  @RequirePermissions('contracts:read')
  @ApiOperation({ summary: 'Get all versions of a contract' })
  @ApiResponse({ status: 200, description: 'Versions retrieved successfully' })
  async getVersions(
    @Param('id') id: string,
    @CurrentUser('organizationId') organizationId: string
  ) {
    return this.contractsService.getVersions(id, organizationId);
  }

  @Put(':id')
  @RequirePermissions('contracts:update')
  @ApiOperation({ summary: 'Update contract' })
  @ApiResponse({
    status: 200,
    description: 'Contract updated successfully',
    type: ContractResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateContractDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('organizationId') organizationId: string
  ): Promise<ContractResponseDto> {
    return this.contractsService.update(id, dto, userId, organizationId);
  }

  @Post(':id/archive')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('contracts:delete')
  @ApiOperation({ summary: 'Archive contract (soft delete)' })
  @ApiResponse({ status: 204, description: 'Contract archived successfully' })
  async archive(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('organizationId') organizationId: string
  ): Promise<void> {
    await this.contractsService.archive(id, userId, organizationId);
  }

  @Post(':id/restore')
  @RequirePermissions('contracts:update')
  @ApiOperation({ summary: 'Restore archived contract' })
  @ApiResponse({
    status: 200,
    description: 'Contract restored successfully',
    type: ContractResponseDto,
  })
  async restore(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('organizationId') organizationId: string
  ): Promise<ContractResponseDto> {
    return this.contractsService.restore(id, userId, organizationId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('contracts:delete')
  @ApiOperation({ summary: 'Permanently delete contract' })
  @ApiResponse({ status: 204, description: 'Contract deleted successfully' })
  async delete(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('organizationId') organizationId: string
  ): Promise<void> {
    await this.contractsService.delete(id, userId, organizationId);
  }
}
