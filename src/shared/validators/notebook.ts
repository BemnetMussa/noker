import { z } from "zod";

export const notebookSchema = z.object({
  title: z
    .string()
    .min(1, "Give your notebook a title")
    .max(120, "Title is too long"),
  description: z.string().max(500, "Description is too long").optional(),
});

export type NotebookInput = z.infer<typeof notebookSchema>;
