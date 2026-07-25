import { z } from "zod";

export const blockTypeSchema = z.enum(["TEXT", "SOURCE", "IMAGE", "UNPACK"]);
export const blockPlacementSchema = z.enum(["BODY", "MARGIN"]);

export type BlockTypeValue = z.infer<typeof blockTypeSchema>;
export type BlockPlacementValue = z.infer<typeof blockPlacementSchema>;

const DATA_URI = /^data:image\/(png|jpe?g|webp|gif|avif);base64,[A-Za-z0-9+/=]+$/;
const WEB_URL = /^https?:\/\/.+/i;

/** Accepts a web image URL or an uploaded image encoded as a data URI. */
export const imageSourceSchema = z
  .string()
  .refine((value) => WEB_URL.test(value) || DATA_URI.test(value), {
    message: "Add an image URL, or upload an image file",
  });

export const createBlockSchema = z.object({
  notebookId: z.string().min(1),
  type: blockTypeSchema.default("TEXT"),
  placement: blockPlacementSchema.default("BODY"),
  /** Insert directly after this block; omit to append at the end. */
  afterId: z.string().min(1).optional(),
  content: z.string().max(200000).optional(),
  imageUrl: imageSourceSchema.optional(),
  quote: z.string().max(8000).optional(),
  citation: z.string().max(300).optional(),
  citationUrl: z.string().max(2000).optional(),
});

export type CreateBlockInput = z.infer<typeof createBlockSchema>;

export const updateBlockSchema = z.object({
  id: z.string().min(1),
  content: z.string().max(200000).optional(),
  citation: z.string().max(300).optional(),
  placement: blockPlacementSchema.optional(),
});

export type UpdateBlockInput = z.infer<typeof updateBlockSchema>;

export const moveBlockSchema = z.object({
  id: z.string().min(1),
  direction: z.enum(["up", "down"]),
});

export type MoveBlockInput = z.infer<typeof moveBlockSchema>;
