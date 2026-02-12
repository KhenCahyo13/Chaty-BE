import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';

export const buildStorageObjectPath = (
    ownerId: string,
    originalName: string
): string => {
    const extension = extname(originalName).toLowerCase();
    return `${ownerId}/${Date.now()}-${randomUUID()}${extension}`;
};

export const extractSupabaseStorageObjectPath = (
    url: null | string | undefined,
    bucket: string
): null | string => {
    if (!url) {
        return null;
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    if (!supabaseUrl) {
        return null;
    }

    const normalizedBaseUrl = supabaseUrl.replace(/\/+$/, '');
    const prefix = `${normalizedBaseUrl}/storage/v1/object/public/${bucket}/`;

    if (!url.startsWith(prefix)) {
        return null;
    }

    const encodedObjectPath = url.slice(prefix.length);
    return encodedObjectPath
        .split('/')
        .map((segment) => decodeURIComponent(segment))
        .join('/');
};

export const resolveSupabaseStorageObjectPath = (
    value: null | string | undefined,
    bucket: string
): null | string => {
    if (!value) {
        return null;
    }

    const extractedPath = extractSupabaseStorageObjectPath(value, bucket);
    return extractedPath ?? value;
};
