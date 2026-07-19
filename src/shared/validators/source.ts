import { z } from "zod";

export const textSourceSchema = z.object({
  title: z.string().min(1, "Add a short title").max(200, "Title is too long"),
  content: z.string().min(1, "Paste the text you want to learn from"),
});

export type TextSourceInput = z.infer<typeof textSourceSchema>;

export const urlSourceSchema = z.object({
  url: z.string().url("Enter a valid URL (including https://)"),
});

export type UrlSourceInput = z.infer<typeof urlSourceSchema>;
