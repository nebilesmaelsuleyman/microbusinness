import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { Public } from '../common/decorators/public.decorator';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('provider/:providerId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  create(
    @CurrentUser('sub') customerId: string,
    @Param('providerId') providerId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(customerId, providerId, dto);
  }

  @Public()
  @Get('provider/:providerId')
  getByProvider(@Param('providerId') providerId: string) {
    return this.reviewsService.findByProvider(providerId);
  }
}
