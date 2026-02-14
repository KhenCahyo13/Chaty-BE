export type UploadFileBody =
    | ArrayBuffer
    | ArrayBufferView
    | Blob
    | Buffer
    | File
    | FormData
    | NodeJS.ReadableStream
    | ReadableStream<Uint8Array>
    | string
    | URLSearchParams;

export interface UploadFileParams {
    bucket: string;
    file: UploadFileBody;
    options?: UploadFileOptions;
    path: string;
}

export interface UploadFileWithBufferParams {
    bucket: string;
    buffer: Buffer;
    cacheControl?: string;
    contentType?: string;
    path: string;
    upsert?: boolean;
}

export interface DeleteFileParams {
    bucket: string;
    path: string | string[];
}

export interface CreateSignedUrlParams {
    bucket: string;
    download?: boolean | string;
    expiresIn?: number;
    path: string;
}

export interface UploadFileOptions {
    cacheControl?: string;
    contentType?: string;
    duplex?: string;
    headers?: Record<string, string>;
    metadata?: Record<string, unknown>;
    upsert?: boolean;
}
