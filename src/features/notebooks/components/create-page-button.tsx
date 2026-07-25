"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createPage } from "@/features/notebooks/actions";
import { Button } from "@/components/ui/button";

export function CreatePageButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await createPage({ title: "Untitled page" });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.push(`/pages/${result.data.id}`);
    });
  }

  return (
    <Button onClick={handleClick} disabled={isPending}>
      {isPending ? <Loader2 className="animate-spin" /> : <Plus />}
      New page
    </Button>
  );
}
