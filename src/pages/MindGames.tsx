import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PublicGameFlowCanvas } from '@/components/Games/PublicGameFlowCanvas';
import { Brain, Clock, ArrowRight, Cpu, Code, Cloud, Phone } from 'lucide-react';
import { PageMeta } from '@/components/UI/PageMeta';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import MobileNav from "@/components/Navigation/MobileNav";

interface GameTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  template_data: any;
  mechanics: any;
  heuristic_targets: any;
}

export default function MindGames() {
  const [gameTemplates, setGameTemplates] = useState<GameTemplate[]>([]);
  const [selectedGame, setSelectedGame] = useState<GameTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  useScrollToTop();

  useEffect(() => {
    loadPublicGameTemplates();
  }, []);

  const loadPublicGameTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('game_templates')
        .select('*')
        .eq('category', 'ai-engineering')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setGameTemplates(data || []);
    } catch (error) {
      console.error('Error loading public games:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGameIcon = (gameName: string) => {
    if (gameName.includes('Agent')) return Cpu;
    if (gameName.includes('Prompt')) return Code;
    if (gameName.includes('Cloud')) return Cloud;
    return Brain;
  };

  const getGameColor = (gameName: string) => {
    if (gameName.includes('Agent')) return 'from-blue-500 to-cyan-500';
    if (gameName.includes('Prompt')) return 'from-purple-500 to-pink-500';
    if (gameName.includes('Cloud')) return 'from-green-500 to-emerald-500';
    return 'from-primary to-secondary';
  };

  const getDifficultyLevel = (gameName: string) => {
    if (gameName.includes('Agent')) return { level: 'Advanced', color: 'bg-red-500' };
    if (gameName.includes('Prompt')) return { level: 'Intermediate', color: 'bg-yellow-500' };
    if (gameName.includes('Cloud')) return { level: 'Expert', color: 'bg-purple-500' };
    return { level: 'Beginner', color: 'bg-green-500' };
  };

  const getEstimatedTime = (gameName: string) => {
    if (gameName.includes('Agent')) return '15-20 min';
    if (gameName.includes('Prompt')) return '12-15 min';
    if (gameName.includes('Cloud')) return '18-25 min';
    return '10-15 min';
  };

  if (selectedGame) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90">
        <PageMeta 
          title={`${selectedGame.name} - AI Mind Games | AutoNate`}
          description={`Challenge your critical thinking with ${selectedGame.name}. Navigate complex AI engineering scenarios and test your decision-making skills.`}
        />
        
        {/* Navigation Bar */}
        <nav className="absolute top-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-sm border-b border-primary/20">
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
                  className="text-sm font-medium hover:text-primary transition-colors border-b-2 border-primary"
                >
                  Mind Games
                </Link>
                <Link 
                  to="/about" 
                  className="text-sm font-medium hover:text-primary transition-colors"
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

        <div className="container mx-auto px-4 pt-20 py-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4 md:mb-0">
              <Button 
                variant="outline" 
                onClick={() => setSelectedGame(null)}
                className="hover:bg-muted/50 transition-colors"
              >
                ← Back to Games
              </Button>
              <h1 className="hidden md:block text-2xl font-bold text-foreground">{selectedGame.name}</h1>
            </div>
            <h1 className="md:hidden text-xl font-bold text-foreground text-center mt-4">{selectedGame.name}</h1>
          </div>

          <div className="h-[100vh] rounded-xl border bg-card shadow-lg overflow-hidden">
            <PublicGameFlowCanvas
              gameTemplate={selectedGame}
              onComplete={(analytics, leadData) => {
                console.log('Game completed:', analytics, leadData);
                // Lead capture handled in PublicGameFlowCanvas
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90">
      <PageMeta 
        title="AI Mind Games - Test Your Critical Thinking | AutoNate"
        description="Challenge yourself with AI engineering scenarios. Test your critical thinking skills through interactive graph-based games covering AI agents, prompt engineering, and cloud infrastructure."
      />
      
        {/* Navigation Bar */}
        <nav className="absolute top-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-sm border-b border-primary/20">
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
                    className="text-sm font-medium hover:text-primary transition-colors border-b-2 border-primary"
                  >
                    Mind Games
                  </Link>
                  <Link 
                    to="/about" 
                    className="text-sm font-medium hover:text-primary transition-colors"
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
      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6">
            <Brain className="w-4 h-4" />
            AI Engineering Mind Games
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground leading-tight">
            Test Your AI Engineering
            <br />
            Critical Thinking
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Navigate complex AI scenarios through interactive graph-based challenges. 
            Build agentic systems, optimize prompts, and scale infrastructure under pressure.
          </p>
        </div>

        {/* Games Grid - Desktop */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="h-96 animate-pulse">
                <div className="h-full bg-muted/50 rounded-lg"></div>
              </Card>
            ))
          ) : (
            gameTemplates.map((game) => {
              const IconComponent = getGameIcon(game.name);
              const gradientClass = getGameColor(game.name);
              const difficulty = getDifficultyLevel(game.name);
              const estimatedTime = getEstimatedTime(game.name);

              return (
                <Card 
                  key={game.id} 
                  className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-0 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm h-full flex flex-col"
                >
                  <CardHeader className="pb-4">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradientClass} flex items-center justify-center mb-4 shadow-lg`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className={`${difficulty.color} text-white border-0`}>
                        {difficulty.level}
                      </Badge>
                      <div className="flex items-center gap-1 text-muted-foreground text-sm">
                        <Clock className="w-3 h-3" />
                        {estimatedTime}
                      </div>
                    </div>
                    <CardTitle className="text-xl font-bold leading-tight group-hover:text-primary transition-colors">
                      {game.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 flex-1 flex flex-col">
                    <p className="text-muted-foreground mb-6 leading-relaxed flex-1">
                      {game.description}
                    </p>
                    <div className="mb-6">
                      <div className="text-sm font-medium mb-2 text-foreground">Critical Thinking Skills:</div>
                      <div className="flex flex-wrap gap-1">
                        {game.heuristic_targets.slice(0, 3).map((target, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {target}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button 
                      onClick={() => setSelectedGame(game)}
                      className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 mt-auto"
                      size="lg"
                    >
                      Start Challenge
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Mobile Carousel */}
        <div className="md:hidden">
          <Carousel 
            className="w-full max-w-sm mx-auto" 
            opts={{
              align: "start",
              loop: false,
            }}
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <CarouselItem key={i}>
                    <Card className="h-96 animate-pulse">
                      <div className="h-full bg-muted/50 rounded-lg"></div>
                    </Card>
                  </CarouselItem>
                ))
              ) : (
                gameTemplates.map((game) => {
                  const IconComponent = getGameIcon(game.name);
                  const gradientClass = getGameColor(game.name);
                  const difficulty = getDifficultyLevel(game.name);
                  const estimatedTime = getEstimatedTime(game.name);

                  return (
                    <CarouselItem key={game.id} className="pl-2 md:pl-4 basis-4/5">
                      <Card className="h-full flex flex-col bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
                        <CardHeader className="pb-4">
                          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradientClass} flex items-center justify-center mb-4 shadow-lg`}>
                            <IconComponent className="w-8 h-8 text-white" />
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className={`${difficulty.color} text-white border-0`}>
                              {difficulty.level}
                            </Badge>
                            <div className="flex items-center gap-1 text-muted-foreground text-sm">
                              <Clock className="w-3 h-3" />
                              {estimatedTime}
                            </div>
                          </div>
                          <CardTitle className="text-xl font-bold leading-tight">
                            {game.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 flex-1 flex flex-col">
                          <p className="text-muted-foreground mb-6 leading-relaxed flex-1">
                            {game.description}
                          </p>
                          <div className="mb-6">
                            <div className="text-sm font-medium mb-2 text-foreground">Critical Thinking Skills:</div>
                            <div className="flex flex-wrap gap-1">
                              {game.heuristic_targets.slice(0, 3).map((target, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {target}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <Button 
                            onClick={() => setSelectedGame(game)}
                            className="w-full mt-auto"
                            size="lg"
                          >
                            Start Challenge
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  );
                })
              )}
            </CarouselContent>
          </Carousel>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-20">
          <Card className="max-w-4xl mx-auto bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 border-primary/20">
            <CardContent className="p-12">
              <h2 className="text-3xl font-bold mb-4 text-foreground">
                Ready for the Full Experience?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join AutoNate's complete Thinking Wizard course with 10 sessions, 30 interactive games, 
                and personalized AI coaching to master critical thinking for software engineering.
              </p>
              <div className="flex justify-center">
                <Button asChild variant="outline" size="lg">
                  <Link to="/about">
                    Learn More
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

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
      </div>
    </div>
  );
}