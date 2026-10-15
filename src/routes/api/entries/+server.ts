import { json } from '@sveltejs/kit';
import { getCatalog } from '$lib/catalog';
import { CARD_PAGE, pageOf } from '$lib/catalog/page';
import { browseEntries } from '$lib/catalog/shuffle';
import { queryFromSearchParams } from '$lib/catalog/url';
import type { RequestHandler } from './$types';

function requestedBucket(params: URLSearchParams) {
	const raw = params.get('bucket');
	if (raw == null) return null;
	const bucket = Number(raw);
	if (!Number.isInteger(bucket) || bucket < 0 || bucket > Number.MAX_SAFE_INTEGER) return null;
	return bucket;
}

/** The next screen of cards. The archive page calls this as the grid scrolls. */
export const GET: RequestHandler = async ({ url }) => {
	const catalog = getCatalog();
	const query = queryFromSearchParams(url.searchParams);
	const offset = Number(url.searchParams.get('offset'));
	const limit = Number(url.searchParams.get('limit')) || CARD_PAGE;
	const browse = browseEntries(
		await catalog.listEntries(query),
		query,
		requestedBucket(url.searchParams)
	);
	const page = pageOf(browse.ordered, offset, limit);
	return json({ ...page, bucket: browse.bucket });
};
