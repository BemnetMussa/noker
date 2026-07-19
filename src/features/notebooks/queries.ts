import { db } from "@/server/db";
import { getSession } from "@/server/session";
import { AppError } from "@/shared/utils/errors";

async function requireUserId(): Promise<string> {
  const session = await getSession();
  if (!session) {
    throw new AppError("You need to be signed in", 401, "UNAUTHORIZED");
  }
  return session.user.id;
}

export async function listNotebooks() {
  const userId = await requireUserId();
  return db.notebook.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { sources: true, notes: true } } },
  });
}

export async function getNotebook(notebookId: string) {
  const userId = await requireUserId();

  const notebook = await db.notebook.findFirst({
    where: { id: notebookId, userId },
    include: {
      sources: { orderBy: { createdAt: "asc" } },
      notes: {
        orderBy: { createdAt: "desc" },
        include: { source: { select: { id: true, title: true, url: true } } },
      },
    },
  });

  if (!notebook) {
    throw new AppError("Notebook not found", 404, "NOTEBOOK_NOT_FOUND");
  }

  return notebook;
}
