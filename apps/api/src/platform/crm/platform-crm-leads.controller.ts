import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { LeadStage } from '@prisma/client';
import { PlatformAuthGuard } from '../../auth/guards/platform-auth.guard';
import {
  CreatePlatformCrmLeadDto,
  UpdatePlatformCrmLeadDto,
} from './dto/lead.dto';
import { PlatformCrmLeadsService } from './platform-crm-leads.service';

@Controller('platform/crm/leads')
@UseGuards(PlatformAuthGuard)
export class PlatformCrmLeadsController {
  constructor(private readonly service: PlatformCrmLeadsService) {}

  
  @Get()
  findAll(@Query('stage') stage?: LeadStage) {
    return this.service.findAll(stage);
  }

  
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  
  @Post()
  @HttpCode(201)
  create(@Body() dto: CreatePlatformCrmLeadDto) {
    return this.service.create(dto);
  }

  
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePlatformCrmLeadDto) {
    return this.service.update(id, dto);
  }

  
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
