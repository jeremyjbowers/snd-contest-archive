import { MediaQuery } from 'svelte/reactivity';

export const isMobile = new MediaQuery('max-width: 800px'); // keep in sync with the 800px CSS media queries
