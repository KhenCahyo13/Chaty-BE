export interface CursorResponse<TData> {
    data: TData[];
    nextCursor: null | string;
}
