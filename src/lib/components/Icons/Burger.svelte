<script lang="ts">
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

<!-- Tabler: menu-2. Bars pinch to the center when the menu is open. -->
<svg
	class={['icon', { collapsed }]}
	viewBox="0 0 24 24"
	aria-hidden="true"
	style:width={size}
	style:height={size}
	style:color
	style:--shift="{size / 4}px"
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
		transform-origin: center;
		transition: transform var(--menu-ms, 300ms) var(--menu-ease, ease);
	}

	.collapsed .top {
		transform: translateY(var(--shift, 6px)) scaleX(0);
	}

	.collapsed .mid {
		transform: scaleX(0);
	}

	.collapsed .bot {
		transform: translateY(calc(var(--shift, 6px) * -1)) scaleX(0);
	}

	@media (prefers-reduced-motion: reduce) {
		line {
			transition: none;
		}
	}
</style>
