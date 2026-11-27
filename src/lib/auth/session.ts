import { createHash } from 'node:crypto';
import { sessionIsActive } from './member';

type Cached = { active: boolean; expires: number };

const cache = new Map<string, Cached>();

export function clearSessionCache() {
	cache.clear();
}

function cacheKey(org: string, token: string) {
	return createHash('sha256').update(org).update('\0').update(token).digest('hex');
}

/**
 * Ask MembershipWorks whether this SFSF value is a signed-in account.
 * A network failure is treated as signed out. Results are remembered briefly
 * so a page and its images do not each call the API.
 */
export async function membershipActive(
	token: string,
	options: {
		org: string;
		url: string;
		now?: number;
		fetch?: typeof fetch;
	}
): Promise<boolean> {
	const now = options.now ?? Date.now();
	const key = cacheKey(options.org, token);
	const hit = cache.get(key);
	if (hit && hit.expires > now) return hit.active;

	let active = false;
	let ttl = 10_000;
	try {
		const response = await (options.fetch ?? fetch)(options.url, {
			method: 'GET',
			headers: {
				Accept: 'application/json',
				Authorization: `Bearer ${token}`,
				'X-Org': options.org
			},
			signal: AbortSignal.timeout(5_000)
		});
		if (response.ok) {
			active = sessionIsActive(await response.json());
			ttl = active ? 60_000 : 15_000;
		}
	} catch {
		active = false;
		ttl = 10_000;
	}

	cache.set(key, { active, expires: now + ttl });
	return active;
}
