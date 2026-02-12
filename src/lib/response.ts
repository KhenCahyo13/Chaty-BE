export type SuccessResponse<T, TMeta = null> = {
    data: T;
    message: string;
    meta?: TMeta;
    success: true;
};

export type ErrorResponse<E = unknown> = {
    errors?: E;
    message: string;
    success: false;
};

export const successResponse = <TData, TMeta = null>(
    message: string,
    data: TData,
    meta?: TMeta
): SuccessResponse<TData, TMeta> => ({
    data,
    message,
    meta,
    success: true,
});

export const errorResponse = <E>(
    message: string,
    errors?: E
): ErrorResponse<E> => ({
    errors,
    message,
    success: false,
});
