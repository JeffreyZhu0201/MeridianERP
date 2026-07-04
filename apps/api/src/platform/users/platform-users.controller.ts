import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PlatformAuthGuard } from '../../auth/guards/platform-auth.guard';
import { PlatformRolesGuard } from '../../auth/guards/platform-roles.guard';
import { PlatformRoles } from '../../auth/decorators/platform-roles.decorator';
import { ListPlatformUsersQueryDto } from './dto/list-platform-users-query.dto';
import { UpdatePlatformAccountDto } from './dto/update-platform-account.dto';
import { UpdatePlatformAccountIdentitiesDto } from './dto/update-platform-account-identities.dto';
import { PlatformUsersService } from './platform-users.service';

@Controller('platform/users')
@UseGuards(PlatformAuthGuard, PlatformRolesGuard)
@PlatformRoles('SUPER_ADMIN')
export class PlatformUsersController {
  constructor(private readonly platformUsersService: PlatformUsersService) {}

  @Get()
  list(@Query() query: ListPlatformUsersQueryDto) {
    return this.platformUsersService.list(query);
  }

  @Patch(':id/identities')
  updateIdentities(
    @Param('id') id: string,
    @Body() dto: UpdatePlatformAccountIdentitiesDto,
  ) {
    return this.platformUsersService.updateIdentities(id, dto);
  }

  @Patch(':id')
  updateProfile(
    @Param('id') id: string,
    @Body() dto: UpdatePlatformAccountDto,
  ) {
    return this.platformUsersService.updateProfile(id, dto);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.platformUsersService.getById(id);
  }
}
