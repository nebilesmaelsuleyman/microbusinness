import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { FavoriteProviderDto } from './dto/favorite-provider.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@Controller('favorites')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CUSTOMER)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post()
  add(@CurrentUser('sub') customerId: string, @Body() dto: FavoriteProviderDto) {
    return this.favoritesService.add(customerId, dto.providerId);
  }

  @Delete(':providerId')
  remove(@CurrentUser('sub') customerId: string, @Param('providerId') providerId: string) {
    return this.favoritesService.remove(customerId, providerId);
  }

  @Get()
  list(@CurrentUser('sub') customerId: string) {
    return this.favoritesService.list(customerId);
  }
}
