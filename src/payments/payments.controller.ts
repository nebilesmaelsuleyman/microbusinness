import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('invoices')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SERVICE_PROVIDER)
  createInvoice(@CurrentUser('sub') userId: string, @Body() dto: CreateInvoiceDto) {
    return this.paymentsService.createInvoice(userId, dto);
  }

  @Get('invoices')
  listInvoices(@CurrentUser('sub') userId: string, @CurrentUser('role') role: string) {
    return this.paymentsService.listInvoicesForUser(userId, role);
  }

  @Get('invoices/:id')
  getInvoice(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
    @Param('id') id: string,
  ) {
    return this.paymentsService.getInvoice(id, userId, role);
  }

  @Post('transactions')
  recordPayment(@CurrentUser('sub') userId: string, @Body() dto: RecordPaymentDto) {
    return this.paymentsService.recordPayment(userId, dto);
  }

  @Get('transactions')
  listTransactions(@CurrentUser('sub') userId: string) {
    return this.paymentsService.listTransactions(userId);
  }

  @Get('earnings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SERVICE_PROVIDER)
  earnings(@CurrentUser('sub') userId: string) {
    return this.paymentsService.getEarningsSummary(userId);
  }
}
