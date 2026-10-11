<script lang="ts">
	import { onMount } from 'svelte';
	import { cubicIn, cubicOut } from 'svelte/easing';
	import { prefersReducedMotion } from 'svelte/motion';
	import type { EntrySummary } from '$lib/catalog/types';
	import EntryCard from './EntryCard.svelte';

	const PHASE = 180; // ms to drop out of a cell, and again to rise into one
	const SKIP = 1; // 0 finishes in sync and strands the cards that are still moving
	const COL_STEP = 60; // ms; the next card in a row waits this long
	const ROW_STEP = 90; // ms; the next row waits this long
	const SPREAD = 180; // cap so a full screen of cards doesn't drag the filter
	const JITTER = 20; // ms either way; smaller than half a column step, so neighbors keep their order

	let { entries }: { entries: EntrySummary[] } = $props();

	let intro = false; // skip the rise on first paint
	onMount(() => {
		intro = true;
	});

	type Box = Pick<DOMRect, 'top' | 'right' | 'bottom' | 'left'>;

	function port(grid: Element): Box {
		const box = grid.getBoundingClientRect();
		const scrolls = grid.scrollHeight > grid.clientHeight + 1;
		if (scrolls) return box;
		return {
			top: Math.max(box.top, 0),
			right: Math.min(box.right, window.innerWidth),
			bottom: Math.min(box.bottom, window.innerHeight),
			left: Math.max(box.left, 0)
		};
	}

	function overlaps(rect: Box, view: Box) {
		return (
			rect.bottom > view.top &&
			rect.top < view.bottom &&
			rect.right > view.left &&
			rect.left < view.right
		);
	}

	function onScreen(node: Element, rect: Box) {
		const grid = node.parentElement;
		if (!grid) return false;
		return overlaps(rect, port(grid));
	}

	// reading order from the first row on screen: left to right, then the next row
	function ripple(grid: Element, anchor: DOMRect) {
		const styles = getComputedStyle(grid);
		const pitchY = anchor.height + (parseFloat(styles.rowGap) || 0);
		const pitchX = anchor.width + (parseFloat(styles.columnGap) || 0);
		if (pitchY <= 0 || pitchX <= 0) return 0;
		const gridBox = grid.getBoundingClientRect();
		const firstRow = Math.max(0, Math.floor((port(grid).top - gridBox.top) / pitchY));
		const row = Math.max(0, Math.round((anchor.top - gridBox.top) / pitchY) - firstRow);
		const col = Math.max(0, Math.round((anchor.left - gridBox.left) / pitchX));
		return Math.min(row * ROW_STEP + col * COL_STEP, SPREAD);
	}

	function wait(grid: Element, anchor: DOMRect) {
		const nudge = (Math.random() - 0.5) * 2 * JITTER;
		return Math.max(0, Math.round(ripple(grid, anchor) + nudge));
	}

	// s = 0 sits in the cell, 1 is fully below it; clipped at the cell's bottom edge
	function slot(h: number, s: number, base = '') {
		const y = s * h;
		return `transform: ${base} translateY(${y}px); clip-path: inset(0 0 ${y}px 0)`;
	}

	function enter(node: Element) {
		if (!intro || prefersReducedMotion.current) return { duration: 0 };
		const rect = node.getBoundingClientRect();
		const grid = node.parentElement;
		if (!grid || !onScreen(node, rect)) return { duration: grid ? SKIP : 0 };
		const h = (node as HTMLElement).offsetHeight;
		return {
			delay: PHASE + wait(grid, rect),
			duration: PHASE,
			easing: cubicOut,
			css: (t: number, u: number) => slot(h, u)
		};
	}

	function leave(node: Element) {
		if (prefersReducedMotion.current) return { duration: 0 };
		const rect = node.getBoundingClientRect();
		const grid = node.parentElement;
		if (!grid || !onScreen(node, rect)) return { duration: grid ? SKIP : 0 };
		const h = (node as HTMLElement).offsetHeight;
		const base = getComputedStyle(node).transform.replace('none', ''); // keeps the leaving card in its old cell
		return {
			delay: wait(grid, rect),
			duration: PHASE,
			easing: cubicIn,
			css: (t: number, u: number) => slot(h, u, base)
		};
	}

	function move(node: Element, { from, to }: { from: DOMRect; to: DOMRect }) {
		const grid = node.parentElement;
		if (prefersReducedMotion.current || !grid) return { duration: 0 };
		const view = port(grid);
		const fromHere = overlaps(from, view);
		if (!fromHere && !overlaps(to, view)) return { duration: 0 };
		const old = `translate(${from.left - to.left}px, ${from.top - to.top}px)`;
		return {
			delay: wait(grid, fromHere ? from : to), // drop in the order of the cells you're looking at
			duration: PHASE * 2,
			css: (t: number) =>
				t < 0.5 ? slot(from.height, cubicIn(t * 2), old) : slot(to.height, 1 - cubicOut(t * 2 - 1))
		};
	}
</script>

{#each entries as entry (entry.id)}
	<div class="frame" animate:move in:enter out:leave>
		<EntryCard {entry} />
	</div>
{/each}

<style>
	.frame {
		min-width: 0;
	}
</style>
