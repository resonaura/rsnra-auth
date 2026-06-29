import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

import { AdminGuard } from '../auth/admin.guard.js';
import { AuthService } from '../auth/auth.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { OAuthService } from '../oauth/oauth.service.js';
import { CreateClientDto, UpdateClientDto } from '../oauth/token.dto.js';

class UpdateUserDto {
  @IsString()
  @IsOptional()
  @MaxLength(120)
  displayName?: string;

  @IsIn(['user', 'admin'])
  @IsOptional()
  role?: 'user' | 'admin';
}

@Controller({ path: 'admin' })
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private readonly authService: AuthService,
    private readonly oauthService: OAuthService
  ) {}

  @Get('users')
  listUsers() {
    return this.authService.listUsers();
  }

  @Put('users/:id')
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.authService.updateUser(id, dto);
  }

  @Delete('users/:id')
  @HttpCode(204)
  async deleteUser(@Param('id') id: string) {
    await this.authService.deleteAccount(id);
  }

  // ── OAuth client management ─────────────────────────────────────

  @Get('oauth-clients')
  listOAuthClients() {
    return this.oauthService.listClients();
  }

  @Post('oauth-clients')
  createOAuthClient(@Body() dto: CreateClientDto) {
    return this.oauthService.createClient(dto);
  }

  @Put('oauth-clients/:id')
  updateOAuthClient(@Param('id') id: string, @Body() dto: UpdateClientDto) {
    return this.oauthService.updateClient(id, dto);
  }

  @Post('oauth-clients/:id/regenerate-secret')
  @HttpCode(200)
  regenerateSecret(@Param('id') id: string) {
    return this.oauthService.regenerateSecret(id);
  }

  @Delete('oauth-clients/:id')
  @HttpCode(204)
  async deleteOAuthClient(@Param('id') id: string) {
    await this.oauthService.deleteClient(id);
  }
}
