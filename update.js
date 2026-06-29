#!/usr/bin/env node
'use strict';

/**
 * RSNRA Auth — system update script.
 *
 * Syncs the git repo, reinstalls dependencies, rebuilds, and restarts PM2.
 * Checks that .env files exist before restarting — offers to run `pnpm setup`
 * if they're missing. Also verifies JWT_SECRET consistency with sibling
 * projects (rsnra-link, resomd) if detected in the parent directory.
 */

const { execSync, spawnSync } = require('child_process');
const readline = require('readline');
const { existsSync, readFileSync } = require('fs');
const { join } = require('path');

const ROOT = __dirname;
const PARENT = join(ROOT, '..');

function run(cmd) {
  console.log(`$ ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}

function askQuestion(prompt) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise(resolve => {
    rl.question(prompt, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

function readEnvKey(envPath, key) {
  if (!existsSync(envPath)) return null;
  const content = readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const m = line.match(new RegExp(`^${key}\\s*=\\s*(.+)$`));
    if (m) return m[1].trim();
  }
  return null;
}

function checkEnvFiles() {
  const required = [
    { path: join(ROOT, 'apps', 'api', '.env'), label: 'Auth API' },
    { path: join(ROOT, 'apps', 'web', '.env'), label: 'Auth Web' },
  ];

  const missing = required.filter(f => !existsSync(f.path));

  if (missing.length > 0) {
    console.log('\n⚠  Missing .env files:');
    for (const f of missing) {
      console.log(`   - ${f.label}: ${f.path}`);
    }
    console.log('');
    const choice = askQuestion(
      'Run `pnpm setup` to generate them now? (Y/n): '
    );
    if (!/^[nN]/.test(choice.trim())) {
      run('pnpm setup');
    } else {
      console.log('Skipping — services may fail without .env files.');
    }
  }
}

function checkJwtConsistency() {
  const authJwt = readEnvKey(join(ROOT, 'apps', 'api', '.env'), 'JWT_SECRET');
  if (!authJwt) return;

  const siblings = [
    {
      name: 'rsnra-link',
      envPath: join(PARENT, 'rsnra-link', 'apps', 'api', '.env'),
    },
    {
      name: 'resomd',
      envPath: join(PARENT, 'resomd', 'apps', 'api', '.env'),
    },
  ];

  const mismatches = [];
  for (const s of siblings) {
    if (!existsSync(s.envPath)) continue;
    const siblingJwt = readEnvKey(s.envPath, 'JWT_SECRET');
    if (siblingJwt && siblingJwt !== authJwt) {
      mismatches.push(s);
    }
  }

  if (mismatches.length > 0) {
    console.log('\n⚠  JWT_SECRET mismatch detected:');
    for (const s of mismatches) {
      console.log(`   - ${s.name} has a different JWT_SECRET`);
    }
    console.log(
      '   Run `pnpm setup` in rsnra-auth to propagate the correct secret.\n'
    );
  }
}

async function main() {
  console.log('=== RSNRA Auth — System Update ===\n');

  // Check for uncommitted changes
  const modifiedResult = spawnSync('git', ['diff', '--name-only'], {
    encoding: 'utf8',
  });
  const modifiedFiles = modifiedResult.stdout.trim();

  const untrackedResult = spawnSync('git', ['clean', '-nd'], {
    encoding: 'utf8',
  });
  const untrackedFiles = untrackedResult.stdout
    .split('\n')
    .map(l => l.replace(/^Would remove /, '').trim())
    .filter(Boolean)
    .join('\n');

  if (modifiedFiles || untrackedFiles) {
    console.log(
      'WARNING: The following files may interfere with synchronization:'
    );
    if (modifiedFiles) {
      console.log('--- Modified tracked files ---');
      console.log(modifiedFiles);
    }
    if (untrackedFiles) {
      console.log(
        '--- Untracked files (gitignored files like .env are preserved) ---'
      );
      console.log(untrackedFiles);
    }
    console.log('------------------------------');

    const choice = await askQuestion(
      'Do you want to clean/discard these changes to proceed with sync? (y/N): '
    );
    if (/^[yY]$/.test(choice.trim())) {
      console.log('Cleaning workspace...');
      run('git restore .');
      run('git clean -fd');
    } else {
      console.log(
        'Proceeding without cleaning. Warning: Sync might fail if there are conflicts.'
      );
    }
  }

  console.log('\nSyncing repository...');
  run('gh repo sync');

  console.log('Installing dependencies...');
  run('pnpm install');

  console.log('Rebuilding packages and applications...');
  run('pnpm build');

  // Check .env files exist before restarting
  await checkEnvFiles();

  // Check JWT_SECRET consistency with sibling projects
  checkJwtConsistency();

  console.log('Restarting services via PM2...');
  run('pm2 restart ecosystem.config.js');

  console.log('\n=== System update complete ===');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
