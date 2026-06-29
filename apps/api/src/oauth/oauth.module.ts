import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module.js';
import { UsersModule } from '../users/users.module.js';
import { OAuthClient } from './oauth-client.entity.js';
import { OAuthCode } from './oauth-code.entity.js';
import { OAuthController } from './oauth.controller.js';
import { OAuthService } from './oauth.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([OAuthClient, OAuthCode]),
    UsersModule,
    AuthModule,
  ],
  controllers: [OAuthController],
  providers: [OAuthService],
  exports: [OAuthService],
})
export class OAuthModule {}
