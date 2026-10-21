<script lang="ts">
	import AwardFlag from '$lib/components/Grid/AwardFlag.svelte';
	import about from '../../../data/about.json';
</script>

<svelte:head>
	<title>About SND — the Archive</title>
</svelte:head>

<main class="page">
	<div class="frame">
		<div class="top">
			<h1>{about.title}</h1>
		</div>
		<div class="columns">
			{#each about.sections as section (section.flag)}
				<section class="column">
					<AwardFlag award={section.flag} variant="section" facing="right" />
					{#each section.blocks as block (block.heading)}
						<div class="block">
							<h2>{block.heading}</h2>
							{#each block.paragraphs as paragraph (paragraph)}
								<p>{paragraph}</p>
							{/each}
						</div>
					{/each}
				</section>
			{/each}
		</div>
	</div>
</main>

<style>
	.page {
		--inset: 24px; /* text inset from the outer lines */
		--title-top: 156px;

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
		padding: var(--title-top) 0 24px;
		border-bottom: var(--border-width) solid var(--color-ink);
	}

	h1 {
		padding: 0 calc(var(--inset) - var(--filter-inset));
		font-family: var(--font-serif);
		font-weight: 700;
		font-size: 40px;
		line-height: 1;
	}

	.columns {
		flex: 1;
		display: grid;
		grid-template-columns: 1fr 1fr;
		margin-top: 16px;
	}

	.column {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 28px;
		padding: 32px var(--inset);
	}

	.column + .column {
		border-left: var(--border-width) solid var(--color-ink);
	}

	.block + .block {
		margin-top: 24px;
	}

	h2 {
		margin-bottom: 10px;
		font-family: var(--font-sans);
		font-weight: 500;
		font-size: 12px;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	p {
		max-width: 33em;
		font-family: var(--font-serif);
		font-weight: 300;
		font-size: 15px;
		line-height: 1.2;
	}

	p + p {
		margin-top: 15px;
	}

	@media (max-width: 800px) {
		.page {
			--title-top: 48px;
		}

		.columns {
			grid-template-columns: 1fr;
		}

		.column + .column {
			border-left: none;
			border-top: var(--border-width) solid var(--color-ink);
		}
	}
</style>
