import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { OAuthModule } from '../oauth/oauth.module.js';
import { AdminController } from './admin.controller.js';

@Module({
  imports: [AuthModule, OAuthModule],
  controllers: [AdminController],
})
export class AdminModule {}
