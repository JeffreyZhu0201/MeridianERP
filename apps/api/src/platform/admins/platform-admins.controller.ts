import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PlatformAuthGuard } from '../../auth/guards/platform-auth.guard';
import { PlatformRolesGuard } from '../../auth/guards/platform-roles.guard';
import { PlatformRoles } from '../../auth/decorators/platform-roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { CreatePlatformAdminDto } from './dto/create-platform-admin.dto';
import { UpdatePlatformAdminDto } from './dto/update-platform-admin.dto';
import { PlatformAdminsService } from './platform-admins.service';

@Controller('platform/admins')
@UseGuards(PlatformAuthGuard, PlatformRolesGuard)
@PlatformRoles('SUPER_ADMIN')
export class PlatformAdminsController {
  constructor(private readonly service: PlatformAdminsService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Post()
  @HttpCode(201)
  create(@Body() dto: CreatePlatformAdminDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePlatformAdminDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.update(id, dto, user.userId);
  }

  @Delete(':id')
  @HttpCode(200)
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.remove(id, user.userId);
  }
}
