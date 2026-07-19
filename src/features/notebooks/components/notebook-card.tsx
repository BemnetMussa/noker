import Link from "next/link";
import { BookOpen, StickyNote } from "lucide-react";
import type { NotebookSummary } from "@/features/notebooks/types";

export function NotebookCard({ notebook }: { notebook: NotebookSummary }) {
  return (
    <Link
      href={`/notebooks/${notebook.id}`}
      className="hover:bg-accent group flex flex-col rounded-lg border p-5 transition-colors"
    >
      <h3 className="font-medium tracking-tight">{notebook.title}</h3>
      {notebook.description ? (
        <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
          {notebook.description}
        </p>
      ) : null}
      <div className="text-muted-foreground mt-4 flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1">
          <BookOpen className="size-3.5" />
          {notebook._count.sources}{" "}
          {notebook._count.sources === 1 ? "source" : "sources"}
        </span>
        <span className="flex items-center gap-1">
          <StickyNote className="size-3.5" />
          {notebook._count.notes}{" "}
          {notebook._count.notes === 1 ? "note" : "notes"}
        </span>
      </div>
    </Link>
  );
}
