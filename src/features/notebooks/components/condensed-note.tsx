"use client";

import { useEffect, useState } from "react";
import {
  Sparkles,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { saveCondensed } from "@/features/notebooks/actions";
import { Button } from "@/components/ui/button";
import { CondensedMarkdown } from "./condensed-markdown";

interface Props {
  pageId: string;
  initialText: string | null;
  initialAt: Date | null;
  hasContent: boolean;
}

function relativeTime(date: Date): string {
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function CondensedNote({
  pageId,
  initialText,
  initialAt,
  hasContent,
}: Props) {
  const [text, setText] = useState(initialText ?? "");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(initialAt);
  const [streaming, setStreaming] = useState(false);
  const [open, setOpen] = useState(Boolean(initialText));
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  async function condense() {
    setStreaming(true);
    setOpen(true);
    setText("");
    let next = "";
    try {
      const response = await fetch("/api/condense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId }),
      });
      if (!response.ok || !response.body) {
        const data = (await response.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        throw new Error(data?.error?.message ?? "Couldn't condense this page.");
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        next += decoder.decode(value, { stream: true });
        setText(next);
      }
      if (!next.trim()) {
        throw new Error("The condenser returned nothing. Check your AI key.");
      }
      const result = await saveCondensed(pageId, next);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setUpdatedAt(new Date());
      toast.success("Condensed note updated");
    } catch (error) {
      setText(initialText ?? "");
      toast.error(
        error instanceof Error ? error.message : "Couldn't condense this page.",
      );
    } finally {
      setStreaming(false);
    }
  }

  function copy() {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success("Condensed note copied"))
      .catch(() => toast.error("Couldn't copy"));
  }

  const hasNote = Boolean(text.trim());

  return (
    <section className="bg-card rounded-lg border">
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          disabled={!hasNote && !streaming}
          className="flex min-w-0 flex-1 items-center gap-2 text-left disabled:cursor-default"
        >
          {hasNote || streaming ? (
            open ? (
              <ChevronDown className="text-muted-foreground size-4 shrink-0" />
            ) : (
              <ChevronRight className="text-muted-foreground size-4 shrink-0" />
            )
          ) : (
            <Sparkles className="text-muted-foreground size-4 shrink-0" />
          )}
          <span className="text-sm font-semibold tracking-tight">
            Condensed note
          </span>
          {updatedAt && mounted && !streaming ? (
            <span className="text-muted-foreground text-xs">
              {relativeTime(updatedAt)}
            </span>
          ) : null}
        </button>

        {hasNote && !streaming ? (
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={copy}
            aria-label="Copy condensed note"
          >
            <Copy />
          </Button>
        ) : null}

        <Button
          size="sm"
          variant={hasNote ? "outline" : "default"}
          onClick={condense}
          disabled={streaming || !hasContent}
          title={
            hasContent ? undefined : "Add something to this page first"
          }
        >
          {streaming ? (
            <>
              <Loader2 className="animate-spin" />
              Condensing…
            </>
          ) : hasNote ? (
            <>
              <RefreshCw />
              Redo
            </>
          ) : (
            <>
              <Sparkles />
              Condense this page
            </>
          )}
        </Button>
      </div>

      {open && (hasNote || streaming) ? (
        <div className="border-t px-4 py-4">
          {hasNote ? (
            <CondensedMarkdown text={text} />
          ) : (
            <p className="text-muted-foreground text-sm">
              Reading your page…
            </p>
          )}
          {streaming ? (
            <span className="bg-primary/60 mt-1 inline-block h-4 w-1.5 animate-pulse align-middle" />
          ) : null}
        </div>
      ) : null}

      {!hasNote && !streaming ? (
        <p className="text-muted-foreground border-t px-4 py-3 text-xs">
          Everything you gather on this page — sources, highlights, unpacked
          bits, your own notes — condensed into one note on the subject. Your
          highlight colours decide what leads.
        </p>
      ) : null}
    </section>
  );
}
