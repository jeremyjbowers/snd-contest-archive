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

**Postgres** is a stub with the same TypeScript interface. It will throw until the backend is implemented — that is intentional.

## Type

The Figma file specifies **Antenna Serif** and **Antenna 2 VF**. Those are licensed fonts. Until the files live in `static/fonts`, the app falls back to Fraunces and Source Sans 3. Drop Antenna files in and they will take priority (see `src/lib/styles/tokens.css`).

## Design notes

- Paper background `#F8F5F2`, ink `#232323`, teal `#1BA098`
- “new theme” in the header flips between paper and a night palette so we can feel type and contrast quickly
- Icons and mock entry images were exported from Figma and committed under `static/assets`
