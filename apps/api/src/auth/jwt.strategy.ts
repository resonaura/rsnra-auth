import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { FastifyRequest } from 'fastify';

import { config } from '../config.js';
import type { AuthenticatedUser, JwtPayload } from './jwt-payload.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: FastifyRequest) => {
          const cookie = request.headers.cookie;
          const token = cookie
            ?.split(';')
            .map(part => part.trim())
            .find(part => part.startsWith('rsnra_session='))
            ?.slice('rsnra_session='.length);
          return token ? decodeURIComponent(token) : null;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.JWT_SECRET,
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      displayName: payload.displayName ?? null,
      avatarUrl: payload.avatarUrl ?? null,
    };
  }
}
