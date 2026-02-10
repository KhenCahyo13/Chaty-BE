export type SuccessResponse<T, TMeta = null> = {
    success: true;
    message: string;
    data: T;
    meta?: TMeta;
};

export type ErrorResponse<E = unknown> = {
    success: false;
    message: string;
    errors?: E;
};

export const successResponse = <TData, TMeta = null>(
    message: string,
    data: TData,
    meta?: TMeta
): SuccessResponse<TData, TMeta> => ({
    success: true,
    message,
    data,
    meta,
});

export const errorResponse = <E>(
    message: string,
    errors?: E
): ErrorResponse<E> => ({
    success: false,
    message,
    errors,
});
