<img src="icon.svg" width="64" height="64" alt="RSNRA Auth Icon" />

# RSNRA Auth

[![Version](https://img.shields.io/badge/Version-0.0.1-blue.svg)](package.json)
[![API](https://img.shields.io/badge/API-NestJS%20%7C%20Fastify-E0234E.svg?logo=nestjs&logoColor=white)](apps/api)
[![Web](https://img.shields.io/badge/Web-React%20%7C%20Vite%20%7C%20Tailwind%20v4-61DAFB.svg?logo=react&logoColor=black)](apps/web)
[![Auth](https://img.shields.io/badge/Auth-OAuth%202.0%20%7C%20JWT-orange.svg)](apps/api)
[![Website](https://img.shields.io/badge/Website-auth.rsnra.com-8A2BE2.svg)](https://auth.rsnra.com)

Central identity provider for RSNRA services. Manages user accounts, authentication, profile data, and OAuth-based single sign-on (SSO) for rsnra.link and md.rsnra.com.

---

## Services

| Service | Port | Stack                                 |
| ------- | ---- | ------------------------------------- |
| API     | 2998 | NestJS, Fastify, TypeORM, SQLite, JWT |
| Web     | 2999 | React, Vite, shadcn/ui, Tailwind v4   |

## Features

- Email/password registration & login
- JWT sessions (365-day expiry) via `rsnra_session` cookie
- OAuth 2.0 authorization code flow for cross-domain SSO
- Profile management with avatar upload
- Admin panel for user & OAuth client management
- Service-aware login form (shows branding from redirecting service)

## Quick start

```bash
pnpm setup    # Generate .env files with secure defaults
pnpm dev      # Start both API and Web
```

## Related services

- [rsnra.link](https://rsnra.link) — music streaming (uses OAuth SSO)
- [md.rsnra.com](https://md.rsnra.com) — markdown editor (uses shared cookie)
