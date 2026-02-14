import { FieldError } from 'src/types/response';
import type { ZodIssue } from 'zod';

export const mapZodIssues = (issues: ZodIssue[]): FieldError[] =>
    issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
    }));
