"use client";

import { useEffect, useState } from "react";
import { Sparkles, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export interface UnpackPayload {
  quote: string;
  sourceId: string | null;
  sourceTitle?: string;
  context?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payload: UnpackPayload | null;
  onSave: (payload: UnpackPayload, body: string) => Promise<boolean>;
}

type Status = "streaming" | "done" | "error";

async function readError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: { message?: string } };
    return data.error?.message ?? "Couldn't unpack that passage.";
  } catch {
    return "Couldn't unpack that passage.";
  }
}

export function UnpackSheet({ open, onOpenChange, payload, onSave }: Props) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<Status>("streaming");
  const [errorMessage, setErrorMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !payload) return;

    const controller = new AbortController();
    setText("");
    setStatus("streaming");
    setErrorMessage("");

    (async () => {
      try {
        const response = await fetch("/api/unpack", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quote: payload.quote,
            sourceTitle: payload.sourceTitle,
            context: payload.context,
          }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          setErrorMessage(await readError(response));
          setStatus("error");
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          setText((prev) => prev + decoder.decode(value, { stream: true }));
        }
        setStatus("done");
      } catch {
        if (!controller.signal.aborted) {
          setErrorMessage("Something went wrong while unpacking.");
          setStatus("error");
        }
      }
    })();

    return () => controller.abort();
  }, [open, payload]);

  async function handleSave() {
    if (!payload || !text.trim()) return;
    setSaving(true);
    const ok = await onSave(payload, text.trim());
    setSaving(false);
    if (ok) onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="size-4" />
            Unpacked
          </SheetTitle>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4">
          {payload ? (
            <blockquote className="border-primary/40 text-muted-foreground mb-4 border-l-2 pl-3 text-sm italic">
              {payload.quote}
            </blockquote>
          ) : null}

          {status === "error" ? (
            <p className="text-destructive text-sm">{errorMessage}</p>
          ) : (
            <div className="font-reading text-[0.98rem] leading-7 whitespace-pre-wrap">
              {text}
              {status === "streaming" ? (
                <Loader2 className="text-muted-foreground ml-1 inline size-3.5 animate-spin align-middle" />
              ) : null}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t p-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || status === "error" || !text.trim()}
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Check />
                Save as note
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
