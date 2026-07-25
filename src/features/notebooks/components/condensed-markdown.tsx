import type { ReactNode } from "react";

/** Renders bold spans inside a line. */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    const key = `${keyPrefix}-${index}`;
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    return <span key={key}>{part}</span>;
  });
}

/**
 * Renders the small Markdown subset the condenser is asked to produce:
 * "## " headings, "- " bullets, **bold**, and paragraphs.
 */
export function CondensedMarkdown({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  let bullets: string[] = [];
  let paragraph: string[] = [];

  function flushBullets() {
    if (!bullets.length) return;
    const items = [...bullets];
    nodes.push(
      <ul key={`ul-${nodes.length}`} className="list-disc space-y-1 pl-5">
        {items.map((item, index) => (
          <li key={index}>{renderInline(item, `li-${nodes.length}-${index}`)}</li>
        ))}
      </ul>,
    );
    bullets = [];
  }

  function flushParagraph() {
    if (!paragraph.length) return;
    const value = paragraph.join(" ");
    nodes.push(
      <p key={`p-${nodes.length}`}>{renderInline(value, `p-${nodes.length}`)}</p>,
    );
    paragraph = [];
  }

  for (const raw of text.split("\n")) {
    const line = raw.trimEnd();

    if (/^#{1,4}\s+/.test(line)) {
      flushParagraph();
      flushBullets();
      const heading = line.replace(/^#{1,4}\s+/, "");
      nodes.push(
        <h3
          key={`h-${nodes.length}`}
          className="text-foreground mt-1 text-sm font-semibold tracking-tight"
        >
          {renderInline(heading, `h-${nodes.length}`)}
        </h3>,
      );
    } else if (/^\s*[-*]\s+/.test(line)) {
      flushParagraph();
      bullets.push(line.replace(/^\s*[-*]\s+/, ""));
    } else if (!line.trim()) {
      flushParagraph();
      flushBullets();
    } else {
      flushBullets();
      paragraph.push(line.trim());
    }
  }
  flushParagraph();
  flushBullets();

  return (
    <div className="font-reading flex flex-col gap-3 text-[0.98rem] leading-7">
      {nodes}
    </div>
  );
}
