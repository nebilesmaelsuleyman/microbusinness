import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Transaction, TransactionDocument } from './schemas/transaction.schema';
import { Invoice, InvoiceDocument } from './schemas/invoice.schema';
import { JobRequest, JobRequestDocument } from '../jobs/schemas/job-request.schema';
import { ProviderProfile, ProviderProfileDocument } from '../providers/schemas/provider-profile.schema';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { PaymentStatus, PaymentType, NotificationType, UserRole } from '../common/enums';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Transaction.name) private txModel: Model<TransactionDocument>,
    @InjectModel(Invoice.name) private invoiceModel: Model<InvoiceDocument>,
    @InjectModel(JobRequest.name) private jobModel: Model<JobRequestDocument>,
    @InjectModel(ProviderProfile.name) private providerModel: Model<ProviderProfileDocument>,
    private notificationsService: NotificationsService,
  ) {}

  private async generateInvoiceNumber(): Promise<string> {
    const count = await this.invoiceModel.countDocuments().exec();
    const year = new Date().getFullYear();
    return `INV-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  async createInvoice(providerUserId: string, dto: CreateInvoiceDto): Promise<InvoiceDocument> {
    const profile = await this.providerModel.findOne({ userId: new Types.ObjectId(providerUserId) }).exec();
    if (!profile) throw new ForbiddenException('Provider profile not found');

    const job = await this.jobModel.findById(dto.jobId).exec();
    if (!job) throw new NotFoundException('Job not found');
    if (job.providerId.toString() !== profile._id.toString()) {
      throw new ForbiddenException('Not your job');
    }

    const lineItems = dto.lineItems.map((li) => ({
      description: li.description,
      quantity: li.quantity,
      unitPrice: li.unitPrice,
      total: li.quantity * li.unitPrice,
    }));
    const subtotal = lineItems.reduce((s, li) => s + li.total, 0);
    const tax = dto.tax ?? 0;
    const total = subtotal + tax;

    const invoice = new this.invoiceModel({
      invoiceNumber: await this.generateInvoiceNumber(),
      jobId: job._id,
      providerId: profile._id,
      customerId: job.customerId,
      lineItems,
      subtotal,
      tax,
      total,
      currency: dto.currency ?? 'USD',
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      notes: dto.notes ?? '',
    });
    await invoice.save();

    await this.notificationsService.create(
      job.customerId.toString(),
      NotificationType.PAYMENT,
      'New invoice',
      `Invoice ${invoice.invoiceNumber} for ${invoice.currency} ${total.toFixed(2)}`,
      { invoiceId: invoice._id.toString(), jobId: job._id.toString() },
    );

    return invoice;
  }

  async getInvoice(id: string, userId: string, role: string): Promise<InvoiceDocument> {
    const inv = await this.invoiceModel.findById(id)
      .populate('jobId')
      .populate('providerId')
      .populate('customerId', 'name phoneNumber')
      .exec();
    if (!inv) throw new NotFoundException('Invoice not found');
    if (role === UserRole.ADMIN) return inv;
    if (inv.customerId._id?.toString() === userId) return inv;
    const profile = await this.providerModel.findOne({ userId: new Types.ObjectId(userId) }).exec();
    if (profile && inv.providerId._id?.toString() === profile._id.toString()) return inv;
    throw new ForbiddenException('Not your invoice');
  }

  async listInvoicesForUser(userId: string, role: string): Promise<InvoiceDocument[]> {
    if (role === UserRole.SERVICE_PROVIDER) {
      const profile = await this.providerModel.findOne({ userId: new Types.ObjectId(userId) }).exec();
      if (!profile) return [];
      return this.invoiceModel.find({ providerId: profile._id })
        .populate('customerId', 'name phoneNumber')
        .sort({ createdAt: -1 })
        .lean()
        .exec() as unknown as Promise<InvoiceDocument[]>;
    }
    return this.invoiceModel.find({ customerId: new Types.ObjectId(userId) })
      .populate('providerId')
      .sort({ createdAt: -1 })
      .lean()
      .exec() as unknown as Promise<InvoiceDocument[]>;
  }

  async recordPayment(payerId: string, dto: RecordPaymentDto): Promise<TransactionDocument> {
    const tx = new this.txModel({
      payerId: new Types.ObjectId(payerId),
      payeeId: dto.payeeId ? new Types.ObjectId(dto.payeeId) : null,
      jobId: dto.jobId ? new Types.ObjectId(dto.jobId) : null,
      type: dto.type,
      amount: dto.amount,
      currency: dto.currency ?? 'USD',
      status: PaymentStatus.PAID,
      description: dto.description ?? '',
      externalRef: dto.externalRef ?? '',
      paidAt: new Date(),
    });
    await tx.save();

    if (dto.invoiceId) {
      await this.invoiceModel.findByIdAndUpdate(dto.invoiceId, {
        status: PaymentStatus.PAID,
        paidAt: new Date(),
      }).exec();
    }

    if (dto.payeeId) {
      await this.notificationsService.create(
        dto.payeeId,
        NotificationType.PAYMENT,
        'Payment received',
        `${tx.currency} ${tx.amount.toFixed(2)} — ${tx.description || 'payment'}`,
        { transactionId: tx._id.toString() },
      );
    }

    return tx;
  }

  async listTransactions(userId: string): Promise<TransactionDocument[]> {
    const uid = new Types.ObjectId(userId);
    return this.txModel
      .find({ $or: [{ payerId: uid }, { payeeId: uid }] })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()
      .exec() as unknown as Promise<TransactionDocument[]>;
  }

  async getEarningsSummary(providerUserId: string): Promise<{
    totalEarned: number;
    pendingAmount: number;
    invoiceCount: number;
    paidInvoices: number;
  }> {
    const profile = await this.providerModel.findOne({ userId: new Types.ObjectId(providerUserId) }).exec();
    if (!profile) return { totalEarned: 0, pendingAmount: 0, invoiceCount: 0, paidInvoices: 0 };
    const agg = await this.invoiceModel.aggregate([
      { $match: { providerId: profile._id } },
      { $group: { _id: '$status', total: { $sum: '$total' }, count: { $sum: 1 } } },
    ]);
    let totalEarned = 0;
    let pendingAmount = 0;
    let invoiceCount = 0;
    let paidInvoices = 0;
    for (const row of agg) {
      invoiceCount += row.count;
      if (row._id === PaymentStatus.PAID) {
        totalEarned += row.total;
        paidInvoices += row.count;
      } else if (row._id === PaymentStatus.PENDING) {
        pendingAmount += row.total;
      }
    }
    return { totalEarned, pendingAmount, invoiceCount, paidInvoices };
  }

  async getRevenueStats(): Promise<{
    totalRevenue: number;
    transactionCount: number;
    byType: Record<string, number>;
  }> {
    const agg = await this.txModel.aggregate([
      { $match: { status: PaymentStatus.PAID } },
      { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);
    let totalRevenue = 0;
    let transactionCount = 0;
    const byType: Record<string, number> = {};
    for (const row of agg) {
      totalRevenue += row.total;
      transactionCount += row.count;
      byType[row._id] = row.total;
    }
    return { totalRevenue, transactionCount, byType };
  }
}
