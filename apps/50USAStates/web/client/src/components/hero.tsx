import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3 } from "lucide-react";
import heroImage from "@assets/generated_images/Campaign_war_room_data_center_98571e50.png";

export function Hero() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/85 to-background/60" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-24 lg:px-8">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
            <BarChart3 className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              Non-Partisan Political Intelligence
            </span>
          </div>

          <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight">
            Data-Driven Intelligence for{" "}
            <span className="text-primary">Political Campaigns</span>
          </h1>

          <p className="text-lg lg:text-xl text-muted-foreground mb-8 max-w-2xl leading-relaxed">
            Professional polling and research services for campaigns across all
            parties. Voter modeling, focus groups, and strategic insights to
            drive campaign success through evidence-based decision making.
          </p>

          <div className="flex flex-wrap gap-4">
            <Button
              size="lg"
              className="gap-2"
              onClick={() => scrollToSection("contact")}
              data-testid="button-schedule-consultation"
            >
              Schedule Consultation
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => scrollToSection("services")}
              data-testid="button-view-services"
            >
              View Services
            </Button>
          </div>

          <div className="mt-12 flex items-center gap-8 text-sm text-muted-foreground">
            <div>
              <div className="text-2xl font-bold text-foreground">500+</div>
              <div>Campaigns Served</div>
            </div>
            <div className="h-12 w-px bg-border" />
            <div>
              <div className="text-2xl font-bold text-foreground">95%</div>
              <div>Client Satisfaction</div>
            </div>
            <div className="h-12 w-px bg-border" />
            <div>
              <div className="text-2xl font-bold text-foreground">20+</div>
              <div>Years Experience</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
