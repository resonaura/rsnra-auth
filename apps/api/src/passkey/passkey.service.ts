import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import type {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/types';
import { Repository } from 'typeorm';

import { AuthService } from '../auth/auth.service.js';
import { config } from '../config.js';
import { Passkey } from './passkey.entity.js';

// In-memory challenge store (cleared on restart). For production, use Redis.
const registrationChallenges = new Map<string, string>();
const authenticationChallenges = new Map<string, string>();

function getRpOrigins(): string[] {
  // Both the API and web app origins are valid — in dev they're on
  // different ports, in prod they're on different subdomains.
  return [
    config.AUTH_API_PUBLIC_URL.replace(/\/$/, ''),
    config.AUTH_WEB_PUBLIC_URL.replace(/\/$/, ''),
  ];
}

function getRpId(): string {
  const origins = getRpOrigins();
  const url = new URL(origins[0]);
  const hostname = url.hostname;
  // In dev: localhost
  // In prod: use the registrable domain (rsnra.com) so passkeys work
  // across auth.rsnra.com and api.auth.rsnra.com
  if (hostname === 'localhost') return 'localhost';
  const parts = hostname.split('.');
  return parts.length > 2 ? parts.slice(-2).join('.') : hostname;
}

function getRpName(): string {
  return 'RSNRA Auth';
}

@Injectable()
export class PasskeyService {
  constructor(
    @InjectRepository(Passkey) private readonly passkeys: Repository<Passkey>,
    private readonly authService: AuthService
  ) {}

  // ── Registration ────────────────────────────────────────────────

  async startRegistration(userId: string, email: string) {
    const existingPasskeys = await this.passkeys.find({ where: { userId } });
    const existingCredentials = existingPasskeys.map(pk => ({
      id: pk.credentialId,
      transports: pk.transports ? JSON.parse(pk.transports) : [],
    }));

    const options = await generateRegistrationOptions({
      rpName: getRpName(),
      rpID: getRpId(),
      userName: email,
      attestationType: 'none',
      excludeCredentials: existingCredentials,
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    });

    registrationChallenges.set(userId, options.challenge);

    return options;
  }

  async finishRegistration(
    userId: string,
    response: RegistrationResponseJSON,
    deviceName?: string
  ): Promise<Passkey> {
    const expectedChallenge = registrationChallenges.get(userId);
    registrationChallenges.delete(userId);

    if (!expectedChallenge) {
      throw new BadRequestException('No pending registration challenge');
    }

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: getRpOrigins(),
      expectedRPID: getRpId(),
    });

    if (!verification.verified || !verification.registrationInfo) {
      throw new BadRequestException('Registration verification failed');
    }

    const { credential, credentialDeviceType } = verification.registrationInfo;
    const pk = this.passkeys.create({
      userId,
      credentialId: credential.id,
      publicKey: Buffer.from(credential.publicKey).toString('base64url'),
      counter: credential.counter || 0,
      deviceName: deviceName ?? credentialDeviceType,
      transports: JSON.stringify(credential.transports || []),
    });
    return this.passkeys.save(pk);
  }

  // ── Authentication ──────────────────────────────────────────────

  async startAuthentication() {
    const options = await generateAuthenticationOptions({
      rpID: getRpId(),
      userVerification: 'preferred',
    });

    // Store challenge keyed by a random session id
    const sessionId = crypto.randomUUID();
    authenticationChallenges.set(sessionId, options.challenge);

    return { sessionId, options };
  }

  async finishAuthentication(
    sessionId: string,
    response: AuthenticationResponseJSON
  ): Promise<{
    accessToken: string;
    user: {
      id: string;
      email: string;
      displayName: string | null;
      avatarUrl: string | null;
      role: string;
    };
  }> {
    const expectedChallenge = authenticationChallenges.get(sessionId);
    authenticationChallenges.delete(sessionId);

    if (!expectedChallenge) {
      throw new BadRequestException('No pending authentication challenge');
    }

    const passkey = await this.passkeys.findOne({
      where: { credentialId: response.id },
    });
    if (!passkey) {
      throw new UnauthorizedException('Unknown credential');
    }

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: getRpOrigins(),
      expectedRPID: getRpId(),
      credential: {
        id: passkey.credentialId,
        publicKey: Buffer.from(passkey.publicKey, 'base64url'),
        counter: passkey.counter,
        transports: passkey.transports ? JSON.parse(passkey.transports) : [],
      },
    });

    if (!verification.verified) {
      throw new UnauthorizedException('Authentication verification failed');
    }

    // Update counter
    passkey.counter = verification.authenticationInfo.newCounter;
    await this.passkeys.save(passkey);

    // Issue JWT + return user info so the client can set the user
    // without needing a separate /auth/me call (cookie may not be
    // available yet in dev with SameSite=None+Secure on localhost).
    const accessToken = await this.authService.signAccessToken(passkey.userId);
    const user = await this.authService.me(passkey.userId);
    return { accessToken, user };
  }

  // ── Management ──────────────────────────────────────────────────

  async listPasskeys(userId: string): Promise<Passkey[]> {
    return this.passkeys.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async deletePasskey(userId: string, id: string): Promise<void> {
    const pk = await this.passkeys.findOne({ where: { id, userId } });
    if (!pk) throw new NotFoundException('Passkey not found');
    await this.passkeys.delete({ id });
  }
}
