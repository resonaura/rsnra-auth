import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module.js';
import { PasskeyController } from './passkey.controller.js';
import { Passkey } from './passkey.entity.js';
import { PasskeyService } from './passkey.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Passkey]), AuthModule],
  controllers: [PasskeyController],
  providers: [PasskeyService],
})
export class PasskeyModule {}
