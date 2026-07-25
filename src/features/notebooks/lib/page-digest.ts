import type { Block, Highlight, HighlightColor } from "@/features/notebooks/types";

const IMPORTANCE: Record<HighlightColor, string> = {
  KEY: "KEY — the learner marked this a core idea",
  SUPPORTING: "SUPPORTING — a useful detail or example",
  REVISIT: "REVISIT — the learner flagged this as unclear",
};

const MAX_BLOCK_CHARS = 12000;
const MAX_TOTAL_CHARS = 40000;

function truncate(value: string, limit: number): string {
  return value.length <= limit ? value : `${value.slice(0, limit)}…[truncated]`;
}

/**
 * Flattens a page into the prompt the condenser reads: blocks in visual order
 * (top-to-bottom, then left-to-right) with each highlight tagged by importance.
 */
export function buildPageDigest(page: {
  title: string;
  blocks: Block[];
  highlights: Highlight[];
}): string {
  const ordered = [...page.blocks].sort((a, b) => a.order - b.order);
  const parts: string[] = [`Topic: ${page.title}`, ""];

  for (const block of ordered) {
    const content = truncate(block.content.trim(), MAX_BLOCK_CHARS);

    if (block.type === "SOURCE" && content) {
      parts.push(
        `[SOURCE MATERIAL${block.citation ? ` — from "${block.citation}"` : ""}]\n${content}`,
      );
    } else if (block.type === "UNPACK" && content) {
      parts.push(
        `[ALREADY UNPACKED${block.quote ? ` — explaining: "${block.quote}"` : ""}]\n${content}`,
      );
    } else if (block.type === "IMAGE") {
      if (content) parts.push(`[FIGURE ON THE PAGE] caption: ${content}`);
    } else if (content) {
      parts.push(
        block.placement === "MARGIN"
          ? `[LEARNER'S MARGIN NOTE]\n${content}`
          : `[LEARNER'S OWN NOTE]\n${content}`,
      );
    }

    for (const highlight of page.highlights.filter(
      (item) => item.blockId === block.id,
    )) {
      parts.push(`Highlighted ${IMPORTANCE[highlight.color]}: "${highlight.text}"`);
    }
    parts.push("");
  }

  return truncate(parts.join("\n"), MAX_TOTAL_CHARS);
}
