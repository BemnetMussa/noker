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

export async function listPages() {
  const userId = await requireUserId();
  return db.notebook.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { blocks: true } } },
  });
}

export async function getPage(pageId: string) {
  const userId = await requireUserId();

  const page = await db.notebook.findFirst({
    where: { id: pageId, userId },
    include: {
      blocks: { orderBy: { order: "asc" } },
      highlights: { orderBy: { startOffset: "asc" } },
    },
  });

  if (!page) {
    throw new AppError("Page not found", 404, "PAGE_NOT_FOUND");
  }

  return page;
}
