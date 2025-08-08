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

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

type Values = z.infer<typeof schema>;

export default function Auth() {
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
    <main className="container py-10 max-w-md">
      <PageMeta title="Thinking Wizard — Login" description="Login to your Thinking Wizard account" />
      <header className="mb-6">
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
          <div className="text-center">
            <Button variant="secondary" asChild>
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </form>
      </Form>
    </main>
  );
}
