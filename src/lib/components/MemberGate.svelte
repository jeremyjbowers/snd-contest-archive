<script lang="ts">
	import { SND_SIGN_IN_URL } from '$lib/auth/member';
</script>

<main class="page">
	<div class="frame">
		<div class="top">
			<p class="kicker">members</p>
			<h1>The archive is for members.</h1>
		</div>
		<div class="copy">
			<p>
				Sign in with your SND account, then come back to this page. Once the snd.org menu includes
				the archive, that link brings you here too.
			</p>
			<!-- External site; resolve() only accepts app routes. -->
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
			<a class="signin slug-bold" href={SND_SIGN_IN_URL}>Sign in at snd.org</a>
		</div>
	</div>
</main>

<style>
	.page {
		--inset: 24px;

		display: grid;
		max-width: var(--page-max);
		min-height: calc(100dvh - var(--header-height) - var(--border-width));
		margin: 0 auto;
		padding: var(--page-margin);
	}

	.frame {
		display: flex;
		flex-direction: column;
		border-left: var(--border-width) solid var(--color-ink);
		border-right: var(--border-width) solid var(--color-ink);
	}

	.top {
		margin: 0 var(--filter-inset);
		padding: 120px 0 24px;
		border-bottom: var(--border-width) solid var(--color-ink);
	}

	.kicker {
		padding: 0 calc(var(--inset) - var(--filter-inset));
		font-family: var(--font-serif);
		font-style: italic;
		font-weight: 300;
		font-size: 20px;
	}

	h1 {
		max-width: 12em;
		margin-top: 8px;
		padding: 0 calc(var(--inset) - var(--filter-inset));
		font-family: var(--font-serif);
		font-weight: 700;
		font-size: clamp(40px, 6vw, 64px);
		line-height: 0.95;
	}

	.copy {
		padding: 32px var(--inset) 80px;
	}

	p {
		max-width: 36em;
		font-family: var(--font-serif);
		font-weight: 300;
		font-size: 18px;
		line-height: 1.4;
	}

	.signin {
		display: inline-block;
		margin-top: 28px;
		padding: 8px 12px;
		background: var(--color-ink);
		color: var(--color-bg);
	}

	.signin:hover,
	.signin:focus-visible {
		background: var(--color-accent);
		color: var(--color-bg);
	}

	@media (max-width: 800px) {
		.top {
			padding-top: 48px;
		}
	}
</style>
