import { dev } from '$app/environment';

const KEY = 'snd-locked-preview';

/**
 * Dev-only preview of the logged-out archive.
 *
 * `isLocked()` is the switch for page behavior. It stays false in production.
 * While the preview is on, `<html>` has the class `locked` and
 * `data-archive="locked"`, so styles can target `html.locked` or
 * `html[data-archive='locked']`. The same `locked` class is on the app shell.
 */
let locked = $state(false);

export function isLocked() {
	return locked;
}

export function initLockedPreview() {
	if (!dev || typeof localStorage === 'undefined') return;
	apply(localStorage.getItem(KEY) === '1');
}

export function toggleLockedPreview() {
	if (!dev) return;
	apply(!locked);
}

function apply(next: boolean) {
	locked = next;
	if (typeof document === 'undefined') return;
	document.documentElement.classList.toggle('locked', next);
	if (next) document.documentElement.dataset.archive = 'locked';
	else delete document.documentElement.dataset.archive;
	localStorage.setItem(KEY, next ? '1' : '0');
}
