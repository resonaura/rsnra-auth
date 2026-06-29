import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/types';
import type { FastifyReply } from 'fastify';

import { AuthService } from '../auth/auth.service.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../auth/jwt-payload.js';
import { PasskeyService } from './passkey.service.js';

@Controller({ path: 'passkey' })
export class PasskeyController {
  constructor(
    private readonly passkeyService: PasskeyService,
    private readonly authService: AuthService
  ) {}

  // ── Registration (requires auth) ────────────────────────────────

  @Post('register/start')
  @UseGuards(JwtAuthGuard)
  async startRegistration(@CurrentUser() user: AuthenticatedUser) {
    return this.passkeyService.startRegistration(user.id, user.email);
  }

  @Post('register/finish')
  @UseGuards(JwtAuthGuard)
  async finishRegistration(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { response: RegistrationResponseJSON; deviceName?: string }
  ) {
    return this.passkeyService.finishRegistration(
      user.id,
      body.response,
      body.deviceName
    );
  }

  // ── Authentication (no auth required) ───────────────────────────

  @Post('login/start')
  @HttpCode(200)
  async startAuthentication() {
    return this.passkeyService.startAuthentication();
  }

  @Post('login/finish')
  @HttpCode(200)
  async finishAuthentication(
    @Body() body: { sessionId: string; response: AuthenticationResponseJSON },
    @Res({ passthrough: true }) reply: FastifyReply
  ) {
    const result = await this.passkeyService.finishAuthentication(
      body.sessionId,
      body.response
    );
    // Set the session cookie so the user is logged in across all services.
    this.authService.attachSessionCookie(reply, result.accessToken);
    return result;
  }

  // ── Management (requires auth) ──────────────────────────────────

  @Get()
  @UseGuards(JwtAuthGuard)
  async listPasskeys(@CurrentUser() user: AuthenticatedUser) {
    return this.passkeyService.listPasskeys(user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async deletePasskey(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string
  ) {
    await this.passkeyService.deletePasskey(user.id, id);
  }
}
