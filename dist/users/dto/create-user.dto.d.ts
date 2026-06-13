import { UserRole } from '../../common/enums';
export declare class CreateUserDto {
    phoneNumber: string;
    name?: string;
    role: UserRole;
}
