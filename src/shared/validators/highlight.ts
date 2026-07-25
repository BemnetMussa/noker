import { z } from "zod";

export const highlightColorSchema = z.enum(["KEY", "SUPPORTING", "REVISIT"]);

export type HighlightColorValue = z.infer<typeof highlightColorSchema>;

export const createHighlightSchema = z
  .object({
    notebookId: z.string().min(1),
    blockId: z.string().min(1),
    color: highlightColorSchema,
    text: z.string().min(1).max(8000),
    startOffset: z.number().int().min(0),
    endOffset: z.number().int().min(0),
  })
  .refine((value) => value.endOffset > value.startOffset, {
    message: "Invalid highlight range",
    path: ["endOffset"],
  });

export type CreateHighlightInput = z.infer<typeof createHighlightSchema>;
