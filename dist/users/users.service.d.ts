import { Model } from 'mongoose';
import { UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from '../common/enums';
export declare class UsersService {
    private userModel;
    constructor(userModel: Model<UserDocument>);
    create(createUserDto: CreateUserDto): Promise<UserDocument>;
    findByPhone(phoneNumber: string): Promise<UserDocument | null>;
    findById(id: string): Promise<UserDocument>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<UserDocument>;
    findAll(skip?: number, limit?: number): Promise<UserDocument[]>;
    findAllByRole(role: UserRole, skip?: number, limit?: number): Promise<UserDocument[]>;
}
