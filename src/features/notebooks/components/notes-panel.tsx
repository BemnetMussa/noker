"use client";

import { useState } from "react";
import {
  Download,
  Pencil,
  Trash2,
  Copy,
  Plus,
  StickyNote,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { NoteKind } from "@/generated/prisma/client";
import type { NoteWithSource } from "@/features/notebooks/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  notes: NoteWithSource[];
  canAddNote: boolean;
  onCreateNote: (body: string) => Promise<boolean>;
  onUpdateNote: (id: string, body: string) => Promise<boolean>;
  onDeleteNote: (id: string) => Promise<void>;
}

const KIND_META: Record<
  NoteKind,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  UNPACK: { label: "Unpacked", variant: "default" },
  QUOTE: { label: "Quote", variant: "secondary" },
  NOTE: { label: "Note", variant: "outline" },
};

function noteToMarkdown(note: NoteWithSource): string {
  const parts: string[] = [];
  const citation = note.source
    ? ` — ${note.source.title}${note.source.url ? ` (${note.source.url})` : ""}`
    : "";
  parts.push(`### ${KIND_META[note.kind].label}${citation}`);
  if (note.quote) {
    parts.push(
      note.quote
        .split("\n")
        .map((line) => `> ${line}`)
        .join("\n"),
    );
  }
  if (note.body) parts.push(note.body);
  return parts.join("\n\n");
}

export function NotesPanel({
  notes,
  canAddNote,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
}: Props) {
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  async function submitDraft() {
    if (!draft.trim()) return;
    setBusy(true);
    const ok = await onCreateNote(draft.trim());
    setBusy(false);
    if (ok) {
      setDraft("");
      setComposing(false);
    }
  }

  function exportAll() {
    const markdown = notes.map(noteToMarkdown).join("\n\n---\n\n");
    navigator.clipboard
      .writeText(markdown)
      .then(() => toast.success("Notes copied as Markdown"))
      .catch(() => toast.error("Couldn't copy notes"));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <StickyNote className="size-4" />
          Notes
          <span className="text-muted-foreground font-normal">
            {notes.length}
          </span>
        </h2>
        <div className="flex items-center gap-1">
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={exportAll}
            disabled={notes.length === 0}
            aria-label="Export notes as Markdown"
          >
            <Download />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setComposing((value) => !value)}
            disabled={!canAddNote}
          >
            <Plus />
            Note
          </Button>
        </div>
      </div>

      {composing ? (
        <div className="flex flex-col gap-2 rounded-lg border p-3">
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Write a note…"
            className="min-h-20"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setComposing(false);
                setDraft("");
              }}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={submitDraft} disabled={busy || !draft.trim()}>
              Save note
            </Button>
          </div>
        </div>
      ) : null}

      {notes.length === 0 && !composing ? (
        <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
          No notes yet. Highlight a passage to unpack or quote it, or add a note
          of your own.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {notes.map((note) => (
            <NoteItem
              key={note.id}
              note={note}
              onUpdateNote={onUpdateNote}
              onDeleteNote={onDeleteNote}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function NoteItem({
  note,
  onUpdateNote,
  onDeleteNote,
}: {
  note: NoteWithSource;
  onUpdateNote: (id: string, body: string) => Promise<boolean>;
  onDeleteNote: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(note.body);
  const [busy, setBusy] = useState(false);
  const meta = KIND_META[note.kind];

  async function save() {
    if (!body.trim()) return;
    setBusy(true);
    const ok = await onUpdateNote(note.id, body.trim());
    setBusy(false);
    if (ok) setEditing(false);
  }

  async function remove() {
    setBusy(true);
    await onDeleteNote(note.id);
  }

  function copy() {
    navigator.clipboard
      .writeText(noteToMarkdown(note))
      .then(() => toast.success("Note copied"))
      .catch(() => toast.error("Couldn't copy note"));
  }

  return (
    <li className="group rounded-lg border p-3">
      <div className="mb-2 flex items-center gap-2">
        <Badge variant={meta.variant}>{meta.label}</Badge>
        {note.source ? (
          <span className="text-muted-foreground min-w-0 truncate text-xs">
            {note.source.url ? (
              <a
                href={note.source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground hover:underline"
              >
                {note.source.title}
              </a>
            ) : (
              note.source.title
            )}
          </span>
        ) : null}
        <div className="ml-auto flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          {editing ? null : (
            <>
              <Button
                size="icon-xs"
                variant="ghost"
                onClick={copy}
                aria-label="Copy note"
              >
                <Copy />
              </Button>
              <Button
                size="icon-xs"
                variant="ghost"
                onClick={() => setEditing(true)}
                aria-label="Edit note"
              >
                <Pencil />
              </Button>
              <Button
                size="icon-xs"
                variant="ghost"
                onClick={remove}
                disabled={busy}
                aria-label="Delete note"
              >
                <Trash2 />
              </Button>
            </>
          )}
        </div>
      </div>

      {note.quote ? (
        <blockquote className="border-primary/40 text-muted-foreground mb-2 border-l-2 pl-3 text-sm italic">
          {note.quote}
        </blockquote>
      ) : null}

      {editing ? (
        <div className="flex flex-col gap-2">
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            className="min-h-24"
            autoFocus
          />
          <div className="flex justify-end gap-1">
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => {
                setEditing(false);
                setBody(note.body);
              }}
              aria-label="Cancel"
            >
              <X />
            </Button>
            <Button
              size="icon-sm"
              onClick={save}
              disabled={busy || !body.trim()}
              aria-label="Save"
            >
              <Check />
            </Button>
          </div>
        </div>
      ) : note.body ? (
        <p className="font-reading text-[0.95rem] leading-6 whitespace-pre-wrap">
          {note.body}
        </p>
      ) : null}
    </li>
  );
}
