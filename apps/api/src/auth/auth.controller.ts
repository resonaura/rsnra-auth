import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { extname, join } from 'node:path';
import { existsSync, mkdirSync, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { randomBytes } from 'node:crypto';

import { config } from '../config.js';
import { AuthService } from './auth.service.js';
import { CurrentUser } from './current-user.decorator.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import type { AuthenticatedUser } from './jwt-payload.js';
import { LoginDto } from './login.dto.js';
import { RegisterDto } from './register.dto.js';
import { UpdateProfileDto } from './update-profile.dto.js';

const ALLOWED_IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

function getUploadsDir(): string {
  const dir = config.UPLOADS_DIR ?? './uploads';
  const absolute = dir.startsWith('/') ? dir : join(process.cwd(), dir);
  if (!existsSync(absolute)) {
    mkdirSync(absolute, { recursive: true });
  }
  return absolute;
}

@Controller({ path: 'auth' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) reply: FastifyReply
  ) {
    const result = await this.authService.register(dto);
    this.authService.attachSessionCookie(reply, result.accessToken);
    return result;
  }

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) reply: FastifyReply
  ) {
    const result = await this.authService.login(dto);
    this.authService.attachSessionCookie(reply, result.accessToken);
    return result;
  }

  @Post('logout')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) reply: FastifyReply) {
    this.authService.clearSessionCookie(reply);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.me(user.id);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto
  ) {
    return this.authService.updateProfile(user.id, dto);
  }

  @Post('me/avatar')
  @UseGuards(JwtAuthGuard)
  async uploadAvatar(
    @Req() req: FastifyRequest,
    @CurrentUser() user: AuthenticatedUser
  ) {
    const data = await req.file({
      limits: { fileSize: 10 * 1024 * 1024 },
    });
    if (!data) throw new BadRequestException('No file uploaded');

    const ext = extname(data.filename).toLowerCase();
    if (!ALLOWED_IMAGE_EXTS.includes(ext)) {
      throw new BadRequestException(`Unsupported image format: ${ext}`);
    }

    // Generate a unique filename: avatar-{userId}-{random}.{ext}
    const random = randomBytes(8).toString('hex');
    const filename = `avatar-${user.id}-${random}${ext}`;
    const targetPath = join(getUploadsDir(), filename);

    await pipeline(data.file, createWriteStream(targetPath));

    // Store as relative path — toPublic() converts it to an absolute URL
    // using AUTH_API_PUBLIC_URL when returning user data.
    const avatarUrl = `/uploads/${filename}`;
    const updated = await this.authService.updateProfile(user.id, {
      avatarUrl,
    });
    return updated;
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async deleteMe(@CurrentUser() user: AuthenticatedUser) {
    await this.authService.deleteAccount(user.id);
  }
}
