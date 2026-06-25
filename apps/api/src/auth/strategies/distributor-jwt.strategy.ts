import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { EnvService } from '../../config/env.service';
import { JwtPayload, AuthenticatedUser } from '../interfaces/jwt-payload.interface';

@Injectable()
export class DistributorJwtStrategy extends PassportStrategy(Strategy, 'distributor-jwt') {
  constructor(env: EnvService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: env.getOrThrow('JWT_DISTRIBUTOR_SECRET'),
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    if (payload.aud !== 'distributor') {
      throw new UnauthorizedException('Invalid token audience');
    }
    if (!payload.tenantId) {
      throw new UnauthorizedException('Missing tenant context');
    }
    if (!payload.roles.includes('DISTRIBUTOR')) {
      throw new UnauthorizedException('Invalid distributor role');
    }
    return {
      userId: payload.sub,
      aud: payload.aud,
      tenantId: payload.tenantId,
      roles: payload.roles,
    };
  }
}
