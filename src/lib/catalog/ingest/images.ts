import type { SourceAsset } from './record';

/**
 * Airtable attachment URLs expire. These are the preview bytes worth keeping:
 * a full-size thumbnail for an image, or the large thumbnail of a PDF.
 */
export type AttachmentPreview = {
	locator: string;
	filename: string | null;
	mediaType: string;
};

const IMAGE_EXT = /\.(png|jpe?g|gif|webp)$/i;

/** Work files live on an attachment field. Social cards and certificates are not the entry. */
export function isWorkAttachmentField(name: string) {
	return /^attachments?$/i.test(name.trim());
}

export function attachmentPreviews(value: unknown): AttachmentPreview[] {
	if (!Array.isArray(value)) return [];
	const previews: AttachmentPreview[] = [];
	for (const file of value) {
		const preview = previewOf(file);
		if (preview) previews.push(preview);
	}
	return previews;
}

export function isDurableImage(asset: SourceAsset) {
	if (asset.kind !== 'url' || asset.expiresHours != null) return false;
	if (asset.mediaType?.startsWith('image/')) return true;
	return IMAGE_EXT.test(asset.locator);
}

export function imagePublicPath(sourceKey: string, sortOrder: number) {
	return `/media/${encodeURIComponent(sourceKey)}/${sortOrder}`;
}

/** Swap an expiring preview for the path the site will serve. */
export function asStoredImage(asset: SourceAsset, stored: { mediaType: string }): SourceAsset {
	return {
		...asset,
		kind: 'url',
		mediaType: stored.mediaType,
		locator: imagePublicPath(asset.sourceKey, asset.sortOrder),
		expiresHours: null
	};
}

export function sniffImage(bytes: Uint8Array): string | null {
	if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
		return 'image/jpeg';
	}
	if (
		bytes.length >= 8 &&
		bytes[0] === 0x89 &&
		bytes[1] === 0x50 &&
		bytes[2] === 0x4e &&
		bytes[3] === 0x47
	) {
		return 'image/png';
	}
	if (bytes.length >= 6 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
		return 'image/gif';
	}
	if (
		bytes.length >= 12 &&
		bytes[0] === 0x52 &&
		bytes[1] === 0x49 &&
		bytes[2] === 0x46 &&
		bytes[3] === 0x46 &&
		bytes[8] === 0x57 &&
		bytes[9] === 0x45 &&
		bytes[10] === 0x42 &&
		bytes[11] === 0x50
	) {
		return 'image/webp';
	}
	return null;
}

/** Decode a BYTEA value from node-pg (Buffer) or PGlite (hex string or bytes). */
export function mediaBytes(value: unknown): Uint8Array | null {
	if (value instanceof Uint8Array) return value;
	if (typeof value === 'string' && value.startsWith('\\x')) {
		const hex = value.slice(2);
		if (hex.length % 2 !== 0) return null;
		const bytes = new Uint8Array(hex.length / 2);
		for (let index = 0; index < bytes.length; index += 1) {
			bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
		}
		return bytes;
	}
	return null;
}

function previewOf(file: unknown): AttachmentPreview | null {
	if (!file || typeof file !== 'object') return null;
	const record = file as {
		url?: unknown;
		filename?: unknown;
		type?: unknown;
		thumbnails?: {
			full?: { url?: unknown };
			large?: { url?: unknown };
		};
	};
	const filename = typeof record.filename === 'string' ? record.filename : null;
	const type = typeof record.type === 'string' ? record.type.toLowerCase() : '';
	const image = type.startsWith('image/') || IMAGE_EXT.test(filename ?? '');
	const full = httpUrl(record.thumbnails?.full?.url);
	const large = httpUrl(record.thumbnails?.large?.url);
	const original = httpUrl(record.url);
	const locator = image ? full || large || original : large;
	if (!locator) return null;
	return { locator, filename, mediaType: 'image/jpeg' };
}

function httpUrl(value: unknown) {
	return typeof value === 'string' && /^https?:\/\//i.test(value) ? value : '';
}
