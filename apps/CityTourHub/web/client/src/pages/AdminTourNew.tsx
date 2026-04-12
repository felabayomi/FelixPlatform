import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminTourSchema, type AdminTour } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

export default function AdminTourNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<AdminTour>({
    resolver: zodResolver(adminTourSchema),
    defaultValues: {
      city: "",
      state: "",
      description: "",
      highlights: [],
      startDate: "",
      endDate: "",
      maxParticipants: 24,
      currentParticipants: 0,
      imageUrl: "/api/images/default.png",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: AdminTour) => {
      return await apiRequest("POST", "/api/tours", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tours"] });
      toast({
        title: "Tour created",
        description: "The new tour has been successfully created.",
      });
      setLocation("/admin/tours");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create tour. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AdminTour) => {
    createMutation.mutate(data);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <Button
        variant="ghost"
        onClick={() => setLocation("/admin/tours")}
        className="mb-4"
        data-testid="button-back"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Tours
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Create New Tour</CardTitle>
          <CardDescription>
            Add a new tour destination to the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-city" placeholder="e.g., Charleston" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-state" placeholder="e.g., South Carolina" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={4}
                        data-testid="input-description"
                        placeholder="Provide a compelling description of the tour destination..."
                      />
                    </FormControl>
                    <FormDescription>
                      Provide a compelling description of the tour
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="highlights"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Highlights</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value?.join("\n") || ""}
                        onChange={(e) => {
                          const highlights = e.target.value
                            .split("\n")
                            .filter((line) => line.trim() !== "");
                          field.onChange(highlights);
                        }}
                        rows={6}
                        data-testid="input-highlights"
                        placeholder="Tour historic sites&#10;Visit museums&#10;Experience local cuisine&#10;Explore nature trails&#10;Shop at local markets&#10;Attend cultural events"
                      />
                    </FormControl>
                    <FormDescription>
                      Enter one highlight per line (6 recommended)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., April 27, 2026"
                          data-testid="input-start-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., May 3, 2026"
                          data-testid="input-end-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="maxParticipants"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Participants</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          data-testid="input-max-participants"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currentParticipants"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Participants</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          data-testid="input-current-participants"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="/api/images/state.png"
                        data-testid="input-image-url"
                      />
                    </FormControl>
                    <FormDescription>
                      Use format: /api/images/statename.png (lowercase, no spaces)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  data-testid="button-create"
                >
                  {createMutation.isPending ? "Creating..." : "Create Tour"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/admin/tours")}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
