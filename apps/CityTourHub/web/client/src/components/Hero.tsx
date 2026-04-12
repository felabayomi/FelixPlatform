import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import heroImage from "@assets/generated_images/American_cityscape_hero_panorama_5758d44c.png";

export default function Hero() {
  const scrollToTours = () => {
    const toursSection = document.getElementById("tours-section");
    toursSection?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="relative h-[600px] w-full overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/60" />
      </div>
      
      <div className="relative h-full flex items-center justify-center px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="flex items-center justify-center gap-2 text-white/90">
            <MapPin className="w-5 h-5" />
            <span className="text-sm font-medium tracking-wide uppercase">Expedition America Travel Co.</span>
          </div>
          
          <h1 className="text-5xl lg:text-6xl font-bold text-white">
            Discover America's Hidden Gems
          </h1>
          
          <p className="text-xl lg:text-2xl text-white/90 max-w-2xl mx-auto">
            Join curated group tours to explore cities with local experts and uncover the heart of each destination
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button 
              size="lg" 
              onClick={scrollToTours}
              className="bg-primary text-primary-foreground border border-primary-border hover-elevate active-elevate-2"
              data-testid="button-browse-tours"
            >
              Browse Tours
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              asChild
              className="bg-background/20 backdrop-blur-sm text-white border-white/30 hover-elevate active-elevate-2"
              data-testid="button-learn-more"
            >
              <a href="https://citydiscoverer.guide/" target="_blank" rel="noopener noreferrer">
                Learn More
              </a>
            </Button>
          </div>
          
          <p className="text-sm text-white/80 pt-2">
            500+ travelers joined in 2024
          </p>
        </div>
      </div>
    </div>
  );
}
