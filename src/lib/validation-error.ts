import type { ZodIssue } from 'zod';

type FieldError = {
    field: string;
    message: string;
};

export const mapZodIssues = (issues: ZodIssue[]): FieldError[] =>
    issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
    }));
