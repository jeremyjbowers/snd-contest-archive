export type DigitalOceanProject = {
	id: string;
	name: string;
};

const OVER_SLOT = /over[\s_-]*slot/i;

/** Pick the baseball project. Never Over slot, even when it is the account default. */
export function pickProject(projects: DigitalOceanProject[]): DigitalOceanProject {
	const eligible = projects.filter((project) => !OVER_SLOT.test(project.name));
	const exact = eligible.filter((project) => project.name.trim().toLowerCase() === 'baseball');
	const chosen =
		only(exact, 'named baseball') ??
		only(
			eligible.filter((project) => /baseball/i.test(project.name)),
			'matching baseball'
		);

	if (!chosen || OVER_SLOT.test(chosen.name)) {
		const names = projects.map((project) => project.name).join(', ') || '(none)';
		throw new Error(
			`No DigitalOcean project named baseball. Refusing to use Over slot. Projects: ${names}`
		);
	}
	return chosen;
}

function only(projects: DigitalOceanProject[], label: string): DigitalOceanProject | undefined {
	if (projects.length > 1) {
		throw new Error(
			`More than one DigitalOcean project is ${label}: ${projects.map((project) => project.name).join(', ')}`
		);
	}
	return projects[0];
}
