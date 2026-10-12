import assert from 'node:assert/strict';
import test from 'node:test';
import { findArchiveProject, pickProject } from './digitalocean-project.ts';

const overSlot = { id: 'slot', name: 'Over slot' };
const archive = { id: 'snd', name: 'SND design archive' };

test('picks SND design archive when Over slot is also present', () => {
	assert.deepEqual(pickProject([overSlot, { id: 'SND', name: 'snd design archive' }]), {
		id: 'SND',
		name: 'snd design archive'
	});
});

test('does not use the baseball, ULMG, or NPL projects', () => {
	assert.throws(
		() =>
			pickProject([
				overSlot,
				{ id: 'bb', name: 'baseball' },
				{ id: 'ulmg', name: 'The ULMG' },
				{ id: 'npl', name: 'The NPL' }
			]),
		/SND design archive/
	);
});

test('refuses when the only projects are Over slot', () => {
	assert.throws(() => pickProject([overSlot, { id: 'os', name: 'overslot' }]), /Over Slot/);
});

test('findArchiveProject returns undefined so the caller can create one', () => {
	assert.equal(findArchiveProject([overSlot, { id: 'ulmg', name: 'The ULMG' }]), undefined);
	assert.equal(findArchiveProject([archive, overSlot])?.id, 'snd');
});
