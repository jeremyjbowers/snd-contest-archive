<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { cycleTheme } from '$lib/theme.svelte';
	import { favoriteIds } from '$lib/favorites.svelte';
	import Icon from './Icon.svelte';

	let menuOpen = $state(false);
	let menuRoot = $state<HTMLDivElement | undefined>(undefined);

	const links = [
		{ href: '/about', label: 'about snd' },
		{ href: '/membership', label: 'membership' },
		{ href: '/competition', label: 'competition' },
		{ href: '/challenge', label: 'snd challenge' },
		{ href: '/', label: 'archive' }
	] as const;

	const favoritesCount = $derived(favoriteIds().length);

	function toggleMenu() {
		menuOpen = !menuOpen;
	}

	function closeIfOutside(event: MouseEvent) {
		if (menuRoot?.contains(event.target as Node)) return;
		menuOpen = false;
	}
</script>

<svelte:window onclick={closeIfOutside} />

<header class="header">
	<div class="bar">
		<div class="left" bind:this={menuRoot}>
			<button
				class="menu-btn"
				class:open={menuOpen}
				type="button"
				aria-expanded={menuOpen}
				aria-controls="site-menu"
				onclick={toggleMenu}
			>
				<span class="burger" aria-hidden="true"></span>
				MENU
			</button>
			{#if menuOpen}
				<nav id="site-menu" class="dropdown" aria-label="Site">
					{#each links as link (link.href)}
						<a
							href={resolve(link.href)}
							aria-current={page.url.pathname === link.href ? 'page' : undefined}
							onclick={() => (menuOpen = false)}>{link.label}</a
						>
					{/each}
				</nav>
			{/if}
		</div>

		<a class="logo" href={resolve('/')} aria-label="SND home">
			<img src="/assets/logo.png" alt="snd" width="86" height="31" />
		</a>

		<nav class="right" aria-label="Account">
			<a
				class="nav-link"
				href={resolve('/favorites')}
				class:active={page.url.pathname === '/favorites'}
			>
				Favorites{favoritesCount ? ` (${favoritesCount})` : ''}
			</a>
			<a class="nav-link" href={resolve('/account')}>account</a>
		</nav>
	</div>

	<!-- <button class="theme" type="button" onclick={cycleTheme}>
		new theme
		<Icon name="shuffle" width={20} height={14} />
	</button> -->
</header>

<style>
	.header {
		position: sticky;
		top: 0;
		z-index: 20;
		background: var(--color-header-wash);
		border-bottom: var(--border-width) solid var(--color-ink);
	}

	.bar {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		height: var(--header-height);
		padding: 0 var(--page-gutter);
	}

	.left {
		position: relative;
		justify-self: start;
	}

	.menu-btn,
	.nav-link {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		font-size: 16px;
		font-weight: 600;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.menu-btn {
		height: 51px;
		padding: 0 10px 0 8px;
		margin-left: -8px;
	}

	.menu-btn.open {
		background: var(--color-ink);
		color: var(--color-bg);
	}

	.burger {
		width: 13px;
		height: 12px;
		flex: none;
		background: currentColor;
		mask: url('/assets/icons/menu.svg') center / 13px 12px no-repeat;
	}

	.logo {
		display: flex;
		justify-content: center;
	}

	.logo img {
		width: 86px;
		height: 31px;
		object-fit: contain;
		object-position: bottom;
	}

	.right {
		justify-self: end;
		display: flex;
		gap: 13px;
	}

	.nav-link.active {
		color: var(--color-accent);
	}

	.dropdown {
		position: absolute;
		top: 100%;
		left: -8px;
		width: 314px;
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
