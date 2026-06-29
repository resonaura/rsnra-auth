import { Column, Entity, Index } from 'typeorm';

import { AppBaseEntity } from '../database/app-base.entity.js';

@Entity({ name: 'oauth_codes' })
export class OAuthCode extends AppBaseEntity {
  // SHA-256 hash of the raw authorization code. The raw value is only
  // returned to the caller once and never persisted in cleartext.
  @Column({ name: 'code_hash' })
  codeHash!: string;

  @Column({ name: 'client_id' })
  clientId!: string;

  @Index()
  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ name: 'redirect_uri' })
  redirectUri!: string;

  @Column({ type: 'text', nullable: true })
  state!: string | null;

  @Column({ name: 'expires_at', type: 'datetime' })
  expiresAt!: Date;

  @Column({ type: 'boolean', default: false })
  used!: boolean;
}
