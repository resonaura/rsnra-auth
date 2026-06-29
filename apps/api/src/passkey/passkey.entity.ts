import { Column, CreateDateColumn, Entity, Index } from 'typeorm';

import { AppBaseEntity } from '../database/app-base.entity.js';

@Entity({ name: 'passkeys' })
export class Passkey extends AppBaseEntity {
  @Index()
  @Column({ name: 'user_id' })
  userId!: string;

  // Base64url-encoded credential ID
  @Index({ unique: true })
  @Column({ name: 'credential_id' })
  credentialId!: string;

  // Base64url-encoded public key (COSE format)
  @Column({ name: 'public_key', type: 'text' })
  publicKey!: string;

  @Column({ type: 'integer', default: 0 })
  counter!: number;

  // Device name (e.g. "MacBook Pro", "iPhone") — optional, for display
  @Column({ name: 'device_name', type: 'text', nullable: true })
  deviceName!: string | null;

  @Column({ name: 'transports', type: 'text', nullable: true })
  transports!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  declare createdAt: Date;
}
