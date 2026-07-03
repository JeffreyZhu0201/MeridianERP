import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { PlatformAuthGuard } from '../../auth/guards/platform-auth.guard';
import { ListPlatformUsersQueryDto } from './dto/list-platform-users-query.dto';
import { PlatformUsersService } from './platform-users.service';

@Controller('platform/users')
@UseGuards(PlatformAuthGuard)
export class PlatformUsersController {
  constructor(private readonly platformUsersService: PlatformUsersService) {}

  @Get()
  list(@Query() query: ListPlatformUsersQueryDto) {
    return this.platformUsersService.list(query);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.platformUsersService.getById(id);
  }
}
