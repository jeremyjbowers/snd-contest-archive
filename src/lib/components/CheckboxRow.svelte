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
	<input type="checkbox" {checked} onchange={(event) => onchange?.(event.currentTarget.checked)} />
	<span>{label}</span>
</label>

<style>
	.row {
		--box-size: 16px;
		--box-stroke: 1.5px;
		--box-radius: 2px;

		display: flex;
		align-items: flex-start;
		gap: 7px;
		cursor: pointer;
	}

	.row input {
		appearance: none;
		display: grid;
		place-content: center;
		flex: none;
		width: var(--box-size);
		height: var(--box-size);
		margin: 0;
		border: var(--box-stroke) solid var(--color-ink);
		border-radius: var(--box-radius);
		background: transparent;
		cursor: pointer;
	}

	.row input:checked {
		background: var(--color-accent);
	}

	/* checkmark: the left and bottom sides of a box, rotated to a tick */
	.row input:checked::before {
		content: '';
		width: 9px;
		height: 5.9px;
		border-left: var(--box-stroke) solid var(--color-ink);
		border-bottom: var(--box-stroke) solid var(--color-ink);
		transform: rotate(-45deg);
	}
</style>
