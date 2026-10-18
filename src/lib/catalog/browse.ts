import { getCatalog } from '$lib/catalog';
import { queryFromSearchParams } from '$lib/catalog/url';

export async function loadBrowse(url: URL) {
	const catalog = getCatalog();
	const query = queryFromSearchParams(url.searchParams);
	const [entries, facets] = await Promise.all([catalog.listEntries(query), catalog.getFacets()]);
	return { entries, facets, query };
}
