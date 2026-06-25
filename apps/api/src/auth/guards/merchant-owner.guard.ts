import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../interfaces/jwt-payload.interface';

@Injectable()
export class MerchantOwnerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest().user as AuthenticatedUser;
    if (!user?.roles?.includes('MERCHANT_OWNER')) {
      throw new ForbiddenException('Merchant owner role required');
    }
    return true;
  }
}
