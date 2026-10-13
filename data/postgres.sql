-- Postgres catalog. The entries/credits/images tables match data/schema.sql.
-- source_submissions keeps the mapped row (no entrant contact fields, no paywall secrets).
-- source_assets keeps article links, Award Force file ids, and expiring download URLs.

CREATE TABLE IF NOT EXISTS entries (
	id TEXT PRIMARY KEY,
	title TEXT NOT NULL,
	publication TEXT NOT NULL,
	year INTEGER NOT NULL,
	award TEXT NOT NULL,
	category TEXT NOT NULL,
	subcategory TEXT,
	discipline TEXT NOT NULL,
	platform TEXT NOT NULL,
	topic TEXT,
	description TEXT,
	url TEXT,
	thumbnail TEXT NOT NULL,
	student INTEGER NOT NULL DEFAULT 0,
	non_editorial INTEGER NOT NULL DEFAULT 0,
	multi_winner INTEGER NOT NULL DEFAULT 0,
	access TEXT NOT NULL DEFAULT 'public',
	awards TEXT NOT NULL DEFAULT '[]',
	citation TEXT,
	source TEXT,
	source_key TEXT
);

CREATE TABLE IF NOT EXISTS entry_images (
	entry_id TEXT NOT NULL REFERENCES entries(id),
	url TEXT NOT NULL,
	sort_order INTEGER NOT NULL DEFAULT 0
);

-- Preview bytes for a card and the detail gallery. Airtable attachment URLs expire,
-- so the loader stores the thumbnail itself and the site serves /media/{id}/{index}.
CREATE TABLE IF NOT EXISTS entry_media (
	entry_id TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
	sort_order INTEGER NOT NULL,
	media_type TEXT NOT NULL,
	bytes BYTEA NOT NULL,
	PRIMARY KEY (entry_id, sort_order)
);

CREATE TABLE IF NOT EXISTS credits (
	entry_id TEXT NOT NULL REFERENCES entries(id),
	name TEXT NOT NULL,
	role TEXT NOT NULL,
	sort_order INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE entries ADD COLUMN IF NOT EXISTS awards TEXT NOT NULL DEFAULT '[]';
ALTER TABLE entries ADD COLUMN IF NOT EXISTS citation TEXT;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS source_key TEXT;

CREATE INDEX IF NOT EXISTS entries_year_idx ON entries(year);
CREATE INDEX IF NOT EXISTS entries_publication_idx ON entries(publication);
CREATE INDEX IF NOT EXISTS entries_award_idx ON entries(award);
CREATE UNIQUE INDEX IF NOT EXISTS entries_source_key_idx ON entries(source_key)
	WHERE source_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS source_submissions (
	source_key TEXT PRIMARY KEY,
	source TEXT NOT NULL,
	origin TEXT NOT NULL,
	season INTEGER,
	contest TEXT,
	entry_status TEXT,
	moderation_status TEXT,
	promotable INTEGER NOT NULL,
	block_reason TEXT,
	payload TEXT NOT NULL,
	loaded_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS source_submissions_season_idx ON source_submissions(season);

CREATE TABLE IF NOT EXISTS source_assets (
	source_key TEXT NOT NULL,
	origin TEXT NOT NULL,
	sort_order INTEGER NOT NULL,
	kind TEXT NOT NULL,
	label TEXT NOT NULL,
	filename TEXT,
	media_type TEXT,
	byte_size TEXT,
	locator TEXT NOT NULL,
	expires_hours INTEGER,
	PRIMARY KEY (source_key, origin, sort_order)
);
