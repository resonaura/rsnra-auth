#!/usr/bin/env node
/**
 * rsnra-auth — interactive environment setup script.
 *
 * Generates .env files for all sub-services with secure defaults:
 *  - JWT secrets: cryptographically random
 *  - Admin passwords: bcrypt-hashed (leaked .env is useless without the project)
 *  - OAuth client secrets: random, shared with rsnra-link & resomd
 *
 * Run: `pnpm setup`
 */

import { join, dirname } from 'node:path';
import { existsSync } from 'node:fs';
import {
  parseEnvFile,
  writeEnvFile,
  promptString,
  promptSecretOrGenerate,
  promptPasswordOrGenerate,
  promptConfirm,
  printHeader,
  printDone,
  generateSecret,
} from './setup-utils.mjs';

const ROOT = import.meta.dirname;
const PARENT = join(ROOT, '..', '..');

/**
 * Detect sibling projects (rsnra-link, resomd) in the parent directory
 * and offer to inject OAuth secrets + JWT_SECRET + auth URLs into their .env files.
 */
async function propagateToSiblingProjects(
  jwtSecret,
  linkSecret,
  authApiUrl,
  authWebUrl
) {
  const siblings = [
    {
      name: 'rsnra-link',
      path: join(PARENT, 'rsnra-link'),
      envPath: join(PARENT, 'rsnra-link', 'apps', 'api', '.env'),
      publicEnvPath: join(PARENT, 'rsnra-link', 'apps', 'public', '.env.local'),
      updates: {
        JWT_SECRET: jwtSecret,
        AUTH_API_URL: authApiUrl,
        OAUTH_CLIENT_SECRET: linkSecret,
      },
      publicUpdates: {
        NEXT_PUBLIC_AUTH_WEB_URL: authWebUrl,
      },
    },
    {
      name: 'resomd',
      path: join(PARENT, 'resomd'),
      envPath: join(PARENT, 'resomd', 'apps', 'api', '.env'),
      webEnvPath: join(PARENT, 'resomd', 'apps', 'web', '.env'),
      updates: {
        JWT_SECRET: jwtSecret,
        AUTH_API_URL: authApiUrl,
      },
      webUpdates: {
        VITE_AUTH_API_URL: authApiUrl,
        VITE_AUTH_WEB_URL: authWebUrl,
      },
    },
  ];

  const found = siblings.filter(s => existsSync(s.path));

  if (found.length === 0) {
    return;
  }

  console.log(`\n  ── Sibling projects detected ──`);
  console.log(`  Found: ${found.map(s => s.name).join(', ')}\n`);

  const shouldPropagate = await promptConfirm(
    'Auto-inject JWT secret, OAuth secrets, and auth URLs into sibling projects?',
    true
  );

  if (!shouldPropagate) return;

  for (const sibling of found) {
    printHeader(`Propagating to ${sibling.name}`);

    // Update API .env
    if (existsSync(sibling.envPath)) {
      const { values } = await parseEnvFile(sibling.envPath);
      const entries = [];
      for (const [key, value] of values) {
        if (sibling.updates[key]) {
          entries.push({
            key,
            value: sibling.updates[key],
            comment: `Updated by rsnra-auth setup`,
          });
        } else {
          entries.push({ key, value });
        }
      }
      // Add missing keys
      for (const [key, value] of Object.entries(sibling.updates)) {
        if (!values.has(key)) {
          entries.push({ key, value, comment: `Added by rsnra-auth setup` });
        }
      }
      await writeEnvFile(sibling.envPath, entries);
      console.log(`  ✓ ${sibling.name} API .env updated`);
    } else {
      console.log(`  ⊘ ${sibling.name} API .env not found — skipping`);
    }

    // Update public/web .env
    const webEnv = sibling.publicEnvPath || sibling.webEnvPath;
    const webUpdates = sibling.publicUpdates || sibling.webUpdates;
    if (webEnv && webUpdates && existsSync(webEnv)) {
      const { values } = await parseEnvFile(webEnv);
      const entries = [];
      for (const [key, value] of values) {
        if (webUpdates[key]) {
          entries.push({
            key,
            value: webUpdates[key],
            comment: `Updated by rsnra-auth setup`,
          });
        } else {
          entries.push({ key, value });
        }
      }
      for (const [key, value] of Object.entries(webUpdates)) {
        if (!values.has(key)) {
          entries.push({ key, value, comment: `Added by rsnra-auth setup` });
        }
      }
      await writeEnvFile(webEnv, entries);
      console.log(`  ✓ ${sibling.name} web .env updated`);
    }
  }
}

async function setupApi() {
  printHeader('rsnra-auth API (port 2998)');
  const envPath = join(ROOT, '..', 'apps', 'api', '.env');
  const { values } = await parseEnvFile(envPath);

  const port = await promptString('Port', values.get('PORT') ?? '2998');
  const dbPath = await promptString(
    'Database path',
    values.get('DB_PATH') ?? './data/rsnra-auth.db'
  );

  // JWT secret — shared across all rsnra services
  const jwtSecret = await promptSecretOrGenerate(
    'JWT secret (shared with rsnra-link & resomd)',
    values.get('JWT_SECRET')
  );

  const corsOrigins = await promptString(
    'CORS origins (comma-separated)',
    values.get('CORS_ORIGINS') ??
      'http://localhost:2999,http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003,http://localhost:3004'
  );

  // Admin account
  const adminEmail = await promptString(
    'Admin email',
    values.get('ADMIN_EMAIL') ?? 'admin@rsnra.local'
  );

  // Admin password — hashed with bcrypt
  // Check if the current value is already a bcrypt hash
  const currentAdminPass = values.get('ADMIN_PASSWORD');
  const isAlreadyHashed = currentAdminPass && currentAdminPass.startsWith('$2');

  const { plain: adminPlain, hash: adminHash } = await promptPasswordOrGenerate(
    'Admin password',
    isAlreadyHashed ? currentAdminPass : undefined
  );

  if (adminPlain) {
    console.log(`  Admin email: ${adminEmail}`);
    console.log(`  Admin password (save it!): ${adminPlain}\n`);
  }

  const cookieDomain = await promptString(
    'Cookie domain (empty for localhost)',
    values.get('COOKIE_DOMAIN') ?? ''
  );

  const authApiPublicUrl = await promptString(
    'Auth API public URL (for avatar URLs on other services)',
    values.get('AUTH_API_PUBLIC_URL') ?? `http://localhost:${port}`
  );

  // OAuth client secrets — for seeding first-party clients
  console.log('\n  ── OAuth client secrets ──');
  console.log('  These are shared with rsnra-link and resomd respectively.');
  console.log(
    '  They seed OAuth clients on first boot. You can regenerate\n  them here and copy the matching secret to the other project.\n'
  );

  const seedClients = await promptConfirm(
    'Seed OAuth clients (rsnra-link, resomd)?',
    true
  );

  let linkSecret = values.get('OAUTH_CLIENT_RSNRA_LINK_SECRET') ?? '';
  let resomdSecret = values.get('OAUTH_CLIENT_RESOMD_SECRET') ?? '';

  if (seedClients) {
    const linkChoice = await promptSecretOrGenerate(
      'rsnra-link OAuth client secret',
      linkSecret || undefined
    );
    linkSecret = linkChoice;

    const resomdChoice = await promptSecretOrGenerate(
      'resomd OAuth client secret',
      resomdSecret || undefined
    );
    resomdSecret = resomdChoice;

    console.log('\n  ⚠  Copy these secrets to the matching projects:');
    console.log(`     rsnra-link  → OAUTH_CLIENT_SECRET=${linkSecret}`);
    console.log(
      `     resomd      → (uses shared cookie, no OAuth secret needed)`
    );
    console.log(
      `     rsnra-auth  → OAUTH_CLIENT_RESOMD_SECRET=${resomdSecret}\n`
    );
  }

  const entries = [
    {
      key: 'NODE_ENV',
      value: values.get('NODE_ENV') ?? 'development',
      comment: 'Node environment',
    },
    { key: 'PORT', value: port, comment: 'API port' },
    { key: 'DB_PATH', value: dbPath, comment: 'SQLite database path' },
    {
      key: 'JWT_SECRET',
      value: jwtSecret,
      comment: 'JWT signing secret — must match rsnra-link & resomd',
    },
    {
      key: 'CORS_ORIGINS',
      value: corsOrigins,
      comment: 'CORS allowed origins',
    },
    {
      key: 'ADMIN_EMAIL',
      value: adminEmail,
      comment: 'Admin account email (seeded on first boot)',
    },
    {
      key: 'ADMIN_PASSWORD',
      value: adminHash,
      comment:
        'Admin password — bcrypt hashed (cost 12). Leaked .env is useless.',
    },
    {
      key: 'COOKIE_DOMAIN',
      value: cookieDomain,
      comment: 'Cookie domain (empty for localhost, .rsnra.com for prod)',
    },
    {
      key: 'AUTH_API_PUBLIC_URL',
      value: authApiPublicUrl,
      comment:
        'Public base URL for avatar URLs (http://localhost:2998 or https://api.auth.rsnra.com)',
    },
  ];

  if (seedClients) {
    entries.push({
      key: 'OAUTH_CLIENT_RSNRA_LINK_SECRET',
      value: linkSecret,
      comment:
        'OAuth client secret for rsnra-link (must match OAUTH_CLIENT_SECRET in rsnra-link API)',
    });
    entries.push({
      key: 'OAUTH_CLIENT_RESOMD_SECRET',
      value: resomdSecret,
      comment: 'OAuth client secret for resomd',
    });
  }

  await writeEnvFile(envPath, entries);
  printDone(envPath);
}

async function setupWeb() {
  printHeader('rsnra-auth Web (port 2999)');
  const envPath = join(ROOT, '..', 'apps', 'web', '.env');
  const { values } = await parseEnvFile(envPath);

  const port = await promptString('Port', values.get('PORT') ?? '2999');
  const apiUrl = await promptString(
    'Auth API URL',
    values.get('VITE_API_URL') ?? 'http://localhost:2998'
  );

  const entries = [
    { key: 'PORT', value: port, comment: 'Web dev server port' },
    {
      key: 'VITE_API_URL',
      value: apiUrl,
      comment: 'Auth API base URL (no /v1 suffix)',
    },
  ];

  await writeEnvFile(envPath, entries);
  printDone(envPath);
}

async function main() {
  console.log('\n  ╔══════════════════════════════════════╗');
  console.log('  ║   rsnra-auth — Environment Setup     ║');
  console.log('  ╚══════════════════════════════════════╝');
  console.log('  Press Enter to keep current values.\n');

  await setupApi();
  await setupWeb();

  // Read the final values for sibling propagation
  const { values: apiValues } = await parseEnvFile(
    join(ROOT, '..', 'apps', 'api', '.env')
  );
  const { values: webValues } = await parseEnvFile(
    join(ROOT, '..', 'apps', 'web', '.env')
  );
  const authApiUrl = `http://localhost:${apiValues.get('PORT') ?? '2998'}`;
  const authWebUrl = `http://localhost:${webValues.get('PORT') ?? '2999'}`;

  // Propagate secrets to sibling projects if detected
  await propagateToSiblingProjects(
    apiValues.get('JWT_SECRET'),
    apiValues.get('OAUTH_CLIENT_RSNRA_LINK_SECRET'),
    authApiUrl,
    authWebUrl
  );

  console.log('\n  ╔══════════════════════════════════════╗');
  console.log('  ║        Setup complete! ✅            ║');
  console.log('  ╚══════════════════════════════════════╝\n');

  console.log('  Next steps:');
  console.log('    1. Run `pnpm dev` to start the services');
  console.log('    2. Sibling projects (if detected) have been updated.\n');
}

main().catch(err => {
  console.error('\n  ✖ Setup failed:', err.message);
  process.exit(1);
});
