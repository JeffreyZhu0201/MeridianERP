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
import {
  CreatePlatformCrmContactDto,
  UpdatePlatformCrmContactDto,
} from './dto/contact.dto';
import { PlatformCrmContactsService } from './platform-crm-contacts.service';

@Controller('platform/crm/contacts')
@UseGuards(PlatformAuthGuard)
export class PlatformCrmContactsController {
  constructor(private readonly service: PlatformCrmContactsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @HttpCode(201)
  create(@Body() dto: CreatePlatformCrmContactDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePlatformCrmContactDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
