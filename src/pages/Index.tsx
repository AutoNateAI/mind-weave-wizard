import { Link } from "react-router-dom";
import hero from "@/assets/hero-cyberwizard.jpg";
import heroEngineer from "@/assets/hero-software-engineer.jpg";
import sessionInterface from "@/assets/lms-session-interface.jpg";
import lectureInterface from "@/assets/lms-lecture-interface.jpg";
import analyticsDashboard from "@/assets/lms-analytics-dashboard.jpg";
import graphEditor from "@/assets/lms-graph-editor.jpg";
import reflectionInterface from "@/assets/deep-reflection-metacognition.jpg";
import session1Image from "@/assets/session-1-graph-theory.jpg";
import session2Image from "@/assets/session-2-mental-models.jpg";
import session3Image from "@/assets/session-3-space-between.jpg";
import session4Image from "@/assets/session-4-decomposition.jpg";
import session5Image from "@/assets/session-5-mastery.jpg";
import { sessionOverview } from "@/content/sessions";
import useEmblaCarousel from 'embla-carousel-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { PageMeta } from "@/components/UI/PageMeta";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { GlassCard } from "@/components/UI/GlassCard";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  Users, 
  BarChart3, 
  Target, 
  Lightbulb, 
  Calendar,
  DollarSign,
  Star,
  CheckCircle,
  ArrowRight,
  PlayCircle,
  BookOpen,
  Gamepad2,
  MessageSquare,
  TrendingUp,
  Clock,
  UserCheck,
  Phone
} from "lucide-react";

const sessionImages = [session1Image, session2Image, session3Image, session4Image, session5Image];

const sessionData = sessionOverview.map((session, index) => ({
  ...session,
  image: sessionImages[index]
}));

const Index = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true, 
    align: 'start',
    slidesToScroll: 1,
    breakpoints: {
      '(min-width: 768px)': { slidesToScroll: 2 }
    }
  });
  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true);
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback((emblaApi: any) => {
    setPrevBtnDisabled(!emblaApi.canScrollPrev());
    setNextBtnDisabled(!emblaApi.canScrollNext());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;

    onSelect(emblaApi);
    emblaApi.on('reInit', onSelect);
    emblaApi.on('select', onSelect);
  }, [emblaApi, onSelect]);

  const scrollToBooking = () => {
    document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen relative overflow-x-hidden">
      <PageMeta 
        title="Master Critical Thinking Skills for Software Engineers | Thinking Wizard" 
        description="Advanced graph-based methodology to enhance logical reasoning, pattern recognition, and strategic thinking for software engineers at all career levels."
      />
      
      {/* Hero Background */}
      <div className="absolute inset-0 overflow-hidden">
        <img src={hero} alt="Cyber-wizard neon abstract background" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 to-background/80" />
      </div>

      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle />
      </div>

      {/* Hero Section */}
      <section className="relative container mx-auto px-4 py-24 animate-fade-in">
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-12 items-center">
          {/* Title - Mobile: First, Desktop: Left */}
          <div className="text-center order-1 lg:order-1">
            <Badge variant="secondary" className="mb-6 cyber-glow">
              <Brain className="mr-2 h-4 w-4" />
              Graph-Based Learning System
            </Badge>
            
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight gradient-text mb-6 leading-tight">
              Master Critical Thinking for Software Engineering
            </h1>
          </div>

          {/* Image - Mobile: Second, Desktop: Right */}
          <div className="relative order-2 lg:order-2">
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-primary/20">
              <img 
                src={heroEngineer} 
                alt="Software engineer working with AI and graph algorithms" 
                className="w-full h-auto"
              />
            </div>
          </div>

          {/* Subtext - Mobile: Third, Desktop: Below title */}
          <div className="text-center order-3 lg:order-1 lg:col-start-1">
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-0 leading-relaxed">
              Advanced graph-based methodology to enhance logical reasoning, pattern recognition, 
              and strategic thinking for software engineers at all career levels.
            </p>
          </div>
          
          {/* Buttons and Features - Mobile: Fourth, Desktop: Below both content and image */}
          <div className="order-4 lg:order-3 lg:col-span-2 w-full">
            <div className="flex flex-col items-center space-y-8">
              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm sm:max-w-2xl mx-auto">
                <Button 
                  size="lg" 
                  className="hover-scale cyber-glow neon-border text-sm sm:text-lg px-4 sm:px-8 py-5 sm:py-7 w-full flex items-center justify-center gap-2 sm:gap-3"
                  onClick={scrollToBooking}
                >
                  <Phone className="h-4 w-4 sm:h-6 sm:w-6 flex-shrink-0" />
                  <span className="font-semibold leading-tight">Book Your Free 15-Minute Discovery Call</span>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="hover-scale text-sm sm:text-lg px-4 sm:px-8 py-5 sm:py-7 w-full flex items-center justify-center gap-2 sm:gap-3"
                  onClick={() => window.location.href = '/auth'}
                >
                  <UserCheck className="h-4 w-4 sm:h-6 sm:w-6 flex-shrink-0" />
                  <span className="font-semibold leading-tight">Login / Sign Up</span>
                </Button>
              </div>

              <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-center">
                  <CheckCircle className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                  <span>All Experience Levels</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                  <span>Self-Paced Learning</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                  <span>Advanced Analytics Included</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Learning Options Section */}
      <section className="relative py-20 bg-gradient-to-b from-background/80 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold gradient-text mb-4 px-2">
              Flexible Learning That Fits Your Career
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
              Choose the learning format that works best - individual study, team training, or mentorship programs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <GlassCard className="text-center p-8 hover-scale">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
                <UserCheck className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Individual Learning</h3>
              <p className="text-muted-foreground mb-6">
                Self-paced focused learning tailored to your career level and learning style.
              </p>
              <ul className="text-sm space-y-2 text-left">
                <li className="flex items-center"><CheckCircle className="mr-2 h-4 w-4 text-primary" /> Personalized curriculum</li>
                <li className="flex items-center"><CheckCircle className="mr-2 h-4 w-4 text-primary" /> Custom pacing</li>
                <li className="flex items-center"><CheckCircle className="mr-2 h-4 w-4 text-primary" /> Individual progress analytics</li>
              </ul>
            </GlassCard>

            <GlassCard className="text-center p-8 hover-scale border-primary/50">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Team Training</h3>
              <p className="text-muted-foreground mb-6">
                Collaborative learning for development teams, engineering cohorts, or peer groups.
              </p>
              <ul className="text-sm space-y-2 text-left">
                <li className="flex items-center"><CheckCircle className="mr-2 h-4 w-4 text-primary" /> Collaborative problem solving</li>
                <li className="flex items-center"><CheckCircle className="mr-2 h-4 w-4 text-primary" /> Peer learning & discussion</li>
                <li className="flex items-center"><CheckCircle className="mr-2 h-4 w-4 text-primary" /> Team discounts available</li>
              </ul>
            </GlassCard>

            <GlassCard className="text-center p-8 hover-scale">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Mentorship Program</h3>
              <p className="text-muted-foreground mb-6">
                Guided learning with experienced engineers and critical thinking mentors.
              </p>
              <ul className="text-sm space-y-2 text-left">
                <li className="flex items-center"><CheckCircle className="mr-2 h-4 w-4 text-primary" /> Expert guidance</li>
                <li className="flex items-center"><CheckCircle className="mr-2 h-4 w-4 text-primary" /> Career-focused learning</li>
                <li className="flex items-center"><CheckCircle className="mr-2 h-4 w-4 text-primary" /> Real-world applications</li>
              </ul>
            </GlassCard>
          </div>

          <div className="text-center px-4">
            <Button 
              size="lg" 
              className="hover-scale cyber-glow neon-border text-sm sm:text-lg px-4 sm:px-8 py-5 sm:py-7 w-full sm:w-auto max-w-sm sm:max-w-lg mx-auto flex items-center justify-center"
              onClick={scrollToBooking}
            >
              <span className="font-semibold text-center leading-tight text-sm sm:text-lg">
                <span className="sm:hidden">Schedule Your Call</span>
                <span className="hidden sm:inline">Schedule Intro Call - See If This Is Right For Your Career</span>
              </span>
            </Button>
          </div>
        </div>
      </section>

      {/* Course Overview Section */}
      <section className="relative py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold gradient-text mb-4 px-2">
              10-Session Critical Thinking Mastery
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
              Each comprehensive session builds upon the previous, creating a transformation 
              in how you approach complex engineering problems and strategic thinking.
            </p>
          </div>

          {/* Carousel Container */}
          <div className="relative mb-16">
            {/* Navigation Buttons */}
            <div className="flex justify-center gap-2 sm:gap-4 mb-8 px-4">
              <Button
                variant="outline"
                size="sm"
                onClick={scrollPrev}
                disabled={prevBtnDisabled}
                className="hover-scale text-xs sm:text-sm px-2 sm:px-4"
              >
                <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 rotate-180" />
                <span className="hidden sm:inline ml-1">Previous</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={scrollNext}
                disabled={nextBtnDisabled}
                className="hover-scale text-xs sm:text-sm px-2 sm:px-4"
              >
                <span className="hidden sm:inline mr-1">Next</span>
                <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>

            {/* Embla Carousel */}
            <div className="overflow-hidden px-2" ref={emblaRef}>
              <div className="flex">
                {sessionData.map((session, index) => (
                  <div key={session.number} className="flex-[0_0_85%] sm:flex-[0_0_90%] md:flex-[0_0_45%] lg:flex-[0_0_30%] min-w-0 pl-2 sm:pl-4">
                    <GlassCard className="h-full hover-scale transition-all duration-300 border-primary/30">
                      {/* Large Image Header */}
                      <div className="relative h-48 overflow-hidden rounded-t-lg">
                        <img 
                          src={session.image} 
                          alt={`Visual representation of ${session.title}`}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                        />
                        <div className="absolute top-4 left-4">
                          <div className="w-12 h-12 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center border-2 border-white/50">
                            <span className="text-lg font-bold text-white">{session.number}</span>
                          </div>
                        </div>
                        <div className="absolute top-4 right-4">
                          <Badge variant="secondary" className="bg-black/50 backdrop-blur-sm text-white border-white/20">
                            <Clock className="mr-2 h-3 w-3" />
                            {session.duration}
                          </Badge>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-6">
                        <h3 className="text-xl font-bold mb-3 leading-tight">{session.title}</h3>
                        
                        <p className="text-sm text-primary font-medium mb-4 italic leading-relaxed">
                          "{session.theme}"
                        </p>
                        
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold mb-2 text-sm">Learning Components:</h4>
                            <div className="grid grid-cols-2 gap-1">
                              <div className="flex items-center text-xs text-muted-foreground">
                                <BookOpen className="mr-1 h-3 w-3" /> Slides
                              </div>
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Brain className="mr-1 h-3 w-3" /> Concepts
                              </div>
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Gamepad2 className="mr-1 h-3 w-3" /> Games
                              </div>
                              <div className="flex items-center text-xs text-muted-foreground">
                                <MessageSquare className="mr-1 h-3 w-3" /> Reflection
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold mb-2 text-sm">Key Skills:</h4>
                            <div className="flex flex-wrap gap-1">
                              {session.keySkills.map((skill, skillIndex) => (
                                <Badge key={skillIndex} variant="outline" className="text-xs py-0 px-2">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Session Interface Preview */}
          <div className="mb-16">
            <GlassCard className="p-8 border-primary/30">
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div className="rounded-lg overflow-hidden shadow-2xl border border-primary/20">
                  <img 
                    src={sessionInterface} 
                    alt="Session dashboard showing lecture tabs, progress indicators, and analytics"
                    className="w-full h-auto"
                  />
                </div>
                <div>
                  <h3 className="text-3xl font-bold gradient-text mb-4">
                    Organized Session Structure
                  </h3>
                  <p className="text-lg text-muted-foreground mb-6">
                    Each session is carefully structured with 2 comprehensive lectures, 
                    clear progress tracking, and immediate access to all learning materials.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Calendar className="mr-3 h-5 w-5 text-primary" />
                      <span>2 focused lectures per session with clear progression</span>
                    </div>
                    <div className="flex items-center">
                      <TrendingUp className="mr-3 h-5 w-5 text-primary" />
                      <span>Real-time progress tracking and completion status</span>
                    </div>
                    <div className="flex items-center">
                      <BookOpen className="mr-3 h-5 w-5 text-primary" />
                      <span>Instant access to slides, games, and reflections</span>
                    </div>
                    <div className="flex items-center">
                      <BarChart3 className="mr-3 h-5 w-5 text-primary" />
                      <span>Performance analytics and learning insights</span>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>

          <div className="text-center px-4">
            <Button 
              size="lg" 
              className="hover-scale cyber-glow neon-border text-base sm:text-lg px-6 sm:px-8 py-6 sm:py-7 w-full sm:w-auto max-w-md mx-auto"
              onClick={scrollToBooking}
            >
              <span className="font-semibold">
                <span className="sm:hidden">Get Started</span>
                <span className="hidden sm:inline">Get Started - Book Your Consultation</span>
              </span>
            </Button>
          </div>
        </div>
      </section>

      {/* Learning Experience Showcase */}
      <section className="relative py-20 bg-gradient-to-b from-background to-background/80">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold gradient-text mb-4 px-2">
              Complete Interactive Learning Experience
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
              Every session includes multiple learning modalities and real-time analytics 
              to track your child's cognitive development.
            </p>
          </div>

          {/* Learning Interface Preview */}
          <div className="mb-16">
            <GlassCard className="p-8 border-primary/30">
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-3xl font-bold gradient-text mb-4">
                    Interactive Learning Interface
                  </h3>
                  <p className="text-lg text-muted-foreground mb-6">
                    Experience our cutting-edge learning platform with multiple content delivery methods 
                    designed to engage different learning styles and maximize retention.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <BookOpen className="mr-3 h-5 w-5 text-primary" />
                      <span>Interactive slide presentations with rich visuals</span>
                    </div>
                    <div className="flex items-center">
                      <Brain className="mr-3 h-5 w-5 text-primary" />
                      <span>Dynamic concept mapping and graph visualization</span>
                    </div>
                    <div className="flex items-center">
                      <Gamepad2 className="mr-3 h-5 w-5 text-primary" />
                      <span>Hands-on interactive games and simulations</span>
                    </div>
                    <div className="flex items-center">
                      <MessageSquare className="mr-3 h-5 w-5 text-primary" />
                      <span>Guided reflection and metacognitive exercises</span>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg overflow-hidden shadow-2xl border border-primary/20">
                  <img 
                    src={lectureInterface} 
                    alt="Interactive lecture interface showing slides, concepts, games, and reflection tabs"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </GlassCard>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            <GlassCard className="text-center p-6 hover-scale">
              <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-3">Professional Slides</h3>
              <p className="text-sm text-muted-foreground">
                Custom-designed presentations that make abstract concepts visual and engaging.
              </p>
            </GlassCard>

            <GlassCard className="text-center p-6 hover-scale">
              <Brain className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-3">Smart Flashcards</h3>
              <p className="text-sm text-muted-foreground">
                Adaptive review system that personalizes based on your child's learning progress.
              </p>
            </GlassCard>

            <GlassCard className="text-center p-6 hover-scale">
              <Gamepad2 className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-3">Graph Games</h3>
              <p className="text-sm text-muted-foreground">
                Interactive logic puzzles that make complex reasoning tangible and fun.
              </p>
            </GlassCard>

            <GlassCard className="text-center p-6 hover-scale">
              <MessageSquare className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-3">Deep Reflections</h3>
              <p className="text-sm text-muted-foreground">
                Guided questionnaires that build metacognitive awareness and self-reflection skills.
              </p>
            </GlassCard>
          </div>

          <GlassCard className="p-8 border-primary/50">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="lg:w-1/2">
                <h3 className="text-3xl font-bold gradient-text mb-4">
                  Advanced Analytics Dashboard
                </h3>
                <p className="text-lg text-muted-foreground mb-6">
                  Get detailed insights into your child's cognitive development with our 
                  comprehensive analytics system.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <BarChart3 className="mr-3 h-5 w-5 text-primary" />
                    <span>Critical Thinking Metrics & Progress Tracking</span>
                  </div>
                  <div className="flex items-center">
                    <Target className="mr-3 h-5 w-5 text-primary" />
                    <span>Individual Strengths & Growth Area Identification</span>
                  </div>
                  <div className="flex items-center">
                    <TrendingUp className="mr-3 h-5 w-5 text-primary" />
                    <span>Visual Learning Journey with Skill Development</span>
                  </div>
                  <div className="flex items-center">
                    <UserCheck className="mr-3 h-5 w-5 text-primary" />
                    <span>Parent Dashboard with Detailed Progress Reports</span>
                  </div>
                </div>
              </div>
              
              <div className="lg:w-1/2">
                <div className="rounded-lg overflow-hidden shadow-2xl border border-primary/20">
                  <img 
                    src={analyticsDashboard} 
                    alt="Analytics dashboard showing student progress, engagement metrics, and performance graphs"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>
          </GlassCard>

          <div className="text-center mt-12 px-4">
            <Button 
              size="lg" 
              className="hover-scale cyber-glow neon-border text-sm sm:text-lg px-4 sm:px-8 py-5 sm:py-7 w-full sm:w-auto max-w-sm sm:max-w-md mx-auto flex items-center justify-center"
              onClick={scrollToBooking}
            >
              <span className="font-semibold text-center leading-tight">
                <span className="sm:hidden">Reserve Your Spot</span>
                <span className="hidden sm:inline">Reserve Your Professional Development Spot - Limited Availability</span>
              </span>
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative py-20">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold gradient-text mb-4">
              Transformational Benefits for Your Career
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Develop advanced reasoning skills and gain insights into your thinking patterns 
              with our professional analytics and career-focused curriculum.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            <GlassCard className="p-8">
              <div className="flex items-center mb-6">
                <Users className="h-8 w-8 text-primary mr-3" />
                <h3 className="text-2xl font-bold">For Engineering Teams</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CheckCircle className="mr-3 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Develop advanced reasoning skills through visual analytics and team collaboration</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="mr-3 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Get detailed insights into team thinking patterns and problem-solving approaches</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="mr-3 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Learn collaboratively or work independently with structured guidance</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="mr-3 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Receive professional-grade reports on critical thinking progress and team dynamics</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="mr-3 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Build critical thinking skills that enhance engineering decision-making</span>
                </li>
              </ul>
            </GlassCard>

            <GlassCard className="p-8">
              <div className="flex items-center mb-6">
                <Brain className="h-8 w-8 text-primary mr-3" />
                <h3 className="text-2xl font-bold">For Individual Engineers</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <Star className="mr-3 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Make abstract thinking visual and engaging through interactive simulations</span>
                </li>
                <li className="flex items-start">
                  <Star className="mr-3 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Build real cognitive skills while applying graph-based learning to engineering challenges</span>
                </li>
                <li className="flex items-start">
                  <Star className="mr-3 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Get immediate feedback on reasoning and problem-solving approaches</span>
                </li>
                <li className="flex items-start">
                  <Star className="mr-3 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Develop confidence in tackling complex software architecture challenges</span>
                </li>
                <li className="flex items-start">
                  <Star className="mr-3 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Gain skills that dramatically improve career advancement and technical leadership</span>
                </li>
              </ul>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Interactive Tools Showcase */}
      <section className="relative py-20 bg-gradient-to-b from-background/80 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold gradient-text mb-4 px-2">
              Advanced Learning Tools & Reflection
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
              Our platform includes sophisticated graph editors and guided reflection tools 
              to deepen understanding and build metacognitive awareness.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 mb-16">
            <GlassCard className="p-8 border-primary/30">
              <div className="mb-8">
                <div className="rounded-lg overflow-hidden shadow-2xl border border-primary/20">
                  <img 
                    src={graphEditor} 
                    alt="Interactive graph editor for visualizing relationships and building mental models"
                    className="w-full h-auto"
                  />
                </div>
              </div>
              <h3 className="text-2xl font-bold gradient-text mb-4">
                Graph Editor & Visualization
              </h3>
              <p className="text-muted-foreground mb-4">
                Students build and manipulate visual graphs to understand relationships, 
                connections, and complex systems thinking.
              </p>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Brain className="mr-3 h-4 w-4 text-primary" />
                  <span className="text-sm">Visual mental model construction</span>
                </div>
                <div className="flex items-center">
                  <Target className="mr-3 h-4 w-4 text-primary" />
                  <span className="text-sm">Interactive relationship mapping</span>
                </div>
                <div className="flex items-center">
                  <Lightbulb className="mr-3 h-4 w-4 text-primary" />
                  <span className="text-sm">Systems thinking development</span>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-8 border-primary/30">
              <div className="mb-8">
                <div className="rounded-lg overflow-hidden shadow-2xl border border-primary/20">
                  <img 
                    src={reflectionInterface} 
                    alt="Guided reflection interface with thoughtful questions and progress tracking"
                    className="w-full h-auto"
                  />
                </div>
              </div>
              <h3 className="text-2xl font-bold gradient-text mb-4">
                Deep Reflection & Metacognition
              </h3>
              <p className="text-muted-foreground mb-4">
                Carefully crafted reflection exercises help students think about their thinking 
                and develop self-awareness of their reasoning processes.
              </p>
              <div className="space-y-2">
                <div className="flex items-center">
                  <MessageSquare className="mr-3 h-4 w-4 text-primary" />
                  <span className="text-sm">Guided self-reflection questions</span>
                </div>
                <div className="flex items-center">
                  <TrendingUp className="mr-3 h-4 w-4 text-primary" />
                  <span className="text-sm">Progress tracking and insights</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="mr-3 h-4 w-4 text-primary" />
                  <span className="text-sm">Metacognitive skill building</span>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="relative py-20 bg-gradient-to-b from-background/80 to-background" id="pricing">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold gradient-text mb-4 px-2">
              Investment in Your Professional Development
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
              Professional-grade critical thinking development with flexible payment options 
              and team discounts available for engineering organizations.
            </p>
          </div>

          <div className="max-w-4xl mx-auto px-4">
            <GlassCard className="p-6 sm:p-8 border-primary/50 text-center">
              <div className="mb-8">
                <div className="text-4xl sm:text-6xl font-bold gradient-text mb-4">$500</div>
                <div className="text-lg sm:text-xl text-muted-foreground">per session</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-2xl font-bold mb-4">What's Included</h3>
                  <ul className="space-y-3 text-left">
                    <li className="flex items-center">
                      <CheckCircle className="mr-3 h-5 w-5 text-primary" />
                      <span>2.5 hours of expert instruction</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-3 h-5 w-5 text-primary" />
                      <span>Interactive slides, games & flashcards</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-3 h-5 w-5 text-primary" />
                      <span>Real-time analytics dashboard</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-3 h-5 w-5 text-primary" />
                      <span>Detailed progress reports</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-3 h-5 w-5 text-primary" />
                      <span>Flexible scheduling options</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-2xl font-bold mb-4">Course Structure</h3>
                  <ul className="space-y-3 text-left">
                    <li className="flex items-center">
                      <Calendar className="mr-3 h-5 w-5 text-primary" />
                      <span><strong>5 Sessions Total</strong> (12.5 hours)</span>
                    </li>
                    <li className="flex items-center">
                      <DollarSign className="mr-3 h-5 w-5 text-primary" />
                      <span><strong>$2,500 Total Investment</strong></span>
                    </li>
                    <li className="flex items-center">
                      <Users className="mr-3 h-5 w-5 text-primary" />
                      <span><strong>Group Discounts</strong> Available</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-3 h-5 w-5 text-primary" />
                      <span><strong>Payment Plans</strong> Available</span>
                    </li>
                    <li className="flex items-center">
                      <Target className="mr-3 h-5 w-5 text-primary" />
                      <span><strong>All Career Levels</strong> Welcome</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="text-center px-4">
                <Button 
                  size="lg" 
                  className="hover-scale cyber-glow neon-border text-sm sm:text-lg px-6 sm:px-12 py-6 w-full sm:w-auto max-w-md"
                  onClick={scrollToBooking}
                >
                  <Phone className="mr-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="text-center">
                    <span className="sm:hidden">Book Free Call</span>
                    <span className="hidden sm:inline">Book Your Free Discovery Call Now</span>
                  </span>
                </Button>
                <p className="text-xs sm:text-sm text-muted-foreground mt-4 px-2">
                  15-minute consultation to see if this program is right for your career development
                </p>
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold gradient-text mb-4 px-2">
              Frequently Asked Questions
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
              Get answers to common questions about our program structure, 
              experience requirements, and learning approach.
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid gap-6">
            <GlassCard className="p-6">
              <h3 className="text-xl font-bold mb-3">What if I don't have experience with graph theory?</h3>
              <p className="text-muted-foreground">
                Our program is designed to meet engineers where they are. We start with fundamental concepts 
                and build progressively. The visual, interactive approach makes complex ideas accessible 
                to software engineers at all career levels. During your discovery call, we'll assess your background.
              </p>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-xl font-bold mb-3">Can engineering teams learn together?</h3>
              <p className="text-muted-foreground">
                Absolutely! Many engineering teams find the program valuable for collaborative problem-solving development. 
                Team sessions create powerful learning experiences while all participants develop 
                advanced reasoning skills and shared mental models.
              </p>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-xl font-bold mb-3">What if we need to reschedule sessions?</h3>
              <p className="text-muted-foreground">
                We offer flexible scheduling to accommodate professional needs. Sessions can be rescheduled 
                with 24-hour notice. We understand that engineering schedules change and work with you 
                to ensure consistent progress in your learning journey.
              </p>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-xl font-bold mb-3">How do I track my progress and learning outcomes?</h3>
              <p className="text-muted-foreground">
                You'll have access to a comprehensive analytics dashboard showing detailed metrics 
                on critical thinking development, problem-solving skills, and cognitive growth patterns. 
                Regular progress reports help you understand your learning journey and career development.
              </p>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-xl font-bold mb-3">Is this suitable for different learning styles?</h3>
              <p className="text-muted-foreground">
                Yes! Our multi-modal approach includes visual graphs, interactive games, reflective 
                writing, and discussion. This combination ensures engagement across different learning 
                preferences while building universal critical thinking skills.
              </p>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-20 bg-gradient-to-b from-background to-background/60" id="booking-section">
        <div className="container mx-auto text-center px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-5xl font-bold gradient-text mb-6 px-2">
              Ready to Transform Your Engineering Mindset?
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground mb-12 leading-relaxed px-4">
              Join software engineers who are already seeing remarkable improvements in their 
              critical thinking, problem-solving, and technical leadership skills. Limited spots available.
            </p>
            
            <GlassCard className="p-6 sm:p-8 border-primary/50 mb-12">
              <div className="flex flex-col gap-4 sm:gap-8 mb-8">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">15</div>
                  <div className="text-sm sm:text-base text-muted-foreground">Minute Discovery Call</div>
                </div>
                <ArrowRight className="h-6 w-6 sm:h-8 sm:w-8 text-primary mx-auto rotate-90" />
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">5</div>
                  <div className="text-sm sm:text-base text-muted-foreground">Transformative Sessions</div>
                </div>
                <ArrowRight className="h-6 w-6 sm:h-8 sm:w-8 text-primary mx-auto rotate-90" />
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">∞</div>
                  <div className="text-sm sm:text-base text-muted-foreground">Lifelong Skills</div>
                </div>
              </div>
              
              <Button 
                size="lg" 
                className="hover-scale cyber-glow neon-border text-base sm:text-xl px-6 sm:px-16 py-6 sm:py-8 w-full sm:w-auto max-w-lg mx-auto"
                onClick={() => window.open('https://calendly.com/autonate-ai/15-min-discovery-call', '_blank')}
              >
                <Phone className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                <span className="font-semibold text-center">Claim Your Strategy Session Today</span>
              </Button>
              
              <p className="text-xs sm:text-sm text-muted-foreground mt-6 px-2">
                Free 15-minute consultation • No obligation • Limited availability
              </p>
            </GlassCard>

            <div className="flex flex-wrap justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-muted-foreground px-4">
              <div className="flex items-center">
                <CheckCircle className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                <span>Professional Analytics Included</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                <span>Flexible Learning Formats</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                <span>All Career Levels Welcome</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                <span>Team Discounts Available</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Index;
