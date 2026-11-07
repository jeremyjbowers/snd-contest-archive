<script lang="ts">
	import { saveCategoryDraft, draftFor, categoryDrafts } from '$lib/admin/categoryDrafts.svelte';
	import { suggestFromSheetLines, type SheetLine } from '$lib/admin/categoryMapping';

	const CATEGORY_LIST = 'snd-mapping-categories';
	const SUBCATEGORY_LIST = 'snd-mapping-subcategories';
	const TOPIC_LIST = 'snd-mapping-topics';

	let {
		rowKey,
		lines,
		currentDiscipline
	}: { rowKey: string; lines: SheetLine[]; currentDiscipline: string } = $props();

	const DISCIPLINE_LIST = 'snd-mapping-disciplines';

	const store = $derived(categoryDrafts());
	const draft = $derived({ ...draftFor(rowKey), ...store[rowKey] });
	const disciplineValue = $derived(draft.discipline || currentDiscipline);

	function splitColon() {
		saveCategoryDraft(rowKey, suggestFromSheetLines(lines));
	}
</script>

<button type="button" class="split" onclick={splitColon}>Split on colon</button>
<dl class="fields target-fields">
	<div>
		<dt>Category</dt>
		<dd>
			<input
				type="text"
				list={CATEGORY_LIST}
				value={draft.category}
				oninput={(event) => saveCategoryDraft(rowKey, { category: event.currentTarget.value })}
			/>
		</dd>
	</div>
	<div>
		<dt>Subcategory</dt>
		<dd>
			<input
				type="text"
				list={SUBCATEGORY_LIST}
				value={draft.subcategory}
				oninput={(event) =>
					saveCategoryDraft(rowKey, { subcategory: event.currentTarget.value })}
			/>
		</dd>
	</div>
	<div>
		<dt>Topic</dt>
		<dd>
			<input
				type="text"
				list={TOPIC_LIST}
				value={draft.topic}
				placeholder="Often blank"
				oninput={(event) => saveCategoryDraft(rowKey, { topic: event.currentTarget.value })}
			/>
		</dd>
	</div>
	<div>
		<dt>Discipline</dt>
		<dd>
			<input
				type="text"
				list={DISCIPLINE_LIST}
				value={disciplineValue}
				oninput={(event) =>
					saveCategoryDraft(rowKey, { discipline: event.currentTarget.value })}
			/>
		</dd>
	</div>
</dl>
<label class="done">
	<input
		type="checkbox"
		checked={draft.done}
		onchange={(event) => saveCategoryDraft(rowKey, { done: event.currentTarget.checked })}
	/>
	Done
</label>

<style>
	.split {
		margin-bottom: 8px;
		border: var(--border-width) solid var(--color-ink);
		background: transparent;
		padding: 2px 6px;
		font-family: var(--font-sans);
		font-size: 11px;
		font-weight: 500;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		line-height: 1.2;
	}

	input[type='text'] {
		border: var(--border-width) solid var(--color-ink);
		background: var(--color-input);
		padding: 6px 8px;
		width: 100%;
		font-family: var(--font-sans);
		font-size: 14px;
		line-height: 1.3;
	}

	.done {
		display: flex;
		gap: 6px;
		align-items: center;
		margin-top: 10px;
		font-size: 12px;
	}

	.done input {
		width: 14px;
		height: 14px;
		margin: 0;
	}

	.target-fields {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin: 0;
	}

	.target-fields div {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	dd {
		margin: 0;
	}

	dt {
		color: var(--color-muted);
		font-size: 11px;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}
</style>
