import assert from 'node:assert/strict';
import test from 'node:test';
import { pickProject } from './digitalocean-project.ts';

const overSlot = { id: 'slot', name: 'Over slot' };
const baseball = { id: 'bb', name: 'baseball' };

test('picks baseball when Over slot is also present', () => {
	assert.deepEqual(pickProject([overSlot, { id: 'BB', name: 'Baseball' }]), {
		id: 'BB',
		name: 'Baseball'
	});
});

test('prefers the exact baseball project over a similarly named one', () => {
	assert.equal(
		pickProject([overSlot, baseball, { id: 'staging', name: 'baseball staging' }]).id,
		'bb'
	);
});

test('refuses when the only projects are Over slot', () => {
	assert.throws(() => pickProject([overSlot, { id: 'os', name: 'overslot' }]), /Over slot/);
});

test('does not treat baiseball as the baseball project', () => {
	assert.throws(() => pickProject([{ id: 'typo', name: 'baiseball' }, overSlot]), /baseball/);
});
