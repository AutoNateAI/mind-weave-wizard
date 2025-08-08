import { Link } from "react-router-dom";
import hero from "@/assets/hero-cyberwizard.jpg";
import { Button } from "@/components/ui/button";
import { PageMeta } from "@/components/UI/PageMeta";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const Index = () => {
  return (
    <main className="min-h-screen relative overflow-hidden">
      <PageMeta title="Thinking Wizard — Enter" description="Begin the graph-powered journey. Modules, games, reflections." />
      <img src={hero} alt="Cyber-wizard neon abstract background" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 to-background/80" />

      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle />
      </div>

      <section className="relative container mx-auto py-24 flex flex-col items-center text-center animate-fade-in">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight gradient-text">
          Thinking Wizard by AutoNateAI
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          A cyber‑wizard, graph‑powered learning system. Build mental models, play with logic flows, and level‑up your thinking.
        </p>
        <div className="mt-8 flex gap-4">
          <Button asChild className="hover-scale cyber-glow neon-border">
            <Link to="/dashboard">Enter Dashboard</Link>
          </Button>
          <Button variant="secondary" asChild className="hover-scale light-glow">
            <Link to="/learn-more">Learn More</Link>
          </Button>
        </div>
      </section>
    </main>
  );
};

export default Index;
