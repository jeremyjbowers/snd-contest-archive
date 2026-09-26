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

<svg
	class={['icon', { filled }]}
	viewBox="0 0 20 18"
	aria-hidden="true"
	style:width={size}
	style:height={size}
	style:color
>
	<path
		d="M9.24 3L10 4L10.76 3C11.64 1.84 12.94 1 14.5 1C16.99 1 19 3.01 19 5.5C19 6.43 18.72 7.29 18.24 8C17.43 9.21 10 17 10 17C10 17 2.57 9.21 1.76 8C1.28 7.29 1 6.43 1 5.5C1 3.01 3.01 1 5.5 1C7.06 1 8.36 1.84 9.24 3Z"
	/>
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
