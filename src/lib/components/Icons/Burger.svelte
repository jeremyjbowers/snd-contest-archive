<script lang="ts">
	const STEP = 70; // ms between bars, bottom first

	let {
		size = 24,
		color = 'currentColor',
		collapsed = false
	}: {
		size?: number;
		color?: string;
		collapsed?: boolean;
	} = $props();
</script>

<!-- Tabler: menu-2, cropped so the bars are flush to the edges. Bars grow in left to right, bottom first. -->
<svg
	class={['icon', { collapsed }]}
	viewBox="3 0 18 24"
	aria-hidden="true"
	style:width={size * 0.75}
	style:height={size}
	style:color
	style:--step="{STEP}ms"
>
	<line class="bar top" x1="4" y1="6" x2="20" y2="6" />
	<line class="bar mid" x1="4" y1="12" x2="20" y2="12" />
	<line class="bar bot" x1="4" y1="18" x2="20" y2="18" />
</svg>

<style>
	.icon {
		display: block;
		flex: none;
		overflow: visible;
	}

	line {
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		transform-box: view-box;
		transform-origin: 4px center; /* grows from the left end */
		transition: transform var(--menu-ms, 300ms) var(--menu-ease, ease);
	}

	.bot {
		transition-delay: 0ms;
	}

	.mid {
		transition-delay: var(--step);
	}

	.top {
		transition-delay: calc(var(--step) * 2);
	}

	.collapsed line {
		transform: scaleX(0);
		transition-delay: 0ms; /* all bars retract together */
	}

	@media (prefers-reduced-motion: reduce) {
		line {
			transition: none;
		}
	}
</style>
