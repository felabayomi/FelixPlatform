import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSignupSchema } from "@shared/schema";
import type { InsertUserSignup } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { UserPlus, Home, Sparkles } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function UserSignup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [generatedPassword, setGeneratedPassword] = useState("");

  const form = useForm<InsertUserSignup>({
    resolver: zodResolver(insertUserSignupSchema),
    defaultValues: {
      username: "",
      email: "",
      firstName: "",
      lastName: "",
      website: "",
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: InsertUserSignup) => {
      const response = await apiRequest("POST", "/api/user-signup", data);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Account request submitted!",
        description: "You'll receive an email once your account is created.",
      });
      form.reset();
      setGeneratedPassword("");
      setTimeout(() => setLocation("/"), 2000);
    },
    onError: (error: Error) => {
      toast({
        title: "Submission failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const generatePassword = () => {
    const length = 24;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setGeneratedPassword(password);
  };

  const onSubmit = (data: InsertUserSignup) => {
    signupMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/">
          <Button variant="outline" className="mb-6" data-testid="button-return-home">
            <Home className="w-4 h-4 mr-2" />
            Return to Home
          </Button>
        </Link>

        <Card className="border-2">
          <CardHeader className="text-center pb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <UserPlus className="w-8 h-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold mb-2">Get Personalized City Insights</CardTitle>
            <CardDescription className="text-base">
              Unlock real-time updates on local events, hidden gems, and the best places to eat and explore. Create your free account to receive curated recommendations and never miss out on what's happening in your favorite neighborhoods!
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Username <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Choose a unique username" 
                          data-testid="input-username"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Email <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="your.email@example.com" 
                          data-testid="input-email"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="First name" 
                            data-testid="input-first-name"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Last name" 
                            data-testid="input-last-name"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input 
                          type="url"
                          placeholder="https://yourwebsite.com (optional)" 
                          data-testid="input-website"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Optional - Share your personal or business website
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="border-t pt-6">
                  <div className="bg-muted/50 p-4 rounded-md space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm">Password Preview</p>
                        <p className="text-xs text-muted-foreground">
                          Your password will be generated and sent to you via email
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={generatePassword}
                        data-testid="button-generate-password"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Preview Password
                      </Button>
                    </div>
                    
                    {generatedPassword && (
                      <div className="bg-background p-3 rounded-md border">
                        <p className="text-xs text-muted-foreground mb-1">Example password:</p>
                        <p className="font-mono text-sm break-all">{generatedPassword}</p>
                        <p className="text-xs text-green-600 mt-2">✓ Strong</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-primary/5 p-4 rounded-md border border-primary/20">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Note:</strong> After submitting this form, our team will manually create your account on WordPress. You'll receive an email with your login credentials once your account is ready.
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  size="lg"
                  disabled={signupMutation.isPending}
                  data-testid="button-submit-signup"
                >
                  {signupMutation.isPending ? "Submitting..." : "Sign Up & Discover More"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <a 
              href="https://travelcenterhub.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
              data-testid="link-login"
            >
              Sign in here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
