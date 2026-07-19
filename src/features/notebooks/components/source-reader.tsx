"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Sparkles, Quote, Link2, BookOpen } from "lucide-react";
import type { Source } from "@/features/notebooks/types";
import { Button } from "@/components/ui/button";

interface Props {
  source: Source | null;
  onUnpack: (quote: string, context: string) => void;
  onSaveQuote: (quote: string) => void;
}

interface ToolbarState {
  x: number;
  y: number;
  text: string;
}

const CONTEXT_RADIUS = 800;

export function SourceReader({ source, onUnpack, onSaveQuote }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [toolbar, setToolbar] = useState<ToolbarState | null>(null);

  const paragraphs = useMemo(() => {
    if (!source) return [];
    return source.content
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
  }, [source]);

  const updateToolbar = useCallback(() => {
    const selection = window.getSelection();
    const container = containerRef.current;
    if (!selection || selection.isCollapsed || !container) {
      setToolbar(null);
      return;
    }
    const text = selection.toString().trim();
    if (!text) {
      setToolbar(null);
      return;
    }
    const range = selection.getRangeAt(0);
    if (!container.contains(range.commonAncestorContainer)) {
      setToolbar(null);
      return;
    }
    const rect = range.getBoundingClientRect();
    const box = container.getBoundingClientRect();
    setToolbar({
      x: rect.left - box.left + rect.width / 2,
      y: rect.top - box.top,
      text,
    });
  }, []);

  function buildContext(quote: string): string {
    if (!source) return "";
    const index = source.content.indexOf(quote);
    if (index === -1) return source.content.slice(0, CONTEXT_RADIUS * 2);
    const start = Math.max(0, index - CONTEXT_RADIUS);
    const end = Math.min(
      source.content.length,
      index + quote.length + CONTEXT_RADIUS,
    );
    return source.content.slice(start, end);
  }

  function clearSelection() {
    window.getSelection()?.removeAllRanges();
    setToolbar(null);
  }

  function handleUnpack() {
    if (!toolbar) return;
    onUnpack(toolbar.text, buildContext(toolbar.text));
    clearSelection();
  }

  function handleSaveQuote() {
    if (!toolbar) return;
    onSaveQuote(toolbar.text);
    clearSelection();
  }

  if (!source) {
    return (
      <div className="text-muted-foreground flex h-full min-h-64 flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center text-sm">
        <BookOpen className="size-6" />
        <p>Add a source, then select any passage to unpack or quote it.</p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col rounded-lg border">
      <div className="flex items-start justify-between gap-3 border-b px-5 py-3">
        <div className="min-w-0">
          <h2 className="truncate font-medium tracking-tight">{source.title}</h2>
          {source.url ? (
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground mt-0.5 flex items-center gap-1 text-xs"
            >
              <Link2 className="size-3" />
              <span className="truncate">{source.url}</span>
            </a>
          ) : null}
        </div>
      </div>

      <div className="relative px-5 py-6">
        {toolbar ? (
          <div
            className="absolute z-20 -translate-x-1/2 -translate-y-full pb-2"
            style={{ left: toolbar.x, top: toolbar.y }}
          >
            <div className="bg-popover flex items-center gap-1 rounded-lg border p-1 shadow-md">
              <Button size="sm" variant="ghost" onClick={handleUnpack}>
                <Sparkles />
                Unpack
              </Button>
              <div className="bg-border h-4 w-px" />
              <Button size="sm" variant="ghost" onClick={handleSaveQuote}>
                <Quote />
                Save quote
              </Button>
            </div>
          </div>
        ) : null}

        <article
          ref={containerRef}
          onMouseDown={() => setToolbar(null)}
          onMouseUp={updateToolbar}
          className="font-reading text-foreground/90 selection:bg-primary/20 mx-auto max-w-2xl text-[1.05rem] leading-8"
        >
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="mb-5 whitespace-pre-wrap">
              {paragraph}
            </p>
          ))}
        </article>
      </div>
    </div>
  );
}
