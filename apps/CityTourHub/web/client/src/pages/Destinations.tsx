import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { type Tour } from "@shared/schema";
import { Link } from "wouter";
import { MapPin, Calendar, Users, Sparkles } from "lucide-react";

export default function Destinations() {
  const { data: tours = [], isLoading } = useQuery<Tour[]>({
    queryKey: ["/api/tours"],
  });

  const groupedByState = tours.reduce((acc, tour) => {
    if (!acc[tour.state]) {
      acc[tour.state] = [];
    }
    acc[tour.state].push(tour);
    return acc;
  }, {} as Record<string, Tour[]>);

  const states = Object.keys(groupedByState).sort();

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="space-y-4 mb-8">
            <h1 className="text-4xl lg:text-5xl font-bold">Destinations</h1>
            <p className="text-lg text-muted-foreground max-w-3xl">
              Browse tours organized by state. Discover the unique experiences waiting for you in each destination across America.
            </p>
          </div>

          <div className="mb-12 p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Want Personalized Recommendations?
                </h2>
                <p className="text-muted-foreground">
                  Not sure which tour is right for you? Sign up for Local Picks and we'll curate custom recommendations based on your interests!
                </p>
              </div>
              <Button
                size="lg"
                asChild
                className="whitespace-nowrap"
                data-testid="button-local-picks"
              >
                <Link href="/local-picks">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Sign Up for Local Picks
                </Link>
              </Button>
            </div>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="h-8 bg-muted animate-pulse rounded mb-4" />
                    <div className="h-24 bg-muted animate-pulse rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {states.map((state) => {
                const stateTours = groupedByState[state];
                const firstTour = stateTours[0];
                const totalSpots = stateTours.reduce((sum, t) => sum + (t.maxParticipants - t.currentParticipants), 0);
                const uniqueCities = Array.from(new Set(stateTours.map(t => t.city))).join(', ');
                
                return (
                  <Card 
                    key={state} 
                    className="overflow-hidden hover-elevate active-elevate-2 transition-all cursor-pointer group"
                    data-testid={`card-destination-${state.toLowerCase().replace(/\s+/g, '')}`}
                  >
                    <Link href={`/tour/${firstTour.id}`}>
                      <div className="aspect-video relative overflow-hidden">
                        <img 
                          src={`/api/images/${state.toLowerCase().replace(/\s+/g, '')}.png`}
                          alt={`${state} destination`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                        <div className="absolute bottom-3 left-3 right-3">
                          <h3 className="text-xl font-bold text-white mb-1">{state}</h3>
                          <p className="text-sm text-white/90 flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {uniqueCities}
                          </p>
                        </div>
                      </div>
                      <CardContent className="p-6 space-y-3">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{stateTours.length} {stateTours.length === 1 ? 'tour' : 'tours'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{totalSpots} spots available</span>
                          </div>
                        </div>
                        
                        <p className="text-sm line-clamp-2">
                          {firstTour.description}
                        </p>
                      </CardContent>
                    </Link>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
