import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from '../common/enums';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(
    createUserDto: CreateUserDto & { email?: string | null; passwordHash?: string | null },
  ): Promise<UserDocument> {
    const created = new this.userModel(createUserDto);
    return created.save();
  }

  async findByPhone(phoneNumber: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ phoneNumber }).exec();
  }

  /**
   * Look up by email. Pass withPassword=true to include the normally-hidden
   * passwordHash (needed for credential verification on login).
   */
  async findByEmail(email: string, withPassword = false): Promise<UserDocument | null> {
    const q = this.userModel.findOne({ email: email.toLowerCase().trim() });
    if (withPassword) q.select('+passwordHash');
    return q.exec();
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(id, { $set: updateUserDto }, { new: true })
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async setTotpSecret(id: string, secret: string | null, enabled = false): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, { $set: { totpSecret: secret, totpEnabled: enabled } }).exec();
  }

  async setPasswordReset(id: string, hash: string | null, expires: Date | null): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, { $set: { passwordResetHash: hash, passwordResetExpires: expires } }).exec();
  }

  async setEmailVerification(id: string, hash: string | null): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, { $set: { emailVerificationHash: hash } }).exec();
  }

  async markEmailVerified(id: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, { $set: { emailVerified: true, emailVerificationHash: null } }).exec();
  }

  async setPassword(id: string, passwordHash: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, { $set: { passwordHash } }).exec();
  }

  /** Set or clear the stored hashed refresh-token identifier for a user. */
  async setRefreshTokenHash(id: string, hash: string | null): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, { $set: { refreshTokenHash: hash } }).exec();
  }

  /** Find a user and include the refreshTokenHash for token verification. */
  async findByIdWithRefreshHash(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).select('+refreshTokenHash').exec();
  }

  async findAll(skip = 0, limit = 20): Promise<UserDocument[]> {
    return this.userModel.find().skip(skip).limit(limit).lean().exec() as unknown as Promise<UserDocument[]>;
  }

  async findAllByRole(role: UserRole, skip = 0, limit = 20): Promise<UserDocument[]> {
    return this.userModel.find({ role }).skip(skip).limit(limit).lean().exec() as unknown as Promise<UserDocument[]>;
  }
}
