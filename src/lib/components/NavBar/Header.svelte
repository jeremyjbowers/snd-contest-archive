<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { favoriteIds } from '$lib/favorites.svelte';
	import Burger from '../Icons/Burger.svelte';

	let menuOpen = $state(false);
	let menuRoot = $state<HTMLDivElement | undefined>(undefined);

	const links = [
		{ href: '/about', label: 'about the archive' },
		{ href: 'https://www.snd.org', label: 'snd home' }
		// { href: '/membership', label: 'membership' },
		// { href: '/competition', label: 'competition' },
		// { href: '/challenge', label: 'snd challenge' },
		// { href: '/', label: 'archive' }
	] as const;

	// const favoritesCount = $derived(favoriteIds().length);

	function toggleMenu() {
		menuOpen = !menuOpen;
	}

	function closeIfOutside(event: MouseEvent) {
		if (menuRoot?.contains(event.target as Node)) return;
		menuOpen = false;
	}
</script>

<svelte:window onclick={closeIfOutside} />

<header class="header slug-bold">
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
				<span class="mark"><Burger size={18} /></span>
				MENU
			</button>
			{#if menuOpen}
				<nav id="site-menu" class="dropdown" aria-label="Site">
					{#each links as link (link.href)}
						<a
							href={link.label.includes('snd') ? link.href : resolve(link.href)}
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

		<nav class="right">
			<a
				class="nav-link"
				href={resolve('/favorites')}
				class:active={page.url.pathname === '/favorites'}
			>
				Favorites
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
		gap: 5px;
		padding: 5px 8px 0 0;
	}

	.mark {
		display: flex;
		transform: translateY(-1px); /* cap line of MENU */
	}

	.menu-btn.open {
		background: var(--color-ink);
		color: var(--color-bg);
	}

	.logo {
		display: flex;
		justify-content: center;
		filter: brightness(0);
	}

	.logo img {
		width: auto;
		height: 28px;
		object-fit: contain;
	}

	.nav-link.active {
		color: var(--color-accent);
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
