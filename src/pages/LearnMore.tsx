import { PageMeta } from "@/components/UI/PageMeta";

export default function LearnMore() {
  return (
    <main className="container py-12 space-y-8">
      <PageMeta title="Thinking Wizard — Learn More" description="Learn about the Thinking Wizard course and how it works" />
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">About Thinking Wizard</h1>
        <p className="text-muted-foreground max-w-2xl">
          A cyber‑wizard, graph‑powered learning system. Build mental models, play with logic flows, and level‑up your thinking across 10 themed sessions.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <article className="glass rounded-md p-6">
          <h2 className="text-xl font-semibold mb-2">How it works</h2>
          <ul className="list-disc ml-6 space-y-1 text-sm text-muted-foreground">
            <li>Each session has 3 lectures, 3 games, and 3 reflections.</li>
            <li>Games use visual graphs to map ideas and decisions.</li>
            <li>Complete all parts to unlock the next session.</li>
          </ul>
        </article>
        <article className="glass rounded-md p-6">
          <h2 className="text-xl font-semibold mb-2">Access</h2>
          <p className="text-sm text-muted-foreground">
            Access is restricted. Use the login provided by the administrator. No public sign up is available.
          </p>
        </article>
      </section>
    </main>
  );
}
