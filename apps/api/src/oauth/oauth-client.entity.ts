import { Column, Entity, Index } from 'typeorm';

import { AppBaseEntity } from '../database/app-base.entity.js';

@Entity({ name: 'oauth_clients' })
export class OAuthClient extends AppBaseEntity {
  @Index({ unique: true })
  @Column({ name: 'client_id' })
  clientId!: string;

  @Column({ name: 'secret_hash' })
  secretHash!: string;

  @Column()
  name!: string;

  // JSON-encoded array of allowed redirect URIs.
  @Column({ name: 'redirect_uris', type: 'text' })
  redirectUris!: string;

  @Column({ name: 'is_first_party', type: 'boolean', default: true })
  isFirstParty!: boolean;

  @Column({ name: 'privacy_url', type: 'text', nullable: true })
  privacyUrl!: string | null;

  @Column({ name: 'terms_url', type: 'text', nullable: true })
  termsUrl!: string | null;
}
