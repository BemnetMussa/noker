"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import { getSession } from "@/server/session";
import { AppError, handleError } from "@/shared/utils/errors";
import { notebookSchema } from "@/shared/validators/notebook";
import { textSourceSchema, urlSourceSchema } from "@/shared/validators/source";
import { createNoteSchema, updateNoteSchema } from "@/shared/validators/note";
import { extractFromUrl } from "./lib/extract-url";
import type { ActionResult, NoteWithSource, Source } from "./types";

async function requireUserId(): Promise<string> {
  const session = await getSession();
  if (!session) {
    throw new AppError("You need to be signed in", 401, "UNAUTHORIZED");
  }
  return session.user.id;
}

async function assertNotebookOwner(notebookId: string, userId: string) {
  const notebook = await db.notebook.findFirst({
    where: { id: notebookId, userId },
    select: { id: true },
  });
  if (!notebook) {
    throw new AppError("Notebook not found", 404, "NOTEBOOK_NOT_FOUND");
  }
}

async function touchNotebook(notebookId: string) {
  await db.notebook.update({
    where: { id: notebookId },
    data: { updatedAt: new Date() },
  });
}

const noteWithSource = {
  source: { select: { id: true, title: true, url: true } },
} as const;

export async function createNotebook(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const userId = await requireUserId();
    const data = notebookSchema.parse(input);

    const notebook = await db.notebook.create({
      data: { ...data, userId },
      select: { id: true },
    });

    revalidatePath("/notebooks");
    return { ok: true, data: { id: notebook.id } };
  } catch (error) {
    return { ok: false, error: handleError(error).message };
  }
}

export async function deleteNotebook(
  notebookId: string,
): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    await assertNotebookOwner(notebookId, userId);

    await db.notebook.delete({ where: { id: notebookId } });

    revalidatePath("/notebooks");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: handleError(error).message };
  }
}

export async function addTextSource(
  notebookId: string,
  input: unknown,
): Promise<ActionResult<Source>> {
  try {
    const userId = await requireUserId();
    await assertNotebookOwner(notebookId, userId);
    const data = textSourceSchema.parse(input);

    const source = await db.source.create({
      data: { notebookId, type: "TEXT", title: data.title, content: data.content },
    });

    await touchNotebook(notebookId);
    revalidatePath(`/notebooks/${notebookId}`);
    return { ok: true, data: source };
  } catch (error) {
    return { ok: false, error: handleError(error).message };
  }
}

export async function addUrlSource(
  notebookId: string,
  input: unknown,
): Promise<ActionResult<Source>> {
  try {
    const userId = await requireUserId();
    await assertNotebookOwner(notebookId, userId);
    const { url } = urlSourceSchema.parse(input);

    const extracted = await extractFromUrl(url);

    const source = await db.source.create({
      data: {
        notebookId,
        type: "URL",
        title: extracted.title,
        url,
        content: extracted.content,
      },
    });

    await touchNotebook(notebookId);
    revalidatePath(`/notebooks/${notebookId}`);
    return { ok: true, data: source };
  } catch (error) {
    return { ok: false, error: handleError(error).message };
  }
}

export async function createNote(
  input: unknown,
): Promise<ActionResult<NoteWithSource>> {
  try {
    const userId = await requireUserId();
    const data = createNoteSchema.parse(input);
    await assertNotebookOwner(data.notebookId, userId);

    if (data.sourceId) {
      const source = await db.source.findFirst({
        where: { id: data.sourceId, notebookId: data.notebookId },
        select: { id: true },
      });
      if (!source) {
        throw new AppError("Source not found", 404, "SOURCE_NOT_FOUND");
      }
    }

    const note = await db.note.create({
      data: {
        notebookId: data.notebookId,
        sourceId: data.sourceId ?? null,
        kind: data.kind,
        quote: data.quote?.trim() || null,
        body: data.body?.trim() ?? "",
      },
      include: noteWithSource,
    });

    await touchNotebook(data.notebookId);
    revalidatePath(`/notebooks/${data.notebookId}`);
    return { ok: true, data: note };
  } catch (error) {
    return { ok: false, error: handleError(error).message };
  }
}

export async function updateNote(
  input: unknown,
): Promise<ActionResult<NoteWithSource>> {
  try {
    const userId = await requireUserId();
    const data = updateNoteSchema.parse(input);

    const existing = await db.note.findFirst({
      where: { id: data.id, notebook: { userId } },
      select: { id: true, notebookId: true },
    });
    if (!existing) {
      throw new AppError("Note not found", 404, "NOTE_NOT_FOUND");
    }

    const note = await db.note.update({
      where: { id: data.id },
      data: { body: data.body.trim() },
      include: noteWithSource,
    });

    revalidatePath(`/notebooks/${existing.notebookId}`);
    return { ok: true, data: note };
  } catch (error) {
    return { ok: false, error: handleError(error).message };
  }
}

export async function deleteNote(
  noteId: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const userId = await requireUserId();

    const existing = await db.note.findFirst({
      where: { id: noteId, notebook: { userId } },
      select: { id: true, notebookId: true },
    });
    if (!existing) {
      throw new AppError("Note not found", 404, "NOTE_NOT_FOUND");
    }

    await db.note.delete({ where: { id: noteId } });

    revalidatePath(`/notebooks/${existing.notebookId}`);
    return { ok: true, data: { id: noteId } };
  } catch (error) {
    return { ok: false, error: handleError(error).message };
  }
}
