import { MapPin, Mail, Phone, Facebook, Instagram } from "lucide-react";
import { RiTwitterXFill } from "react-icons/ri";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Footer() {
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const subscribeMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest("POST", "/api/newsletter", { email });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Successfully subscribed!",
        description: "Check your email for a welcome message.",
      });
      setEmail("");
    },
    onError: (error: Error) => {
      toast({
        title: "Subscription failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      subscribeMutation.mutate(email);
    }
  };

  return (
    <footer className="bg-card border-t mt-auto">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-6 h-6 text-primary" />
              <div className="flex flex-col">
                <span className="font-bold text-lg leading-tight">City Discoverer</span>
                <span className="text-xs text-muted-foreground leading-tight">Group Tours</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Operated by Expedition America Travel Co. Helping travelers discover U.S. cities with freedom and authenticity.
            </p>
            <div className="flex flex-col gap-2">
              <a 
                href="https://expeditionamericatravel.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover-elevate active-elevate-2 px-2 py-1 rounded-md w-fit"
                data-testid="link-expedition-america"
              >
                Expedition America Travel →
              </a>
              <a 
                href="https://travelcenterhub.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover-elevate active-elevate-2 px-2 py-1 rounded-md w-fit"
                data-testid="link-travel-center-hub"
              >
                City Discoverer Travel Centre Hub →
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <nav className="flex flex-col space-y-2">
              <Link href="/tours" className="text-sm text-muted-foreground hover-elevate active-elevate-2 px-2 py-1 rounded-md w-fit" data-testid="link-footer-tours">
                All Tours
              </Link>
              <Link href="/destinations" className="text-sm text-muted-foreground hover-elevate active-elevate-2 px-2 py-1 rounded-md w-fit" data-testid="link-footer-destinations">
                Destinations
              </Link>
              <Link href="/faq" className="text-sm text-muted-foreground hover-elevate active-elevate-2 px-2 py-1 rounded-md w-fit" data-testid="link-footer-faq">
                FAQ
              </Link>
              <Link href="/contact" className="text-sm text-muted-foreground hover-elevate active-elevate-2 px-2 py-1 rounded-md w-fit" data-testid="link-footer-contact">
                Contact
              </Link>
            </nav>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Contact Info</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4" />
                <a href="mailto:discoverercity@gmail.com" className="hover-elevate active-elevate-2 px-1 rounded-md" data-testid="link-email">
                  discoverercity@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4" />
                <span>Mon-Fri, 9am-6pm EST</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Newsletter</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Get updates about new tours and destinations
            </p>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input 
                type="email" 
                placeholder="Your email" 
                className="flex-1"
                data-testid="input-newsletter-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button 
                type="submit" 
                data-testid="button-newsletter-subscribe"
                disabled={subscribeMutation.isPending}
              >
                {subscribeMutation.isPending ? "..." : "Subscribe"}
              </Button>
            </form>
          </div>
        </div>
        
        <div className="border-t mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2024 Expedition America Travel Co. All rights reserved.
          </p>
          
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-muted-foreground hover-elevate active-elevate-2 p-2 rounded-md" data-testid="link-privacy">
              <span className="text-sm">Privacy Policy</span>
            </Link>
            <Link href="/terms" className="text-muted-foreground hover-elevate active-elevate-2 p-2 rounded-md" data-testid="link-terms">
              <span className="text-sm">Terms</span>
            </Link>
            <div className="flex items-center gap-2">
              <a href="https://www.facebook.com/CityDiscoverer/" target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon" data-testid="button-facebook">
                  <Facebook className="w-4 h-4" />
                </Button>
              </a>
              <a href="https://www.instagram.com/citydiscoverer" target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon" data-testid="button-instagram">
                  <Instagram className="w-4 h-4" />
                </Button>
              </a>
              <a href="https://x.com/city_discoverer" target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon" data-testid="button-x">
                  <RiTwitterXFill className="w-4 h-4" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
