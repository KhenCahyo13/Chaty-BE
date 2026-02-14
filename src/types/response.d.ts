export interface CursorResponse<TData> {
    data: TData[];
    nextCursor: null | string;
}

export interface SuccessResponse<T, TMeta = null> {
    data: T;
    message: string;
    meta?: TMeta;
    success: true;
}

export interface ErrorResponse<E = unknown> {
    errors?: E;
    message: string;
    success: false;
}

export interface FieldError {
    field: string;
    message: string;
}

export interface HttpError {
    errors?: unknown;
    message: string;
    statusCode: number;
}
