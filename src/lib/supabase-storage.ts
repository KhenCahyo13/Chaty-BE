import {
    createClient,
    type SupabaseClient,
} from '@supabase/supabase-js';

import { createHttpError } from './http-error';

type UploadFileParams = {
    bucket: string;
    path: string;
    file: UploadFileBody;
    options?: UploadFileOptions;
};

type UploadFileWithBufferParams = {
    bucket: string;
    path: string;
    buffer: Buffer;
    contentType?: string;
    cacheControl?: string;
    upsert?: boolean;
};

type DeleteFileParams = {
    bucket: string;
    path: string | string[];
};

type CreateSignedUrlParams = {
    bucket: string;
    path: string;
    expiresIn?: number;
    download?: string | boolean;
};

type UploadFileBody =
    | ArrayBuffer
    | ArrayBufferView
    | Blob
    | Buffer
    | File
    | FormData
    | NodeJS.ReadableStream
    | ReadableStream<Uint8Array>
    | URLSearchParams
    | string;

type UploadFileOptions = {
    cacheControl?: string;
    contentType?: string;
    upsert?: boolean;
    duplex?: string;
    metadata?: Record<string, unknown>;
    headers?: Record<string, string>;
};

let supabaseClient: SupabaseClient | null = null;

const getSupabaseClient = (): SupabaseClient => {
    if (supabaseClient) {
        return supabaseClient;
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw createHttpError(
            'Konfigurasi Supabase Storage belum lengkap. Isi SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY (atau SUPABASE_ANON_KEY).',
            500
        );
    }

    supabaseClient = createClient(supabaseUrl, supabaseKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });

    return supabaseClient;
};

export const uploadFile = async ({
    bucket,
    path,
    file,
    options,
}: UploadFileParams) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .storage
        .from(bucket)
        .upload(path, file, options);

    if (error) {
        throw createHttpError('Gagal upload file ke Supabase Storage.', 500, error);
    }

    return data;
};

export const uploadFileWithBuffer = async ({
    bucket,
    path,
    buffer,
    contentType,
    cacheControl,
    upsert,
}: UploadFileWithBufferParams) => {
    return uploadFile({
        bucket,
        path,
        file: buffer,
        options: {
            contentType,
            cacheControl,
            upsert,
        },
    });
};

export const deleteFile = async ({ bucket, path }: DeleteFileParams) => {
    const supabase = getSupabaseClient();
    const paths = Array.isArray(path) ? path : [path];

    const { data, error } = await supabase.storage.from(bucket).remove(paths);

    if (error) {
        throw createHttpError('Gagal menghapus file di Supabase Storage.', 500, error);
    }

    return data;
};

export const createSignedUrl = async ({
    bucket,
    path,
    expiresIn = 60 * 60,
    download,
}: CreateSignedUrlParams) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .storage
        .from(bucket)
        .createSignedUrl(path, expiresIn, { download });

    if (error) {
        throw createHttpError('Gagal membuat signed URL dari Supabase Storage.', 500, error);
    }

    return data;
};
