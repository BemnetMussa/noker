import { listNotebooks } from "@/features/notebooks/queries";
import { NotebookCard } from "@/features/notebooks/components/notebook-card";
import { CreateNotebookButton } from "@/features/notebooks/components/create-notebook-button";

export const metadata = {
  title: "Notebooks | NOKER",
};

export default async function NotebooksPage() {
  const notebooks = await listNotebooks();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notebooks</h1>
          <p className="text-muted-foreground text-sm">
            Your study spaces — one per topic you&apos;re learning.
          </p>
        </div>
        <CreateNotebookButton />
      </div>

      {notebooks.length === 0 ? (
        <div className="text-muted-foreground rounded-lg border border-dashed p-12 text-center text-sm">
          No notebooks yet. Create one to start learning.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notebooks.map((notebook) => (
            <NotebookCard key={notebook.id} notebook={notebook} />
          ))}
        </div>
      )}
    </div>
  );
}
