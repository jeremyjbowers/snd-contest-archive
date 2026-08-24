const KEY = 'snd-favorites';

let ids = $state<string[]>([]);
let ready = $state(false);

export function initFavorites() {
	if (ready || typeof localStorage === 'undefined') return;
	try {
		const stored = JSON.parse(localStorage.getItem(KEY) ?? '[]');
		if (Array.isArray(stored)) ids = stored.map(String);
	} catch {
		ids = [];
	}
	ready = true;
}

function persist() {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(KEY, JSON.stringify(ids));
}

export function favoriteIds() {
	return ids;
}

export function isFavorite(id: string) {
	return ids.includes(id);
}

export function toggleFavorite(id: string) {
	ids = ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
	persist();
}
