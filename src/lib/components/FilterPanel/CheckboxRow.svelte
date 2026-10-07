<script lang="ts">
	let {
		checked = false,
		label,
		onchange
	}: {
		checked?: boolean;
		label: string;
		onchange?: (next: boolean) => void;
	} = $props();
</script>

<label class="row list-sans">
	<span class="box">
		<input type="checkbox" {checked} onchange={(event) => onchange?.(event.currentTarget.checked)} />
		<!-- Material Symbols: check, traced as a centerline so the stroke matches the border -->
		<svg class="tick" viewBox="0 0 24 24" aria-hidden="true">
			<polyline points="4.56 11.59 9.55 16.58 19.44 6.69" />
		</svg>
	</span>
	<span class='label'>{label}</span>
</label>

<style>
	.label {
		text-box-edge: cap alphabetic;
		text-box-trim: trim-both;
	}
	.row {
		--box-size: 16px;
		--box-stroke: 1.5px;
		--box-radius: 2px;

		display: flex;
		align-items: center;
		gap: 7px;
		cursor: pointer;
	}

	.box {
		position: relative;
		flex: none;
		width: var(--box-size);
		height: var(--box-size);
	}

	.box input {
		appearance: none;
		position: absolute;
		inset: 0;
		margin: 0;
		border: var(--box-stroke) solid var(--color-ink);
		border-radius: var(--box-radius);
		background: transparent;
		cursor: pointer;
	}

	.box input:checked {
		background: var(--color-accent);
	}

	.tick {
		position: absolute;
		inset: var(--box-stroke);
		display: none;
		pointer-events: none;
	}

	.box input:checked + .tick {
		display: block;
	}

	.tick polyline {
		fill: none;
		stroke: var(--color-ink);
		stroke-width: var(--box-stroke);
		vector-effect: non-scaling-stroke; /* keeps the stroke in real pixels */
	}
</style>
