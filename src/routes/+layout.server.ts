import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => {
	return { gate: locals.gate ?? false, member: locals.member ?? false };
};
