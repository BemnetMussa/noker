import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";

const steps = [
  {
    title: "Bring any source",
    body: "Paste text or a link, and NOKER pulls out the readable content. PDFs, images, and lecture videos are coming next.",
  },
  {
    title: "Unpack what's unclear",
    body: "Highlight any passage and NOKER explains it in plain language — grounded in your source, never made up.",
  },
  {
    title: "Keep grounded notes",
    body: "Every note stays quoted and cited back to where it came from. Learn it once, keep it forever, export any time.",
  },
];

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main className="flex flex-1 flex-col">
        <section className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
          <span className="text-muted-foreground mb-5 rounded-full border px-3 py-1 text-xs font-medium tracking-wide">
            A notetaker for learning
          </span>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-6xl">
            Learn anything, <span className="text-primary">clearly</span>.
          </h1>
          <p className="text-muted-foreground mt-6 max-w-2xl text-lg text-pretty">
            NOKER helps you actually understand what you read. Bring a source,
            unpack the confusing parts, and keep notes that stay quoted and
            cited. No flashcards, no quizzes — just clarity.
          </p>
          <div className="mt-10 flex gap-4">
            <Link
              href="/signup"
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-11 items-center rounded-md px-8 text-sm font-medium transition-colors"
            >
              Start learning
            </Link>
            <Link
              href="/login"
              className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-11 items-center rounded-md border px-8 text-sm font-medium transition-colors"
            >
              Log in
            </Link>
          </div>
        </section>

        <section className="border-t py-20">
          <div className="container mx-auto px-4">
            <h2 className="mb-12 text-center text-3xl font-bold tracking-tight">
              How it works
            </h2>
            <div className="grid gap-8 md:grid-cols-3">
              {steps.map((step, index) => (
                <div key={step.title} className="rounded-lg border p-6">
                  <div className="text-muted-foreground mb-3 font-mono text-sm">
                    0{index + 1}
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground text-sm">
            NOKER — learn anything, clearly.
          </p>
        </div>
      </footer>
    </>
  );
}
