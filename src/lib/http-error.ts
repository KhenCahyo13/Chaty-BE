import { HttpError } from 'src/types/response';

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
    errors: errors ?? null,
    message,
    statusCode,
});

export const toHttpError = (error: unknown): HttpError => {
    if (isHttpError(error)) {
        return error;
    }

    return {
        errors: null,
        message: 'An internal server error occurred.',
        statusCode: 500,
    };
};
