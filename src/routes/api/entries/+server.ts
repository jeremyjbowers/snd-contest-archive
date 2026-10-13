import { json } from '@sveltejs/kit';
import { getCatalog } from '$lib/catalog';
import { CARD_PAGE, byArchiveOrder, pageOf } from '$lib/catalog/page';
import { queryFromSearchParams } from '$lib/catalog/url';
import type { RequestHandler } from './$types';

/** The next screen of cards. The archive page calls this as the grid scrolls. */
export const GET: RequestHandler = async ({ url }) => {
	const catalog = getCatalog();
	const query = queryFromSearchParams(url.searchParams);
	const offset = Number(url.searchParams.get('offset'));
	const limit = Number(url.searchParams.get('limit')) || CARD_PAGE;
	const page = pageOf(byArchiveOrder(await catalog.listEntries(query)), offset, limit);
	return json(page);
};
