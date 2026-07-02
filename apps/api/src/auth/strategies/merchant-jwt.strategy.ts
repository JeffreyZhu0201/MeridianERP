import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { EnvService } from '../../config/env.service';
import { JwtPayload, AuthenticatedUser } from '../interfaces/jwt-payload.interface';

@Injectable()
export class MerchantJwtStrategy extends PassportStrategy(Strategy, 'merchant-jwt') {
  constructor(env: EnvService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: env.getOrThrow('JWT_MERCHANT_SECRET'),
    });
  }

  
  validate(payload: JwtPayload): AuthenticatedUser {
    if (payload.aud !== 'merchant') {
      throw new UnauthorizedException('Invalid token audience');
    }
    if (!payload.tenantId) {
      throw new UnauthorizedException('Missing tenant context');
    }

    return {
      userId: payload.sub,
      aud: payload.aud,
      tenantId: payload.tenantId,
      roles: payload.roles,
    };
  }
}
