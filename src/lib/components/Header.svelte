<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { cycleTheme } from '$lib/theme.svelte';
	import { favoriteIds } from '$lib/favorites.svelte';
	import Icon from './Icon.svelte';

	let menuOpen = $state(false);

	const links = [
		{ href: '/about', label: 'about snd' },
		{ href: '/membership', label: 'membership' },
		{ href: '/competition', label: 'competition' },
		{ href: '/challenge', label: 'snd challenge' },
		{ href: '/', label: 'archive' }
	] as const;

	const favoritesCount = $derived(favoriteIds().length);
</script>

<header class="header">
	<div class="bar">
		<div class="left">
			<button
				class="menu-btn"
				type="button"
				aria-expanded={menuOpen}
				onclick={() => (menuOpen = !menuOpen)}
			>
				<Icon name="menu" width={13} height={12} />
				MENU
			</button>
			{#if menuOpen}
				<nav class="dropdown" aria-label="Site">
					{#each links as link (link.href)}
						<a href={resolve(link.href)} onclick={() => (menuOpen = false)}>{link.label}</a>
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

	<button class="theme" type="button" onclick={cycleTheme}>
		new theme
		<Icon name="shuffle" width={20} height={14} />
	</button>
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
		top: calc(100% + 8px);
		left: -8px;
		width: 314px;
		background: var(--color-paper);
		border: var(--border-width) solid var(--color-ink);
		box-shadow: var(--shadow-menu);
		padding: 35px 20px;
		display: flex;
		flex-direction: column;
		gap: 37px;
		z-index: 30;
	}

	.dropdown a {
		font-size: 16px;
		font-weight: 600;
		letter-spacing: 0.04em;
		text-transform: uppercase;
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
