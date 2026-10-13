-- Shared catalog schema for SQLite and Postgres.
-- CSV remains the default mock; this is the shape the loaders write.
-- Postgres also has source_submissions and source_assets (see data/postgres.sql).

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

CREATE TABLE IF NOT EXISTS entry_media (
	entry_id TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
	sort_order INTEGER NOT NULL,
	media_type TEXT NOT NULL,
	bytes BLOB NOT NULL,
	PRIMARY KEY (entry_id, sort_order)
);

CREATE TABLE IF NOT EXISTS credits (
	entry_id TEXT NOT NULL REFERENCES entries(id),
	name TEXT NOT NULL,
	role TEXT NOT NULL,
	sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS entries_year_idx ON entries(year);
CREATE INDEX IF NOT EXISTS entries_publication_idx ON entries(publication);
CREATE INDEX IF NOT EXISTS entries_award_idx ON entries(award);
CREATE UNIQUE INDEX IF NOT EXISTS entries_source_key_idx ON entries(source_key)
	WHERE source_key IS NOT NULL;
