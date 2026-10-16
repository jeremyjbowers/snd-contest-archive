# Connect to production Postgres from your laptop

This guide is for a frontend engineer who wants the **live archive data** while developing locally. You do not need to write SQL day to day — the app already talks to Postgres through a small catalog layer. Your job is to point that layer at the production database and run the SvelteKit app.

You will get:

1. A **connection string** (keep it private; treat it like a password)
2. Your **public IP whitelisted** on the DigitalOcean managed Postgres firewall

Until both are in place, the database will refuse connections from your machine.

## What you are connecting to

Production runs on DigitalOcean App Platform with a managed Postgres cluster. The app reads contest entries from that database. Locally, the same code path works: set one env var and `npm run dev` loads real rows instead of the CSV mock.

| Without the env var | With production `CATALOG_URL` |
| ------------------- | ----------------------------- |
| Mock CSV (`data/entries.csv`) | Live Postgres catalog |
| Good for UI-only work | Good for filters, detail pages, real images |

## Prerequisites

- **Node.js 22.12+** (`node -v`)
- This repo cloned and dependencies installed:

```sh
npm install
```

- Your public IP sent to whoever manages the database (so it can be added to the trusted sources / firewall)
- The connection string they send you (usually starts with `postgresql://` and includes `?sslmode=require`)

Find your public IP (share this for the whitelist):

```sh
curl -s https://ifconfig.me
echo
```

If you change networks (home ↔ café ↔ VPN), your IP changes and you will need a new whitelist entry.

## Set the env var

1. In the repo root, copy the example env file if you do not already have `.env`:

```sh
cp .env.example .env
```

2. Edit `.env` and set **only** this (paste the string you were given):

```env
CATALOG_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require
```

Notes:

- `.env` is gitignored. Never commit it, never paste the URL into Slack/GitHub issues, never put it in client-side code.
- SvelteKit loads `.env` for `npm run dev`. The catalog reads `CATALOG_URL` from private server env (`$env/dynamic/private`), so the string stays on the Node process — it is not shipped to the browser.
- `sslmode=require` is expected for DigitalOcean. The app’s Postgres helper already handles DO’s certificate the way Node’s `pg` client needs.

## Run the app against production data

```sh
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

You should see the archive grid populated from Postgres. Entry pictures for Airtable-backed rows are served from the same database at `/media/{id}/{index}` when you open a detail page.

To go back to the mock CSV, comment out the Postgres line (or set `CATALOG_URL=csv:data/entries.csv`) and restart `npm run dev`.

## How data reaches the UI (SvelteKit sketch)

You do not open a database client from a `.svelte` file. Pages ask the catalog; the catalog picks CSV / SQLite / Postgres from `CATALOG_URL`.

```
Browser → +page.server.ts (load) → getCatalog() → Postgres adapter → managed DB
```

Useful places to look while learning the stack:

| File | Role |
| ---- | ---- |
| `src/lib/catalog/index.ts` | Chooses adapter from `CATALOG_URL` |
| `src/lib/catalog/types.ts` | `Entry`, `Catalog` — the contract the UI depends on |
| `src/routes/+page.server.ts` | Homepage `load`: list + facets |
| `src/routes/entries/[id]/+page.server.ts` | Detail `load`: one entry |
| `src/lib/components/*.svelte` | Presentational UI (Svelte 5 runes) |

In SvelteKit, `+page.server.ts` runs **only on the server**. That is why putting `CATALOG_URL` in `.env` is safe for local reads: the connection never appears in browser JS.

Svelte 5 in this repo uses runes (`$props`, `$state`, `$derived`). See **AGENTS.md** for the short cheat sheet if you are coming from React or older Svelte.

## Read-only habits (important)

Even if your connection string can write, treat production as **read-only** from your laptop:

- Do **not** run `npm run catalog:migrate` or `npm run catalog:load` against this URL
- Do **not** run one-off scripts that upsert or delete rows unless someone asks you to
- Prefer changing UI and filters; use `SELECT`-style inspection only when debugging data shape

Schema reference (for curiosity / debugging): `data/postgres.sql`.

## Optional: sanity-check the connection

If the app fails to start or the grid is empty, verify the network path with `psql` (install Postgres client tools if needed):

```sh
psql "$CATALOG_URL" -c 'SELECT count(*) FROM entries;'
```

Or from Node in the repo (uses the same SSL behavior as the app):

```sh
node --input-type=module -e "
import pg from 'pg';
const url = process.env.CATALOG_URL;
if (!url) throw new Error('Set CATALOG_URL in the environment first');
const needsSsl = /sslmode=/.test(url);
const connectionString = url.replace(/([?&])sslmode=[^&]*&?/, '\$1').replace(/[?&]\$/, '');
const client = new pg.Client(needsSsl ? { connectionString, ssl: { rejectUnauthorized: false } } : { connectionString: url });
await client.connect();
const { rows } = await client.query('SELECT count(*)::int AS n FROM entries');
console.log('entries:', rows[0].n);
await client.end();
"
```

Run that with the var exported, e.g. `export $(grep -v '^#' .env | xargs)` then the `node` command — or paste `CATALOG_URL=...` inline for a one-off check.

## Troubleshooting

| Symptom | Likely cause | What to try |
| ------- | ------------ | ----------- |
| `Connection timed out` / `ECONNREFUSED` | IP not whitelisted, or wrong host/port | Confirm your current public IP; ask for a firewall update; double-check the URL |
| `password authentication failed` | Wrong user/password in the string | Ask for a fresh connection string; watch for special characters that need URL-encoding |
| `SSL` / certificate errors | Missing or odd `sslmode` | Use the URL as provided (with `sslmode=require`); do not strip SSL params by hand for the app |
| App still shows mock / old data | `.env` not loaded or wrong var name | Restart `npm run dev` after editing `.env`; confirm the line is `CATALOG_URL=...` (not `DATABASE_URL` alone — the app reads `CATALOG_URL`) |
| Works at home, fails elsewhere | New public IP | Re-whitelist |

Connection pool note: managed Postgres allows a small number of connections. One local `npm run dev` is fine. Avoid opening many parallel scripts against the same URL.

## Security checklist

- [ ] `.env` exists only on your machine
- [ ] Connection string not committed, screenshotted, or pasted into tickets
- [ ] You only use it for local `npm run dev` and careful read queries
- [ ] You tell the DB owner when you no longer need access (IP can be removed)

## When to use CSV instead

Stay on `CATALOG_URL=csv:data/entries.csv` when you are iterating on layout, typography, or components and do not need production volume or image bytes. Switch to Postgres when you need real filters, real entry counts, or `/media/...` images.
