<script lang="ts">
	let {
		award,
		facing = 'left',
		variant = 'award'
	}: {
		award: string;
		facing?: 'left' | 'right';
		variant?: 'award' | 'section';
	} = $props();

	const SHORT: Record<string, string> = {
		"Judge's Special Recognition": 'J.S.R.',
		'Award of Excellence': 'A.O.E.'
	};

	const label = $derived(
		award.startsWith("World's Best") ? "World's Best" : (SHORT[award] ?? award)
	);
</script>

<span class="slug-bold flag {facing}" class:section={variant === 'section'}>{label}</span>

<style>
	.flag {
		--notch: 14px;

		display: inline-flex;
		align-items: center;
		height: 27px;
		padding: 0 calc(var(--notch) + 8px) 0 8px;
		background: var(--color-award);
		white-space: nowrap;
		font-size: 13px;
		clip-path: polygon(0 0, 100% 0, calc(100% - var(--notch)) 50%, 100% 100%, 0 100%);
	}

	.left {
		padding: 0 8px 0 calc(var(--notch) + 8px);
		clip-path: polygon(0 0, var(--notch) 50%, 0 100%, 100% 100%, 100% 0);
	}

	/* ink edge, accent inside, inset 1.5px */
	.flag.section {
		position: relative;
		z-index: 0;
		background: var(--color-ink);
	}

	.flag.section::before {
		content: '';
		position: absolute;
		inset: 0;
		z-index: -1;
		background: var(--color-accent);
		clip-path: polygon(
			3.72px 1.5px,
			calc(100% - 1.5px) 1.5px,
			calc(100% - 1.5px) 25.5px,
			3.72px 25.5px,
			calc(var(--notch) + 2.16px) 13.5px
		);
	}

	.flag.section.right::before {
		clip-path: polygon(
			1.5px 1.5px,
			calc(100% - 3.72px) 1.5px,
			calc(100% - var(--notch) - 2.16px) 13.5px,
			calc(100% - 3.72px) 25.5px,
			1.5px 25.5px
		);
	}
</style>
