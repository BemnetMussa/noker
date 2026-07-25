"use client";

import {
  type ClipboardEvent,
  type MouseEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ImagePlus, Sparkles, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  createBlock,
  createBlockFromUrl,
  updateBlock,
  moveBlock,
  deleteBlock,
  createHighlight,
  deleteHighlight,
  updatePage,
  deletePage,
} from "@/features/notebooks/actions";
import type {
  Block,
  Highlight,
  HighlightColor,
  PageWithBlocks,
} from "@/features/notebooks/types";
import {
  HIGHLIGHT_COLORS,
  HIGHLIGHT_ORDER,
} from "@/features/notebooks/lib/highlight-colors";
import {
  fileToDataUrl,
  looksLikeImageUrl,
  looksLikeUrl,
} from "@/features/notebooks/lib/image-file";
import { Button } from "@/components/ui/button";
import { TextbookBlock } from "./textbook-block";
import { CondensedNote } from "./condensed-note";

const DRAFT_ID = "__draft__";
const CONTEXT_RADIUS = 800;

interface SelectionState {
  blockId: string;
  text: string;
  start: number;
  end: number;
  x: number;
  y: number;
}

interface Reference {
  key: string;
  label: string;
  url: string | null;
}

export function TextbookPage({ page }: { page: PageWithBlocks }) {
  const router = useRouter();
  const docRef = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const [blocks, setBlocks] = useState<Block[]>(page.blocks);
  const [highlights, setHighlights] = useState<Highlight[]>(page.highlights);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [selection, setSelection] = useState<SelectionState | null>(null);
  const [activeHighlight, setActiveHighlight] = useState<{
    id: string;
    x: number;
    y: number;
  } | null>(null);
  const [streaming, setStreaming] = useState<Record<string, string>>({});
  const [title, setTitle] = useState(page.title);
  const [busy, setBusy] = useState(false);

  /** Figure numbers and reference numbers, assigned in document order. */
  const { figureNumbers, referenceNumbers, references } = useMemo(() => {
    const figures = new Map<string, number>();
    const refNumbers = new Map<string, number>();
    const refList: Reference[] = [];
    let figureCount = 0;

    for (const block of blocks) {
      if (block.type === "IMAGE") {
        figureCount += 1;
        figures.set(block.id, figureCount);
      }
      const label = block.citation?.trim();
      if (label) {
        const key = `${label}|${block.citationUrl ?? ""}`;
        let index = refList.findIndex((item) => item.key === key);
        if (index === -1) {
          refList.push({ key, label, url: block.citationUrl });
          index = refList.length - 1;
        }
        refNumbers.set(block.id, index + 1);
      }
    }
    return {
      figureNumbers: figures,
      referenceNumbers: refNumbers,
      references: refList,
    };
  }, [blocks]);

  function clearOverlays() {
    setSelection(null);
    setActiveHighlight(null);
  }

  function replaceBlock(id: string, patch: Partial<Block>) {
    setBlocks((prev) =>
      prev.map((block) => (block.id === id ? { ...block, ...patch } : block)),
    );
  }

  // ---- writing ----
  async function commitDraft() {
    const content = (draft ?? "").trim();
    setDraft(null);
    setEditingId(null);
    if (!content) return;

    const result = await createBlock({
      notebookId: page.id,
      type: "TEXT",
      content,
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setBlocks((prev) => [...prev, result.data]);
  }

  async function commitBlock(block: Block) {
    setEditingId(null);
    if (!block.content.trim() && block.type === "TEXT") {
      await removeBlock(block.id);
      return;
    }
    const result = await updateBlock({ id: block.id, content: block.content });
    if (!result.ok) toast.error(result.error);
  }

  async function removeBlock(id: string) {
    setBlocks((prev) => prev.filter((block) => block.id !== id));
    setHighlights((prev) => prev.filter((h) => h.blockId !== id));
    const result = await deleteBlock(id);
    if (!result.ok) toast.error(result.error);
  }

  async function handleMove(id: string, direction: "up" | "down") {
    setBlocks((prev) => {
      const index = prev.findIndex((block) => block.id === id);
      const target = direction === "up" ? index - 1 : index + 1;
      if (index === -1 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    const result = await moveBlock({ id, direction });
    if (!result.ok) toast.error(result.error);
  }

  async function handleTogglePlacement(block: Block) {
    const placement = block.placement === "MARGIN" ? "BODY" : "MARGIN";
    replaceBlock(block.id, { placement });
    const result = await updateBlock({ id: block.id, placement });
    if (!result.ok) toast.error(result.error);
  }

  // ---- gathering: paste text, links, images ----
  async function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    if (editingId) return;
    const data = event.clipboardData;
    if (!data) return;

    const imageFile = Array.from(data.items)
      .find((item) => item.type.startsWith("image/"))
      ?.getAsFile();

    if (imageFile) {
      event.preventDefault();
      setBusy(true);
      try {
        await addImage(await fileToDataUrl(imageFile));
      } catch {
        toast.error("Couldn't read that image");
      } finally {
        setBusy(false);
      }
      return;
    }

    const text = data.getData("text/plain");
    if (!text.trim()) return;
    event.preventDefault();
    setBusy(true);
    try {
      if (looksLikeUrl(text) && looksLikeImageUrl(text)) {
        await addImage(text.trim());
      } else if (looksLikeUrl(text)) {
        const result = await createBlockFromUrl(page.id, text.trim());
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        setBlocks((prev) => [...prev, result.data]);
        toast.success("Pulled the text into your page");
      } else {
        const result = await createBlock({
          notebookId: page.id,
          type: "SOURCE",
          content: text.trim(),
        });
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        setBlocks((prev) => [...prev, result.data]);
      }
    } finally {
      setBusy(false);
    }
  }

  async function addImage(imageUrl: string) {
    const result = await createBlock({
      notebookId: page.id,
      type: "IMAGE",
      imageUrl,
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setBlocks((prev) => [...prev, result.data]);
  }

  async function handleFilePicked(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      await addImage(await fileToDataUrl(file));
    } catch {
      toast.error("Couldn't read that image");
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  // ---- highlighting ----
  function handleTextMouseUp(event: MouseEvent<HTMLElement>, block: Block) {
    const container = event.currentTarget;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      clearOverlays();
      setEditingId(block.id);
      return;
    }
    const text = sel.toString();
    if (!text.trim()) {
      setEditingId(block.id);
      return;
    }
    const range = sel.getRangeAt(0);
    if (!container.contains(range.commonAncestorContainer)) return;

    const pre = document.createRange();
    pre.selectNodeContents(container);
    pre.setEnd(range.startContainer, range.startOffset);
    const start = pre.toString().length;

    const rect = range.getBoundingClientRect();
    const docRect = docRef.current?.getBoundingClientRect();
    if (!docRect) return;

    setActiveHighlight(null);
    setSelection({
      blockId: block.id,
      text,
      start,
      end: start + text.length,
      x: rect.left - docRect.left + rect.width / 2,
      y: rect.top - docRect.top,
    });
  }

  async function handleHighlight(color: HighlightColor) {
    if (!selection || selection.blockId === DRAFT_ID) return;
    const result = await createHighlight({
      notebookId: page.id,
      blockId: selection.blockId,
      color,
      text: selection.text,
      startOffset: selection.start,
      endOffset: selection.end,
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setHighlights((prev) => [...prev, result.data]);
    window.getSelection()?.removeAllRanges();
    setSelection(null);
  }

  async function handleRemoveHighlight(id: string) {
    setHighlights((prev) => prev.filter((h) => h.id !== id));
    setActiveHighlight(null);
    const result = await deleteHighlight(id);
    if (!result.ok) toast.error(result.error);
  }

  // ---- unpack: a callout lands right after the passage ----
  async function handleUnpack() {
    if (!selection) return;
    const origin = blocks.find((block) => block.id === selection.blockId);
    if (!origin) return;

    const context = origin.content.slice(
      Math.max(0, selection.start - CONTEXT_RADIUS),
      selection.end + CONTEXT_RADIUS,
    );
    const quote = selection.text;

    window.getSelection()?.removeAllRanges();
    setSelection(null);

    const result = await createBlock({
      notebookId: page.id,
      type: "UNPACK",
      afterId: origin.id,
      quote,
      citation: origin.citation ?? undefined,
      citationUrl: origin.citationUrl ?? undefined,
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    const block = result.data;
    setBlocks((prev) => {
      const index = prev.findIndex((item) => item.id === origin.id);
      if (index === -1) return [...prev, block];
      return [...prev.slice(0, index + 1), block, ...prev.slice(index + 1)];
    });
    void streamUnpack(block.id, quote, context, origin.citation ?? page.title);
  }

  async function streamUnpack(
    blockId: string,
    quote: string,
    context: string,
    sourceTitle: string,
  ) {
    setStreaming((prev) => ({ ...prev, [blockId]: "" }));
    let text = "";
    try {
      const response = await fetch("/api/unpack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quote, context, sourceTitle }),
      });
      if (!response.ok || !response.body) {
        const data = (await response.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        throw new Error(data?.error?.message ?? "Couldn't unpack that passage.");
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setStreaming((prev) => ({ ...prev, [blockId]: text }));
      }
      if (!text.trim()) {
        throw new Error("The unpacker returned nothing. Check your AI key.");
      }
      replaceBlock(blockId, { content: text });
      await updateBlock({ id: blockId, content: text });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Couldn't unpack that passage.",
      );
      await removeBlock(blockId);
    } finally {
      setStreaming((prev) => {
        const next = { ...prev };
        delete next[blockId];
        return next;
      });
    }
  }

  const saveTitle = useCallback(async () => {
    const next = title.trim();
    if (!next || next === page.title) return;
    const result = await updatePage(page.id, {
      title: next,
      description: page.description ?? undefined,
    });
    if (!result.ok) toast.error(result.error);
  }, [title, page.id, page.title, page.description]);

  async function handleDeletePage() {
    if (!window.confirm("Delete this page and everything on it?")) return;
    const result = await deletePage(page.id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    router.push("/pages");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Link
          href="/pages"
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
        >
          <ArrowLeft className="size-3.5" />
          Pages
        </Link>
        <div className="flex-1" />
        {busy ? (
          <Loader2 className="text-muted-foreground size-4 animate-spin" />
        ) : null}
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => handleFilePicked(event.target.files?.[0])}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInput.current?.click()}
        >
          <ImagePlus />
          Figure
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={handleDeletePage}>
          <Trash2 />
          <span className="sr-only">Delete page</span>
        </Button>
      </div>

      <div
        ref={docRef}
        onPaste={handlePaste}
        tabIndex={0}
        className="relative mx-auto w-full max-w-[940px] outline-none"
      >
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onBlur={saveTitle}
          className="font-reading mb-4 w-full bg-transparent text-3xl font-semibold tracking-tight outline-none"
          aria-label="Page title"
        />

        <div className="mb-8">
          <CondensedNote
            pageId={page.id}
            initialText={page.condensed}
            initialAt={page.condensedAt}
            hasContent={blocks.some(
              (block) => block.content.trim() || block.imageUrl,
            )}
          />
        </div>

        <div className="font-reading lg:pr-[214px]">
          {blocks.map((block) => (
            <TextbookBlock
              key={block.id}
              block={block}
              figureNumber={figureNumbers.get(block.id)}
              referenceNumber={referenceNumbers.get(block.id)}
              highlights={highlights.filter((h) => h.blockId === block.id)}
              isEditing={editingId === block.id}
              streamingText={streaming[block.id]}
              onEdit={() => setEditingId(block.id)}
              onChange={(content) => replaceBlock(block.id, { content })}
              onCommit={() =>
                void commitBlock(
                  blocks.find((item) => item.id === block.id) ?? block,
                )
              }
              onDelete={() => void removeBlock(block.id)}
              onMove={(direction) => void handleMove(block.id, direction)}
              onTogglePlacement={() => void handleTogglePlacement(block)}
              onTextMouseUp={handleTextMouseUp}
              onHighlightClick={(event, highlight) => {
                event.stopPropagation();
                const rect = (
                  event.target as HTMLElement
                ).getBoundingClientRect();
                const docRect = docRef.current?.getBoundingClientRect();
                if (!docRect) return;
                setSelection(null);
                setActiveHighlight({
                  id: highlight.id,
                  x: rect.left - docRect.left + rect.width / 2,
                  y: rect.top - docRect.top,
                });
              }}
            />
          ))}

          <div className="clear-both" />

          {draft !== null ? (
            <textarea
              value={draft}
              autoFocus
              onChange={(event) => setDraft(event.target.value)}
              onBlur={() => void commitDraft()}
              placeholder="Write here…"
              className="field-sizing-content w-full resize-none bg-transparent text-[1.02rem] leading-8 outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                clearOverlays();
                setEditingId(null);
                setDraft("");
              }}
              className="text-muted-foreground/50 hover:text-muted-foreground w-full py-2 text-left text-[1.02rem]"
            >
              {blocks.length === 0
                ? "Start writing, or paste something in…"
                : "Write here…"}
            </button>
          )}
        </div>

        {references.length > 0 ? (
          <section className="mt-10 border-t pt-5">
            <h2 className="text-muted-foreground mb-3 text-xs font-semibold tracking-[0.14em] uppercase">
              References
            </h2>
            <ol className="flex flex-col gap-1.5 text-sm">
              {references.map((reference, index) => (
                <li key={reference.key} className="flex gap-2">
                  <span className="text-muted-foreground tabular-nums">
                    [{index + 1}]
                  </span>
                  {reference.url ? (
                    <a
                      href={reference.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {reference.label}
                    </a>
                  ) : (
                    <span>{reference.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {selection ? (
          <div
            className="absolute z-30 -translate-x-1/2 -translate-y-full pb-2"
            style={{ left: selection.x, top: selection.y }}
          >
            <div className="bg-popover flex items-center gap-1 rounded-lg border p-1 shadow-md">
              {HIGHLIGHT_ORDER.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleHighlight(color)}
                  title={HIGHLIGHT_COLORS[color].label}
                  aria-label={`Highlight: ${HIGHLIGHT_COLORS[color].label}`}
                  className={cn(
                    "size-5 rounded-full border border-black/10 transition-transform hover:scale-110",
                    HIGHLIGHT_COLORS[color].dot,
                  )}
                />
              ))}
              <div className="bg-border mx-0.5 h-4 w-px" />
              <Button size="sm" variant="ghost" onClick={handleUnpack}>
                <Sparkles />
                Unpack
              </Button>
            </div>
          </div>
        ) : null}

        {activeHighlight ? (
          <div
            className="absolute z-30 -translate-x-1/2 -translate-y-full pb-2"
            style={{ left: activeHighlight.x, top: activeHighlight.y }}
          >
            <div className="bg-popover flex items-center rounded-lg border p-1 shadow-md">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleRemoveHighlight(activeHighlight.id)}
              >
                <Trash2 />
                Remove
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
