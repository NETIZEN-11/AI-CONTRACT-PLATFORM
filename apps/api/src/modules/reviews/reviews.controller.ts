import { Controller, Get, Post, Put, Delete, Body, Param, Query, Logger } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, UpdateReviewDto, ListReviewsDto } from './dto';

@ApiTags('reviews')
@ApiBearerAuth()
@Controller('reviews')
export class ReviewsController {
  private readonly logger = new Logger(ReviewsController.name);

  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  async createReview(@Body() createReviewDto: CreateReviewDto) {
    this.logger.debug(`Creating review for contract: ${createReviewDto.contractId}`);
    return this.reviewsService.createReview(createReviewDto);
  }

  @Get()
  async listReviews(@Query() query: ListReviewsDto) {
    this.logger.debug(`Listing reviews with query: ${JSON.stringify(query)}`);
    return this.reviewsService.listReviews(query);
  }

  @Get(':id')
  async getReview(@Param('id') id: string) {
    this.logger.debug(`Getting review: ${id}`);
    return this.reviewsService.getReviewById(id);
  }

  @Put(':id')
  async updateReview(@Param('id') id: string, @Body() updateReviewDto: UpdateReviewDto) {
    this.logger.debug(`Updating review: ${id}`);
    return this.reviewsService.updateReview(id, updateReviewDto);
  }

  @Delete(':id')
  async deleteReview(@Param('id') id: string) {
    this.logger.debug(`Deleting review: ${id}`);
    return this.reviewsService.deleteReview(id);
  }

  @Post(':id/approve')
  async approveReview(@Param('id') id: string) {
    this.logger.debug(`Approving review: ${id}`);
    return this.reviewsService.approveReview(id);
  }

  @Post(':id/reject')
  async rejectReview(@Param('id') id: string, @Body() body: { reason: string }) {
    this.logger.debug(`Rejecting review: ${id}`);
    return this.reviewsService.rejectReview(id, body.reason);
  }
}
