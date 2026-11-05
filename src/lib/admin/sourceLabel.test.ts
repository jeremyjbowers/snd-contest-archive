import assert from 'node:assert/strict';
import test from 'node:test';
import { formatSourceLabel, formatYearRange } from './sourceLabel.ts';

test('print and results sheets show contest season year', () => {
	assert.equal(formatSourceLabel('SND47 Results', [2025]), 'SND 47 results (2025)');
	assert.equal(formatSourceLabel('SND42 print', [2020]), 'SND 42 print (2020)');
});

test('archive and year tables show year ranges', () => {
	assert.equal(formatSourceLabel('Archive', [2011, 2017, 2019]), 'Archive (2011–2019)');
	assert.equal(formatSourceLabel('2021', [2020, 2021]), '2021 digital (2020–2021)');
});

test('formatYearRange', () => {
	assert.equal(formatYearRange([2022]), '2022');
	assert.equal(formatYearRange([2020, 2021]), '2020–2021');
});
