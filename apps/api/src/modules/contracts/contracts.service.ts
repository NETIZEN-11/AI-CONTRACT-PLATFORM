import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@contract-ai/database';
import { ContractStatus, Prisma } from '@prisma/client';
import { StorageService } from '../../common/services/storage.service';
import {
  CreateContractDto,
  UpdateContractDto,
  QueryContractDto,
  ContractResponseDto,
  ContractListResponseDto,
  ContractStatsDto,
} from './dto';

@Injectable()
export class ContractsService {
  private readonly logger = new Logger(ContractsService.name);

  constructor(
    private prisma: PrismaService,
    private storageService: StorageService
  ) {}

  /**
   * Create a new contract
   */
  async create(
    dto: CreateContractDto,
    userId: string,
    organizationId: string
  ): Promise<ContractResponseDto> {
    // Verify team belongs to organization if teamId is provided
    if (dto.teamId) {
      const team = await this.prisma.team.findFirst({
        where: {
          id: dto.teamId,
          organizationId,
        },
      });

      if (!team) {
        throw new BadRequestException('Team not found or does not belong to your organization');
      }
    }

    const contract = await this.prisma.contract.create({
      data: {
        title: dto.title,
        description: dto.description,
        contractType: dto.contractType,
        status: dto.status || ContractStatus.DRAFT,
        organizationId,
        teamId: dto.teamId,
        createdBy: userId,
        parties: dto.parties || [],
        effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : null,
        expirationDate: dto.expirationDate ? new Date(dto.expirationDate) : null,
        jurisdiction: dto.jurisdiction,
        governingLaw: dto.governingLaw,
        value: dto.value,
        currency: dto.currency || 'USD',
        paymentTerms: dto.paymentTerms,
      },
    });

    this.logger.log(`Contract created: ${contract.id} by user: ${userId}`);

    return this.mapToResponseDto(contract);
  }

  /**
   * Upload file to existing contract
   */
  async uploadFile(
    contractId: string,
    file: Express.Multer.File,
    userId: string,
    organizationId: string
  ): Promise<ContractResponseDto> {
    // Verify contract belongs to organization
    const contract = await this.findOneOrFail(contractId, organizationId);

    // Upload to S3
    const uploadResult = await this.storageService.uploadFile(file, organizationId, 'contracts');

    // Delete old file if exists
    if (contract.fileKey) {
      try {
        await this.storageService.deleteFile(contract.fileKey);
      } catch (error) {
        this.logger.warn(`Failed to delete old file: ${contract.fileKey}`);
      }
    }

    // Update contract with file info
    const updatedContract = await this.prisma.contract.update({
      where: { id: contractId },
      data: {
        fileUrl: uploadResult.url,
        fileKey: uploadResult.key,
        fileSize: uploadResult.size,
        fileName: file.originalname,
      },
    });

    // Create version
    await this.createVersion(
      contractId,
      updatedContract.title,
      uploadResult.key,
      uploadResult.url,
      userId
    );

    this.logger.log(`File uploaded for contract: ${contractId}`);

    return this.mapToResponseDto(updatedContract);
  }

  /**
   * Find all contracts with filters and pagination
   */
  async findAll(
    query: QueryContractDto,
    organizationId: string,
    userId: string
  ): Promise<ContractListResponseDto> {
    const where: Prisma.ContractWhereInput = {
      organizationId,
      archivedAt: null,
    };

    // Apply filters
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { extractedText: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.contractType) {
      where.contractType = query.contractType;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.teamId) {
      where.teamId = query.teamId;
    }

    if (query.effectiveDateFrom || query.effectiveDateTo) {
      where.effectiveDate = {};
      if (query.effectiveDateFrom) {
        where.effectiveDate.gte = new Date(query.effectiveDateFrom);
      }
      if (query.effectiveDateTo) {
        where.effectiveDate.lte = new Date(query.effectiveDateTo);
      }
    }

    if (query.expirationDateFrom || query.expirationDateTo) {
      where.expirationDate = {};
      if (query.expirationDateFrom) {
        where.expirationDate.gte = new Date(query.expirationDateFrom);
      }
      if (query.expirationDateTo) {
        where.expirationDate.lte = new Date(query.expirationDateTo);
      }
    }

    // Get total count
    const total = await this.prisma.contract.count({ where });

    // Default pagination values
    const skip = query.skip ?? 0;
    const take = query.take ?? 10;
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';

    // Get contracts
    const contracts = await this.prisma.contract.findMany({
      where,
      skip,
      take,
      orderBy: {
        [sortBy as string]: sortOrder,
      } as any,
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const data = contracts.map((contract) => this.mapToResponseDto(contract));

    return {
      data,
      total,
      skip,
      take,
      hasMore: skip + take < total,
    };
  }

  /**
   * Find one contract by ID
   */
  async findOne(contractId: string, organizationId: string): Promise<ContractResponseDto> {
    const contract = await this.findOneOrFail(contractId, organizationId);
    return this.mapToResponseDto(contract);
  }

  /**
   * Update contract
   */
  async update(
    contractId: string,
    dto: UpdateContractDto,
    userId: string,
    organizationId: string
  ): Promise<ContractResponseDto> {
    await this.findOneOrFail(contractId, organizationId);

    // Verify team if provided
    if (dto.teamId) {
      const team = await this.prisma.team.findFirst({
        where: {
          id: dto.teamId,
          organizationId,
        },
      });

      if (!team) {
        throw new BadRequestException('Team not found');
      }
    }

    const contract = await this.prisma.contract.update({
      where: { id: contractId },
      data: {
        title: dto.title,
        description: dto.description,
        contractType: dto.contractType,
        status: dto.status,
        teamId: dto.teamId,
        parties: dto.parties,
        effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : undefined,
        expirationDate: dto.expirationDate ? new Date(dto.expirationDate) : undefined,
        jurisdiction: dto.jurisdiction,
        governingLaw: dto.governingLaw,
        value: dto.value,
        currency: dto.currency,
        paymentTerms: dto.paymentTerms,
      },
    });

    this.logger.log(`Contract updated: ${contractId} by user: ${userId}`);

    return this.mapToResponseDto(contract);
  }

  /**
   * Archive contract (soft delete)
   */
  async archive(contractId: string, userId: string, organizationId: string): Promise<void> {
    await this.findOneOrFail(contractId, organizationId);

    await this.prisma.contract.update({
      where: { id: contractId },
      data: {
        archivedAt: new Date(),
        status: ContractStatus.ARCHIVED,
      },
    });

    this.logger.log(`Contract archived: ${contractId} by user: ${userId}`);
  }

  /**
   * Restore archived contract
   */
  async restore(
    contractId: string,
    userId: string,
    organizationId: string
  ): Promise<ContractResponseDto> {
    const contract = await this.prisma.contract.findFirst({
      where: {
        id: contractId,
        organizationId,
      },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    const restored = await this.prisma.contract.update({
      where: { id: contractId },
      data: {
        archivedAt: null,
        status: ContractStatus.DRAFT,
      },
    });

    this.logger.log(`Contract restored: ${contractId} by user: ${userId}`);

    return this.mapToResponseDto(restored);
  }

  /**
   * Permanently delete contract
   */
  async delete(contractId: string, userId: string, organizationId: string): Promise<void> {
    const contract = await this.findOneOrFail(contractId, organizationId);

    // Delete file from S3
    if (contract.fileKey) {
      try {
        await this.storageService.deleteFile(contract.fileKey);
      } catch (error) {
        this.logger.warn(`Failed to delete file: ${contract.fileKey}`);
      }
    }

    // Delete all versions files
    const versions = await this.prisma.contractVersion.findMany({
      where: { contractId },
    });

    for (const version of versions) {
      if (version.fileKey) {
        try {
          await this.storageService.deleteFile(version.fileKey);
        } catch (error) {
          this.logger.warn(`Failed to delete version file: ${version.fileKey}`);
        }
      }
    }

    // Delete contract (cascade will delete related records)
    await this.prisma.contract.delete({
      where: { id: contractId },
    });

    this.logger.log(`Contract permanently deleted: ${contractId} by user: ${userId}`);
  }

  /**
   * Get contract statistics
   */
  async getStats(organizationId: string): Promise<ContractStatsDto> {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [
      totalContracts,
      draftContracts,
      underReview,
      approved,
      expired,
      expiringInNext30Days,
      totalValueResult,
    ] = await Promise.all([
      this.prisma.contract.count({
        where: { organizationId, archivedAt: null },
      }),
      this.prisma.contract.count({
        where: { organizationId, status: ContractStatus.DRAFT, archivedAt: null },
      }),
      this.prisma.contract.count({
        where: {
          organizationId,
          status: {
            in: [
              ContractStatus.UNDER_REVIEW,
              ContractStatus.AI_REVIEW,
              ContractStatus.LEGAL_REVIEW,
            ],
          },
          archivedAt: null,
        },
      }),
      this.prisma.contract.count({
        where: { organizationId, status: ContractStatus.APPROVED, archivedAt: null },
      }),
      this.prisma.contract.count({
        where: { organizationId, status: ContractStatus.EXPIRED, archivedAt: null },
      }),
      this.prisma.contract.count({
        where: {
          organizationId,
          expirationDate: {
            gte: now,
            lte: thirtyDaysFromNow,
          },
          archivedAt: null,
        },
      }),
      this.prisma.contract.aggregate({
        where: { organizationId, archivedAt: null },
        _sum: { value: true },
      }),
    ]);

    return {
      totalContracts,
      draftContracts,
      underReview,
      approved,
      expired,
      expiringInNext30Days,
      totalValue: totalValueResult._sum.value || 0,
    };
  }

  /**
   * Download contract file
   */
  async getDownloadUrl(contractId: string, organizationId: string): Promise<string> {
    const contract = await this.findOneOrFail(contractId, organizationId);

    if (!contract.fileKey) {
      throw new BadRequestException('Contract has no file attached');
    }

    return this.storageService.getSignedUrl(contract.fileKey, 3600);
  }

  /**
   * Get contract versions
   */
  async getVersions(contractId: string, organizationId: string) {
    await this.findOneOrFail(contractId, organizationId);

    return this.prisma.contractVersion.findMany({
      where: { contractId },
      orderBy: { version: 'desc' },
    });
  }

  /**
   * Create a new version
   */
  private async createVersion(
    contractId: string,
    title: string,
    fileKey: string,
    fileUrl: string,
    userId: string
  ) {
    // Get latest version number
    const latestVersion = await this.prisma.contractVersion.findFirst({
      where: { contractId },
      orderBy: { version: 'desc' },
    });

    const nextVersion = latestVersion ? latestVersion.version + 1 : 1;

    return this.prisma.contractVersion.create({
      data: {
        contractId,
        version: nextVersion,
        title,
        fileKey,
        fileUrl,
        createdBy: userId,
      },
    });
  }

  /**
   * Helper: Find contract or throw error
   */
  private async findOneOrFail(contractId: string, organizationId: string) {
    const contract = await this.prisma.contract.findFirst({
      where: {
        id: contractId,
        organizationId,
      },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    return contract;
  }

  /**
   * Map contract to response DTO
   */
  private mapToResponseDto(contract: any): ContractResponseDto {
    return {
      id: contract.id,
      title: contract.title,
      description: contract.description,
      contractType: contract.contractType,
      status: contract.status,
      fileUrl: contract.fileUrl,
      fileName: contract.fileName,
      fileSize: contract.fileSize,
      parties: contract.parties,
      effectiveDate: contract.effectiveDate,
      expirationDate: contract.expirationDate,
      jurisdiction: contract.jurisdiction,
      governingLaw: contract.governingLaw,
      value: contract.value,
      currency: contract.currency,
      paymentTerms: contract.paymentTerms,
      organizationId: contract.organizationId,
      teamId: contract.teamId,
      createdBy: contract.createdBy,
      createdAt: contract.createdAt,
      updatedAt: contract.updatedAt,
      archivedAt: contract.archivedAt,
    };
  }
}
