import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { useRef, useState } from "react";
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

function displayDateToIso(value: string): string {
  if (!value) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isoDateToDisplay(value: string): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const [year, month, day] = value.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdminTourNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const API_HOST = (import.meta.env.VITE_API_URL || "https://felix-platform-backend.onrender.com").replace(/\/$/, "");

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
      imageUrl: "/images/American_cityscape_hero_panorama_5758d44c.png",
    },
  });

  const handleUpload = async (file: File) => {
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(`${API_HOST}/api/city-tour-hub/upload-image`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || "Image upload failed");
      }

      const payload = await response.json();
      if (!payload?.url) {
        throw new Error("Upload completed but no image URL was returned");
      }

      form.setValue("imageUrl", payload.url, { shouldDirty: true, shouldValidate: true });
      toast({
        title: "Image uploaded",
        description: payload.storage === "cloudinary"
          ? "Uploaded to Cloudinary and image URL updated."
          : "Uploaded successfully and image URL updated.",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error?.message || "Could not upload image.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

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
                          type="date"
                          value={displayDateToIso(field.value || "")}
                          onChange={(e) => field.onChange(isoDateToDisplay(e.target.value))}
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
                          type="date"
                          value={displayDateToIso(field.value || "")}
                          onChange={(e) => field.onChange(isoDateToDisplay(e.target.value))}
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
                      <div className="space-y-3">
                        <Input
                          {...field}
                          placeholder="/images/state.png or https://res.cloudinary.com/..."
                          data-testid="input-image-url"
                        />
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const selected = e.target.files?.[0];
                            if (selected) {
                              handleUpload(selected);
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isUploading}
                          onClick={() => fileInputRef.current?.click()}
                          data-testid="button-upload-image"
                        >
                          {isUploading ? "Uploading..." : "Upload to Cloudinary"}
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Paste an image URL or upload from your computer. If Cloudinary keys are configured, uploads go to Cloudinary automatically.
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
