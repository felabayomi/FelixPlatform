import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminTourSchema, type AdminTour, type Tour } from "@shared/schema";
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

export default function AdminTourEdit() {
  const [, params] = useRoute("/admin/tours/:id/edit");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const API_HOST = (import.meta.env.VITE_API_URL || "https://felix-platform-backend.onrender.com").replace(/\/$/, "");

  const { data: tour, isLoading } = useQuery<Tour>({
    queryKey: ["/api/tours", params?.id],
    enabled: !!params?.id,
  });

  const form = useForm<AdminTour>({
    resolver: zodResolver(adminTourSchema),
    values: tour ? {
      city: tour.city,
      state: tour.state,
      description: tour.description,
      highlights: tour.highlights,
      startDate: tour.startDate,
      endDate: tour.endDate,
      maxParticipants: tour.maxParticipants,
      currentParticipants: tour.currentParticipants,
      imageUrl: tour.imageUrl,
    } : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: AdminTour) => {
      const response = await apiRequest("PATCH", `/api/tours/${params?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tours"] });
      toast({
        title: "Tour updated",
        description: "The tour has been successfully updated.",
      });
      setLocation("/admin/tours");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update tour. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AdminTour) => {
    updateMutation.mutate(data);
  };

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

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading tour...</p>
        </div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Tour not found</p>
        </div>
      </div>
    );
  }

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
          <CardTitle>Edit Tour</CardTitle>
          <CardDescription>
            Update tour details for {tour.city}, {tour.state}
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
                        <Input {...field} data-testid="input-city" />
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
                        <Input {...field} data-testid="input-state" />
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
                  disabled={updateMutation.isPending}
                  data-testid="button-save"
                >
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
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
