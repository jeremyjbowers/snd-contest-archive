# SND Archive

A SvelteKit app for the Society for News Design Creative Competition archive. The UI is scaffolded from the [SND Archive Figma file](https://www.figma.com/design/QaGKdZmZYh2iyog4AjZaCl/SND-Archive) — **designs** (Round 2) for look, **wireframes** for the page set.

This is an early frontend. Entry data is mocked. The backend can land later without rewriting the pages.

## Run it

```sh
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

Other commands:

```sh
npm run check    # TypeScript + Svelte
npm run lint     # Prettier + ESLint
npm run format   # Rewrite files to match Prettier
npm run build    # Production build
```

Project conventions and the Svelte 5 map are in **AGENTS.md**.

## What is built

| Route                                                             | Figma source                            | Status                            |
| ----------------------------------------------------------------- | --------------------------------------- | --------------------------------- |
| `/`                                                               | designs → Round 2 “archive main view”   | Grid, filters, search, year range |
| `/entries/[id]`                                                   | designs → Round 2 “detail page”         | Metadata rail + image gallery     |
| `/favorites`                                                      | designs → “favorites”                   | Hearts save in this browser       |
| `/about`, `/membership`, `/competition`, `/challenge`, `/account` | menu in “archive main view — menu open” | Labeled stubs                     |

## Data

Pages never read CSV, SQLite, or Postgres directly. They call `getCatalog()` in `src/lib/catalog`.

Set the adapter with `CATALOG_URL` in `.env` (see `.env.example`):

```
CATALOG_URL=csv:data/entries.csv
CATALOG_URL=sqlite:data/archive.db
CATALOG_URL=postgres://user:pass@host:5432/snd
```

**CSV** is the working mock. Edit `data/entries.csv` and refresh.

**SQLite** uses `data/schema.sql`. Create a database with `sqlite3 data/archive.db < data/schema.sql`, load rows, then point `CATALOG_URL` at the file.

**Postgres** is the persistence target for real contest data. `npm run catalog:migrate` creates the tables in `data/postgres.sql`. `npm run catalog:load` applies that schema and upserts rows. Point the app at them with `CATALOG_URL=postgres://user:pass@host:5432/snd`.

## DigitalOcean

`.do/app.yaml` is the App Platform spec: a 512 MiB web service and a pre-deploy job that runs `catalog:migrate`. The database is an existing managed Postgres cluster named `snd-archive-pg` (1 GiB, one node, about $15 a month). The web service is about $5 a month. There is no standby node.

```sh
DIGITALOCEAN_ACCESS_TOKEN=... npx tsx scripts/provision-digitalocean.ts
```

The script creates the cluster and the app in a DigitalOcean project named **SND design archive**, creating that project on this account when it does not already exist. It will not put them on the Over Slot team. Award Force workbooks stay out of git and off the app image. The script can load them by adding the machine's address to the database firewall and removing that rule afterward. That path misses when the machine's public address changes during the load. The 2024 and 2025 workbooks were loaded instead by a one-off post-deploy job inside App Platform, using a private registry image that was deleted after the load. The checked-in spec does not include that job. The live app clones `main`. A public git URL does not receive push webhooks, so a commit on `main` is built when a deployment is started. The `prod` branch is cut from that deployed commit and can replace `main` as the App Platform branch when releases should be explicit.

The running app is [snd-archive](https://snd-archive-y3yig.ondigitalocean.app).

`npm run catalog:fit` reads Award Force workbooks, the expiring file-download CSV, and Airtable JSON dumps and reports how those rows sit on the catalog model. It does not write a database. Entrant emails, phone numbers, addresses, and paywall passwords are dropped before anything is stored. Download URLs from Award Force expire after about 48 hours, so they are stored as locators rather than as permanent thumbnails.

## Type

The Figma file specifies **Antenna Serif** and **Antenna 2 VF**. Those are licensed fonts. Until the files live in `static/fonts`, the app falls back to Fraunces and Source Sans 3. Drop Antenna files in and they will take priority (see `src/lib/styles/tokens.css`).

## Design notes

- Paper background `#F8F5F2`, ink `#232323`, teal `#1BA098`
- “new theme” in the header flips between paper and a night palette so we can feel type and contrast quickly
- Icons and mock entry images were exported from Figma and committed under `static/assets`
