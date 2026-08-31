<script lang="ts">
	let {
		min,
		max,
		low = $bindable(),
		high = $bindable(),
		oncommit
	}: {
		min: number;
		max: number;
		low: number;
		high: number;
		oncommit?: () => void;
	} = $props();

	let track = $state<HTMLDivElement | undefined>(undefined);
	let dragging = $state<'low' | 'high' | null>(null);

	const span = $derived(Math.max(max - min, 1));
	const lowPct = $derived(((low - min) / span) * 100);
	const highPct = $derived(((high - min) / span) * 100);

	function yearFromClientX(clientX: number) {
		const rect = track!.getBoundingClientRect();
		const pct = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
		return Math.round(min + pct * span);
	}

	function assign(thumb: 'low' | 'high', year: number) {
		if (thumb === 'low') low = Math.min(Math.max(year, min), high);
		else high = Math.max(Math.min(year, max), low);
	}

	function start(thumb: 'low' | 'high', event: PointerEvent) {
		event.preventDefault();
		event.stopPropagation();
		dragging = thumb;
		track?.setPointerCapture(event.pointerId);
		assign(thumb, yearFromClientX(event.clientX));
	}

	function onPointerMove(event: PointerEvent) {
		if (!dragging || !track) return;
		assign(dragging, yearFromClientX(event.clientX));
	}

	function onPointerUp(event: PointerEvent) {
		if (!dragging) return;
		dragging = null;
		if (track?.hasPointerCapture(event.pointerId)) {
			track.releasePointerCapture(event.pointerId);
		}
		oncommit?.();
	}

	function nudge(thumb: 'low' | 'high', delta: number) {
		assign(thumb, (thumb === 'low' ? low : high) + delta);
		oncommit?.();
	}

	function onKey(thumb: 'low' | 'high', event: KeyboardEvent) {
		if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
			event.preventDefault();
			nudge(thumb, -1);
		} else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
			event.preventDefault();
			nudge(thumb, 1);
		} else if (event.key === 'Home') {
			event.preventDefault();
			nudge(thumb, thumb === 'low' ? min - low : low - high);
		} else if (event.key === 'End') {
			event.preventDefault();
			nudge(thumb, thumb === 'low' ? high - low : max - high);
		}
	}

	function onTrackPointerDown(event: PointerEvent) {
		if (!track || (event.target as HTMLElement).closest('.knob')) return;
		const year = yearFromClientX(event.clientX);
		const next = Math.abs(year - low) <= Math.abs(year - high) ? 'low' : 'high';
		start(next, event);
	}
</script>

<div
	bind:this={track}
	class="slider"
	role="group"
	aria-label="Year range"
	onpointerdown={onTrackPointerDown}
	onpointermove={onPointerMove}
	onpointerup={onPointerUp}
	onpointercancel={onPointerUp}
>
	<div class="track"></div>
	<div class="range" style="left: {lowPct}%; width: {highPct - lowPct}%"></div>
	<div
		class="knob"
		class:active={dragging === 'low'}
		role="slider"
		tabindex="0"
		aria-label="Earliest year"
		aria-valuemin={min}
		aria-valuemax={high}
		aria-valuenow={low}
		style="left: {lowPct}%"
		onpointerdown={(event) => start('low', event)}
		onkeydown={(event) => onKey('low', event)}
	></div>
	<div
		class="knob"
		class:active={dragging === 'high'}
		role="slider"
		tabindex="0"
		aria-label="Latest year"
		aria-valuemin={low}
		aria-valuemax={max}
		aria-valuenow={high}
		style="left: {highPct}%"
		onpointerdown={(event) => start('high', event)}
		onkeydown={(event) => onKey('high', event)}
	></div>
	<span class="year" style="left: {lowPct}%">{low}</span>
	<span class="year" style="left: {highPct}%">{high}</span>
</div>

<style>
	.slider {
		position: relative;
		height: 36px;
		margin: 8px 0 4px;
		touch-action: none;
		user-select: none;
	}

	.track,
	.range {
		position: absolute;
		top: 5px;
		height: 0;
		pointer-events: none;
	}

	.track {
		left: 0;
		right: 0;
		border-top: var(--border-width) solid var(--color-ink);
	}

	.range {
		border-top: 2px solid var(--color-accent);
	}

	.knob {
		position: absolute;
		top: 0;
		width: 11px;
		height: 11px;
		margin-left: -5.5px;
		border-radius: 50%;
		background: var(--color-bg);
		border: 2px solid var(--color-accent);
		z-index: 1;
		cursor: grab;
	}

	.knob.active {
		z-index: 2;
		cursor: grabbing;
	}

	.year {
		position: absolute;
		top: 16px;
		font-size: 16px;
		font-weight: 300;
		transform: translateX(-50%);
		white-space: nowrap;
		pointer-events: none;
	}
</style>
