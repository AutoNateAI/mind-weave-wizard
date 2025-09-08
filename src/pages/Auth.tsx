import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { PageMeta } from "@/components/UI/PageMeta";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { Phone } from "lucide-react";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

type Values = z.infer<typeof schema>;

export default function Auth() {
  useScrollToTop();
  
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Try to ensure admin exists (no-op if already created)
  useEffect(() => {
    supabase.functions.invoke("create_admin").catch(() => void 0);
  }, []);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" }
  });

  const onSubmit = async (values: Values) => {
    const creds = { email: values.email as string, password: values.password as string };
    const { data, error } = await supabase.auth.signInWithPassword(creds);
    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
      return;
    }

    const from = (location.state as any)?.from?.pathname || "/dashboard";
    toast({ title: "Welcome back", description: data.user?.email ?? "" });
    navigate(from, { replace: true });
  };

  return (
    <main className="min-h-screen relative">
      <PageMeta title="Thinking Wizard — Login" description="Login to your Thinking Wizard account" />
      
      {/* Navigation Bar */}
      <nav className="relative z-10 bg-background/80 backdrop-blur-sm border-b border-primary/20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="text-xl font-bold gradient-text">
              AutoNateAI
            </Link>
            <div className="flex items-center gap-6">
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
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                About AutoNate
              </Link>
              <Link 
                to="/auth" 
                className="text-sm font-medium hover:text-primary transition-colors border-b-2 border-primary"
              >
                Login
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* Login Form */}
      <div className="container py-20 max-w-md mx-auto">
        <header className="mb-6 text-center">
          <h1 className="text-3xl font-bold">Login</h1>
          <p className="text-muted-foreground text-sm">Email and password only. No sign up available.</p>
        </header>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField name="email" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="you@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField name="password" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <Button type="submit" className="w-full">Login</Button>
            <p className="text-xs text-muted-foreground text-center">
              Need access? Contact the administrator.
            </p>
          </form>
        </Form>
      </div>

      {/* Sticky CTA Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-primary/20 p-4">
        <div className="container mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl mx-auto">
            <div className="text-center sm:text-left">
              <p className="font-semibold text-foreground">Don't have an account? Let's chat!</p>
            </div>
            <Button 
              size="lg"
              className="hover-scale cyber-glow neon-border flex items-center gap-2 w-full sm:w-auto"
              onClick={() => window.open('https://calendly.com/autonate-ai/15-min-discovery-call', '_blank')}
            >
              <Phone className="h-4 w-4" />
              Book Your Free 15-Minute Discovery Call
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom padding to account for sticky footer */}
      <div className="h-20"></div>
    </main>
  );
}
