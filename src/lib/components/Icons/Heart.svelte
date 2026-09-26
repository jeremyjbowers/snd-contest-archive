<script lang="ts">
	let {
		size = 24,
		color = 'currentColor',
		filled = false
	}: {
		size?: number;
		color?: string;
		filled?: boolean;
	} = $props();
</script>

<!-- Tabler: heart. Filled keeps the stroke. -->
<svg
	class={['icon', { filled }]}
	viewBox="0 0 24 24"
	aria-hidden="true"
	style:width={size}
	style:height={size}
	style:color
>
	<path d="M19.5 12.572L12 20l-7.5-7.428A5 5 0 1 1 12 6.006a5 5 0 1 1 7.5 6.572" />
</svg>

<style>
	.icon {
		display: block;
		flex: none;
	}

	path {
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.filled path {
		fill: var(--color-accent);
	}
</style>
