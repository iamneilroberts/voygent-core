# Voygent Core

![License](https://img.shields.io/badge/License-BSL%201.1-blue.svg)
![MCP Server](https://img.shields.io/badge/MCP-Server-1f6feb)

Voygent Core is a minimal MCP server that provides persistent JSON storage via the Cloudflare KV interface.
It runs locally by default (Miniflare KV) and can be deployed to Cloudflare KV when you want hosted storage.

## License

This project uses the Business Source License (BSL 1.1) with a non-compete restriction for hosted services.
See `LICENSE` and `TRADEMARKS.md`.

## Quick Start (Local Demo)

```bash
git clone https://github.com/iamneilroberts/voygent-core.git
cd voygent-core
npm install
npm run bootstrap
npm run dev
```

Local MCP URL:
```
http://127.0.0.1:8787/sse?key=demo.key
```

Optional smoke test (expects the dev server running):
```bash
npm run demo
```

## Manual Setup (Local)

1. Create a `.dev.vars` file with a local auth key:
   ```bash
   cp .dev.vars.example .dev.vars
   ```
2. Run locally with persistent KV:
   ```bash
   npx wrangler dev --local --persist
   ```
3. Seed demo data (optional):
   ```bash
   npm run seed
   ```
   To seed a remote KV namespace instead, set `KV_MODE=remote`.
4. Deploy to Cloudflare KV (optional):
   ```bash
   npx wrangler deploy
   ```
   For cloud deploys:
   - Create a KV namespace: `npx wrangler kv:namespace create TRIPS`
   - Update `wrangler.toml` with the namespace ID
   - Set auth keys: `npx wrangler secret put AUTH_KEYS`

## MCP Tools (Core)

- `get_context` – returns system prompt and list of item IDs
- `list_items` – list all item IDs
- `read_item` – read an item by ID
- `save_item` – create/replace an item
- `patch_item` – partial update using dot notation
- `delete_item` – delete an item

## System Prompt

Store a system prompt in KV at `_prompts/system-prompt` if you want to deliver custom instructions at session start.
Starter prompt and sample data live in:
- `examples/system-prompt.md`
- `examples/sample-trip.json`

## Local Storage (Best Default)

Use `wrangler dev --local --persist` for local KV storage. This gives you fast, private iteration without any cloud setup.

## Claude/ChatGPT Web Notes

Local MCP works for desktop apps (Claude Desktop / Claude Code). Claude and ChatGPT web clients cannot reach `localhost` directly. To use web clients:
- Use `npx wrangler dev --remote` for a temporary public URL, or
- Deploy with `npx wrangler deploy` for a stable URL.

## Cloud Storage Options (Bring Your Own)

Voygent Core is intentionally minimal. If you want hosted or multi-user storage, you can:
- Use Cloudflare KV (via Wrangler) for a serverless production deployment.
- Swap the storage layer to your preferred backend (Redis, Postgres, D1, SQLite).

The core code uses the KV API interface; replacing it is an advanced change and not provided out-of-the-box.

## Security Notes

- Item IDs are validated to prevent path traversal.
- Auth keys can be set in KV (`_config/auth-keys`) or via `AUTH_KEYS` env var.
