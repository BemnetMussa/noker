import { z } from "zod";

export const condenseSchema = z.object({
  pageId: z.string().min(1),
});

export type CondenseInput = z.infer<typeof condenseSchema>;
