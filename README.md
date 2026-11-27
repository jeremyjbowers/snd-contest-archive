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

To point a local checkout at the **production** database for read-only frontend work (IP whitelist + `CATALOG_URL`), see **[docs/local-prod-db.md](docs/local-prod-db.md)**.

## DigitalOcean

There are two App Platform apps, one per DigitalOcean team. Each is a 512 MiB web service (about $5 a month) and a 1 GiB single-node Postgres cluster named `snd-archive-pg` (about $15 a month). A pre-deploy job runs `catalog:migrate`. There is no standby node.

| Environment | Team                                              | Git branch | Spec                      | App                                                         |
| ----------- | ------------------------------------------------- | ---------- | ------------------------- | ----------------------------------------------------------- |
| Staging     | existing account, project **SND design archive**  | `main`     | `.do/app.yaml`            | [snd-archive](https://snd-archive-y3yig.ondigitalocean.app) |
| Production  | **Archives** team, project **SND design archive** | `prod`     | `.do/app.production.yaml` | same app name, its own URL                                  |

Pushes to `main` deploy staging. Pushes to `prod` deploy production. Production does not deploy from `main`. To release, update `prod` from the staging commit you want (for example `git push origin main:prod` when staging is the release).

```sh
DIGITALOCEAN_ACCESS_TOKEN=... npx tsx scripts/provision-digitalocean.ts
```

That script provisions **staging**. It creates the cluster and the app in a DigitalOcean project named **SND design archive**, creating that project on this account when it does not already exist. It will not put them on the Over Slot team, and it refuses the Archives team token so production is not pointed back at `main`. Award Force workbooks stay out of git and off the app image. The script can load them by adding the machine's address to the database firewall and removing that rule afterward. That path misses when the machine's public address changes during the load. The 2024 and 2025 workbooks were loaded instead by a one-off post-deploy job inside App Platform, using a private registry image that was deleted after the load. The checked-in spec does not include that job. Production was loaded with a copy of the staging database, in `defaultdb`, and the production spec binds that database as `doadmin`.

`npm run catalog:fit` reads Award Force workbooks, the expiring file-download CSV, and Airtable JSON dumps and reports how those rows sit on the catalog model. It does not write a database. Entrant emails, phone numbers, addresses, and paywall passwords are dropped before anything is stored. Download URLs from Award Force expire after about 48 hours, so they are stored as locators rather than as permanent thumbnails. The pictures on the site come from the Airtable results sheets: each work attachment's preview is saved in Postgres and served at `/media/{id}/{index}`. Social cards and award certificates are not used as the entry image.

## Type

The Figma file specifies **Antenna Serif** and **Antenna 2 VF**. Those are licensed fonts. Until the files live in `static/fonts`, the app falls back to Fraunces and Source Sans 3. Drop Antenna files in and they will take priority (see `src/lib/styles/tokens.css`).

## Design notes

- Paper background `#F8F5F2`, ink `#232323`, teal `#1BA098`
- “new theme” in the header flips between paper and a night palette so we can feel type and contrast quickly
- Icons and mock entry images were exported from Figma and committed under `static/assets`
