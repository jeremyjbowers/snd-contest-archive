/**
 * SND signs members in with MembershipWorks. The browser stores that session
 * in the SFSF cookie on .snd.org. This module decides what a request may see.
 * It does not talk to MembershipWorks; the server session check does that.
 */

/** Live sign-in page. The embed there is account management, not a bounce. */
export const SND_SIGN_IN_URL = 'https://snd.org/join-snd-log-in/member-sign-in/';

/**
 * MembershipWorks reads a return URL only from the sign-in embed's data-zzz
 * attribute. The public sign-in page does not set one, and a query parameter
 * on that URL is not a return address. OAuth can return to another site, and
 * that needs an app registered in the MembershipWorks admin.
 */
export const MEMBERSHIPWORKS_SESSION = 'https://api.membershipworks.com/v2/account/session';

/** Organization id from the sign-in embed on snd.org (`data-org`). */
export const DEFAULT_ORG = '17787';

/** Set on the one-time reload that lets a Strict cookie arrive. */
export const RETRY_COOKIE = 'snd_gate';

export function memberGateEnabled(hostname: string, setting: string | undefined): boolean {
	const value = setting?.trim().toLowerCase();
	if (value === '0' || value === 'off' || value === 'false') return false;
	if (value === '1' || value === 'on' || value === 'true') return true;
	const host = hostname.toLowerCase().replace(/\.$/, '');
	return host === 'snd.org' || host.endsWith('.snd.org');
}

export function membershipOrg(value: string | undefined): string {
	const org = value?.trim() || DEFAULT_ORG;
	return /^[0-9]{1,12}$/.test(org) ? org : DEFAULT_ORG;
}

export function sessionEndpoint(value: string | undefined): string {
	const raw = value?.trim();
	if (!raw) return MEMBERSHIPWORKS_SESSION;
	try {
		const url = new URL(raw);
		if (url.protocol !== 'https:' && url.protocol !== 'http:') return MEMBERSHIPWORKS_SESSION;
		return url.toString();
	} catch {
		return MEMBERSHIPWORKS_SESSION;
	}
}

/** A MembershipWorks session payload with a uid is a signed-in account. */
export function sessionIsActive(body: unknown): boolean {
	if (!body || typeof body !== 'object') return false;
	const uid = (body as { uid?: unknown }).uid;
	if (typeof uid === 'string') return uid.trim().length > 0;
	if (typeof uid === 'number') return Number.isFinite(uid);
	return false;
}

/** Reject values that are too short to be a session or unsafe in a header. */
export function usableSessionToken(value: string | undefined | null): string | null {
	if (!value) return null;
	let token = value.trim();
	try {
		token = decodeURIComponent(token);
	} catch {
		return null;
	}
	if (token.length < 10 || token.length > 500) return null;
	if (!/^[A-Za-z0-9_-]+$/.test(token)) return null;
	return token;
}

/**
 * Every SFSF value on the request. A host-only cookie can sit beside the
 * .snd.org cookie; one invalid value must not hide a real session.
 */
export function sessionTokens(cookieHeader: string | null): string[] {
	if (!cookieHeader) return [];
	const tokens: string[] = [];
	for (const part of cookieHeader.split(';')) {
		const eq = part.indexOf('=');
		if (eq === -1) continue;
		if (part.slice(0, eq).trim() !== 'SFSF') continue;
		const token = usableSessionToken(part.slice(eq + 1).trim());
		if (token && !tokens.includes(token)) tokens.push(token);
	}
	return tokens.slice(0, 3);
}

export function isPublicPath(pathname: string): boolean {
	return pathname === '/health' || pathname.startsWith('/health/');
}

export function isMemberDataPath(pathname: string): boolean {
	return (
		pathname === '/api' ||
		pathname.startsWith('/api/') ||
		pathname === '/media' ||
		pathname.startsWith('/media/')
	);
}

/**
 * SameSite=Strict is withheld on the first arrival from outside snd.org.
 * One same-origin reload after that arrival sends the cookie.
 */
export function shouldRetryStrictCookie(input: {
	gate: boolean;
	member: boolean;
	method: string;
	pathname: string;
	fetchSite: string | null;
	fetchDest: string | null;
	accept: string | null;
	retried: boolean;
}): boolean {
	if (!input.gate || input.member || input.retried) return false;
	if (input.method !== 'GET') return false;
	if (isPublicPath(input.pathname) || isMemberDataPath(input.pathname)) return false;
	if (input.fetchSite?.toLowerCase() !== 'cross-site') return false;
	const dest = input.fetchDest?.toLowerCase();
	if (dest && dest !== 'document') return false;
	const accept = input.accept?.toLowerCase();
	if (accept && !accept.includes('text/html') && !accept.includes('*/*')) return false;
	return true;
}

/** Path and query only, so the reload cannot be sent to another site. */
export function sameOriginTarget(pathname: string, search: string): string {
	const path = pathname.startsWith('/') && !pathname.startsWith('//') ? pathname : '/';
	return path + (search.startsWith('?') ? search : '');
}

export function retryDocument(target: string): string {
	const safe = sameOriginTarget(target, '');
	const attr = safe.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
	const script = JSON.stringify(safe);
	return `<!doctype html>
<meta charset="utf-8">
<title>SND Archive</title>
<script>location.replace(${script})</script>
<meta http-equiv="refresh" content="0;url=${attr}">`;
}
