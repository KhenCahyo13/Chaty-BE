import z from 'zod';
import { createPrivateMessageSchema } from './private-message.schema';

export type CreatePrivateMessageValues = z.infer<typeof createPrivateMessageSchema>;