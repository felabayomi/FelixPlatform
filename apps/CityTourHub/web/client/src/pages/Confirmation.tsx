import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Mail, Calendar } from "lucide-react";
import { Link, useSearch } from "wouter";

export default function Confirmation() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const tourCity = params.get('tour') || 'your selected city';

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="max-w-3xl mx-auto px-4 lg:px-8">
          <Card>
            <CardContent className="p-8 lg:p-12 text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="w-12 h-12 text-primary" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h1 className="text-3xl lg:text-4xl font-bold" data-testid="text-confirmation-title">
                  Registration Confirmed!
                </h1>
                <p className="text-xl text-muted-foreground">
                  You're all set for the {tourCity} group tour
                </p>
              </div>

              <div className="bg-accent/50 rounded-md p-6 space-y-4">
                <div className="flex items-start gap-3 text-left">
                  <Mail className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Check Your Email</h3>
                    <p className="text-sm text-muted-foreground">
                      We've sent a confirmation email with all the tour details, meeting point information, and what to bring.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 text-left">
                  <Calendar className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">What's Next</h3>
                    <p className="text-sm text-muted-foreground">
                      You'll receive a reminder email one week before the tour starts with final preparations and contact information.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Have questions? Contact us at <a href="mailto:reservations@citydiscoverer.guide" className="text-primary hover:underline">reservations@citydiscoverer.guide</a>
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <Button asChild data-testid="button-back-home">
                    <Link href="/">Back to Home</Link>
                  </Button>
                  <Button asChild variant="outline" data-testid="button-browse-more">
                    <Link href="/tours">Browse More Tours</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
