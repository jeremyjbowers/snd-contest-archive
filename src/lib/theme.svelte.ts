const KEY = 'snd-theme';
export const THEMES = ['paper', 'night'] as const;
export type Theme = (typeof THEMES)[number];

let theme = $state<Theme>('paper');

export function currentTheme() {
	return theme;
}

export function initTheme() {
	if (typeof document === 'undefined') return;
	const stored = localStorage.getItem(KEY);
	if (stored === 'paper' || stored === 'night') theme = stored;
	document.documentElement.dataset.theme = theme;
}

export function cycleTheme() {
	const index = THEMES.indexOf(theme);
	theme = THEMES[(index + 1) % THEMES.length];
	document.documentElement.dataset.theme = theme;
	localStorage.setItem(KEY, theme);
}
