import { Button } from "@/components/ui/button";
import { MapPin, Menu, X } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

const ecosystemApps = [
  { label: "LiveLoop", href: "https://apps.apple.com/us/app/live-loop/id6760877693" },
  { label: "EventLoop", href: "https://web.live-loop.live/" },
  { label: "FanLore", href: "https://apps.apple.com/us/app/fanlore/id6760257973" },
  { label: "City Discoverer App", href: "https://apps.apple.com/us/app/city-discoverer-companion/id6759014495" },
  { label: "Itinerary Planner", href: "https://plan.citydiscoverer.ai/" },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 hover-elevate active-elevate-2 px-2 py-1 rounded-md" data-testid="link-home">
            <MapPin className="w-6 h-6 text-primary" />
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-tight">City Discoverer</span>
              <span className="text-xs text-muted-foreground leading-tight">Group Tours</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium hover-elevate active-elevate-2 px-3 py-2 rounded-md" data-testid="link-nav-home">
              Home
            </Link>
            <Link href="/tours" className="text-sm font-medium hover-elevate active-elevate-2 px-3 py-2 rounded-md" data-testid="link-nav-tours">
              All Tours
            </Link>
            <Link href="/destinations" className="text-sm font-medium hover-elevate active-elevate-2 px-3 py-2 rounded-md" data-testid="link-nav-destinations">
              Destinations
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Button asChild variant="outline" className="hidden sm:flex" data-testid="button-book-appointment-header">
              <Link href="/appointment">Book Appointment</Link>
            </Button>
            <Button asChild className="hidden sm:flex" data-testid="button-contact-us-header">
              <Link href="/contact">Contact us</Link>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 pb-2 overflow-x-auto">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">Apps</span>
          {ecosystemApps.map((app) => (
            <a
              key={app.label}
              href={app.href}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-medium px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-primary transition-colors whitespace-nowrap"
              data-testid={`link-app-${app.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {app.label}
            </a>
          ))}
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="flex flex-col px-4 py-4 space-y-2">
            <Link 
              href="/" 
              className="text-sm font-medium hover-elevate active-elevate-2 px-3 py-2 rounded-md"
              onClick={() => setMobileMenuOpen(false)}
              data-testid="link-mobile-home"
            >
              Home
            </Link>
            <Link 
              href="/tours" 
              className="text-sm font-medium hover-elevate active-elevate-2 px-3 py-2 rounded-md"
              onClick={() => setMobileMenuOpen(false)}
              data-testid="link-mobile-tours"
            >
              All Tours
            </Link>
            <Link 
              href="/destinations" 
              className="text-sm font-medium hover-elevate active-elevate-2 px-3 py-2 rounded-md"
              onClick={() => setMobileMenuOpen(false)}
              data-testid="link-mobile-destinations"
            >
              Destinations
            </Link>
            <Link 
              href="/appointment" 
              className="text-sm font-medium hover-elevate active-elevate-2 px-3 py-2 rounded-md"
              onClick={() => setMobileMenuOpen(false)}
              data-testid="link-mobile-appointment"
            >
              Book Appointment
            </Link>
            <Link 
              href="/contact" 
              className="text-sm font-medium hover-elevate active-elevate-2 px-3 py-2 rounded-md"
              onClick={() => setMobileMenuOpen(false)}
              data-testid="link-mobile-contact"
            >
              Contact us
            </Link>

            <div className="pt-3 mt-2 border-t">
              <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Apps</p>
              {ecosystemApps.map((app) => (
                <a
                  key={app.label}
                  href={app.href}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-sm font-medium hover-elevate active-elevate-2 px-3 py-2 rounded-md"
                  data-testid={`link-mobile-app-${app.label.toLowerCase().replace(/\s+/g, "-")}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {app.label}
                </a>
              ))}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
