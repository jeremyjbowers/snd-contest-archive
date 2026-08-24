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

<label class="row">
	<input type="checkbox" {checked} onchange={(event) => onchange?.(event.currentTarget.checked)} />
	<img
		src={checked ? '/assets/icons/checkbox-checked.svg' : '/assets/icons/checkbox.svg'}
		alt=""
		width="20"
		height="20"
	/>
	<span>{label}</span>
</label>

<style>
	.row {
		display: flex;
		align-items: flex-start;
		gap: 7px;
		cursor: pointer;
		font-size: 16px;
		font-weight: 300;
		line-height: 1.2;
	}

	.row input {
		position: absolute;
		opacity: 0;
		pointer-events: none;
	}

	.row img {
		width: 20px;
		height: 20px;
		flex: none;
	}
</style>
