import { Document } from 'mongoose';
import { UserRole } from '../../common/enums';
export type UserDocument = User & Document;
export declare class User {
    phoneNumber: string;
    name: string;
    role: UserRole;
    profilePhoto: string | null;
    location: {
        latitude: number;
        longitude: number;
    } | null;
}
export declare const UserSchema: import("mongoose").Schema<User, import("mongoose").Model<User, any, any, any, Document<unknown, any, User, any, {}> & User & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, User, Document<unknown, {}, import("mongoose").FlatRecord<User>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<User> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
