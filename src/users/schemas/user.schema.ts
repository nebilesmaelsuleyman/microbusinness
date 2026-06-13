import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRole } from '../../common/enums';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  phoneNumber: string;

  @Prop({ default: '' })
  name: string;

  @Prop({ required: true, enum: Object.values(UserRole) })
  role: UserRole;

  @Prop({ type: String, default: null })
  profilePhoto: string | null;

  @Prop({
    type: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    default: null,
  })
  location: { latitude: number; longitude: number } | null;

}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ phoneNumber: 1 }, { unique: true });
UserSchema.index({ role: 1 });
