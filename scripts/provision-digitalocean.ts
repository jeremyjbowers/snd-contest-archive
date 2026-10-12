import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Client } from 'pg';
import { fromAwardForceRows } from '../src/lib/catalog/ingest/award-force.ts';
import { fromFilesCsv } from '../src/lib/catalog/ingest/files.ts';
import { type SourceAsset, type SubmissionRecord } from '../src/lib/catalog/ingest/record.ts';
import { loadCatalog } from '../src/lib/catalog/persist/load.ts';
import { poolOptions } from '../src/lib/catalog/persist/pg.ts';
import type { Sql } from '../src/lib/catalog/persist/sql.ts';
import { readXlsxRows } from './read-xlsx.ts';
import {
	ARCHIVE_PROJECT_NAME,
	findArchiveProject,
	isOverSlotName,
	type DigitalOceanProject
} from './digitalocean-project.ts';

const CLUSTER_NAME = 'snd-archive-pg';
const APP_NAME = 'snd-archive';
const SPEC = '.do/app.yaml';

const token = process.env.DIGITALOCEAN_ACCESS_TOKEN || process.env.DIGITALOCEAN_TOKEN;
if (!token) {
	console.error(
		'Set DIGITALOCEAN_ACCESS_TOKEN to a DigitalOcean personal access token with write access to projects, databases, and apps.'
	);
	process.exit(1);
}

const projects = asProjects(json(doctl(['projects', 'list', '-o', 'json'])));
assertNotOverslotTeam(projects);
const project = findArchiveProject(projects) ?? createArchiveProject();
console.log(`Using DigitalOcean project "${project.name}" (${project.id})`);

const cluster = await ensureCluster(project.id);
console.log(`Postgres cluster ${cluster.name} is ${cluster.status} (${cluster.id})`);
assign(project.id, `do:dbaas:${cluster.id}`);

console.log('Reading contest files');
const batch = await readContestBatch(contestFiles());
console.log(`Read ${batch.records.length} contest rows`);
const uri = await connectionUri(cluster.id);
const rule = await connectForLoad(cluster.id, uri);
try {
	const result = await loadCatalog(clientSql(rule.client), batch);
	console.log(JSON.stringify(result));
	await rule.client.end();
} finally {
	if (rule.uuid) removeFirewall(cluster.id, rule.uuid);
}

const app = ensureApp(project.id);
assign(project.id, `do:app:${app.id}`);
await ensureAppFirewall(cluster.id, app.id);
console.log('Waiting for the App Platform deployment');
await deployApp(app.id);
assertNotInOverSlot(project, cluster.id, app.id);

console.log(
	JSON.stringify(
		{
			project: project.name,
			cluster: CLUSTER_NAME,
			app: app.id,
			url: app.url,
			monthly: { web: 5, postgres: 15.15, region: 'nyc3' }
		},
		null,
		2
	)
);

function doctl(args: string[]): string {
	const result = spawnSync('doctl', args, {
		encoding: 'utf8',
		env: { ...process.env, DIGITALOCEAN_ACCESS_TOKEN: token }
	});
	if (result.status !== 0) {
		throw new Error(redact(`doctl ${args.join(' ')} failed: ${result.stderr || result.stdout}`));
	}
	return result.stdout;
}

function json(text: string): unknown {
	return JSON.parse(text) as unknown;
}

function assertNotOverslotTeam(projects: DigitalOceanProject[]) {
	const names = [
		...projects.map((project) => project.name),
		...listedApps().map((app) => app.name)
	];
	const overslot = names.filter((name) => isOverSlotName(name));
	if (overslot.length > 0) {
		throw new Error(
			`This token can see Over Slot resources (${overslot.join(', ')}). Refusing to create billable resources on that team.`
		);
	}
}

function createArchiveProject(): DigitalOceanProject {
	const value = json(
		doctl([
			'projects',
			'create',
			'--name',
			ARCHIVE_PROJECT_NAME,
			'--purpose',
			'Web Application',
			'--environment',
			'Production',
			'--description',
			'SND contest archive',
			'-o',
			'json'
		])
	);
	const record = Array.isArray(value) ? recordOf(value[0]) : recordOf(value);
	const created = {
		id: stringField(record, 'id', 'ID'),
		name: stringField(record, 'name', 'Name') || ARCHIVE_PROJECT_NAME
	};
	if (!created.id || isOverSlotName(created.name)) {
		throw new Error(`Could not create ${ARCHIVE_PROJECT_NAME} away from the Over Slot team`);
	}
	console.log(`Created DigitalOcean project "${created.name}"`);
	return created;
}

function asProjects(value: unknown): DigitalOceanProject[] {
	if (!Array.isArray(value)) throw new Error('Project list was not an array');
	return value.map((row) => {
		const record = recordOf(row);
		const id = stringField(record, 'id', 'ID');
		const name = stringField(record, 'name', 'Name');
		if (!id || !name) throw new Error('A project is missing id or name');
		return { id, name };
	});
}

async function ensureCluster(
	projectId: string
): Promise<{ id: string; name: string; status: string }> {
	const found = listedClusters().find((cluster) => cluster.name === CLUSTER_NAME);
	const cluster = found ?? (await createCluster(projectId));
	assign(projectId, `do:dbaas:${cluster.id}`);
	return waitUntilOnline(cluster.id);
}

function listedClusters(): { id: string; name: string; status: string }[] {
	const value = json(doctl(['databases', 'list', '-o', 'json']));
	if (!Array.isArray(value)) throw new Error('Database list was not an array');
	return value.map((row) => {
		const record = recordOf(row);
		return {
			id: stringField(record, 'id', 'ID'),
			name: stringField(record, 'name', 'Name'),
			status: stringField(record, 'status', 'Status')
		};
	});
}

async function createCluster(
	projectId: string
): Promise<{ id: string; name: string; status: string }> {
	const body = {
		name: CLUSTER_NAME,
		engine: 'pg',
		version: '16',
		region: 'nyc3',
		size: 'db-amd-1vcpu-1gb',
		num_nodes: 1,
		project_id: projectId
	};
	const created = await postDatabase(body);
	if (created) return created;

	const fallback = await postDatabase({ ...body, project_id: undefined });
	if (!fallback) {
		throw new Error('DigitalOcean did not return a database id');
	}
	return fallback;
}

async function postDatabase(body: {
	name: string;
	engine: string;
	version: string;
	region: string;
	size: string;
	num_nodes: number;
	project_id?: string;
}): Promise<{ id: string; name: string; status: string } | undefined> {
	const payload = { ...body };
	if (!payload.project_id) delete payload.project_id;
	const response = await fetch('https://api.digitalocean.com/v2/databases', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(payload)
	});
	const text = await response.text();
	if (!response.ok) {
		if (body.project_id && response.status === 422 && text.includes('project_id')) return undefined;
		throw new Error(redact(`Database create failed (${response.status}): ${text}`));
	}
	const parsed = json(text) as { database?: Record<string, unknown> };
	const database = parsed.database;
	if (!database) throw new Error('Database create response had no database');
	return {
		id: stringField(database, 'id'),
		name: stringField(database, 'name'),
		status: stringField(database, 'status')
	};
}

async function waitUntilOnline(id: string): Promise<{ id: string; name: string; status: string }> {
	const deadline = Date.now() + 20 * 60 * 1000;
	for (;;) {
		const value = json(doctl(['databases', 'get', id, '-o', 'json']));
		const record = Array.isArray(value) ? recordOf(value[0]) : recordOf(value);
		const cluster = {
			id: stringField(record, 'id', 'ID') || id,
			name: stringField(record, 'name', 'Name'),
			status: stringField(record, 'status', 'Status')
		};
		if (cluster.status === 'online') return cluster;
		if (Date.now() > deadline) {
			throw new Error(`Database ${id} stayed ${cluster.status || 'unknown'}`);
		}
		console.log(`Waiting for ${CLUSTER_NAME} (${cluster.status || 'creating'})`);
		await new Promise((resolve) => setTimeout(resolve, 15000));
	}
}

function appendFirewall(databaseId: string, rule: string): string | undefined {
	try {
		doctl(['databases', 'firewalls', 'append', databaseId, '--rule', rule]);
	} catch (error) {
		if (!/already|duplicate|exists/i.test(String(error))) throw error;
	}
	const rules = firewallRules(databaseId);
	const value = rule.split(':').slice(1).join(':');
	return rules.find((item) => item.type === rule.split(':')[0] && item.value === value)?.uuid;
}

function removeFirewall(databaseId: string, uuid: string) {
	doctl(['databases', 'firewalls', 'remove', databaseId, '--uuid', uuid]);
}

function firewallRules(databaseId: string): { uuid: string; type: string; value: string }[] {
	const value = json(doctl(['databases', 'firewalls', 'list', databaseId, '-o', 'json']));
	if (!Array.isArray(value)) return [];
	return value.map((row) => {
		const record = recordOf(row);
		return {
			uuid: stringField(record, 'uuid', 'UUID'),
			type: stringField(record, 'type', 'Type'),
			value: stringField(record, 'value', 'Value')
		};
	});
}

async function ensureAppFirewall(databaseId: string, appId: string) {
	const deadline = Date.now() + 3 * 60 * 1000;
	for (;;) {
		const rules = firewallRules(databaseId);
		if (rules.some((rule) => rule.type === 'app' && rule.value === appId)) return;
		if (Date.now() > deadline) {
			doctl(['databases', 'firewalls', 'append', databaseId, '--rule', `app:${appId}`]);
			return;
		}
		await new Promise((resolve) => setTimeout(resolve, 10000));
	}
}

async function connectForLoad(
	databaseId: string,
	uri: string
): Promise<{ client: Client; uuid?: string }> {
	const { Client: PgClient } = await import('pg');
	let allowed = '';
	let uuid: string | undefined;
	let last = 'unavailable';
	for (let attempt = 1; attempt <= 8; attempt += 1) {
		const ip = (await fetch('https://api.ipify.org').then((response) => response.text())).trim();
		if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) {
			throw new Error(`Refusing to allow an unrecognized loader address: ${ip}`);
		}
		if (ip !== allowed) {
			if (uuid) removeFirewall(databaseId, uuid);
			uuid = appendFirewall(databaseId, `ip_addr:${ip}`);
			allowed = ip;
			console.log(`Allowing ${ip} to load the catalog`);
		}
		const client = new PgClient({ ...poolOptions(uri), connectionTimeoutMillis: 8000 });
		try {
			await client.connect();
			return { client, uuid };
		} catch (error) {
			await client.end().catch(() => undefined);
			last = error instanceof Error ? error.message : 'unavailable';
			console.log(`Waiting for Postgres (${attempt}/8): ${redact(last)}`);
			await new Promise((resolve) => setTimeout(resolve, 5000));
		}
	}
	if (uuid) removeFirewall(databaseId, uuid);
	throw new Error(`Postgres did not accept connections from this machine: ${redact(last)}`);
}

function clientSql(client: Client): Sql {
	return {
		async query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
			const result = await client.query(sql, params);
			return result.rows as T[];
		},
		async exec(sql: string) {
			await client.query(sql);
		}
	};
}

async function readContestBatch(files: { xlsx: string[]; csv: string[] }): Promise<{
	records: SubmissionRecord[];
	assets: SourceAsset[];
}> {
	const records: SubmissionRecord[] = [];
	const assets: SourceAsset[] = [];
	for (const filePath of files.xlsx) {
		const mapped = fromAwardForceRows(await readXlsxRows(filePath), `award-force:${filePath}`);
		records.push(...mapped.records);
		assets.push(...mapped.assets);
	}
	for (const filePath of files.csv) {
		assets.push(...fromFilesCsv(readFileSync(filePath, 'utf8'), `award-force-files:${filePath}`));
	}
	return { records, assets };
}

async function connectionUri(databaseId: string): Promise<string> {
	for (let attempt = 1; attempt <= 8; attempt += 1) {
		const text = doctl(['databases', 'connection', databaseId, '--format', 'URI', '--no-header']);
		const uri = text
			.split('\n')
			.map((line) => line.trim())
			.find((line) => line.startsWith('postgres'));
		if (uri) return uri;
		console.log(`Waiting for a database connection string (${attempt}/8)`);
		await new Promise((resolve) => setTimeout(resolve, 5000));
	}
	throw new Error('Database connection string was not available');
}

async function deployApp(appId: string) {
	for (let attempt = 1; attempt <= 2; attempt += 1) {
		try {
			doctl([
				'apps',
				'create-deployment',
				appId,
				'--force-rebuild',
				'--wait',
				'--format',
				'ID,Phase',
				'--no-header'
			]);
			return;
		} catch (error) {
			if (attempt === 2 || !/in progress/i.test(String(error))) throw error;
			console.log('A deployment is already running; waiting for it to finish');
			try {
				await waitForDeployment(appId);
				return;
			} catch (waitError) {
				console.log(waitError instanceof Error ? waitError.message : 'Deployment failed');
			}
		}
	}
}

async function waitForDeployment(appId: string) {
	const deadline = Date.now() + 20 * 60 * 1000;
	const active = new Set(['PENDING_BUILD', 'BUILDING', 'DEPLOYING', 'PENDING']);
	for (;;) {
		const value = json(doctl(['apps', 'list-deployments', appId, '-o', 'json']));
		const rows = Array.isArray(value) ? value.map(recordOf) : [];
		const phase = stringField(rows[0] ?? {}, 'phase', 'Phase');
		if (phase && !active.has(phase)) {
			if (phase === 'ACTIVE' || phase === 'SUCCESS') return;
			throw new Error(`Deployment finished as ${phase}`);
		}
		if (Date.now() > deadline) throw new Error('Timed out waiting for the deployment');
		await new Promise((resolve) => setTimeout(resolve, 15000));
	}
}

function contestFiles(): { xlsx: string[]; csv: string[] } {
	const fromArgs = { xlsx: [] as string[], csv: [] as string[] };
	const argv = process.argv.slice(2);
	for (let index = 0; index < argv.length; index += 1) {
		const flag = argv[index];
		const value = argv[index + 1];
		if ((flag === '--award-force' || flag === '--files') && value) {
			index += 1;
			(flag === '--award-force' ? fromArgs.xlsx : fromArgs.csv).push(resolve(value));
		}
	}
	if (fromArgs.xlsx.length || fromArgs.csv.length) return fromArgs;

	const dir = process.env.CATALOG_SOURCE_DIR || '/home/ubuntu/.cursor/projects/workspace/uploads';
	let names: string[];
	try {
		names = readdirSync(dir);
	} catch {
		return fromArgs;
	}
	return {
		xlsx: names
			.filter((name) => /award.?force/i.test(name) && name.endsWith('.xlsx'))
			.map((name) => resolve(dir, name)),
		csv: names
			.filter((name) => /files/i.test(name) && name.endsWith('.csv'))
			.map((name) => resolve(dir, name))
	};
}

function ensureApp(projectId: string): { id: string; url: string } {
	const created = doctl([
		'apps',
		'create',
		'--spec',
		SPEC,
		'--project-id',
		projectId,
		'--upsert',
		'--format',
		'ID,DefaultIngress',
		'--no-header'
	]).trim();
	const listed = listedApps().find((app) => app.name === APP_NAME);
	if (listed) return listed;
	const [id, url] = created.split(/\s+/, 2);
	if (!id) throw new Error('App create did not return an id');
	return { id, url: url ?? '' };
}

function listedApps(): { id: string; name: string; url: string }[] {
	const value = json(doctl(['apps', 'list', '-o', 'json']));
	if (!Array.isArray(value)) return [];
	return value.map((row) => {
		const record = recordOf(row);
		const spec = recordOf(record.spec ?? {});
		return {
			id: stringField(record, 'id', 'ID'),
			name: stringField(spec, 'name') || stringField(record, 'name', 'Name'),
			url: stringField(record, 'default_ingress', 'DefaultIngress', 'live_url')
		};
	});
}

function assign(projectId: string, urn: string) {
	doctl(['projects', 'resources', 'assign', projectId, '--resource', urn]);
}

function assertNotInOverSlot(archive: DigitalOceanProject, databaseId: string, appId: string) {
	const archiveUrns = resourceUrns(archive.id);
	for (const id of [databaseId, appId]) {
		if (!archiveUrns.some((urn) => urn.includes(id))) {
			throw new Error(`${id} is not in DigitalOcean project ${archive.name}`);
		}
	}
	const projects = asProjects(json(doctl(['projects', 'list', '-o', 'json'])));
	for (const candidate of projects) {
		if (!/over[\s_-]*slot/i.test(candidate.name)) continue;
		const urns = resourceUrns(candidate.id);
		if (urns.some((urn) => urn.includes(databaseId) || urn.includes(appId))) {
			throw new Error(`Refusing to leave resources in DigitalOcean project "${candidate.name}"`);
		}
	}
}

function resourceUrns(projectId: string): string[] {
	const value = json(doctl(['projects', 'resources', 'list', projectId, '-o', 'json']));
	if (!Array.isArray(value)) return [];
	return value.map((row) => stringField(recordOf(row), 'urn', 'URN'));
}

function recordOf(value: unknown): Record<string, unknown> {
	if (!value || typeof value !== 'object') return {};
	return value as Record<string, unknown>;
}

function stringField(record: Record<string, unknown>, ...keys: string[]): string {
	for (const key of keys) {
		const value = record[key];
		if (typeof value === 'string' && value) return value;
	}
	return '';
}

function redact(text: string): string {
	return text.replace(/postgres(?:ql)?:\/\/\S+/g, 'postgresql://[redacted]');
}
