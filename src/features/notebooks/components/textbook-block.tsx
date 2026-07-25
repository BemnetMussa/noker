"use client";

import { type MouseEvent, useEffect, useRef } from "react";
import {
  Trash2,
  Sparkles,
  Link2,
  ChevronUp,
  ChevronDown,
  PanelRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Block, Highlight } from "@/features/notebooks/types";
import { HIGHLIGHT_COLORS } from "@/features/notebooks/lib/highlight-colors";

type Segment =
  | { kind: "text"; value: string }
  | { kind: "mark"; value: string; highlight: Highlight };

/** Splits verbatim content into plain and highlighted segments by offset. */
function buildSegments(content: string, highlights: Highlight[]): Segment[] {
  const sorted = [...highlights]
    .filter((h) => h.startOffset < h.endOffset && h.startOffset < content.length)
    .sort((a, b) => a.startOffset - b.startOffset);

  const segments: Segment[] = [];
  let cursor = 0;

  for (const highlight of sorted) {
    const start = Math.max(highlight.startOffset, cursor);
    const end = Math.min(highlight.endOffset, content.length);
    if (end <= start) continue;
    if (start > cursor) {
      segments.push({ kind: "text", value: content.slice(cursor, start) });
    }
    segments.push({ kind: "mark", value: content.slice(start, end), highlight });
    cursor = end;
  }
  if (cursor < content.length) {
    segments.push({ kind: "text", value: content.slice(cursor) });
  }
  return segments;
}

interface Props {
  block: Block;
  figureNumber?: number;
  referenceNumber?: number;
  highlights: Highlight[];
  isEditing: boolean;
  streamingText?: string;
  onEdit: () => void;
  onChange: (content: string) => void;
  onCommit: () => void;
  onDelete: () => void;
  onMove: (direction: "up" | "down") => void;
  onTogglePlacement: () => void;
  onTextMouseUp: (event: MouseEvent<HTMLElement>, block: Block) => void;
  onHighlightClick: (event: MouseEvent<HTMLElement>, highlight: Highlight) => void;
}

export function TextbookBlock({
  block,
  figureNumber,
  referenceNumber,
  highlights,
  isEditing,
  streamingText,
  onEdit,
  onChange,
  onCommit,
  onDelete,
  onMove,
  onTogglePlacement,
  onTextMouseUp,
  onHighlightClick,
}: Props) {
  const textarea = useRef<HTMLTextAreaElement>(null);
  const isStreaming = streamingText !== undefined;
  const text = isStreaming ? streamingText : block.content;
  const isMargin = block.placement === "MARGIN";

  useEffect(() => {
    if (isEditing) textarea.current?.focus();
  }, [isEditing]);

  const segments = buildSegments(text, highlights);

  const readable = (
    <div
      onMouseUp={(event) => onTextMouseUp(event, block)}
      className={cn(
        "cursor-text whitespace-pre-wrap",
        isMargin ? "text-[0.82rem] leading-6" : "text-[1.02rem] leading-8",
        !text && "text-muted-foreground/50",
      )}
    >
      {text ? (
        segments.map((segment, index) =>
          segment.kind === "text" ? (
            <span key={index}>{segment.value}</span>
          ) : (
            <mark
              key={index}
              onClick={(event) => onHighlightClick(event, segment.highlight)}
              className={cn(
                "box-decoration-clone cursor-pointer rounded-sm text-inherit",
                HIGHLIGHT_COLORS[segment.highlight.color].mark,
              )}
            >
              {segment.value}
            </mark>
          ),
        )
      ) : (
        <span>Write here…</span>
      )}
      {referenceNumber ? (
        <sup className="text-muted-foreground ml-0.5 text-[0.7em]">
          [{referenceNumber}]
        </sup>
      ) : null}
      {isStreaming ? (
        <span className="bg-primary/60 ml-0.5 inline-block h-4 w-1.5 animate-pulse align-middle" />
      ) : null}
    </div>
  );

  const editor = (
    <textarea
      ref={textarea}
      value={block.content}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onCommit}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onCommit();
        }
      }}
      placeholder="Write here…"
      className={cn(
        "field-sizing-content w-full resize-none bg-transparent outline-none",
        isMargin ? "text-[0.82rem] leading-6" : "text-[1.02rem] leading-8",
      )}
    />
  );

  return (
    <div
      data-block-id={block.id}
      className={cn(
        "group/block relative",
        isMargin
          ? "text-muted-foreground border-border mb-4 border-l pl-3 lg:float-right lg:clear-right lg:-mr-[214px] lg:ml-8 lg:w-[190px]"
          : "mb-5",
      )}
    >
      {/* hover controls */}
      <div className="absolute -top-2 -left-9 z-10 flex flex-col gap-0.5 opacity-0 transition-opacity group-hover/block:opacity-100">
        <button
          type="button"
          onClick={() => onMove("up")}
          className="text-muted-foreground hover:bg-accent hover:text-foreground rounded p-0.5"
          aria-label="Move up"
        >
          <ChevronUp className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onMove("down")}
          className="text-muted-foreground hover:bg-accent hover:text-foreground rounded p-0.5"
          aria-label="Move down"
        >
          <ChevronDown className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={onTogglePlacement}
          className={cn(
            "hover:bg-accent hover:text-foreground rounded p-0.5",
            isMargin ? "text-primary" : "text-muted-foreground",
          )}
          aria-label={isMargin ? "Move into body" : "Move to margin"}
          title={isMargin ? "Move into body" : "Move to margin"}
        >
          <PanelRight className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded p-0.5"
          aria-label="Delete"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      {block.type === "IMAGE" ? (
        <figure className="flex flex-col gap-2">
          {block.imageUrl ? (
            <div className="flex justify-center rounded-md border bg-white p-3 dark:bg-neutral-100">
              {/* eslint-disable-next-line @next/next/no-img-element -- user image (URL or data URI) */}
              <img
                src={block.imageUrl}
                alt={block.content || "Figure"}
                className="max-h-80 w-auto object-contain"
                draggable={false}
              />
            </div>
          ) : null}
          <figcaption className="text-muted-foreground text-[0.8rem] leading-6">
            {figureNumber ? (
              <span className="text-foreground font-medium">
                Figure {figureNumber}.{" "}
              </span>
            ) : null}
            {isEditing ? (
              <textarea
                ref={textarea}
                value={block.content}
                onChange={(event) => onChange(event.target.value)}
                onBlur={onCommit}
                placeholder="Caption…"
                className="field-sizing-content w-full resize-none bg-transparent outline-none"
              />
            ) : (
              <span onMouseUp={() => onEdit()} className="cursor-text">
                {block.content || "Add a caption…"}
              </span>
            )}
            {referenceNumber ? (
              <sup className="ml-0.5 text-[0.7em]">[{referenceNumber}]</sup>
            ) : null}
          </figcaption>
        </figure>
      ) : block.type === "UNPACK" ? (
        <aside className="border-primary/20 bg-primary/5 rounded-lg border px-4 py-3">
          <span className="text-primary/70 mb-1.5 flex items-center gap-1 text-[0.7rem] font-semibold tracking-wide uppercase">
            <Sparkles className="size-3" />
            Unpacked
          </span>
          {block.quote ? (
            <blockquote className="border-primary/30 text-muted-foreground mb-2 border-l-2 pl-2 text-[0.85rem] italic">
              {block.quote}
            </blockquote>
          ) : null}
          {isEditing ? editor : readable}
        </aside>
      ) : block.type === "SOURCE" ? (
        <div className="border-border border-l-2 pl-4">
          {block.citation ? (
            <div className="text-muted-foreground mb-1 text-[0.72rem]">
              {block.citationUrl ? (
                <a
                  href={block.citationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground inline-flex items-center gap-1 hover:underline"
                >
                  <Link2 className="size-3" />
                  {block.citation}
                </a>
              ) : (
                <span>{block.citation}</span>
              )}
            </div>
          ) : null}
          {isEditing ? editor : readable}
        </div>
      ) : isEditing ? (
        editor
      ) : (
        readable
      )}
    </div>
  );
}
