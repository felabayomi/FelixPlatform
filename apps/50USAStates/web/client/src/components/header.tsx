import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Map, Archive, ExternalLink } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { Link, useLocation } from "wouter";
import logoSrc from "/logo.png";

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isHome = location === "/";

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        isScrolled
          ? "bg-background/95 backdrop-blur-sm border-b shadow-sm"
          : "bg-background/90 backdrop-blur-sm border-b"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-14 gap-4">
          <Link href="/" className="flex items-center gap-2.5 hover-elevate rounded-md px-2 py-1 -mx-2 shrink-0">
            <img
              src={logoSrc}
              alt="Expedition America"
              className="h-9 w-auto object-contain"
              data-testid="img-header-logo"
            />
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold text-foreground tracking-tight">Expedition America</span>
              <span className="text-xs text-muted-foreground tracking-wide uppercase">Dispatch</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {!isHome && (
              <Link href="/">
                <Button variant="ghost" size="sm" data-testid="button-nav-home">
                  Home
                </Button>
              </Link>
            )}
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-1.5" data-testid="button-nav-states">
                <Map className="h-3.5 w-3.5" />
                All 50 States
              </Button>
            </Link>
            <Link href="/archive">
              <Button variant="ghost" size="sm" className="gap-1.5" data-testid="button-nav-archive">
                <Archive className="h-3.5 w-3.5" />
                Archive
              </Button>
            </Link>
            <a href="https://web.live-loop.live/" target="_blank" rel="noopener noreferrer" data-testid="link-nav-liveloop">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <ExternalLink className="h-3.5 w-3.5" />
                LiveLoop
              </Button>
            </a>
            <ThemeToggle />
          </nav>

          <div className="flex items-center gap-1 md:hidden">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(!mobileOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t py-3">
            <nav className="flex flex-col gap-1">
              <Link href="/">
                <Button variant="ghost" size="sm" className="justify-start w-full" onClick={() => setMobileOpen(false)}>
                  Home
                </Button>
              </Link>
              <Link href="/">
                <Button variant="ghost" size="sm" className="justify-start w-full gap-1.5" onClick={() => setMobileOpen(false)}>
                  <Map className="h-3.5 w-3.5" />
                  All 50 States
                </Button>
              </Link>
              <Link href="/archive">
                <Button variant="ghost" size="sm" className="justify-start w-full gap-1.5" onClick={() => setMobileOpen(false)}>
                  <Archive className="h-3.5 w-3.5" />
                  Archive
                </Button>
              </Link>
              <a href="https://web.live-loop.live/" target="_blank" rel="noopener noreferrer" className="w-full" data-testid="link-mobile-liveloop">
                <Button variant="ghost" size="sm" className="justify-start w-full gap-1.5" onClick={() => setMobileOpen(false)}>
                  <ExternalLink className="h-3.5 w-3.5" />
                  LiveLoop
                </Button>
              </a>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
