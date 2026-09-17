import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRole } from '../../common/enums';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  phoneNumber: string;

  // Optional email login identifier. Sparse unique so phone-only accounts (email=null) don't collide.
  @Prop({ type: String, default: null, lowercase: true, trim: true })
  email: string | null;

  // bcrypt hash for email+password login. `select: false` keeps it out of normal queries/responses.
  @Prop({ type: String, default: null, select: false })
  passwordHash: string | null;

  @Prop({ default: '' })
  name: string;

  @Prop({ required: true, enum: Object.values(UserRole) })
  role: UserRole;

  @Prop({ type: String, default: null })
  profilePhoto: string | null;

  @Prop({
    type: {
      city: { type: String, default: null },
      formattedAddress: { type: String, default: null },
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
    default: null,
  })
  location: {
    city?: string | null;
    formattedAddress?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  } | null;

  // Admins can suspend accounts; suspended users cannot authenticate.
  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: String, default: null, select: false })
  totpSecret: string | null;

  @Prop({ default: false })
  totpEnabled: boolean;

  // Hashed identifier for the currently valid refresh token (rotated on refresh).
  @Prop({ type: String, default: null, select: false })
  refreshTokenHash: string | null;

  // Password reset token (hashed) and expiry
  @Prop({ type: String, default: null, select: false })
  passwordResetHash: string | null;

  @Prop({ type: Date, default: null })
  passwordResetExpires: Date | null;

  // Email verification
  @Prop({ default: false })
  emailVerified: boolean;

  @Prop({ type: String, default: null, select: false })
  emailVerificationHash: string | null;

}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ phoneNumber: 1 }, { unique: true });
// Sparse: only documents with a non-null email participate, so phone-only users are unaffected.
UserSchema.index({ email: 1 }, { unique: true, sparse: true });
UserSchema.index({ role: 1 });
