import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { CreateCategoryDto } from '../categories/dto/create-category.dto';
import { UpdateCategoryDto } from '../categories/dto/update-category.dto';
import { CreatePlanDto } from '../subscriptions/dto/create-plan.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  getAllUsers(@Query('skip') skip?: string, @Query('limit') limit?: string) {
    return this.adminService.getAllUsers(Number(skip) || 0, Number(limit) || 20);
  }

  @Get('providers')
  getAllProviders(@Query('skip') skip?: string, @Query('limit') limit?: string) {
    return this.adminService.getAllProviders(Number(skip) || 0, Number(limit) || 20);
  }

  @Patch('providers/:providerId/verify')
  setProviderVerification(
    @Param('providerId') providerId: string,
    @Body('status') status: 'approved' | 'rejected',
  ) {
    return this.adminService.setProviderVerification(providerId, status);
  }

  @Get('verification-documents')
  getPendingVerificationDocuments() {
    return this.adminService.getPendingVerificationDocuments();
  }

  @Patch('verification-documents/:docId')
  setDocumentStatus(
    @Param('docId') docId: string,
    @Body('status') status: 'approved' | 'rejected',
  ) {
    return this.adminService.setDocumentStatus(docId, status);
  }

  @Get('categories')
  getCategories() {
    return this.adminService.getCategories();
  }

  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.adminService.createCategory(dto);
  }

  @Patch('categories/:id')
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.adminService.updateCategory(id, dto);
  }

  @Get('stats/jobs')
  getJobStats() {
    return this.adminService.getJobStats();
  }

  @Get('stats/revenue')
  getRevenueMetrics() {
    return this.adminService.getRevenueMetrics();
  }

  @Post('plans')
  createPlan(@Body() dto: CreatePlanDto) {
    return this.adminService.createPlan(dto);
  }
}
