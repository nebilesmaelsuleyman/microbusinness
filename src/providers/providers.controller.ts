import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
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
import { ProvidersService } from './providers.service';
import { CreateProviderProfileDto } from './dto/create-provider-profile.dto';
import { UpdateProviderProfileDto } from './dto/update-provider-profile.dto';
import { SearchProvidersDto } from './dto/search-providers.dto';
import { UploadVerificationDocumentDto } from './dto/upload-verification-document.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../common/enums';
import { Public } from '../common/decorators/public.decorator';

// Where uploaded verification files live on disk (served statically at /uploads).
const VERIFICATION_UPLOAD_DIR = join(process.cwd(), 'uploads', 'verification');

@Controller('providers')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Public()
  @Get('search')
  search(@Query() query: SearchProvidersDto) {
    return this.providersService.search(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SERVICE_PROVIDER)
  @Post('profile')
  createProfile(@CurrentUser('sub') userId: string, @Body() dto: CreateProviderProfileDto) {
    return this.providersService.create(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile/me')
  getMyProfile(@CurrentUser('sub') userId: string) {
    return this.providersService.findByUserId(userId);
  }

  @Public()
  @Get(':userId/profile')
  getProfile(
    @Param('userId') userId: string,
    @CurrentUser() payload: JwtPayload | undefined,
  ) {
    const reqUserId = payload?.sub ?? '';
    const reqRole = payload?.role ?? '';
    return this.providersService.getProfile(userId, reqUserId, reqRole);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SERVICE_PROVIDER)
  @Patch('profile')
  updateProfile(@CurrentUser('sub') userId: string, @Body() dto: UpdateProviderProfileDto) {
    return this.providersService.updateProfile(userId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SERVICE_PROVIDER)
  @Post('verification-documents')
  uploadVerificationDocument(
    @CurrentUser('sub') userId: string,
    @Body() dto: UploadVerificationDocumentDto,
  ) {
    return this.providersService.uploadVerificationDocument(userId, dto);
  }

  // Direct file upload (image/PDF) from the provider's device. Stores the file on disk,
  // builds its public URL, and records a PENDING verification doc for the admin queue.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SERVICE_PROVIDER)
  @Post('verification-documents/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          mkdirSync(VERIFICATION_UPLOAD_DIR, { recursive: true });
          cb(null, VERIFICATION_UPLOAD_DIR);
        },
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname).toLowerCase();
          cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const ok = /^(image\/(png|jpe?g|webp|gif)|application\/pdf)$/.test(file.mimetype);
        cb(ok ? null : new BadRequestException('Only image or PDF files are allowed'), ok);
      },
    }),
  )
  uploadVerificationFile(
    @CurrentUser('sub') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('documentType') documentType: string,
    @Req() req: Request,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const origin = `${req.protocol}://${req.get('host')}`;
    const documentUrl = `${origin}/uploads/verification/${file.filename}`;
    return this.providersService.uploadVerificationDocument(userId, {
      documentType: documentType || 'document',
      documentUrl,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SERVICE_PROVIDER)
  @Get('verification-documents/me')
  getMyVerificationDocuments(@CurrentUser('sub') userId: string) {
    return this.providersService.getMyVerificationDocuments(userId);
  }
}
