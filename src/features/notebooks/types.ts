import type {
  Notebook,
  Block,
  BlockType,
  BlockPlacement,
  Highlight,
  HighlightColor,
} from "@/generated/prisma/client";

export type {
  Notebook,
  Block,
  BlockType,
  BlockPlacement,
  Highlight,
  HighlightColor,
};

/** One page = one topic. `Notebook` is the underlying model. */
export type PageWithBlocks = Notebook & {
  blocks: Block[];
  highlights: Highlight[];
};

export type PageSummary = Notebook & {
  _count: { blocks: number };
};

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };
