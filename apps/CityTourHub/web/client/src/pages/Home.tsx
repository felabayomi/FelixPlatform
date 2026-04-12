import Hero from "@/components/Hero";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TourCard from "@/components/TourCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Users, Calendar, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { type Tour } from "@shared/schema";

export default function Home() {
  const { data: tours = [], isLoading } = useQuery<Tour[]>({
    queryKey: ["/api/tours"],
  });

  const sortedTours = [...tours].sort((a, b) => {
    const dateA = new Date(a.startDate);
    const dateB = new Date(b.startDate);
    return dateA.getTime() - dateB.getTime();
  });

  const featuredTours = sortedTours.slice(0, 3);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <Hero />
      
      <main className="flex-1">
        <section id="tours-section" className="py-12 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 lg:px-8">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl lg:text-4xl font-semibold">Featured Group Tours</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Join small groups of fellow explorers on curated journeys through America's most captivating cities
              </p>
            </div>
            
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="aspect-video bg-muted animate-pulse" />
                    <CardContent className="p-6 space-y-3">
                      <div className="h-8 bg-muted animate-pulse rounded" />
                      <div className="h-20 bg-muted animate-pulse rounded" />
                      <div className="h-10 bg-muted animate-pulse rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {featuredTours.map((tour) => (
                  <TourCard key={tour.id} {...tour} />
                ))}
              </div>
            )}
            
            <div className="text-center mt-12">
              <Button asChild size="lg" variant="outline" data-testid="button-view-all-tours">
                <Link href="/tours">
                  View All Tours
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-12 lg:py-20 bg-card">
          <div className="max-w-7xl mx-auto px-4 lg:px-8">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl lg:text-4xl font-semibold">How It Works</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Three simple steps to your next urban adventure
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Choose Your Destination</h3>
                  <p className="text-muted-foreground">
                    Browse our curated selection of group tours to cities across America. Each destination offers unique experiences and local insights.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Join a Small Group</h3>
                  <p className="text-muted-foreground">
                    Connect with fellow travelers in intimate groups of 16-24 people. Make lasting friendships while exploring together.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Experience the City</h3>
                  <p className="text-muted-foreground">
                    Immerse yourself in local culture, cuisine, and hidden gems guided by experts who know the city inside and out.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-12 lg:py-20">
          <div className="max-w-4xl mx-auto px-4 lg:px-8 text-center space-y-6">
            <h2 className="text-3xl lg:text-4xl font-semibold">Ready to Explore?</h2>
            <p className="text-lg text-muted-foreground">
              Join hundreds of travelers who have discovered America's cities through our curated group tours
            </p>
            <Button asChild size="lg" data-testid="button-browse-all-tours">
              <Link href="/tours">Browse All Tours</Link>
            </Button>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
