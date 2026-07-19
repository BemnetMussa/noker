import { z } from "zod";

export const unpackSchema = z.object({
  quote: z.string().min(1, "Nothing was selected to unpack").max(6000),
  sourceTitle: z.string().max(300).optional(),
  context: z.string().max(12000).optional(),
});

export type UnpackInput = z.infer<typeof unpackSchema>;
