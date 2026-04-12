import { useState } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertLocalPicksSignupSchema, type InsertLocalPicksSignup } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Sparkles, CheckCircle2, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LocalPicks() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<InsertLocalPicksSignup>({
    resolver: zodResolver(insertLocalPicksSignupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      preferredStates: "",
      startDate: "",
      endDate: "",
      interests: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertLocalPicksSignup) => {
      return await apiRequest("POST", "/api/local-picks", data);
    },
    onSuccess: () => {
      setIsSuccess(true);
      form.reset();
      toast({
        title: "Success!",
        description: "You're all set for Local Picks! Check your email for confirmation.",
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to submit. Please try again.",
      });
    },
  });

  const onSubmit = (data: InsertLocalPicksSignup) => {
    mutation.mutate(data);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-4 lg:px-8">
          {isSuccess ? (
            <Card className="border-primary/20">
              <CardContent className="py-12 text-center space-y-6">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10 text-primary" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold">You're All Set!</h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Check your email for confirmation. We'll send you personalized tour recommendations within 2-3 business days!
                  </p>
                </div>
                <div className="flex gap-4 justify-center pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsSuccess(false)}
                    data-testid="button-submit-another"
                  >
                    Submit Another Request
                  </Button>
                  <Button
                    onClick={() => setLocation("/destinations")}
                    data-testid="button-browse-destinations"
                  >
                    Browse Destinations
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Sparkles className="w-8 h-8 text-primary" />
                  <h1 className="text-4xl lg:text-5xl font-bold">Local Picks</h1>
                </div>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Get personalized tour recommendations based on your interests and preferred destinations. 
                  We'll handpick unique experiences just for you!
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Tell Us About Your Travel Preferences</CardTitle>
                  <CardDescription>
                    Share your interests and we'll curate the perfect tours for you
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="John Doe"
                                  data-testid="input-full-name"
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
                              <FormLabel>Email Address</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="email"
                                  placeholder="john@example.com"
                                  data-testid="input-email"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="tel"
                                placeholder="(555) 123-4567"
                                data-testid="input-phone"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="preferredStates"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              Preferred States or Regions
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="e.g., California, New York, Southwest"
                                data-testid="input-preferred-states"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="startDate"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Start Date</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                      data-testid="button-start-date"
                                    >
                                      {field.value ? (
                                        format(new Date(field.value), "PPP")
                                      ) : (
                                        <span>Pick start date</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value ? new Date(field.value) : undefined}
                                    onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                                    disabled={(date) =>
                                      date < new Date(new Date().setHours(0, 0, 0, 0))
                                    }
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="endDate"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>End Date</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                      data-testid="button-end-date"
                                    >
                                      {field.value ? (
                                        format(new Date(field.value), "PPP")
                                      ) : (
                                        <span>Pick end date</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value ? new Date(field.value) : undefined}
                                    onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                                    disabled={(date) =>
                                      date < new Date(new Date().setHours(0, 0, 0, 0))
                                    }
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="interests"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Your Interests & Travel Style</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Tell us what you love! Examples: historic sites, food tours, outdoor adventures, art galleries, local markets, hidden gems..."
                                className="min-h-32 resize-none"
                                data-testid="input-interests"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-3 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setLocation("/destinations")}
                          className="flex-1"
                          data-testid="button-cancel"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={mutation.isPending}
                          className="flex-1"
                          data-testid="button-submit"
                        >
                          {mutation.isPending ? "Submitting..." : "Get Personalized Picks"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
