import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';

export interface AuditRecord {
  actorId?: string;
  actorPhone?: string;
  method: string;
  path: string;
  action?: string;
  meta?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  constructor(@InjectModel(AuditLog.name) private auditModel: Model<AuditLogDocument>) {}

  async record(r: AuditRecord): Promise<void> {
    await this.auditModel.create({
      actorId: r.actorId ? new Types.ObjectId(r.actorId) : null,
      actorPhone: r.actorPhone ?? '',
      method: r.method,
      path: r.path,
      action: r.action ?? '',
      meta: r.meta ?? {},
    });
  }

  async list(skip: number, limit: number) {
    const [items, total] = await Promise.all([
      this.auditModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec(),
      this.auditModel.countDocuments().exec(),
    ]);
    return { items, total };
  }
}
