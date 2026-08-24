<script lang="ts">
	let {
		kicker = 'snd',
		title,
		body
	}: {
		kicker?: string;
		title: string;
		body: string;
	} = $props();
</script>

<main class="page">
	<p class="kicker">{kicker}</p>
	<h1>{title}</h1>
	<p class="body">{body}</p>
</main>

<style>
	.page {
		max-width: 720px;
		padding: 80px var(--page-gutter) 120px;
	}

	.kicker {
		font-family: var(--font-serif);
		font-style: italic;
		font-weight: 300;
		font-size: 20px;
	}

	h1 {
		font-family: var(--font-serif);
		font-size: clamp(48px, 7vw, 72px);
		font-weight: 700;
		line-height: 0.95;
		margin: 8px 0 28px;
	}

	.body {
		font-family: var(--font-serif);
		font-weight: 300;
		font-size: 18px;
		line-height: 1.45;
		max-width: 38em;
	}
</style>
