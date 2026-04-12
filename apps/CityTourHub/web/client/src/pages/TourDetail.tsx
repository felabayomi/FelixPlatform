import { useParams, useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SignupForm from "@/components/SignupForm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { type InsertSignup, type Tour } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function parseTourDate(dateStr: string): Date {
  return new Date(dateStr);
}

export default function TourDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: tour, isLoading } = useQuery<Tour>({
    queryKey: ["/api/tours", params.id],
  });

  const { data: allTours = [] } = useQuery<Tour[]>({
    queryKey: ["/api/tours"],
  });

  const sortedTours = [...allTours].sort(
    (a, b) => parseTourDate(a.startDate).getTime() - parseTourDate(b.startDate).getTime()
  );

  const currentIndex = sortedTours.findIndex((t) => t.id === params.id);
  const prevTour = currentIndex > 0 ? sortedTours[currentIndex - 1] : null;
  const nextTour = currentIndex < sortedTours.length - 1 ? sortedTours[currentIndex + 1] : null;

  const signupMutation = useMutation({
    mutationFn: async (data: InsertSignup) => {
      return await apiRequest("POST", "/api/signups", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tours"] });
      setLocation(`/confirmation?tour=${tour?.city || "your selected city"}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Unable to complete registration. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">
          <div className="h-[400px] bg-muted animate-pulse" />
          <div className="py-12">
            <div className="max-w-7xl mx-auto px-4 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <div className="h-40 bg-muted animate-pulse rounded" />
                  <div className="h-60 bg-muted animate-pulse rounded" />
                </div>
                <div className="lg:col-span-1">
                  <div className="h-96 bg-muted animate-pulse rounded" />
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold">Tour Not Found</h1>
            <p className="text-muted-foreground">The tour you're looking for doesn't exist.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const spotsLeft = tour.maxParticipants - tour.currentParticipants;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1">
        <div className="relative h-[400px] w-full overflow-hidden">
          <img
            src={tour.imageUrl}
            alt={`${tour.city}, ${tour.state}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center gap-2 text-white/90 mb-2">
                <MapPin className="w-5 h-5" />
                <span className="font-medium">{tour.state}</span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold text-white mb-4" data-testid="text-tour-title">
                {tour.city}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-white/90">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span>{tour.startDate} - {tour.endDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span>{tour.currentParticipants}/{tour.maxParticipants} participants</span>
                </div>
                {spotsLeft <= 5 && (
                  <Badge className="bg-destructive text-destructive-foreground">
                    Only {spotsLeft} spots left!
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tour Navigation Bar */}
        <div className="border-b bg-background/95 backdrop-blur-sm sticky top-16 z-40">
          <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!prevTour}
                onClick={() => prevTour && setLocation(`/tour/${prevTour.id}`)}
                data-testid="button-prev-tour"
                className="flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline truncate max-w-[120px]">
                  {prevTour ? prevTour.city : "Previous"}
                </span>
              </Button>

              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {currentIndex + 1} of {sortedTours.length}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={!nextTour}
                onClick={() => nextTour && setLocation(`/tour/${nextTour.id}`)}
                data-testid="button-next-tour"
                className="flex items-center gap-1"
              >
                <span className="hidden sm:inline truncate max-w-[120px]">
                  {nextTour ? nextTour.city : "Next"}
                </span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Jump to:</span>
              <Select
                value={params.id}
                onValueChange={(id) => setLocation(`/tour/${id}`)}
              >
                <SelectTrigger className="w-[200px]" data-testid="select-jump-to-tour">
                  <SelectValue placeholder="Select a city" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {sortedTours.map((t) => (
                    <SelectItem key={t.id} value={t.id} data-testid={`option-tour-${t.id}`}>
                      {t.city}, {t.state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="py-12">
          <div className="max-w-7xl mx-auto px-4 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <section>
                  <h2 className="text-3xl font-semibold mb-4">About This Tour</h2>
                  <p className="text-lg text-muted-foreground leading-relaxed" data-testid="text-tour-description">
                    {tour.description}
                  </p>
                </section>

                <section>
                  <h2 className="text-3xl font-semibold mb-4">Tour Highlights</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {tour.highlights.map((highlight, index) => (
                      <div key={index} className="flex items-start gap-3" data-testid={`highlight-${index}`}>
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-muted-foreground">{highlight}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h2 className="text-3xl font-semibold mb-4">Tour Details</h2>
                  <Card>
                    <CardContent className="p-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold mb-2">Duration</h4>
                          <p className="text-muted-foreground">
                            {tour.startDate} - {tour.endDate}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Group Size</h4>
                          <p className="text-muted-foreground">
                            Maximum {tour.maxParticipants} participants
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Meeting Point</h4>
                          <p className="text-muted-foreground">
                            Details provided after registration
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Difficulty</h4>
                          <p className="text-muted-foreground">
                            Moderate walking required
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </section>
              </div>

              <div className="lg:col-span-1">
                <div className="sticky top-32">
                  <Card>
                    <CardContent className="p-6">
                      <SignupForm
                        tourId={tour.id}
                        onSubmit={(data) => signupMutation.mutate(data)}
                        isPending={signupMutation.isPending}
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
