import { Button } from "@/components/ui/button";
import { PageMeta } from "@/components/UI/PageMeta";
import { GlassCard } from "@/components/UI/GlassCard";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Phone } from "lucide-react";
import { Link } from "react-router-dom";
import nathanPortrait from "@/assets/nathan-baker-portrait.png";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import MobileNav from "@/components/Navigation/MobileNav";

const About = () => {
  useScrollToTop();
  
  return (
    <main className="min-h-screen relative">
      <PageMeta 
        title="About Nathan Baker - AutoNateAI Founder | Critical Thinking Academy" 
        description="Learn about Nathan Baker, founder of AutoNateAI and creator of the Critical Thinking Academy for software engineers. From Fortune 500 systems to graph-based thinking."
      />

      {/* Navigation Bar */}
      <nav className="relative z-10 bg-background/80 backdrop-blur-sm border-b border-primary/20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="text-xl font-bold gradient-text">
              AutoNateAI
            </Link>
            <div className="flex items-center gap-6">
              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-6">
                <Link 
                  to="/" 
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  Home
                </Link>
                <Link 
                  to="/mind-games" 
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  Mind Games
                </Link>
                <Link 
                  to="/about" 
                  className="text-sm font-medium hover:text-primary transition-colors border-b-2 border-primary"
                >
                  About AutoNate
                </Link>
                <Link 
                  to="/auth" 
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  Login
                </Link>
              </div>
              <ThemeToggle />
              {/* Mobile Navigation */}
              <MobileNav />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-16 bg-gradient-to-b from-background/60 to-background/80">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
            {/* Professional Portrait */}
            <div className="order-2 lg:order-1">
              <div className="relative">
                <div className="aspect-square rounded-2xl overflow-hidden border border-primary/20 shadow-2xl">
                  <img 
                    src={nathanPortrait}
                    alt="Nathan Baker - Professional Portrait"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Hero Content */}
            <div className="order-1 lg:order-2 text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold gradient-text mb-6 leading-tight">
                Nathan Baker –<br />Engineer of Minds & Machines
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
                From Fortune 500 systems to graph-based thinking, Nathan built AutoNateAI to transform 
                how software engineers think, learn, and lead.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Early Engineering Foundations */}
            <GlassCard className="p-8">
              <h2 className="text-2xl font-bold mb-4 text-primary">Early Engineering Foundations</h2>
              <p className="text-muted-foreground leading-relaxed">
                Nathan began his engineering journey at Citi, where he rapidly went from building front-end 
                systems to representing the Digital Department at career fairs and onboarding new engineers. 
                He gained a reputation not just as a coder, but as someone who could translate complexity into clarity.
              </p>
            </GlassCard>

            {/* Security & Big Tech Experience */}
            <GlassCard className="p-8">
              <h2 className="text-2xl font-bold mb-4 text-primary">Security & Big Tech Experience</h2>
              <p className="text-muted-foreground leading-relaxed">
                At Microsoft, Nathan contributed to the Threat Protection Team in Atlanta, sharpening his 
                skills in secure, enterprise-grade software development. At the University of Michigan, he 
                taught computer security as an Instructional Aide—guiding students through encryption, web 
                exploits, and network defense.
              </p>
            </GlassCard>

            {/* The Rise of AI Engineering */}
            <GlassCard className="p-8">
              <h2 className="text-2xl font-bold mb-4 text-primary">The Rise of AI Engineering</h2>
              <p className="text-muted-foreground leading-relaxed">
                Before the world even had a term for it, Nathan was pioneering prompt engineering. At Outlier, 
                he fine-tuned AI models and built prompt-driven workflows that delivered measurable productivity 
                gains. At Veterans United, he joined the BrAInStorm team, bringing generative AI research into 
                production systems and designing intelligent tools that made the company's workflows smarter and faster.
              </p>
            </GlassCard>

            {/* Founder of AutoNateAI */}
            <GlassCard className="p-8 border-primary/50">
              <h2 className="text-2xl font-bold mb-4 text-primary">Founder of AutoNateAI</h2>
              <p className="text-muted-foreground leading-relaxed">
                Nathan launched AutoNateAI to bring his two worlds together—advanced AI engineering and deep 
                human critical thinking. What began as publishing and repurposing content evolved into a 
                consultancy and academy that teaches engineers how to see like algorithms, map like graphs, 
                and think like strategists.
              </p>
            </GlassCard>

            {/* The Critical Thinking Academy */}
            <GlassCard className="p-8">
              <h2 className="text-2xl font-bold mb-4 text-primary">The Critical Thinking Academy</h2>
              <p className="text-muted-foreground leading-relaxed">
                AutoNateAI's Critical Thinking Academy was born from Nathan's conviction that the most valuable 
                engineers aren't just fluent in code—they are fluent in thought. His graph-based learning system 
                turns abstract logic into concrete visualizations, giving software engineers at all levels the 
                tools to become leaders in reasoning, strategy, and innovation.
              </p>
            </GlassCard>

            {/* Beyond Code */}
            <GlassCard className="p-8">
              <h2 className="text-2xl font-bold mb-4 text-primary">Beyond Code</h2>
              <p className="text-muted-foreground leading-relaxed">
                More than an engineer, Nathan is a builder of systems—technical, intellectual, and human. He 
                blends data science, AI, and philosophy into a single mission: training minds to think faster, 
                deeper, and more strategically in a world shaped by intelligent machines.
              </p>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Sticky CTA Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-primary/20 p-4">
        <div className="container mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl mx-auto">
            <div className="text-center sm:text-left">
              <p className="font-semibold text-foreground">Ready to level up your engineering mind?</p>
            </div>
              <Button 
                size="lg"
                className="hover-scale cyber-glow neon-border flex items-center gap-2 w-full sm:w-auto"
                onClick={() => window.open('https://calendly.com/autonate-ai/15-min-discovery-call', '_blank')}
              >
                <Phone className="h-4 w-4" />
                <span className="hidden sm:inline">Book Your Free 15-Minute Discovery Call</span>
                <span className="sm:hidden">Book Discovery Call</span>
              </Button>
          </div>
        </div>
      </div>

      {/* Bottom padding to account for sticky footer */}
      <div className="h-20"></div>
    </main>
  );
};

export default About;