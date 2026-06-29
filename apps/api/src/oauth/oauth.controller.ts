import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../auth/jwt-payload.js';
import { AuthorizeDto } from './authorize.dto.js';
import { OAuthService } from './oauth.service.js';
import { TokenDto, type TokenResponse } from './token.dto.js';

@Controller({ path: 'oauth' })
export class OAuthController {
  constructor(private readonly oauthService: OAuthService) {}

  /**
   * Return public information about an OAuth client (name, legal page
   * URLs). Used by the auth web app to show service-aware branding.
   * No authentication required.
   */
  @Get('clients/:clientId')
  getPublicClientInfo(@Param('clientId') clientId: string) {
    return this.oauthService.getPublicClientInfo(clientId);
  }

  /**
   * Create a short-lived authorization code. The authenticated user's
   * browser is then redirected to the client's `redirect_uri` with the
   * code appended as a query parameter.
   */
  @Post('authorize')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  authorize(@Body() dto: AuthorizeDto, @CurrentUser() user: AuthenticatedUser) {
    return this.oauthService.authorize(dto, user.id);
  }

  /**
   * Exchange an authorization code for an access token. This is a
   * server-to-server call: the client service authenticates with its
   * `client_id` + `client_secret`.
   */
  @Post('token')
  @HttpCode(200)
  token(@Body() dto: TokenDto): Promise<TokenResponse> {
    return this.oauthService.token(dto);
  }

  /**
   * Return the authenticated user's profile. Accepts the same JWT as
   * `/auth/me` — either via the `rsnra_session` cookie or an
   * `Authorization: Bearer <token>` header.
   */
  @Get('userinfo')
  @UseGuards(JwtAuthGuard)
  userinfo(@CurrentUser() user: AuthenticatedUser) {
    return this.oauthService.getUserInfo(user.id);
  }
}
