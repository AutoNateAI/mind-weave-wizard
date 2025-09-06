import { Link } from "react-router-dom";
import hero from "@/assets/hero-cyberwizard.jpg";
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

const sessionData = [
  { number: 1, title: "Introduction to Graph Theory", theme: "Everything is connected", duration: "2.5 hours" },
  { number: 2, title: "Mental Models & Mapping", theme: "You don't see with your eyes—you see with your models", duration: "2.5 hours" },
  { number: 3, title: "The Space Between", theme: "The meaning isn't in the nodes—it's in the edges", duration: "2.5 hours" },
  { number: 4, title: "Research Decomposition", theme: "Even the impossible becomes possible when you break it down right", duration: "2.5 hours" },
  { number: 5, title: "Advanced Applications & Mastery", theme: "You are now the architect of your thinking", duration: "2.5 hours" }
];

const Index = () => {
  const scrollToBooking = () => {
    document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen relative">
      <PageMeta 
        title="Transform Your Child's Critical Thinking Skills | Thinking Wizard" 
        description="5 comprehensive sessions designed for children and families to master logical reasoning, pattern recognition, and strategic thinking through graph-based learning."
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
      <section className="relative container mx-auto py-24 flex flex-col items-center text-center animate-fade-in">
        <Badge variant="secondary" className="mb-6 cyber-glow">
          <Brain className="mr-2 h-4 w-4" />
          Graph-Based Learning System
        </Badge>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight gradient-text mb-6">
          Transform Your Child's Critical Thinking Skills
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mb-8 leading-relaxed">
          5 comprehensive sessions designed for children and families to master logical reasoning, 
          pattern recognition, and strategic thinking through our revolutionary graph-based methodology.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-12">
          <Button 
            size="lg" 
            className="hover-scale cyber-glow neon-border text-lg px-8 py-6"
            onClick={scrollToBooking}
          >
            <Phone className="mr-2 h-5 w-5" />
            Book Your Free 15-Minute Discovery Call
          </Button>
        </div>

        <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center">
            <CheckCircle className="mr-2 h-4 w-4 text-primary" />
            Ages 8-18+ Welcome
          </div>
          <div className="flex items-center">
            <CheckCircle className="mr-2 h-4 w-4 text-primary" />
            Parent-Child Learning
          </div>
          <div className="flex items-center">
            <CheckCircle className="mr-2 h-4 w-4 text-primary" />
            Advanced Analytics Included
          </div>
        </div>
      </section>

      {/* Learning Options Section */}
      <section className="relative py-20 bg-gradient-to-b from-background/80 to-background">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold gradient-text mb-4">
              Flexible Learning That Fits Your Family
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Choose the learning format that works best - solo sessions, group learning, or parent-child exploration.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <GlassCard className="text-center p-8 hover-scale">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
                <UserCheck className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Solo Sessions</h3>
              <p className="text-muted-foreground mb-6">
                One-on-one focused learning tailored to your child's pace and learning style.
              </p>
              <ul className="text-sm space-y-2 text-left">
                <li className="flex items-center"><CheckCircle className="mr-2 h-4 w-4 text-primary" /> Personalized attention</li>
                <li className="flex items-center"><CheckCircle className="mr-2 h-4 w-4 text-primary" /> Custom pacing</li>
                <li className="flex items-center"><CheckCircle className="mr-2 h-4 w-4 text-primary" /> Individual analytics</li>
              </ul>
            </GlassCard>

            <GlassCard className="text-center p-8 hover-scale border-primary/50">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Group Learning</h3>
              <p className="text-muted-foreground mb-6">
                Siblings, friends, or homeschool groups can explore concepts together and learn collaboratively.
              </p>
              <ul className="text-sm space-y-2 text-left">
                <li className="flex items-center"><CheckCircle className="mr-2 h-4 w-4 text-primary" /> Collaborative thinking</li>
                <li className="flex items-center"><CheckCircle className="mr-2 h-4 w-4 text-primary" /> Peer learning</li>
                <li className="flex items-center"><CheckCircle className="mr-2 h-4 w-4 text-primary" /> Group discounts available</li>
              </ul>
            </GlassCard>

            <GlassCard className="text-center p-8 hover-scale">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Parent-Child</h3>
              <p className="text-muted-foreground mb-6">
                Interactive sessions where parents and children explore critical thinking concepts together.
              </p>
              <ul className="text-sm space-y-2 text-left">
                <li className="flex items-center"><CheckCircle className="mr-2 h-4 w-4 text-primary" /> Family bonding</li>
                <li className="flex items-center"><CheckCircle className="mr-2 h-4 w-4 text-primary" /> Shared learning experience</li>
                <li className="flex items-center"><CheckCircle className="mr-2 h-4 w-4 text-primary" /> Parents learn too</li>
              </ul>
            </GlassCard>
          </div>

          <div className="text-center">
            <Button 
              size="lg" 
              className="hover-scale cyber-glow neon-border"
              onClick={scrollToBooking}
            >
              Schedule Intro Call - See If This Is Right For Your Family
            </Button>
          </div>
        </div>
      </section>

      {/* Course Overview Section */}
      <section className="relative py-20">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold gradient-text mb-4">
              5-Session Critical Thinking Journey
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Each 2.5-hour session builds upon the previous, creating a comprehensive transformation 
              in how your child approaches complex problems and logical reasoning.
            </p>
          </div>

          <div className="grid gap-8 mb-16">
            {sessionData.map((session, index) => (
              <GlassCard key={session.number} className="p-8 hover-scale">
                <div className="flex flex-col md:flex-row items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/50">
                      <span className="text-2xl font-bold text-primary">{session.number}</span>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                      <h3 className="text-2xl font-bold mb-2 md:mb-0">{session.title}</h3>
                      <Badge variant="outline" className="w-fit">
                        <Clock className="mr-2 h-4 w-4" />
                        {session.duration}
                      </Badge>
                    </div>
                    
                    <p className="text-lg text-primary font-medium mb-4 italic">
                      "{session.theme}"
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Learning Components:</h4>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li className="flex items-center"><BookOpen className="mr-2 h-3 w-3" /> Interactive Slides</li>
                          <li className="flex items-center"><Brain className="mr-2 h-3 w-3" /> Concept Flashcards</li>
                          <li className="flex items-center"><Gamepad2 className="mr-2 h-3 w-3" /> Graph-Based Games</li>
                          <li className="flex items-center"><MessageSquare className="mr-2 h-3 w-3" /> Reflection Exercises</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Skills Developed:</h4>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li className="flex items-center"><Target className="mr-2 h-3 w-3" /> Pattern Recognition</li>
                          <li className="flex items-center"><Lightbulb className="mr-2 h-3 w-3" /> Strategic Reasoning</li>
                          <li className="flex items-center"><TrendingUp className="mr-2 h-3 w-3" /> Metacognition</li>
                          <li className="flex items-center"><CheckCircle className="mr-2 h-3 w-3" /> Problem Solving</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>

          <div className="text-center">
            <Button 
              size="lg" 
              className="hover-scale cyber-glow neon-border"
              onClick={scrollToBooking}
            >
              Get Started - Book Your Consultation
            </Button>
          </div>
        </div>
      </section>

      {/* Learning Experience Showcase */}
      <section className="relative py-20 bg-gradient-to-b from-background to-background/80">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold gradient-text mb-4">
              Complete Interactive Learning Experience
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Every session includes multiple learning modalities and real-time analytics 
              to track your child's cognitive development.
            </p>
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="glass p-4 text-center rounded-lg">
                    <div className="text-2xl font-bold text-primary">94%</div>
                    <div className="text-sm text-muted-foreground">Pattern Recognition</div>
                  </div>
                  <div className="glass p-4 text-center rounded-lg">
                    <div className="text-2xl font-bold text-primary">87%</div>
                    <div className="text-sm text-muted-foreground">Strategic Reasoning</div>
                  </div>
                  <div className="glass p-4 text-center rounded-lg">
                    <div className="text-2xl font-bold text-primary">91%</div>
                    <div className="text-sm text-muted-foreground">Metacognition</div>
                  </div>
                  <div className="glass p-4 text-center rounded-lg">
                    <div className="text-2xl font-bold text-primary">89%</div>
                    <div className="text-sm text-muted-foreground">Error Recovery</div>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>

          <div className="text-center mt-12">
            <Button 
              size="lg" 
              className="hover-scale cyber-glow neon-border"
              onClick={scrollToBooking}
            >
              Reserve Your Family's Spot - Limited Availability
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative py-20">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold gradient-text mb-4">
              Transformational Benefits for Your Family
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Watch your child develop advanced reasoning skills while you gain insights 
              into their cognitive development with our professional analytics.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            <GlassCard className="p-8">
              <div className="flex items-center mb-6">
                <Users className="h-8 w-8 text-primary mr-3" />
                <h3 className="text-2xl font-bold">For Parents</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CheckCircle className="mr-3 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Watch your child develop advanced reasoning skills through our visual analytics</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="mr-3 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Get detailed insights into their cognitive development and thinking patterns</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="mr-3 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Learn alongside them or have them work independently with confidence</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="mr-3 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Receive professional-grade reports on their critical thinking progress</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="mr-3 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Build critical thinking skills that benefit the whole family</span>
                </li>
              </ul>
            </GlassCard>

            <GlassCard className="p-8">
              <div className="flex items-center mb-6">
                <Brain className="h-8 w-8 text-primary mr-3" />
                <h3 className="text-2xl font-bold">For Children</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <Star className="mr-3 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Make abstract thinking visual and engaging through interactive games</span>
                </li>
                <li className="flex items-start">
                  <Star className="mr-3 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Build real cognitive skills while having fun with graph-based learning</span>
                </li>
                <li className="flex items-start">
                  <Star className="mr-3 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>See immediate feedback on their reasoning and problem-solving</span>
                </li>
                <li className="flex items-start">
                  <Star className="mr-3 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Develop confidence in tackling complex problems step by step</span>
                </li>
                <li className="flex items-start">
                  <Star className="mr-3 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Gain skills that dramatically improve academic performance</span>
                </li>
              </ul>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="relative py-20 bg-gradient-to-b from-background/80 to-background" id="pricing">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold gradient-text mb-4">
              Investment in Your Child's Future
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Professional-grade critical thinking development with flexible payment options 
              and group discounts available.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <GlassCard className="p-8 border-primary/50 text-center">
              <div className="mb-8">
                <div className="text-6xl font-bold gradient-text mb-4">$500</div>
                <div className="text-xl text-muted-foreground">per session</div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
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
                      <span><strong>Ages 8-18+</strong> Welcome</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="text-center">
                <Button 
                  size="lg" 
                  className="hover-scale cyber-glow neon-border text-lg px-12 py-6"
                  onClick={scrollToBooking}
                >
                  <Phone className="mr-2 h-5 w-5" />
                  Book Your Free Discovery Call Now
                </Button>
                <p className="text-sm text-muted-foreground mt-4">
                  15-minute consultation to see if this program is right for your family
                </p>
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative py-20">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold gradient-text mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Get answers to common questions about our program structure, 
              age appropriateness, and learning approach.
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid gap-6">
            <GlassCard className="p-6">
              <h3 className="text-xl font-bold mb-3">What if my child isn't ready for this level of thinking?</h3>
              <p className="text-muted-foreground">
                Our program is designed to meet children where they are. We start with fundamental concepts 
                and build progressively. The visual, game-based approach makes complex ideas accessible 
                to learners aged 8-18+. During your discovery call, we'll assess readiness.
              </p>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-xl font-bold mb-3">Can parents learn alongside their children?</h3>
              <p className="text-muted-foreground">
                Absolutely! Many parents find the program valuable for their own critical thinking development. 
                Parent-child sessions create powerful bonding experiences while both participants develop 
                advanced reasoning skills.
              </p>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-xl font-bold mb-3">What if we need to reschedule sessions?</h3>
              <p className="text-muted-foreground">
                We offer flexible scheduling to accommodate family needs. Sessions can be rescheduled 
                with 24-hour notice. We understand that family schedules change and work with you 
                to ensure consistent progress.
              </p>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-xl font-bold mb-3">How do I track my child's progress?</h3>
              <p className="text-muted-foreground">
                You'll have access to a comprehensive analytics dashboard showing detailed metrics 
                on critical thinking development, problem-solving skills, and cognitive growth. 
                Regular progress reports help you understand your child's journey.
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
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl font-bold gradient-text mb-6">
              Ready to Transform Your Child's Thinking?
            </h2>
            <p className="text-xl text-muted-foreground mb-12 leading-relaxed">
              Join families who are already seeing remarkable improvements in their children's 
              critical thinking, problem-solving, and academic performance. Limited spots available.
            </p>
            
            <GlassCard className="p-8 border-primary/50 mb-12">
              <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">15</div>
                  <div className="text-muted-foreground">Minute Discovery Call</div>
                </div>
                <ArrowRight className="h-8 w-8 text-primary rotate-90 md:rotate-0" />
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">5</div>
                  <div className="text-muted-foreground">Transformative Sessions</div>
                </div>
                <ArrowRight className="h-8 w-8 text-primary rotate-90 md:rotate-0" />
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">∞</div>
                  <div className="text-muted-foreground">Lifelong Skills</div>
                </div>
              </div>
              
              <Button 
                size="lg" 
                className="hover-scale cyber-glow neon-border text-xl px-16 py-8"
                onClick={() => window.open('https://calendly.com/your-calendar-link', '_blank')}
              >
                <Phone className="mr-3 h-6 w-6" />
                Claim Your Strategy Session Today
              </Button>
              
              <p className="text-sm text-muted-foreground mt-6">
                Free 15-minute consultation • No obligation • Limited availability
              </p>
            </GlassCard>

            <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center">
                <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                Professional Analytics Included
              </div>
              <div className="flex items-center">
                <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                Flexible Learning Formats
              </div>
              <div className="flex items-center">
                <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                Ages 8-18+ Welcome
              </div>
              <div className="flex items-center">
                <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                Group Discounts Available
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Index;
