import { streamText } from "ai";
import { db } from "@/server/db";
import { getSession } from "@/server/session";
import { errorResponse } from "@/shared/utils/api-response";
import { handleError } from "@/shared/utils/errors";
import { condenseSchema } from "@/shared/validators/condense";
import { buildPageDigest } from "@/features/notebooks/lib/page-digest";

export const maxDuration = 120;

const CONDENSE_MODEL = "anthropic/claude-sonnet-5";

const SYSTEM_PROMPT = `You are NOKER. A learner has gathered everything they found about one topic onto a single page: source material they pasted in, passages they highlighted, explanations they already unpacked, images, and their own notes.

Write ONE condensed note on the topic. This is what they will read later instead of re-reading the whole page.

Rules:
- Use ONLY what is on the page. Never add facts from outside it. If the page doesn't cover something, leave it out.
- Their highlights tell you what mattered to them: lead with what they marked KEY, and fold SUPPORTING in as detail.
- Open with one or two sentences that capture the whole subject.
- Then lay out the ideas so they build on each other — not a replay of the page in page order.
- Anything marked REVISIT belongs in a short "Still unclear" section at the very end.
- Condense hard. Aim under 400 words. Cut anything that doesn't earn its place.
- Plain language, short paragraphs. Use "## " headings only if the topic genuinely has parts, and "- " bullets only where a list is the clearest form.
- No preamble, no sign-off, no quizzes, no flashcards. Start straight into the note.`;

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return errorResponse("You need to be signed in", 401, "UNAUTHORIZED");
    }

    if (!process.env.AI_GATEWAY_API_KEY) {
      return errorResponse(
        "Condensing needs an AI key. Add AI_GATEWAY_API_KEY to your .env and restart.",
        503,
        "AI_NOT_CONFIGURED",
      );
    }

    const parsed = condenseSchema.safeParse(await request.json());
    if (!parsed.success) {
      return errorResponse("Invalid request", 400, "INVALID_INPUT");
    }

    const page = await db.notebook.findFirst({
      where: { id: parsed.data.pageId, userId: session.user.id },
      include: { blocks: true, highlights: true },
    });

    if (!page) {
      return errorResponse("Page not found", 404, "PAGE_NOT_FOUND");
    }

    const hasContent = page.blocks.some(
      (block) => block.content.trim() || block.imageUrl,
    );
    if (!hasContent) {
      return errorResponse(
        "There's nothing on this page to condense yet",
        400,
        "PAGE_EMPTY",
      );
    }

    const result = streamText({
      model: CONDENSE_MODEL,
      system: SYSTEM_PROMPT,
      prompt: buildPageDigest(page),
    });

    return result.toTextStreamResponse();
  } catch (error) {
    const { message, statusCode, code } = handleError(error);
    return errorResponse(message, statusCode, code);
  }
}
