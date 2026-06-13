import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtPayload } from '../common/decorators/current-user.decorator';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getMe(payload: JwtPayload): Promise<import("./schemas/user.schema").UserDocument>;
    updateMe(payload: JwtPayload, updateUserDto: UpdateUserDto): Promise<import("./schemas/user.schema").UserDocument>;
    findOne(id: string): Promise<import("./schemas/user.schema").UserDocument>;
}
