import Link from "next/link";
import { FileText } from "lucide-react";
import type { PageSummary } from "@/features/notebooks/types";

export function PageCard({ page }: { page: PageSummary }) {
  return (
    <Link
      href={`/pages/${page.id}`}
      className="hover:bg-accent flex flex-col rounded-lg border p-5 transition-colors"
    >
      <h3 className="truncate font-medium tracking-tight">{page.title}</h3>
      {page.description ? (
        <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
          {page.description}
        </p>
      ) : null}
      <div className="text-muted-foreground mt-4 flex items-center gap-1 text-xs">
        <FileText className="size-3.5" />
        {page._count.blocks} {page._count.blocks === 1 ? "item" : "items"}
      </div>
    </Link>
  );
}
