import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { mediaBytes } from '$lib/catalog/ingest/images';
import { pgSql } from '$lib/catalog/persist/pg';
import type { RequestHandler } from './$types';

const ENTRY_ID = /^(?:af-\d+|at-rec[A-Za-z0-9]+)$/;

/** Serve a stored attachment preview. The grid and the detail gallery point here. */
export const GET: RequestHandler = async ({ params }) => {
	const index = Number(params.index);
	if (!ENTRY_ID.test(params.id) || !Number.isInteger(index) || index < 0) {
		error(404, 'Not found');
	}
	const url = env.CATALOG_URL ?? '';
	if (!url.startsWith('postgres://') && !url.startsWith('postgresql://')) {
		error(404, 'Not found');
	}

	const rows = await pgSql(url).query<{ media_type: string; bytes: unknown }>(
		'SELECT media_type, bytes FROM entry_media WHERE entry_id = $1 AND sort_order = $2',
		[params.id, index]
	);
	const row = rows[0];
	const bytes = row ? mediaBytes(row.bytes) : null;
	if (!row || !bytes || !row.media_type.startsWith('image/')) error(404, 'Not found');

	return new Response(new Uint8Array(bytes), {
		headers: {
			'Content-Type': row.media_type,
			'Cache-Control': 'public, max-age=86400'
		}
	});
};
