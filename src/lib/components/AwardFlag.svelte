<script lang="ts">
	let { label = 'AWARD' }: { label?: string } = $props();
</script>

<span class="flag">
	<img src="/assets/icons/award-flag.svg" alt="" width="91" height="27" />
	<span class="label">{label}</span>
</span>

<style>
	.flag {
		position: relative;
		display: inline-block;
		width: 91px;
		height: 27px;
		flex: none;
	}

	.flag img {
		width: 91px;
		height: 27px;
	}

	.label {
		position: absolute;
		inset: 0 10px 0 8px;
		display: flex;
		align-items: center;
		font-family: var(--font-sans);
		font-size: 12px;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		white-space: nowrap;
		overflow: hidden;
	}
</style>
