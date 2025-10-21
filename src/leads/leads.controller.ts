import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { ContactProviderDto } from './dto/contact-provider.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@Controller('leads')
@UseGuards(JwtAuthGuard)
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post('contact')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CUSTOMER)
  async contactProvider(
    @CurrentUser('sub') customerId: string,
    @Body() dto: ContactProviderDto,
  ) {
    return this.leadsService.recordLead(customerId, dto.providerId);
  }

  @Get('my-leads')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SERVICE_PROVIDER)
  async myLeads(@CurrentUser('sub') userId: string) {
    return this.leadsService.getLeadsForProviderByUserId(userId);
  }
}
