import { z } from "zod";

export const noteKindSchema = z.enum(["NOTE", "QUOTE", "UNPACK"]);

export type NoteKindValue = z.infer<typeof noteKindSchema>;

export const createNoteSchema = z
  .object({
    notebookId: z.string().min(1),
    sourceId: z.string().min(1).optional(),
    kind: noteKindSchema.default("NOTE"),
    quote: z.string().max(8000).optional(),
    body: z.string().max(20000).optional(),
  })
  .refine((value) => Boolean(value.quote?.trim() || value.body?.trim()), {
    message: "A note needs a quote or some text",
    path: ["body"],
  });

export type CreateNoteInput = z.infer<typeof createNoteSchema>;

export const updateNoteSchema = z.object({
  id: z.string().min(1),
  body: z.string().min(1, "A note can't be empty").max(20000),
});

export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
