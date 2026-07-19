import { streamText } from "ai";
import { getSession } from "@/server/session";
import { errorResponse } from "@/shared/utils/api-response";
import { handleError } from "@/shared/utils/errors";
import { unpackSchema } from "@/shared/validators/unpack";

export const maxDuration = 60;

const UNPACK_MODEL = "anthropic/claude-sonnet-5";

const SYSTEM_PROMPT = `You are NOKER, a calm study companion. A learner is reading something and has highlighted a passage they want to genuinely understand.

Your job: explain the highlighted passage in plain, clear language a motivated beginner could follow.

Rules:
- Ground every claim in the provided source. Do not introduce facts the source doesn't support. If understanding the passage requires a term the source never defines, say so in one short line instead of inventing a definition.
- Lead with the core idea in one or two sentences. Then unpack the details only as far as they need unpacking.
- Keep it tight. Short paragraphs. Use a small bullet list only when it truly aids clarity.
- Use an everyday analogy when it genuinely makes the idea click — never force one.
- No quizzes, no flashcards, no "let me test you", no praise, no filler, no restating the question.
- Write plain Markdown prose.`;

function buildPrompt(input: {
  quote: string;
  sourceTitle?: string;
  context?: string;
}): string {
  const parts: string[] = [];

  if (input.sourceTitle) {
    parts.push(`Source: "${input.sourceTitle}"`);
  }
  if (input.context) {
    parts.push(`Surrounding context from the source:\n"""\n${input.context}\n"""`);
  }
  parts.push(`The learner highlighted this passage:\n"""\n${input.quote}\n"""`);
  parts.push("Unpack the highlighted passage so it becomes clear.");

  return parts.join("\n\n");
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return errorResponse("You need to be signed in", 401, "UNAUTHORIZED");
    }

    const parsed = unpackSchema.safeParse(await request.json());
    if (!parsed.success) {
      return errorResponse(
        parsed.error.issues[0]?.message ?? "Invalid request",
        400,
        "INVALID_INPUT",
      );
    }

    const result = streamText({
      model: UNPACK_MODEL,
      system: SYSTEM_PROMPT,
      prompt: buildPrompt(parsed.data),
    });

    return result.toTextStreamResponse();
  } catch (error) {
    const { message, statusCode, code } = handleError(error);
    return errorResponse(message, statusCode, code);
  }
}
