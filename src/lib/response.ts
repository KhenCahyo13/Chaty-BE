import { ErrorResponse, SuccessResponse } from 'src/types/response';

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
