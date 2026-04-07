import { Button } from "@/components/ui/button";
import { Calendar, Clock, Sparkles } from "lucide-react";

interface HeroProps {
  onBookNow: () => void;
}

export default function Hero({ onBookNow }: HeroProps) {
  return (
    <div className="relative bg-gradient-to-br from-primary/10 via-background to-chart-2/10 overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            Professional Wash, Dry & Fold Service
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground">
            <span className="block">A & F Laundry Service</span>
            <span className="block text-primary mt-2">Schedule Drop-off</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-muted-foreground">
            Convenient drop-off and pickup scheduling. Quality laundry care at $1.50 per pound.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              size="lg" 
              onClick={onBookNow}
              className="text-base sm:text-lg px-8"
              data-testid="button-book-now-hero"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Schedule Now
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-base sm:text-lg px-8"
              data-testid="button-view-pricing"
            >
              View Pricing
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-3xl mx-auto mt-12 pt-12 border-t border-border">
            <div className="flex flex-col items-center gap-2">
              <Calendar className="w-8 h-8 text-primary" />
              <h3 className="font-semibold">Easy Scheduling</h3>
              <p className="text-sm text-muted-foreground">Book 1 day in advance</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Clock className="w-8 h-8 text-primary" />
              <h3 className="font-semibold">Flexible Hours</h3>
              <p className="text-sm text-muted-foreground">9am - 6pm daily</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Sparkles className="w-8 h-8 text-primary" />
              <h3 className="font-semibold">Quality Care</h3>
              <p className="text-sm text-muted-foreground">Wash, dry & fold</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
