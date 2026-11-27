import assert from 'node:assert/strict';
import test from 'node:test';
import {
	RETRY_COOKIE,
	isMemberDataPath,
	memberGateEnabled,
	membershipOrg,
	retryDocument,
	sameOriginTarget,
	sessionIsActive,
	sessionTokens,
	shouldRetryStrictCookie,
	usableSessionToken
} from './member';
import { clearSessionCache, membershipActive } from './session';

test('the gate follows the snd.org site unless the env override says otherwise', () => {
	assert.equal(memberGateEnabled('archive.snd.org', undefined), true);
	assert.equal(memberGateEnabled('snd.org', undefined), true);
	assert.equal(memberGateEnabled('SND.ORG', undefined), true);
	assert.equal(memberGateEnabled('localhost', undefined), false);
	assert.equal(memberGateEnabled('preview.ondigitalocean.app', undefined), false);
	assert.equal(memberGateEnabled('notsnd.org', undefined), false);
	assert.equal(memberGateEnabled('snd.org.example', undefined), false);
	assert.equal(memberGateEnabled('localhost', 'on'), true);
	assert.equal(memberGateEnabled('archive.snd.org', 'off'), false);
});

test('org id falls back when the setting is not numeric', () => {
	assert.equal(membershipOrg(undefined), '17787');
	assert.equal(membershipOrg('42'), '42');
	assert.equal(membershipOrg('nope'), '17787');
});

test('a session is active only when MembershipWorks returns a uid', () => {
	assert.equal(sessionIsActive({ uid: 'member' }), true);
	assert.equal(sessionIsActive({ uid: 4 }), true);
	assert.equal(sessionIsActive({ uid: '  ' }), false);
	assert.equal(sessionIsActive({ _st: {} }), false);
	assert.equal(sessionIsActive(null), false);
	assert.equal(sessionIsActive('uid'), false);
});

test('cookie values that are not session tokens are ignored', () => {
	assert.equal(usableSessionToken('short'), null);
	assert.equal(usableSessionToken('bad token!!'), null);
	assert.equal(usableSessionToken('abc\n1234567890'), null);
	assert.equal(usableSessionToken('abcdefghij_-'), 'abcdefghij_-');
	assert.deepEqual(sessionTokens('theme=paper; SFSF=short; SFSF=abcdefghijklmnop'), [
		'abcdefghijklmnop'
	]);
	assert.deepEqual(sessionTokens('SFSF=abcdefghijklmnop; SFSF=zzzzzzzzzzzz'), [
		'abcdefghijklmnop',
		'zzzzzzzzzzzz'
	]);
});

test('strict-cookie retry happens once, and only for a cross-site document', () => {
	const arrival = {
		gate: true,
		member: false,
		method: 'GET',
		pathname: '/',
		fetchSite: 'cross-site',
		fetchDest: 'document',
		accept: 'text/html',
		retried: false
	};
	assert.equal(shouldRetryStrictCookie(arrival), true);
	assert.equal(shouldRetryStrictCookie({ ...arrival, fetchSite: 'same-origin' }), false);
	assert.equal(shouldRetryStrictCookie({ ...arrival, fetchSite: 'none' }), false);
	assert.equal(shouldRetryStrictCookie({ ...arrival, retried: true }), false);
	assert.equal(shouldRetryStrictCookie({ ...arrival, member: true }), false);
	assert.equal(shouldRetryStrictCookie({ ...arrival, pathname: '/api/entries' }), false);
	assert.equal(shouldRetryStrictCookie({ ...arrival, pathname: '/health' }), false);
	assert.equal(shouldRetryStrictCookie({ ...arrival, fetchDest: 'image' }), false);
	assert.equal(shouldRetryStrictCookie({ ...arrival, gate: false }), false);
	assert.equal(isMemberDataPath('/media/af-1/0'), true);
	assert.equal(RETRY_COOKIE, 'snd_gate');
});

test('the retry document stays on this site', () => {
	const html = retryDocument(sameOriginTarget('/entries/kept', '?award=Gold'));
	assert.match(html, /\/entries\/kept\?award=Gold/);
	assert.equal(retryDocument('//evil.example/phish').includes('evil.example'), false);
	assert.equal(sameOriginTarget('https://evil.example', ''), '/');
});

test('session check sends the bearer token and remembers the answer', async () => {
	clearSessionCache();
	const calls: string[] = [];
	const options = {
		org: '17787',
		url: 'https://api.membershipworks.com/v2/account/session',
		fetch: async (_url: string | URL | Request, init?: RequestInit) => {
			const headers = init?.headers as Record<string, string>;
			calls.push(headers.Authorization);
			assert.equal(headers['X-Org'], '17787');
			return new Response(JSON.stringify({ uid: calls.length === 1 ? 'member' : '' }), {
				status: 200,
				headers: { 'content-type': 'application/json' }
			});
		}
	};
	assert.equal(await membershipActive('abcdefghij', { ...options, now: 1_000 }), true);
	assert.equal(await membershipActive('abcdefghij', { ...options, now: 2_000 }), true);
	assert.deepEqual(calls, ['Bearer abcdefghij']);

	assert.equal(
		await membershipActive('zzzzzzzzzz', {
			...options,
			now: 1_000,
			fetch: async () => new Response(JSON.stringify({ _st: {} }), { status: 200 })
		}),
		false
	);
});
