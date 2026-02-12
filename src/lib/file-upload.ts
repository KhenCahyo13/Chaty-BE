import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';

import { createHttpError } from './http-error';

export const buildStorageObjectPath = (
    ownerId: string,
    originalName: string
): string => {
    const extension = extname(originalName).toLowerCase();
    return `${ownerId}/${Date.now()}-${randomUUID()}${extension}`;
};

export const buildSupabaseStoragePublicUrl = (
    bucket: string,
    objectPath: string
): string => {
    const supabaseUrl = process.env.SUPABASE_URL;

    if (!supabaseUrl) {
        throw createHttpError(
            'Supabase configuration is incomplete. Please set SUPABASE_URL.',
            500
        );
    }

    const normalizedBaseUrl = supabaseUrl.replace(/\/+$/, '');
    const encodedPath = objectPath
        .split('/')
        .map((segment) => encodeURIComponent(segment))
        .join('/');

    return `${normalizedBaseUrl}/storage/v1/object/public/${bucket}/${encodedPath}`;
};

export const extractSupabaseStorageObjectPath = (
    url: string | null | undefined,
    bucket: string
): string | null => {
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
    value: string | null | undefined,
    bucket: string
): string | null => {
    if (!value) {
        return null;
    }

    const extractedPath = extractSupabaseStorageObjectPath(value, bucket);
    return extractedPath ?? value;
};
