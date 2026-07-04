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
import { MerchantAuthGuard } from '../../../auth/guards/merchant-auth.guard';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../auth/interfaces/jwt-payload.interface';
import { CreateCompanyDto, UpdateCompanyDto } from '../dto/company.dto';
import { CompaniesService } from './companies.service';

@Controller('merchant/companies')
@UseGuards(MerchantAuthGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.companiesService.findAll(user.tenantId!);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.companiesService.findOne(user.tenantId!, id);
  }

  @Post()
  @HttpCode(201)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCompanyDto,
  ) {
    return this.companiesService.create(user.tenantId!, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.companiesService.update(user.tenantId!, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.companiesService.remove(user.tenantId!, id);
  }
}
