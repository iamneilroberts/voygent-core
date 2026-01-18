#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = join(__dirname, '..');

const bindings = process.env.KV_BINDING || 'TRIPS';
const mode = process.env.KV_MODE || 'local';

const localFlag = mode === 'local' ? '--local' : '';

function run(cmd) {
  execSync(cmd, { stdio: 'inherit', cwd: root });
}

console.log(`Seeding KV (${mode}) using binding: ${bindings}`);

run(`npx wrangler kv:key put _prompts/system-prompt --path examples/system-prompt.md --binding ${bindings} ${localFlag}`);
run(`npx wrangler kv:key put lisbon-smith-2026-04 --path examples/sample-trip.json --binding ${bindings} ${localFlag}`);

console.log('Seed complete.');
