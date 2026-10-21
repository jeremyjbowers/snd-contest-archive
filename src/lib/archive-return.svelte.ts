const KEY = 'snd-archive-return';

let href = $state('/');

export function archiveHref() {
	return href;
}

function allowed(value: string) {
	return value === '/' || (value.startsWith('/?') && !value.includes('://'));
}

export function initArchiveReturn() {
	if (typeof localStorage === 'undefined') return;
	const saved = localStorage.getItem(KEY);
	if (saved && allowed(saved)) href = saved;
}

/** Last archive grid, including its filters. Shared by both Back links. */
export function rememberArchive(url: URL) {
	if (url.pathname !== '/') return;
	const next = `${url.pathname}${url.search}`;
	href = next;
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(KEY, next);
}
