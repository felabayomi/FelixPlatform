import { useState } from "react";
import { Link } from "wouter";
import { Calendar, X, Loader2, ExternalLink } from "lucide-react";
import logoSrc from "/logo.png";
import liveloopLogoSrc from "/liveloop-logo.png";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function SiteFooter() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const handleOpen = () => {
    setLoaded(false);
    setOpen(true);
  };

  return (
    <>
      <footer className="border-t py-10 bg-muted/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            <div>
              <Link href="/">
                <img src={logoSrc} alt="Expedition America" className="h-10 w-auto object-contain mb-3" />
              </Link>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Daily expert travel and tourism dispatches across all 50 United States. Rediscovering America, one story at a time.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Explore</h3>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><Link href="/"><span className="hover:text-foreground transition-colors cursor-pointer">Today's Dispatches</span></Link></li>
                <li><Link href="/archive"><span className="hover:text-foreground transition-colors cursor-pointer">Archive</span></Link></li>
                <li><Link href="/state/NY"><span className="hover:text-foreground transition-colors cursor-pointer">All 50 States</span></Link></li>
              </ul>

              <div className="mt-6">
                <h3 className="text-sm font-semibold text-foreground mb-2">Part of the Ecosystem</h3>
                <a
                  href="https://web.live-loop.live/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-start gap-3 group hover-elevate rounded-md p-2 -mx-2"
                  data-testid="link-footer-liveloop"
                >
                  <img src={liveloopLogoSrc} alt="LiveLoop" className="h-16 w-16 object-contain shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-foreground flex items-center gap-1">
                      LiveLoop
                      <ExternalLink className="h-2.5 w-2.5 text-muted-foreground" />
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                      What's happening right now in any city?
                    </p>
                  </div>
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Have a Story for Us?</h3>
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                Got a newsworthy event, destination, or travel story worth sharing? Schedule a call with our editorial team — we'd love to hear it.
              </p>
              <Button
                size="sm"
                className="gap-2"
                onClick={handleOpen}
                data-testid="button-pitch-story"
              >
                <Calendar className="h-3.5 w-3.5" />
                Schedule a Call
              </Button>
            </div>
          </div>

          <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 flex-wrap">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Expedition America. All rights reserved.
            </p>
            <Link href="/admin">
              <span className="text-xs text-muted-foreground/40 hover:text-muted-foreground/70 cursor-pointer transition-colors">
                Admin
              </span>
            </Link>
          </div>
        </div>
      </footer>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl w-full p-0 overflow-hidden" data-testid="dialog-appointment">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <DialogTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4 text-primary" />
                  Schedule a Call with Our Editorial Team
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Tell us about your story — we'll be in touch to discuss whether it's a fit for Expedition America.
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setOpen(false)}
                data-testid="button-close-appointment"
                className="shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="relative w-full" style={{ height: "600px" }}>
            {!loaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-sm">Loading calendar...</span>
                </div>
              </div>
            )}
            <iframe
              src="https://appointment.expeditionamerica.us/"
              title="Schedule an appointment"
              className="w-full h-full border-0"
              onLoad={() => setLoaded(true)}
              data-testid="iframe-appointment"
              allow="camera; microphone"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
