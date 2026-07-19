import { AppError } from "@/shared/utils/errors";

export interface ExtractedSource {
  title: string;
  content: string;
}

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
};

function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&[a-z]+;|&#39;/gi, (match) => ENTITIES[match.toLowerCase()] ?? match);
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? decodeEntities(match[1]).trim() : null;
}

/**
 * Turns raw HTML into readable plain text. This is a deliberately lightweight
 * pass (no extra dependencies): strip non-content tags, keep block boundaries
 * as line breaks, and collapse whitespace. A readability library would extract
 * the main article more precisely — a good v2 upgrade.
 */
function htmlToText(html: string): string {
  const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? html;

  return decodeEntities(
    body
      .replace(/<(script|style|noscript|template|svg)[^>]*>[\s\S]*?<\/\1>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<\/(p|div|section|article|h[1-6]|li|tr|blockquote)>/gi, "\n\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function extractFromUrl(url: string): Promise<ExtractedSource> {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; NokerBot/1.0; +https://noker.app)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
  } catch {
    throw new AppError("Couldn't reach that URL", 400, "URL_FETCH_FAILED");
  }

  if (!response.ok) {
    throw new AppError(
      `That page returned ${response.status}`,
      400,
      "URL_FETCH_FAILED",
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("html") && !contentType.includes("text")) {
    throw new AppError(
      "That link isn't a readable web page",
      415,
      "URL_UNSUPPORTED",
    );
  }

  const html = await response.text();
  const content = htmlToText(html);

  if (content.length < 40) {
    throw new AppError(
      "Couldn't find readable text on that page. Try pasting the text instead.",
      422,
      "URL_EMPTY",
    );
  }

  return {
    title: extractTitle(html) || new URL(url).hostname,
    content,
  };
}
