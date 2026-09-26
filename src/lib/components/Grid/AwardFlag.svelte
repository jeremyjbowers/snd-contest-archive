<script lang="ts">
	let {
		award,
		facing = 'left'
	}: {
		award: string;
		facing?: 'left' | 'right';
	} = $props();

	const SHORT: Record<string, string> = {
		"Judge's Special Recognition": 'J.S.R.',
		'Award of Excellence': 'A.O.E.'
	};

	const label = $derived(SHORT[award] ?? award);
</script>

<span class='slug-bold flag {facing}'>{label}</span>

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
</style>
