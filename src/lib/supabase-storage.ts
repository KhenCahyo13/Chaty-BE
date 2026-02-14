import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
    CreateSignedUrlParams,
    DeleteFileParams,
    UploadFileParams,
    UploadFileWithBufferParams,
} from 'src/types/file-upload';

import { createHttpError } from './http-error';

let supabaseClient: null | SupabaseClient = null;

const getSupabaseClient = (): SupabaseClient => {
    if (supabaseClient) {
        return supabaseClient;
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw createHttpError(
            'Supabase Storage configuration is incomplete. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY).',
            500
        );
    }

    supabaseClient = createClient(supabaseUrl, supabaseKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });

    return supabaseClient;
};

export const uploadFile = async ({
    bucket,
    file,
    options,
    path,
}: UploadFileParams) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, options);

    if (error) {
        throw createHttpError(
            'Failed to upload file to Supabase Storage.',
            500,
            error
        );
    }

    return data;
};

export const uploadFileWithBuffer = async ({
    bucket,
    buffer,
    cacheControl,
    contentType,
    path,
    upsert,
}: UploadFileWithBufferParams) => {
    return uploadFile({
        bucket,
        file: buffer,
        options: {
            cacheControl,
            contentType,
            upsert,
        },
        path,
    });
};

export const deleteFile = async ({ bucket, path }: DeleteFileParams) => {
    const supabase = getSupabaseClient();
    const paths = Array.isArray(path) ? path : [path];

    const { data, error } = await supabase.storage.from(bucket).remove(paths);

    if (error) {
        throw createHttpError(
            'Failed to delete file from Supabase Storage.',
            500,
            error
        );
    }

    return data;
};

export const createSignedUrl = async ({
    bucket,
    download,
    expiresIn = 60 * 60,
    path,
}: CreateSignedUrlParams) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn, { download });

    if (error) {
        throw createHttpError(
            'Failed to create a signed URL from Supabase Storage.',
            500,
            error
        );
    }

    return data;
};
