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
  CreatePlatformCrmCompanyDto,
  UpdatePlatformCrmCompanyDto,
} from './dto/company.dto';
import { PlatformCrmCompaniesService } from './platform-crm-companies.service';

@Controller('platform/crm/companies')
@UseGuards(PlatformAuthGuard)
export class PlatformCrmCompaniesController {
  constructor(private readonly service: PlatformCrmCompaniesService) {}

  
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
  create(@Body() dto: CreatePlatformCrmCompanyDto) {
    return this.service.create(dto);
  }

  
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePlatformCrmCompanyDto) {
    return this.service.update(id, dto);
  }

  
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
