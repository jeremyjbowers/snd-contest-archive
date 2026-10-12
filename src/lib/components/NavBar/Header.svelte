<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { cubicOut } from 'svelte/easing';
	import { prefersReducedMotion } from 'svelte/motion';
	import { slide } from 'svelte/transition';
	import Burger from '../Icons/Burger.svelte';
	import Heart from '../Icons/Heart.svelte';

	const MENU_MS = 300;
	const MARK = 18;
	const HEART = 16;

	let menuOpen = $state(false);
	let pointerOver = false; // mouse is inside the button or the open panel

	const menuDuration = $derived(prefersReducedMotion.current ? 0 : MENU_MS);

	const internalLinks = [
		{ href: '/about', label: 'about the archive' }
		// { href: '/membership', label: 'membership' },
		// { href: '/competition', label: 'competition' },
		// { href: '/challenge', label: 'snd challenge' },
		// { href: '/', label: 'archive' }
	] as const;
	const externalLinks = [{ href: 'https://www.snd.org', label: 'snd home' }] as const;

	function hoverOpen(event: PointerEvent) {
		if (event.pointerType !== 'mouse') return;
		pointerOver = true;
		menuOpen = true;
	}

	function hoverClose(event: PointerEvent) {
		if (event.pointerType !== 'mouse') return;
		pointerOver = false;
		menuOpen = false;
	}

	// A mouse click lands while the pointer is already over the button, so hover owns it.
	function toggleMenu(event: MouseEvent) {
		if (pointerOver && event.detail > 0) return;
		menuOpen = !menuOpen;
	}

	function closeIfFocusLeft(event: FocusEvent) {
		const next = event.relatedTarget;
		const root = event.currentTarget;
		if (next instanceof Node && root instanceof Node && root.contains(next)) return;
		if (pointerOver) return;
		menuOpen = false;
	}

	function closeIfOutside(event: MouseEvent) {
		const target = event.target;
		if (target instanceof Element && target.closest('[data-menu-root]')) return;
		menuOpen = false;
	}

	function onEscape(event: KeyboardEvent) {
		if (event.key === 'Escape') menuOpen = false;
	}
</script>

<svelte:window onclick={closeIfOutside} onkeydown={onEscape} />

<header class="header slug-bold">
	<div class="bar">
		<div
			class="left"
			role="group"
			aria-label="Site menu"
			data-menu-root
			onpointerenter={hoverOpen}
			onpointerleave={hoverClose}
			onfocusout={closeIfFocusLeft}
		>
			<button
				class="menu-btn"
				class:open={menuOpen}
				type="button"
				aria-expanded={menuOpen}
				aria-controls="site-menu"
				onclick={toggleMenu}
				style:--mark="{MARK}px"
			>
				<span class="mark">
					<Burger size={MARK} collapsed={menuOpen} />
				</span>
				MENU
			</button>
			{#if menuOpen}
				<nav
					id="site-menu"
					class="dropdown"
					aria-label="Site"
					transition:slide={{ duration: menuDuration, easing: cubicOut }}
				>
					{#each internalLinks as link (link.href)}
						<a
							href={resolve(link.href)}
							aria-current={page.url.pathname === link.href ? 'page' : undefined}
							onclick={() => (menuOpen = false)}>{link.label}</a
						>
					{/each}
					{#each externalLinks as link (link.href)}
						<!-- External site; resolve() only accepts app routes. -->
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
						<a href={link.href} onclick={() => (menuOpen = false)}>{link.label}</a>
					{/each}
				</nav>
			{/if}
		</div>

		<a class="logo" href={resolve('/')} aria-label="SND home">
			<img src="/assets/logo.png" alt="snd" width="86" height="31" />
		</a>

		<nav class="right">
			<a
				class="nav-link"
				href={resolve('/favorites')}
				class:active={page.url.pathname === '/favorites'}
				style:--heart="{HEART}px"
			>
				Favorites
				<span class="heart"><Heart size={HEART} filled /></span>
			</a>
			<!-- <a class="nav-link" href={resolve('/account')}>account</a> -->
		</nav>
	</div>

	<!-- <button class="theme" type="button" onclick={cycleTheme}>
		new theme
		<Icon name="shuffle" width={20} height={14} />
	</button> -->
</header>

<style>
	.header {
		--menu-ms: 300ms;
		--menu-ease: cubic-bezier(0.33, 1, 0.68, 1); /* matches cubicOut on the panel */
		--gap: 5px; /* between word and icon */
		--pad: 8px; /* chip padding beside the word */
		--pad-y: 5px; /* chip padding above caps and below baseline */
		position: sticky;
		top: 0;
		z-index: 20;
		background: var(--color-bg);
		border-bottom: var(--border-width) solid var(--color-ink);
	}

	.bar {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		height: var(--header-height);
		max-width: var(--page-max);
		margin: 0 auto;
		padding: 0 var(--page-gutter) 6px;
	}

	.left,
	.right {
		height: min-content;
		display: flex;
		gap: 13px;
		position: relative;
	}

	.menu-btn {
		display: inline-flex;
		align-items: center;
		gap: var(--gap);
		padding: var(--pad-y) var(--pad) var(--pad-y) 0;
		margin-right: 0;
		line-height: 1; /* equal space above caps and below baseline */
		color: var(--color-ink);
		background-color: transparent;
		white-space: nowrap;
		transition:
			gap var(--menu-ms) var(--menu-ease),
			padding-left var(--menu-ms) var(--menu-ease),
			margin-right var(--menu-ms) var(--menu-ease),
			background-color var(--menu-ms) var(--menu-ease),
			color var(--menu-ms) var(--menu-ease);
	}

	.mark {
		display: flex;
		justify-content: center;
		align-items: center;
		width: var(--mark);
		height: 1lh; /* icon overflows a little so the chip stays one line tall, same as FAVORITES */
		overflow: hidden;
		transition: width var(--menu-ms) var(--menu-ease);
	}

	.menu-btn.open {
		gap: 0;
		padding-left: var(--pad); /* match the right padding once the icon is gone */
		margin-right: calc(
			var(--mark) + var(--gap) - var(--pad)
		); /* keeps total width fixed so the logo and hover area don't move */
		background-color: var(--color-ink);
		color: var(--color-bg);
	}

	.menu-btn.open .mark {
		width: 0; /* MENU slides into the space the icon leaves */
	}

	.nav-link {
		--heart-fill: currentColor; /* solid, same color as the word */
		display: inline-flex;
		align-items: center;
		gap: 0;
		padding: var(--pad-y) 0;
		margin-left: calc(
			var(--heart) + var(--gap) + 2 * var(--pad)
		); /* room for the heart, held so the logo stays put */
		line-height: 1;
		color: var(--color-ink);
		background-color: transparent;
		transition:
			gap var(--menu-ms) var(--menu-ease),
			padding-inline var(--menu-ms) var(--menu-ease),
			margin-left var(--menu-ms) var(--menu-ease),
			background-color var(--menu-ms) var(--menu-ease),
			color var(--menu-ms) var(--menu-ease);
	}

	.heart {
		display: flex;
		justify-content: center;
		width: 0;
		overflow: hidden;
		transition: width var(--menu-ms) var(--menu-ease);
	}

	.heart :global(svg) {
		transform: scale(0);
		transition: transform var(--menu-ms) var(--menu-ease);
	}

	.nav-link.active {
		color: var(--color-accent);
	}

	.nav-link:hover,
	.nav-link:focus-visible {
		gap: var(--gap);
		padding-inline: var(--pad);
		margin-left: 0;
		background-color: var(--color-ink);
		color: var(--color-bg);
	}

	.nav-link:hover .heart,
	.nav-link:focus-visible .heart {
		width: var(--heart);
	}

	.nav-link:hover :global(svg),
	.nav-link:focus-visible :global(svg) {
		transform: scale(1);
	}

	@media (prefers-reduced-motion: reduce) {
		.menu-btn,
		.mark,
		.nav-link,
		.heart,
		.heart :global(svg) {
			transition: none;
		}
	}

	.logo {
		display: flex;
		justify-content: center;
		margin-bottom: calc(var(--pad-y) + 1px); /* sits "snd" on the MENU / FAVORITES baseline */
		filter: brightness(0);
	}

	.logo img {
		width: auto;
		height: 28px;
		object-fit: contain;
	}

	.dropdown {
		position: absolute;
		top: 100%;
		left: 0;
		width: var(--filter-width);
		background: var(--color-ink);
		border: var(--border-width) solid var(--color-ink);
		padding: 35px 20px;
		display: flex;
		flex-direction: column;
		gap: 37px;
		z-index: 30;
	}

	.dropdown a {
		font-family: var(--font-serif);
		font-size: 17px;
		font-weight: 700;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--color-bg);
	}

	.dropdown a:hover,
	.dropdown a[aria-current='page'] {
		color: var(--color-accent);
	}

	.theme {
		position: absolute;
		top: var(--header-height);
		left: calc(var(--page-gutter) + 182px);
		display: inline-flex;
		align-items: center;
		gap: 8px;
		background: var(--color-chip);
		padding: 4px 6px;
		font-size: 14px;
		font-weight: 600;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		z-index: 5;
	}

	@media (max-width: 900px) {
		.theme {
			left: var(--page-gutter);
		}
	}
</style>
