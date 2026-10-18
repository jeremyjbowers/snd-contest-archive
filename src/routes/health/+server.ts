/** Readiness probe. It does not touch the catalog, so a cold homepage draw cannot fail the deploy. */
export function GET() {
	return new Response('ok', { headers: { 'content-type': 'text/plain' } });
}
