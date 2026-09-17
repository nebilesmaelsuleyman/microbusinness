import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Post,
  UseInterceptors,
  UploadedFile,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';
import type { Request } from 'express';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';


@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() payload: JwtPayload) {
    return this.usersService.findById(payload.sub);
  }

  @Patch('me')
  updateMe(@CurrentUser() payload: JwtPayload, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(payload.sub, updateUserDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  // Upload a profile photo from the device and set it on the user's profile.
  @Post('me/photo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const UPLOAD_DIR = join(process.cwd(), 'uploads', 'users');
          mkdirSync(UPLOAD_DIR, { recursive: true });
          cb(null, UPLOAD_DIR);
        },
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname).toLowerCase();
          cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
        },
      }),
      limits: { fileSize: 2 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const ok = /^(image\/(png|jpe?g|webp|gif))$/.test(file.mimetype);
        cb(ok ? null : new BadRequestException('Only image files are allowed'), ok);
      },
    }),
  )
  async uploadProfilePhoto(@CurrentUser('sub') userId: string, @UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    if (!file) throw new BadRequestException('No file uploaded');
    const origin = `${req.protocol}://${req.get('host')}`;
    const photoUrl = `${origin}/uploads/users/${file.filename}`;
    return this.usersService.update(userId, { profilePhoto: photoUrl });
  }
}
