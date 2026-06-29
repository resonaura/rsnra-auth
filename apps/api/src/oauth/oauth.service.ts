import { createHash, randomBytes } from 'node:crypto';

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnApplicationBootstrap,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { config } from '../config.js';
import { AuthService } from '../auth/auth.service.js';
import { User } from '../users/user.entity.js';
import { AuthorizeDto } from './authorize.dto.js';
import {
  CreateClientDto,
  TokenDto,
  type TokenResponse,
  UpdateClientDto,
} from './token.dto.js';
import { OAuthClient } from './oauth-client.entity.js';
import { OAuthCode } from './oauth-code.entity.js';

const BCRYPT_COST = 12;
const CODE_TTL_SECONDS = 600; // 10 minutes

const DEFAULT_CLIENTS = [
  {
    clientId: 'rsnra-link',
    name: 'rsnra.link',
    secret: config.OAUTH_CLIENT_RSNRA_LINK_SECRET,
    redirectUris: [
      'http://localhost:3000/auth/callback',
      'https://rsnra.link/auth/callback',
      'http://localhost:3002/auth/callback',
      'https://admin.rsnra.link/auth/callback',
    ],
    privacyUrl: 'https://rsnra.link/privacy',
    termsUrl: 'https://rsnra.link/terms',
  },
  {
    clientId: 'resomd',
    name: 'md.rsnra.com',
    secret: config.OAUTH_CLIENT_RESOMD_SECRET,
    redirectUris: [
      'http://localhost:3003/auth/callback',
      'https://md.rsnra.com/auth/callback',
    ],
    privacyUrl: 'https://md.rsnra.com/privacy',
    termsUrl: 'https://md.rsnra.com/terms',
  },
];

function hashCode(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

function generateCode(): string {
  return randomBytes(32).toString('hex');
}

function generateSecret(): string {
  return randomBytes(32).toString('hex');
}

function parseRedirectUris(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export interface PublicClient {
  id: string;
  clientId: string;
  name: string;
  redirectUris: string[];
  isFirstParty: boolean;
  privacyUrl: string | null;
  termsUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class OAuthService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(OAuthClient)
    private readonly clients: Repository<OAuthClient>,
    @InjectRepository(OAuthCode)
    private readonly codes: Repository<OAuthCode>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly authService: AuthService
  ) {}

  // ── Seeding ───────────────────────────────────────────────────────

  async onApplicationBootstrap() {
    for (const def of DEFAULT_CLIENTS) {
      if (!def.secret) continue;
      const secretHash = await bcrypt.hash(def.secret, BCRYPT_COST);
      // Upsert: if the client already exists, update its secret hash
      // so changing OAUTH_CLIENT_*_SECRET in .env + restart takes effect.
      const existing = await this.getClientByClientId(def.clientId);
      if (existing) {
        existing.secretHash = secretHash;
        existing.name = def.name;
        existing.redirectUris = JSON.stringify(def.redirectUris);
        existing.isFirstParty = true;
        existing.privacyUrl = def.privacyUrl ?? null;
        existing.termsUrl = def.termsUrl ?? null;
        await this.clients.save(existing);
      } else {
        await this.clients.save(
          this.clients.create({
            clientId: def.clientId,
            name: def.name,
            secretHash,
            redirectUris: JSON.stringify(def.redirectUris),
            isFirstParty: true,
            privacyUrl: def.privacyUrl ?? null,
            termsUrl: def.termsUrl ?? null,
          })
        );
      }
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────

  private toPublicClient(client: OAuthClient): PublicClient {
    return {
      id: client.id,
      clientId: client.clientId,
      name: client.name,
      redirectUris: parseRedirectUris(client.redirectUris),
      isFirstParty: client.isFirstParty,
      privacyUrl: client.privacyUrl,
      termsUrl: client.termsUrl,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    };
  }

  private toPublicUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      role: user.role,
    };
  }

  async getClientByClientId(clientId: string): Promise<OAuthClient | null> {
    return this.clients.findOne({ where: { clientId } });
  }

  // ── Authorization code flow ───────────────────────────────────────

  async authorize(
    dto: AuthorizeDto,
    userId: string
  ): Promise<{ code: string; redirectUri: string; state?: string }> {
    const client = await this.getClientByClientId(dto.clientId);
    if (!client) {
      throw new BadRequestException('Unknown client_id');
    }

    const allowedUris = parseRedirectUris(client.redirectUris);
    if (!allowedUris.includes(dto.redirectUri)) {
      throw new BadRequestException('redirect_uri is not registered');
    }

    const rawCode = generateCode();
    await this.codes.save(
      this.codes.create({
        codeHash: hashCode(rawCode),
        clientId: client.clientId,
        userId,
        redirectUri: dto.redirectUri,
        state: dto.state ?? null,
        expiresAt: new Date(Date.now() + CODE_TTL_SECONDS * 1000),
        used: false,
      })
    );

    return {
      code: rawCode,
      redirectUri: dto.redirectUri,
      state: dto.state,
    };
  }

  async token(dto: TokenDto): Promise<TokenResponse> {
    const client = await this.getClientByClientId(dto.clientId);
    if (!client) {
      throw new UnauthorizedException('Invalid client credentials');
    }

    const secretMatches = await bcrypt.compare(
      dto.clientSecret,
      client.secretHash
    );
    if (!secretMatches) {
      throw new UnauthorizedException('Invalid client credentials');
    }

    const code = await this.codes.findOne({
      where: { codeHash: hashCode(dto.code) },
    });
    if (!code) {
      throw new BadRequestException('Invalid authorization code');
    }
    if (code.used) {
      // Reuse of a code may indicate an attack — invalidate silently.
      throw new BadRequestException('Authorization code already used');
    }
    if (code.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Authorization code expired');
    }
    if (code.clientId !== client.clientId) {
      throw new BadRequestException('Code was not issued to this client');
    }
    if (code.redirectUri !== dto.redirectUri) {
      throw new BadRequestException('redirect_uri mismatch');
    }

    code.used = true;
    await this.codes.save(code);

    const accessToken = await this.authService.signAccessToken(code.userId);
    const user = await this.users.findOne({ where: { id: code.userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 7776000, // 90d, matches JWT_EXPIRY
      user: this.toPublicUser(user),
    };
  }

  // ── User info ────────────────────────────────────────────────────

  async getUserInfo(userId: string) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.toPublicUser(user);
  }

  // ── Public client info ───────────────────────────────────────────

  async getPublicClientInfo(clientId: string): Promise<{
    clientId: string;
    name: string;
    privacyUrl: string | null;
    termsUrl: string | null;
  }> {
    const client = await this.getClientByClientId(clientId);
    if (!client) {
      throw new NotFoundException('Client not found');
    }
    return {
      clientId: client.clientId,
      name: client.name,
      privacyUrl: client.privacyUrl,
      termsUrl: client.termsUrl,
    };
  }

  // ── Admin: client management ──────────────────────────────────────

  async listClients(): Promise<PublicClient[]> {
    const clients = await this.clients.find({ order: { createdAt: 'ASC' } });
    return clients.map(c => this.toPublicClient(c));
  }

  async createClient(
    dto: CreateClientDto,
    autogeneratedSecret?: string
  ): Promise<PublicClient & { clientSecret: string }> {
    const existing = await this.getClientByClientId(dto.clientId);
    if (existing) {
      throw new ConflictException('client_id already exists');
    }

    const rawSecret = autogeneratedSecret ?? generateSecret();
    const secretHash = await bcrypt.hash(rawSecret, BCRYPT_COST);
    const client = this.clients.create({
      clientId: dto.clientId,
      name: dto.name,
      secretHash,
      redirectUris: JSON.stringify(dto.redirectUris),
      isFirstParty: dto.firstParty === 'true',
      privacyUrl: dto.privacyUrl ?? null,
      termsUrl: dto.termsUrl ?? null,
    });
    await this.clients.save(client);

    return { ...this.toPublicClient(client), clientSecret: rawSecret };
  }

  async updateClient(id: string, dto: UpdateClientDto): Promise<PublicClient> {
    const client = await this.clients.findOne({ where: { id } });
    if (!client) {
      throw new NotFoundException('OAuth client not found');
    }
    if (dto.name !== undefined) client.name = dto.name;
    if (dto.redirectUris !== undefined) {
      client.redirectUris = JSON.stringify(dto.redirectUris);
    }
    if (dto.firstParty !== undefined) {
      client.isFirstParty = dto.firstParty === 'true';
    }
    if (dto.privacyUrl !== undefined)
      client.privacyUrl = dto.privacyUrl || null;
    if (dto.termsUrl !== undefined) client.termsUrl = dto.termsUrl || null;
    await this.clients.save(client);
    return this.toPublicClient(client);
  }

  async regenerateSecret(
    id: string
  ): Promise<PublicClient & { clientSecret: string }> {
    const client = await this.clients.findOne({ where: { id } });
    if (!client) {
      throw new NotFoundException('OAuth client not found');
    }
    const rawSecret = generateSecret();
    client.secretHash = await bcrypt.hash(rawSecret, BCRYPT_COST);
    await this.clients.save(client);
    return { ...this.toPublicClient(client), clientSecret: rawSecret };
  }

  async deleteClient(id: string): Promise<void> {
    await this.clients.delete({ id });
  }
}
