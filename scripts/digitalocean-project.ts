export type DigitalOceanProject = {
	id: string;
	name: string;
};

export const ARCHIVE_PROJECT_NAME = 'SND design archive';

const OVER_SLOT = /over[\s_-]*slot/i;

export function isOverSlotName(name: string): boolean {
	return OVER_SLOT.test(name);
}

/** The SND design archive project on this team, or undefined when it still has to be created. */
export function findArchiveProject(
	projects: DigitalOceanProject[]
): DigitalOceanProject | undefined {
	const eligible = projects.filter((project) => !isOverSlotName(project.name));
	const exact = eligible.filter(
		(project) => project.name.trim().toLowerCase() === ARCHIVE_PROJECT_NAME.toLowerCase()
	);
	return only(exact, `named ${ARCHIVE_PROJECT_NAME}`);
}

/** Pick the SND design archive project. Never a project on the Over Slot team. */
export function pickProject(projects: DigitalOceanProject[]): DigitalOceanProject {
	const chosen = findArchiveProject(projects);
	if (!chosen || isOverSlotName(chosen.name)) {
		const names = projects.map((project) => project.name).join(', ') || '(none)';
		throw new Error(
			`No DigitalOcean project named ${ARCHIVE_PROJECT_NAME}. Refusing to use the Over Slot team. Projects: ${names}`
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
