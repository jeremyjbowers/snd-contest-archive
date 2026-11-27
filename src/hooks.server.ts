import { env } from '$env/dynamic/private';
import type { Handle } from '@sveltejs/kit';
import { withArchiveAccess } from '$lib/auth/access';
import {
	RETRY_COOKIE,
	isMemberDataPath,
	isPublicPath,
	memberGateEnabled,
	membershipOrg,
	retryDocument,
	sameOriginTarget,
	sessionEndpoint,
	sessionTokens,
	shouldRetryStrictCookie
} from '$lib/auth/member';
import { membershipActive } from '$lib/auth/session';

export const handle: Handle = async ({ event, resolve }) => {
	const gate = memberGateEnabled(event.url.hostname, env.MEMBER_GATE);
	event.locals.gate = gate;
	event.locals.member = false;

	if (gate && !isPublicPath(event.url.pathname)) {
		for (const token of sessionTokens(event.request.headers.get('cookie'))) {
			const active = await membershipActive(token, {
				org: membershipOrg(env.MEMBERSHIPWORKS_ORG),
				url: sessionEndpoint(env.MEMBERSHIPWORKS_SESSION_URL)
			});
			if (active) {
				event.locals.member = true;
				break;
			}
		}
	}

	if (gate && !event.locals.member && isMemberDataPath(event.url.pathname)) {
		return text('Sign in required', 401);
	}

	if (
		shouldRetryStrictCookie({
			gate,
			member: event.locals.member,
			method: event.request.method,
			pathname: event.url.pathname,
			fetchSite: event.request.headers.get('sec-fetch-site'),
			fetchDest: event.request.headers.get('sec-fetch-dest'),
			accept: event.request.headers.get('accept'),
			retried: event.cookies.get(RETRY_COOKIE) === '1'
		})
	) {
		// A response returned from handle does not go through resolve, so the
		// cookie has to be on this response or the reload loops.
		const secure = event.url.protocol === 'https:' ? '; Secure' : '';
		return new Response(retryDocument(sameOriginTarget(event.url.pathname, event.url.search)), {
			headers: {
				'content-type': 'text/html; charset=utf-8',
				'cache-control': 'private, no-store',
				'set-cookie': `${RETRY_COOKIE}=1; Path=/; Max-Age=120; HttpOnly; SameSite=Lax${secure}`
			}
		});
	}

	const allowed = !gate || event.locals.member;
	const response = await withArchiveAccess(allowed, () => resolve(event));
	if (gate && !isPublicPath(event.url.pathname)) {
		const memberMedia = event.locals.member && event.url.pathname.startsWith('/media/');
		response.headers.set(
			'cache-control',
			memberMedia ? 'private, max-age=86400' : 'private, no-store'
		);
	}
	return response;
};

function text(message: string, status: number) {
	return new Response(message, {
		status,
		headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'private, no-store' }
	});
}
