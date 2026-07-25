import { notFound } from "next/navigation";
import { getPage } from "@/features/notebooks/queries";
import { TextbookPage } from "@/features/notebooks/components/textbook-page";

export default async function TopicPage({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const { pageId } = await params;
  const page = await getPage(pageId).catch(() => null);

  if (!page) {
    notFound();
  }

  return <TextbookPage page={page} />;
}
