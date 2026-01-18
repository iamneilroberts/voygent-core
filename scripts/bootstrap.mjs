#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = join(__dirname, '..');
const devVarsPath = join(root, '.dev.vars');
const exampleVarsPath = join(root, '.dev.vars.example');

function run(cmd) {
  execSync(cmd, { stdio: 'inherit', cwd: root });
}

if (!existsSync(devVarsPath)) {
  const fallback = 'AUTH_KEYS=demo.key\n';
  const content = existsSync(exampleVarsPath)
    ? readFileSync(exampleVarsPath, 'utf-8')
    : fallback;
  writeFileSync(devVarsPath, content, 'utf-8');
  console.log('Created .dev.vars');
}

if (!existsSync(join(root, 'node_modules'))) {
  console.log('Installing dependencies...');
  run('npm install');
}

console.log('Seeding demo data (local KV)...');
run('node scripts/seed-demo.mjs');

console.log('\nBootstrap complete.');
console.log('Run: npm run dev');
console.log('Local MCP URL: http://127.0.0.1:8787/sse?key=demo.key');
