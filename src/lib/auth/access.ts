import { AsyncLocalStorage } from 'node:async_hooks';

const access = new AsyncLocalStorage<boolean>();

/** Run catalog reads for this request. `false` hides the archive. */
export function withArchiveAccess<T>(allowed: boolean, run: () => T): T {
	return access.run(allowed, run);
}

/**
 * True outside a request (scripts, tests) and for signed-in requests.
 * A closed request must not read or replace the shared homepage draw.
 */
export function archiveOpen(): boolean {
	return access.getStore() !== false;
}
