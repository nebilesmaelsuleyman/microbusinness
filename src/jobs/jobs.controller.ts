import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobRequestDto } from './dto/create-job-request.dto';
import { UpdateJobStatusDto } from './dto/update-job-status.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@Controller('jobs')
@UseGuards(JwtAuthGuard)
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.CUSTOMER)
  create(@CurrentUser('sub') customerId: string, @Body() dto: CreateJobRequestDto) {
    return this.jobsService.create(customerId, dto);
  }

  @Get('me/list')
  myJobs(@CurrentUser() payload: JwtPayload) {
    if (payload.role === UserRole.CUSTOMER) {
      return this.jobsService.findByCustomer(payload.sub);
    }
    return this.jobsService.findByProviderUserId(payload.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() payload: JwtPayload) {
    return this.jobsService.findById(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateJobStatusDto,
    @CurrentUser() payload: JwtPayload,
  ) {
    return this.jobsService.updateStatus(id, dto.status, payload.sub, payload.role);
  }

  @Patch(':id/payment')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CUSTOMER)
  updatePaymentStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentStatusDto,
    @CurrentUser('sub') customerId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.jobsService.updatePaymentStatus(id, dto.paymentStatus, customerId, role);
  }
}
