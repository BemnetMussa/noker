import { listPages } from "@/features/notebooks/queries";
import { PageCard } from "@/features/notebooks/components/page-card";
import { CreatePageButton } from "@/features/notebooks/components/create-page-button";

export const metadata = {
  title: "Pages | NOKER",
};

export default async function PagesPage() {
  const pages = await listPages();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pages</h1>
          <p className="text-muted-foreground text-sm">
            One page per topic. Everything you gather lives on it.
          </p>
        </div>
        <CreatePageButton />
      </div>

      {pages.length === 0 ? (
        <div className="text-muted-foreground rounded-lg border border-dashed p-12 text-center text-sm">
          No pages yet. Make one and start writing.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pages.map((page) => (
            <PageCard key={page.id} page={page} />
          ))}
        </div>
      )}
    </div>
  );
}
