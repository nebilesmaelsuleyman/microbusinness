import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SERVICE_PROVIDER)
  @Get('verification-documents/me')
  getMyVerificationDocuments(@CurrentUser('sub') userId: string) {
    return this.providersService.getMyVerificationDocuments(userId);
  }
}
