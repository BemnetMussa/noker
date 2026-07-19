import { notFound } from "next/navigation";
import { getNotebook } from "@/features/notebooks/queries";
import { NotebookWorkspace } from "@/features/notebooks/components/notebook-workspace";

export default async function NotebookPage({
  params,
}: {
  params: Promise<{ notebookId: string }>;
}) {
  const { notebookId } = await params;
  const notebook = await getNotebook(notebookId).catch(() => null);

  if (!notebook) {
    notFound();
  }

  return <NotebookWorkspace notebook={notebook} />;
}
