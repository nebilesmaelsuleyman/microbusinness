import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AuditService } from '../audit/audit.service';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { CreateCategoryDto } from '../categories/dto/create-category.dto';
import { UpdateCategoryDto } from '../categories/dto/update-category.dto';
import { CreatePlanDto } from '../subscriptions/dto/create-plan.dto';
import { UpdatePlanDto } from '../subscriptions/dto/update-plan.dto';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly audit: AuditService,
  ) {}

  /* ----------------------------------------------------------------- Users */

  @Get('users')
  getAllUsers(
    @Query('skip') skip?: string,
    @Query('limit') limit?: string,
    @Query('role') role?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllUsers(Number(skip) || 0, Number(limit) || 20, role, search);
  }

  @Patch('users/:id/role')
  setUserRole(@Param('id') id: string, @Body('role') role: string) {
    return this.adminService.setUserRole(id, role);
  }

  @Patch('users/:id/status')
  setUserActive(@Param('id') id: string, @Body('isActive') isActive: boolean) {
    return this.adminService.setUserActive(id, isActive);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  /* ------------------------------------------------------------- Providers */

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

  /* --------------------------------------------------------------- Reviews */

  @Get('reviews')
  getReviews(@Query('skip') skip?: string, @Query('limit') limit?: string) {
    return this.adminService.getReviews(Number(skip) || 0, Number(limit) || 30);
  }

  @Delete('reviews/:id')
  deleteReview(@Param('id') id: string) {
    return this.adminService.deleteReview(id);
  }

  /* ------------------------------------------------------------------ Jobs */

  @Get('jobs')
  getJobs(
    @Query('skip') skip?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getJobs(Number(skip) || 0, Number(limit) || 30, status);
  }

  /* ------------------------------------------------------------ Categories */

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

  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string) {
    return this.adminService.deleteCategory(id);
  }

  /* ----------------------------------------------------------------- Stats */

  @Get('stats/jobs')
  getJobStats() {
    return this.adminService.getJobStats();
  }

  @Get('stats/revenue')
  getRevenueMetrics() {
    return this.adminService.getRevenueMetrics();
  }

  /* ------------------------------------------------------------ Audit log */

  @Get('audit-logs')
  getAuditLogs(@Query('skip') skip?: string, @Query('limit') limit?: string) {
    return this.audit.list(Number(skip) || 0, Number(limit) || 30);
  }

  /* ----------------------------------------------------------------- Plans */

  @Post('plans')
  createPlan(@Body() dto: CreatePlanDto) {
    return this.adminService.createPlan(dto);
  }

  @Patch('plans/:id')
  updatePlan(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.adminService.updatePlan(id, dto);
  }

  @Delete('plans/:id')
  deletePlan(@Param('id') id: string) {
    return this.adminService.deletePlan(id);
  }
}
