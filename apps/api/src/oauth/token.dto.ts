import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

// Allow localhost and IP addresses as redirect targets — needed for
// local development across different ports.
const urlOptions = { require_tld: false, allow_underscores: true } as const;

export class TokenDto {
  @IsIn(['authorization_code'])
  grantType!: string;

  @IsString()
  @MaxLength(256)
  code!: string;

  @IsString()
  @MaxLength(128)
  clientId!: string;

  @IsString()
  @MaxLength(256)
  clientSecret!: string;

  @IsUrl(urlOptions)
  @MaxLength(2048)
  redirectUri!: string;
}

// Re-exported so the web client can reuse the same shape.
export interface TokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  user: {
    id: string;
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
    role: 'user' | 'admin';
  };
}

export class CreateClientDto {
  @IsString()
  @MaxLength(128)
  clientId!: string;

  @IsString()
  @MaxLength(120)
  name!: string;

  @IsArray()
  @IsUrl(urlOptions, { each: true })
  @MaxLength(2048, { each: true })
  redirectUris!: string[];

  @IsOptional()
  @IsString()
  @MaxLength(8)
  firstParty?: string;

  @IsOptional()
  @IsUrl(urlOptions)
  @MaxLength(2048)
  privacyUrl?: string;

  @IsOptional()
  @IsUrl(urlOptions)
  @MaxLength(2048)
  termsUrl?: string;
}

export class UpdateClientDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsArray()
  @IsUrl(urlOptions, { each: true })
  @MaxLength(2048, { each: true })
  redirectUris?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(8)
  firstParty?: string;

  @IsOptional()
  @IsUrl(urlOptions)
  @MaxLength(2048)
  privacyUrl?: string;

  @IsOptional()
  @IsUrl(urlOptions)
  @MaxLength(2048)
  termsUrl?: string;
}
