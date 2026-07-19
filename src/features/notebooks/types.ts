import type { Notebook, Source, Note } from "@/generated/prisma/client";

export type { Notebook, Source, Note };

export interface NoteSourceRef {
  id: string;
  title: string;
  url: string | null;
}

export type NoteWithSource = Note & { source: NoteSourceRef | null };

export type NotebookWithContent = Notebook & {
  sources: Source[];
  notes: NoteWithSource[];
};

export type NotebookSummary = Notebook & {
  _count: { sources: number; notes: number };
};

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };
