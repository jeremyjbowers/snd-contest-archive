import { emptyQuery } from './filter';
import type { EntryQuery } from './types';

export type ListParam =
	'discipline' | 'award' | 'platform' | 'org' | 'topic' | 'category' | 'special';

export function queryFromSearchParams(params: URLSearchParams): EntryQuery {
	const query = emptyQuery();
	query.q = params.get('q') ?? undefined;
	query.person = params.get('person') ?? undefined;
	query.disciplines = params.getAll('discipline');
	query.awards = params.getAll('award');
	query.platforms = params.getAll('platform');
	query.organizations = params.getAll('org');
	query.topics = params.getAll('topic');
	query.categories = params.getAll('category');
	query.special = params.getAll('special');

	const yearMin = params.get('yearMin');
	const yearMax = params.get('yearMax');
	if (yearMin) query.yearMin = Number(yearMin);
	if (yearMax) query.yearMax = Number(yearMax);
	return query;
}

export function toggleListParam(params: URLSearchParams, key: ListParam, value: string) {
	const current = params.getAll(key);
	params.delete(key);
	const next = current.includes(value)
		? current.filter((item) => item !== value)
		: [...current, value];
	for (const item of next) params.append(key, item);
}

export function setOrDelete(params: URLSearchParams, key: string, value: string | undefined) {
	if (!value) params.delete(key);
	else params.set(key, value);
}
