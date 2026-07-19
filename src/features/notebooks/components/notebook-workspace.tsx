"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, FileText, Link2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  createNote,
  updateNote,
  deleteNote,
  deleteNotebook,
} from "@/features/notebooks/actions";
import type {
  NotebookWithContent,
  NoteWithSource,
  Source,
} from "@/features/notebooks/types";
import { Button } from "@/components/ui/button";
import { AddSourceSheet } from "./add-source-sheet";
import { SourceReader } from "./source-reader";
import { NotesPanel } from "./notes-panel";
import { UnpackSheet, type UnpackPayload } from "./unpack-sheet";

export function NotebookWorkspace({
  notebook,
}: {
  notebook: NotebookWithContent;
}) {
  const router = useRouter();
  const [sources, setSources] = useState<Source[]>(notebook.sources);
  const [notes, setNotes] = useState<NoteWithSource[]>(notebook.notes);
  const [activeSourceId, setActiveSourceId] = useState<string | null>(
    notebook.sources[0]?.id ?? null,
  );
  const [unpackOpen, setUnpackOpen] = useState(false);
  const [unpackPayload, setUnpackPayload] = useState<UnpackPayload | null>(null);

  const activeSource = useMemo(
    () => sources.find((source) => source.id === activeSourceId) ?? null,
    [sources, activeSourceId],
  );

  function handleSourceAdded(source: Source) {
    setSources((prev) => [...prev, source]);
    setActiveSourceId(source.id);
  }

  async function handleSaveQuote(quote: string) {
    const result = await createNote({
      notebookId: notebook.id,
      sourceId: activeSourceId ?? undefined,
      kind: "QUOTE",
      quote,
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setNotes((prev) => [result.data, ...prev]);
    toast.success("Quote saved");
  }

  function handleUnpack(quote: string, context: string) {
    setUnpackPayload({
      quote,
      sourceId: activeSourceId,
      sourceTitle: activeSource?.title,
      context,
    });
    setUnpackOpen(true);
  }

  async function handleUnpackSave(payload: UnpackPayload, body: string) {
    const result = await createNote({
      notebookId: notebook.id,
      sourceId: payload.sourceId ?? undefined,
      kind: "UNPACK",
      quote: payload.quote,
      body,
    });
    if (!result.ok) {
      toast.error(result.error);
      return false;
    }
    setNotes((prev) => [result.data, ...prev]);
    toast.success("Saved to notes");
    return true;
  }

  async function handleCreateNote(body: string) {
    const result = await createNote({
      notebookId: notebook.id,
      sourceId: activeSourceId ?? undefined,
      kind: "NOTE",
      body,
    });
    if (!result.ok) {
      toast.error(result.error);
      return false;
    }
    setNotes((prev) => [result.data, ...prev]);
    return true;
  }

  async function handleUpdateNote(id: string, body: string) {
    const result = await updateNote({ id, body });
    if (!result.ok) {
      toast.error(result.error);
      return false;
    }
    setNotes((prev) => prev.map((note) => (note.id === id ? result.data : note)));
    return true;
  }

  async function handleDeleteNote(id: string) {
    const result = await deleteNote(id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setNotes((prev) => prev.filter((note) => note.id !== id));
  }

  async function handleDeleteNotebook() {
    if (
      !window.confirm(
        "Delete this notebook and every source and note in it? This can't be undone.",
      )
    ) {
      return;
    }
    const result = await deleteNotebook(notebook.id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Notebook deleted");
    router.push("/notebooks");
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href="/notebooks"
            className="text-muted-foreground hover:text-foreground mb-1 inline-flex items-center gap-1 text-xs"
          >
            <ArrowLeft className="size-3.5" />
            Notebooks
          </Link>
          <h1 className="truncate text-2xl font-bold tracking-tight">
            {notebook.title}
          </h1>
          {notebook.description ? (
            <p className="text-muted-foreground text-sm">
              {notebook.description}
            </p>
          ) : null}
        </div>
        <Button variant="destructive" size="sm" onClick={handleDeleteNotebook}>
          <Trash2 />
          Delete
        </Button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {sources.map((source) => (
          <button
            key={source.id}
            type="button"
            onClick={() => setActiveSourceId(source.id)}
            className={cn(
              "flex max-w-52 shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
              source.id === activeSourceId
                ? "bg-primary text-primary-foreground border-transparent"
                : "hover:bg-accent text-muted-foreground",
            )}
          >
            {source.type === "URL" ? (
              <Link2 className="size-3.5 shrink-0" />
            ) : (
              <FileText className="size-3.5 shrink-0" />
            )}
            <span className="truncate">{source.title}</span>
          </button>
        ))}
        <AddSourceSheet notebookId={notebook.id} onAdded={handleSourceAdded} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <SourceReader
          source={activeSource}
          onUnpack={handleUnpack}
          onSaveQuote={handleSaveQuote}
        />
        <NotesPanel
          notes={notes}
          canAddNote={sources.length > 0}
          onCreateNote={handleCreateNote}
          onUpdateNote={handleUpdateNote}
          onDeleteNote={handleDeleteNote}
        />
      </div>

      <UnpackSheet
        open={unpackOpen}
        onOpenChange={setUnpackOpen}
        payload={unpackPayload}
        onSave={handleUnpackSave}
      />
    </div>
  );
}
