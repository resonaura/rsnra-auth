import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

// Allow localhost and IP addresses as redirect targets — needed for
// local development across different ports.
const urlOptions = { require_tld: false, allow_underscores: true } as const;

export class AuthorizeDto {
  @IsString()
  @MaxLength(128)
  clientId!: string;

  @IsUrl(urlOptions)
  @MaxLength(2048)
  redirectUri!: string;

  @IsString()
  @IsOptional()
  @MaxLength(1024)
  state?: string;
}
