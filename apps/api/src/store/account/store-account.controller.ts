import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { StoreAuthGuard } from '../../auth/guards/store-auth.guard';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { StoreAuthService } from '../auth/store-auth.service';
import { StoreAccountAddressesService } from './store-account-addresses.service';
import {
  ChangeStorePasswordDto,
  CreateCustomerDeliveryAddressDto,
  UpdateCustomerDeliveryAddressDto,
  UpdateStoreCustomerProfileDto,
} from './dto/store-account.dto';

@Controller('store/auth')
@UseGuards(StoreAuthGuard)
export class StoreAccountController {
  constructor(
    private readonly addresses: StoreAccountAddressesService,
    private readonly authService: StoreAuthService,
  ) {}

  @Get('addresses')
  listAddresses(@CurrentUser() user: AuthenticatedUser) {
    return this.addresses.list(user.userId);
  }

  @Post('addresses')
  createAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCustomerDeliveryAddressDto,
  ) {
    return this.addresses.create(user.userId, dto);
  }

  @Patch('addresses/:id')
  updateAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDeliveryAddressDto,
  ) {
    return this.addresses.update(user.userId, id, dto);
  }

  @Delete('addresses/:id')
  deleteAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.addresses.remove(user.userId, id);
  }

  @Patch('me')
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateStoreCustomerProfileDto,
  ) {
    return this.authService.updateProfile(user.userId, dto);
  }

  @Post('change-password')
  changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangeStorePasswordDto,
  ) {
    return this.authService.changePassword(user.userId, dto);
  }
}
