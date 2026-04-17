import { z } from 'zod';

export const LanguageSchema = z.enum(['en', 'ja']);

export type Language = z.infer<typeof LanguageSchema>;