# Working in this repo

Conventions for SND Archive — Svelte 5 + SvelteKit, scaffolded from the [SND Archive Figma file](https://www.figma.com/design/QaGKdZmZYh2iyog4AjZaCl/SND-Archive).

Visual source: **designs**, Round 2. Screen inventory: **wireframes**.

## Stack

Svelte is the component format (markup, scoped CSS, and `<script>` in one `.svelte` file). SvelteKit is routing, `load` functions, and the `$lib` alias. This app is Svelte 5 **runes** mode (`$props`, `$state`, `$derived`, `$effect`). It is not Sapper, and it is not the 2018 compiler.

| Svelte 2 / 3 | This repo |
| --- | --- |
| `export let name` | `let { name }: { name: string } = $props()` |
| implicit `let` reactivity | `let count = $state(0)` |
| `$: doubled = count * 2` | `const doubled = $derived(count * 2)` |
| `$: { ... }` | `$effect(() => { ... })` — rare; prefer derived values |
| `writable` stores for shared UI state | module-level `$state` in a `.svelte.ts` file |
| Sapper `_layout.svelte` | `+layout.svelte` / `+page.svelte` |
| `onMount` | still valid; data usually comes from `load` |

HMR picks up saves in `.svelte` and `.css`. Typecheck with `npm run check`.

## Layout of the tree

```
src/routes/                 one folder per URL
  +layout.svelte            chrome (header, fonts, global CSS)
  +page.svelte              archive grid  (/)
  entries/[id]/+page.svelte detail
  favorites/+page.svelte
  about/+page.svelte        and the other menu stubs

src/lib/components/         card, filters, header, etc.
src/lib/styles/tokens.css   color, type, spacing
src/lib/catalog/            CSV / SQLite / Postgres adapters
data/entries.csv            mock rows
static/assets/              logo, icons, mock images
```

`$lib/components/EntryCard.svelte` resolves to `src/lib/components/EntryCard.svelte`.

## Components

```svelte
<script lang="ts">
	let { label }: { label: string } = $props();
	let open = $state(true);
</script>

<button onclick={() => (open = !open)}>{label}</button>

<style>
	button {
		color: var(--color-ink);
	}
</style>
```

- `$props()` — inputs from the parent
- `$state` — local UI state
- `{#if}` / `{#each}` — control flow
- `<style>` is scoped to the file. Prefer tokens in `tokens.css` over new hex values so paper/night stay in sync.

## Visual system

| What | Where |
| --- | --- |
| Color, type, gutters | `src/lib/styles/tokens.css` |
| A component | `src/lib/components` |
| A page | `src/routes/.../+page.svelte` |
| Fonts | `@font-face` in `tokens.css`; files in `static/fonts` |

Intended type is Antenna Serif + Antenna 2 VF. Until those files are in the repo, Fraunces and Source Sans 3 are the fallbacks.

The header “new theme” control swaps paper / night. It is a contrast check, not a product decision.

## Data

Pages talk to `getCatalog()` in `$lib/catalog`, not to `fs` or a database client.

- `listEntries(query)` — grid
- `getEntry(id)` — detail
- CSV is the default mock (`data/entries.csv`)
- SQLite and Postgres adapters share `Catalog` in `src/lib/catalog/types.ts`

Keep the `Entry` type stable when the real backend lands; map into it.

CSV credits: `Name|Role; Name|Role`. Images: `|`-separated paths under `static/`.

Filters are URL search params (`?award=Gold&discipline=Infographics`) so a view is shareable. Implementation: `src/lib/catalog/url.ts` and `FilterPanel.svelte`.

Favorites are `localStorage` (`src/lib/favorites.svelte.ts`) until accounts exist. They are not catalog data.

## Commands

```sh
npm run dev      # app
npm run check    # types
npm run format   # Prettier (tabs, single quotes)
```

## Not built yet

- Production entry data and crops
- Member lock / paywall (wireframe “archive locked view”)
- Pagination vs infinite scroll (both labeled in Round 1)
- Postgres, auth
- About / membership / competition copy

Extend the catalog interface and existing components rather than a parallel app.
