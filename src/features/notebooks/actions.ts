"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import { getSession } from "@/server/session";
import { AppError, handleError } from "@/shared/utils/errors";
import { notebookSchema } from "@/shared/validators/notebook";
import {
  createBlockSchema,
  updateBlockSchema,
  moveBlockSchema,
} from "@/shared/validators/block";
import { createHighlightSchema } from "@/shared/validators/highlight";
import { urlSourceSchema } from "@/shared/validators/source";
import { extractFromUrl } from "./lib/extract-url";
import type { ActionResult, Block, Highlight } from "./types";

const ORDER_STEP = 10;

async function requireUserId(): Promise<string> {
  const session = await getSession();
  if (!session) {
    throw new AppError("You need to be signed in", 401, "UNAUTHORIZED");
  }
  return session.user.id;
}

async function assertPageOwner(pageId: string, userId: string) {
  const page = await db.notebook.findFirst({
    where: { id: pageId, userId },
    select: { id: true },
  });
  if (!page) {
    throw new AppError("Page not found", 404, "PAGE_NOT_FOUND");
  }
}

async function touchPage(pageId: string) {
  await db.notebook.update({
    where: { id: pageId },
    data: { updatedAt: new Date() },
  });
}

/** Re-spaces the flow so there's always room to insert between elements. */
async function renumberBlocks(notebookId: string) {
  const blocks = await db.block.findMany({
    where: { notebookId },
    orderBy: { order: "asc" },
    select: { id: true },
  });
  await db.$transaction(
    blocks.map((block, index) =>
      db.block.update({
        where: { id: block.id },
        data: { order: (index + 1) * ORDER_STEP },
      }),
    ),
  );
}

async function nextOrder(notebookId: string): Promise<number> {
  const last = await db.block.findFirst({
    where: { notebookId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  return (last?.order ?? 0) + ORDER_STEP;
}

export async function createPage(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const userId = await requireUserId();
    const data = notebookSchema.parse(input);
    const page = await db.notebook.create({
      data: { ...data, userId },
      select: { id: true },
    });
    revalidatePath("/pages");
    return { ok: true, data: { id: page.id } };
  } catch (error) {
    return { ok: false, error: handleError(error).message };
  }
}

export async function updatePage(
  pageId: string,
  input: unknown,
): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    await assertPageOwner(pageId, userId);
    const data = notebookSchema.parse(input);
    await db.notebook.update({ where: { id: pageId }, data });
    revalidatePath("/pages");
    revalidatePath(`/pages/${pageId}`);
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: handleError(error).message };
  }
}

export async function deletePage(pageId: string): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    await assertPageOwner(pageId, userId);
    await db.notebook.delete({ where: { id: pageId } });
    revalidatePath("/pages");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: handleError(error).message };
  }
}

export async function saveCondensed(
  pageId: string,
  text: string,
): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    await assertPageOwner(pageId, userId);
    const condensed = text.trim().slice(0, 20000);
    if (!condensed) {
      throw new AppError("Nothing to save", 400, "EMPTY_CONDENSED");
    }
    await db.notebook.update({
      where: { id: pageId },
      data: { condensed, condensedAt: new Date() },
    });
    revalidatePath(`/pages/${pageId}`);
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: handleError(error).message };
  }
}

export async function createBlock(
  input: unknown,
): Promise<ActionResult<Block>> {
  try {
    const userId = await requireUserId();
    const data = createBlockSchema.parse(input);
    await assertPageOwner(data.notebookId, userId);

    let order: number;
    if (data.afterId) {
      const after = await db.block.findFirst({
        where: { id: data.afterId, notebookId: data.notebookId },
        select: { order: true },
      });
      if (!after) {
        throw new AppError("Block not found", 404, "BLOCK_NOT_FOUND");
      }
      order = after.order + Math.floor(ORDER_STEP / 2);
    } else {
      order = await nextOrder(data.notebookId);
    }

    const created = await db.block.create({
      data: {
        notebookId: data.notebookId,
        type: data.type,
        placement: data.placement,
        order,
        content: data.content ?? "",
        imageUrl: data.imageUrl ?? null,
        quote: data.quote ?? null,
        citation: data.citation ?? null,
        citationUrl: data.citationUrl ?? null,
      },
    });

    if (data.afterId) await renumberBlocks(data.notebookId);

    const block = await db.block.findUnique({ where: { id: created.id } });
    if (!block) {
      throw new AppError("Block not found", 404, "BLOCK_NOT_FOUND");
    }

    await touchPage(data.notebookId);
    revalidatePath(`/pages/${data.notebookId}`);
    return { ok: true, data: block };
  } catch (error) {
    return { ok: false, error: handleError(error).message };
  }
}

/** Pulls the readable text off a web page and adds it to the document. */
export async function createBlockFromUrl(
  notebookId: string,
  url: unknown,
): Promise<ActionResult<Block>> {
  try {
    const userId = await requireUserId();
    await assertPageOwner(notebookId, userId);
    const parsed = urlSourceSchema.parse({ url });

    const extracted = await extractFromUrl(parsed.url);

    const block = await db.block.create({
      data: {
        notebookId,
        type: "SOURCE",
        order: await nextOrder(notebookId),
        content: extracted.content,
        citation: extracted.title,
        citationUrl: parsed.url,
      },
    });

    await touchPage(notebookId);
    revalidatePath(`/pages/${notebookId}`);
    return { ok: true, data: block };
  } catch (error) {
    return { ok: false, error: handleError(error).message };
  }
}

export async function updateBlock(
  input: unknown,
): Promise<ActionResult<Block>> {
  try {
    const userId = await requireUserId();
    const data = updateBlockSchema.parse(input);

    const existing = await db.block.findFirst({
      where: { id: data.id, notebook: { userId } },
      select: { id: true, notebookId: true },
    });
    if (!existing) {
      throw new AppError("Block not found", 404, "BLOCK_NOT_FOUND");
    }

    const block = await db.block.update({
      where: { id: data.id },
      data: {
        ...(data.content !== undefined ? { content: data.content } : {}),
        ...(data.citation !== undefined ? { citation: data.citation } : {}),
        ...(data.placement !== undefined ? { placement: data.placement } : {}),
      },
    });

    revalidatePath(`/pages/${existing.notebookId}`);
    return { ok: true, data: block };
  } catch (error) {
    return { ok: false, error: handleError(error).message };
  }
}

/** Swaps an element with its neighbour in the flow. */
export async function moveBlock(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const userId = await requireUserId();
    const data = moveBlockSchema.parse(input);

    const existing = await db.block.findFirst({
      where: { id: data.id, notebook: { userId } },
      select: { id: true, notebookId: true },
    });
    if (!existing) {
      throw new AppError("Block not found", 404, "BLOCK_NOT_FOUND");
    }

    const blocks = await db.block.findMany({
      where: { notebookId: existing.notebookId },
      orderBy: { order: "asc" },
      select: { id: true, order: true },
    });

    const index = blocks.findIndex((block) => block.id === data.id);
    const target = data.direction === "up" ? index - 1 : index + 1;
    if (index === -1 || target < 0 || target >= blocks.length) {
      return { ok: true, data: { id: data.id } };
    }

    await db.$transaction([
      db.block.update({
        where: { id: blocks[index].id },
        data: { order: blocks[target].order },
      }),
      db.block.update({
        where: { id: blocks[target].id },
        data: { order: blocks[index].order },
      }),
    ]);

    revalidatePath(`/pages/${existing.notebookId}`);
    return { ok: true, data: { id: data.id } };
  } catch (error) {
    return { ok: false, error: handleError(error).message };
  }
}

export async function deleteBlock(
  blockId: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const userId = await requireUserId();

    const existing = await db.block.findFirst({
      where: { id: blockId, notebook: { userId } },
      select: { id: true, notebookId: true },
    });
    if (!existing) {
      throw new AppError("Block not found", 404, "BLOCK_NOT_FOUND");
    }

    await db.block.delete({ where: { id: blockId } });

    revalidatePath(`/pages/${existing.notebookId}`);
    return { ok: true, data: { id: blockId } };
  } catch (error) {
    return { ok: false, error: handleError(error).message };
  }
}

export async function createHighlight(
  input: unknown,
): Promise<ActionResult<Highlight>> {
  try {
    const userId = await requireUserId();
    const data = createHighlightSchema.parse(input);
    await assertPageOwner(data.notebookId, userId);

    const block = await db.block.findFirst({
      where: { id: data.blockId, notebookId: data.notebookId },
      select: { id: true },
    });
    if (!block) {
      throw new AppError("Block not found", 404, "BLOCK_NOT_FOUND");
    }

    const highlight = await db.highlight.create({
      data: {
        notebookId: data.notebookId,
        blockId: data.blockId,
        color: data.color,
        text: data.text,
        startOffset: data.startOffset,
        endOffset: data.endOffset,
      },
    });

    await touchPage(data.notebookId);
    revalidatePath(`/pages/${data.notebookId}`);
    return { ok: true, data: highlight };
  } catch (error) {
    return { ok: false, error: handleError(error).message };
  }
}

export async function deleteHighlight(
  highlightId: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const userId = await requireUserId();

    const existing = await db.highlight.findFirst({
      where: { id: highlightId, notebook: { userId } },
      select: { id: true, notebookId: true },
    });
    if (!existing) {
      throw new AppError("Highlight not found", 404, "HIGHLIGHT_NOT_FOUND");
    }

    await db.highlight.delete({ where: { id: highlightId } });

    revalidatePath(`/pages/${existing.notebookId}`);
    return { ok: true, data: { id: highlightId } };
  } catch (error) {
    return { ok: false, error: handleError(error).message };
  }
}
