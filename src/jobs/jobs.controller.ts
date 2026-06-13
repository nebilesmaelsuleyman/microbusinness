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
import { CompleteJobDto, QuoteJobDto } from './dto/complete-job.dto';
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

  @Patch(':id/quote')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SERVICE_PROVIDER)
  setQuote(
    @Param('id') id: string,
    @Body() dto: QuoteJobDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.jobsService.setQuote(id, userId, dto);
  }

  @Patch(':id/complete')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SERVICE_PROVIDER)
  complete(
    @Param('id') id: string,
    @Body() dto: CompleteJobDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.jobsService.complete(id, userId, dto);
  }
}
