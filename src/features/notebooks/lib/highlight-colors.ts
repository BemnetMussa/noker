import type { HighlightColor } from "@/features/notebooks/types";

export interface HighlightMeta {
  label: string;
  /** background applied to the highlighted text (light + dark) */
  mark: string;
  /** solid swatch/dot for toolbars and legends */
  dot: string;
}

export const HIGHLIGHT_COLORS: Record<HighlightColor, HighlightMeta> = {
  KEY: {
    label: "Key point",
    mark: "bg-amber-200/70 dark:bg-amber-300/25",
    dot: "bg-amber-400",
  },
  SUPPORTING: {
    label: "Good to know",
    mark: "bg-emerald-200/70 dark:bg-emerald-300/25",
    dot: "bg-emerald-500",
  },
  REVISIT: {
    label: "Revisit",
    mark: "bg-rose-200/70 dark:bg-rose-300/25",
    dot: "bg-rose-500",
  },
};

export const HIGHLIGHT_ORDER: HighlightColor[] = ["KEY", "SUPPORTING", "REVISIT"];
