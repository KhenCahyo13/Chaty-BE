export type HttpError = {
    statusCode: number;
    message: string;
    errors?: unknown;
};

export const isHttpError = (error: unknown): error is HttpError =>
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    'message' in error;

export const createHttpError = (
    message: string,
    statusCode: number,
    errors?: unknown
): HttpError => ({
    statusCode,
    message,
    errors: errors ?? null,
});

export const toHttpError = (error: unknown): HttpError => {
    if (isHttpError(error)) {
        return error;
    }

    return {
        statusCode: 500,
        message: 'An internal server error occurred.',
        errors: null,
    };
};
