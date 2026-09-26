<script lang="ts">
	let {
		size = 24,
		color = 'currentColor',
		minus = false
	}: {
		size?: number;
		color?: string;
		minus?: boolean;
	} = $props();
</script>

<!-- Tabler: plus / minus. Stem rotates onto the bar. -->
<svg
	class={['icon', { minus }]}
	viewBox="0 0 24 24"
	aria-hidden="true"
	style:width={size}
	style:height={size}
	style:color
>
	<line class="bar" x1="5" y1="12" x2="19" y2="12" />
	<line class="stem" x1="12" y1="5" x2="12" y2="19" />
</svg>

<style>
	.icon {
		display: block;
		flex: none;
	}

	line {
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
	}

	.stem {
		transform-box: view-box;
		transform-origin: center;
		transition: transform 200ms ease;
	}

	.minus .stem {
		transform: rotate(90deg);
	}

	@media (prefers-reduced-motion: reduce) {
		.stem {
			transition: none;
		}
	}
</style>
