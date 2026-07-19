"use client";

import { useState, useTransition } from "react";
import type { ReactNode } from "react";
import type { ZodError } from "zod";
import {
  Plus,
  FileText,
  Link2,
  Image as ImageIcon,
  Video,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { textSourceSchema, urlSourceSchema } from "@/shared/validators/source";
import { addTextSource, addUrlSource } from "@/features/notebooks/actions";
import type { Source } from "@/features/notebooks/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function fieldErrors(error: ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !result[key]) {
      result[key] = issue.message;
    }
  }
  return result;
}

export function AddSourceSheet({
  notebookId,
  onAdded,
}: {
  notebookId: string;
  onAdded: (source: Source) => void;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("text");
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function reset() {
    setTitle("");
    setContent("");
    setUrl("");
    setErrors({});
  }

  function complete(source: Source) {
    onAdded(source);
    toast.success("Source added");
    setOpen(false);
    reset();
  }

  function submitText() {
    const parsed = textSourceSchema.safeParse({ title, content });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    startTransition(async () => {
      const result = await addTextSource(notebookId, parsed.data);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      complete(result.data);
    });
  }

  function submitUrl() {
    const parsed = urlSourceSchema.safeParse({ url });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    startTransition(async () => {
      const result = await addUrlSource(notebookId, parsed.data);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      complete(result.data);
    });
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus />
        Add source
      </Button>

      <Sheet
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) reset();
        }}
      >
        <SheetContent side="right" className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Add a source</SheetTitle>
            <SheetDescription>Bring in something to learn from.</SheetDescription>
          </SheetHeader>

          <div className="flex min-h-0 flex-col gap-4 overflow-y-auto px-4 pb-6">
            <Tabs value={tab} onValueChange={(value) => setTab(String(value))}>
              <TabsList className="w-full">
                <TabsTrigger value="text">
                  <FileText />
                  Text
                </TabsTrigger>
                <TabsTrigger value="url">
                  <Link2 />
                  URL
                </TabsTrigger>
                <TabsTrigger value="more">More soon</TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="flex flex-col gap-3 pt-4">
                <Field label="Title" error={errors.title}>
                  <Input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="e.g. Chapter 3 — Scheduling"
                  />
                </Field>
                <Field label="Text" error={errors.content}>
                  <Textarea
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    placeholder="Paste the text you want to learn from…"
                    className="min-h-48"
                  />
                </Field>
                <Button onClick={submitText} disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Adding…
                    </>
                  ) : (
                    "Add text"
                  )}
                </Button>
              </TabsContent>

              <TabsContent value="url" className="flex flex-col gap-3 pt-4">
                <Field label="Page URL" error={errors.url}>
                  <Input
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    placeholder="https://…"
                    inputMode="url"
                  />
                </Field>
                <p className="text-muted-foreground text-xs">
                  NOKER fetches the page and pulls out the readable text.
                </p>
                <Button onClick={submitUrl} disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Fetching…
                    </>
                  ) : (
                    "Fetch & add"
                  )}
                </Button>
              </TabsContent>

              <TabsContent value="more" className="flex flex-col gap-2 pt-4">
                <ComingSoon icon={<FileText />} label="PDF & documents" />
                <ComingSoon icon={<ImageIcon />} label="Images & screenshots" />
                <ComingSoon icon={<Video />} label="Lecture videos" />
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {error ? <p className="text-destructive text-xs">{error}</p> : null}
    </div>
  );
}

function ComingSoon({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="text-muted-foreground flex items-center gap-2 rounded-md border border-dashed px-3 py-2 text-sm">
      {icon}
      <span>{label}</span>
      <span className="ml-auto text-xs">soon</span>
    </div>
  );
}
