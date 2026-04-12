import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/header";
import { SiteFooter } from "@/components/site-footer";
import type { Article } from "@shared/schema";
import { US_STATES } from "@shared/schema";
import {
  Compass,
  MapPin,
  Clock,
  Star,
  Globe,
  Loader2,
  ChevronRight,
  Mountain,
  Zap,
  Newspaper,
} from "lucide-react";

const STATE_NAME_COLORS: Record<string, string> = {
  AL: "#9B2335", AK: "#1A237E", AZ: "#0066CC", AR: "#BB1430", CA: "#003DA5",
  CO: "#BF1924", CT: "#4169E1", DE: "#5B8DB8", FL: "#E03C31", GA: "#BA0C2F",
  HI: "#CC0000", ID: "#003087", IL: "#003DA5", IN: "#002868", IA: "#CC2936",
  KS: "#003DA5", KY: "#003DA5", LA: "#003DA5", ME: "#016B6C", MD: "#CC0000",
  MA: "#9E1B34", MI: "#003DA5", MN: "#0075B0", MS: "#003DA5", MO: "#C41E3A",
  MT: "#003087", NE: "#003087", NV: "#5B5EA6", NH: "#003DA5", NJ: "#003087",
  NM: "#CC2200", NY: "#003087", NC: "#C41E3A", ND: "#002868", OH: "#BB0000",
  OK: "#007A33", OR: "#003087", PA: "#003DA5", RI: "#003087", SC: "#4B0082",
  SD: "#0075B0", TN: "#CC0000", TX: "#BF0A30", UT: "#003DA5", VT: "#228B22",
  VA: "#003DA5", WA: "#005C35", WV: "#9B7B24", WI: "#003087", WY: "#003DA5",
};

const CATEGORY_COLORS: Record<string, string> = {
  "Events & Festivals": "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  "Natural Wonders": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  "Food & Culture": "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  "History & Heritage": "bg-stone-100 text-stone-800 dark:bg-stone-800/40 dark:text-stone-300",
  "Adventure & Outdoors": "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",
  "Arts & Entertainment": "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
  "Hidden Gems": "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300",
  "Seasonal Highlights": "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
};

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getTodayFormatted() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
    timeZone: "America/New_York",
  });
}

interface StateStatus {
  code: string;
  name: string;
  hasToday: boolean;
  latestArticle: { id: string; title: string; category: string; city: string } | null;
}

export default function Home() {
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const { data: articles = [], isLoading: articlesLoading } = useQuery<Article[]>({
    queryKey: ["/api/articles"],
  });

  const { data: stateStatus = [], isLoading: statesLoading } = useQuery<StateStatus[]>({
    queryKey: ["/api/articles/states"],
  });

  // Eastern Time is canonical — the site "resets" at midnight ET
  const todayET = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const todayArticles = articles.filter(a => a.publishedDate === todayET);
  const pastArticles = articles.filter(a => a.publishedDate < todayET);
  const statesWithNews = stateStatus.filter(s => s.latestArticle != null).length;

  const categories = Array.from(new Set(todayArticles.map(a => a.category)));
  const filteredArticles = activeFilter === "all"
    ? todayArticles
    : todayArticles.filter(a => a.category === activeFilter);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Hero */}
      <section className="relative pt-24 pb-14 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(135deg, hsl(220 65% 30% / 0.06) 0%, transparent 60%, hsl(36 85% 50% / 0.05) 100%)",
          }}
        />
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3 flex items-center gap-2">
              <Compass className="h-3.5 w-3.5" />
              {getTodayFormatted()}
            </p>
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4 leading-tight text-foreground">
              Rediscover America
              <span className="block text-primary mt-1">One State at a Time</span>
            </h1>
            <p className="text-base text-muted-foreground max-w-2xl leading-relaxed mb-6">
              Daily expert travel and tourism dispatches from across all 50 United States —
              uncovering the festivals, natural wonders, hidden gems, culinary scenes, and adventures
              that make America endlessly worth exploring.
            </p>

            {/* Stats */}
            <div className="flex items-center gap-6 flex-wrap">
              {[
                { icon: Globe, label: "States with stories", value: `${statesWithNews}` },
                { icon: Newspaper, label: "Today's dispatches", value: `${todayArticles.length}` },
                { icon: Mountain, label: "Total dispatches", value: `${articles.length}` },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <span className="text-sm font-bold text-foreground">{value} </span>
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Today's Dispatches */}
      {(articlesLoading || todayArticles.length > 0) && (
        <section className="py-10 border-t">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">Today's Expedition</h2>
                {!articlesLoading && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {todayArticles.length} travel stor{todayArticles.length !== 1 ? "ies" : "y"} published today
                  </p>
                )}
              </div>

              {categories.length > 1 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setActiveFilter("all")}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                      activeFilter === "all"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover-elevate"
                    }`}
                    data-testid="filter-all"
                  >
                    All
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveFilter(cat)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                        activeFilter === cat
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground border-border hover-elevate"
                      }`}
                      data-testid={`filter-${cat.replace(/\s+/g, "-")}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {articlesLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-3 bg-muted rounded w-1/3 mb-2" />
                      <div className="h-4 bg-muted rounded w-4/5" />
                      <div className="h-4 bg-muted rounded w-3/5 mt-1" />
                    </CardHeader>
                    <CardContent>
                      <div className="h-3 bg-muted rounded mb-2" />
                      <div className="h-3 bg-muted rounded w-5/6" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Compass className="h-10 w-10 mx-auto mb-3 opacity-25" />
                <p className="font-medium mb-1">No stories for this category today</p>
                <button
                  onClick={() => setActiveFilter("all")}
                  className="text-sm text-primary hover:underline cursor-pointer"
                >
                  View all categories
                </button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredArticles.map((article) => (
                  <Link key={article.id} href={`/articles/${article.id}`}>
                    <Card className="h-full hover-elevate cursor-pointer" data-testid={`card-article-${article.id}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <Badge
                            className={`text-xs shrink-0 no-default-active-elevate ${CATEGORY_COLORS[article.category] || "bg-gray-100 text-gray-800 dark:bg-gray-800/40 dark:text-gray-300"}`}
                            variant="secondary"
                          >
                            {article.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                            <MapPin className="h-3 w-3" />
                            {article.stateCode}
                          </span>
                        </div>
                        <CardTitle className="text-sm leading-snug mt-2 line-clamp-2 text-foreground">
                          {article.title}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 text-primary" />
                          {article.city}, {article.stateName}
                        </p>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                          {article.summary}
                        </p>
                        {article.highlights.length > 0 && (
                          <div className="mt-3 flex items-center gap-1.5 text-xs text-primary font-medium">
                            <Star className="h-3 w-3" />
                            {article.highlights.length} highlights
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Explore All 50 States */}
      <section className="py-10 border-t">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground">Explore All 50 States</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Click any state to read its latest travel dispatch
            </p>
          </div>

          {statesLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {Array.from({ length: 50 }).map((_, i) => (
                <div key={i} className="h-20 rounded-md bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {US_STATES.map((state) => {
                const status = stateStatus.find(s => s.code === state.code);
                const latestArticle = status?.latestArticle;
                const hasNews = !!latestArticle;

                return (
                  <Link
                    key={state.code}
                    href={`/state/${state.code}`}
                  >
                    <div
                      className={`hover-elevate cursor-pointer rounded-md p-3 border transition-colors ${
                        hasNews ? "bg-card border-border" : "bg-muted/40 border-border/50"
                      }`}
                      data-testid={`state-card-${state.code}`}
                    >
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <span className="text-sm font-bold text-foreground">{state.code}</span>
                        {hasNews && (
                          <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-0.5" />
                        )}
                      </div>
                      <p
                        className="text-xs leading-tight font-medium"
                        style={{ color: STATE_NAME_COLORS[state.code] }}
                      >
                        {state.name}
                      </p>
                      {latestArticle ? (
                        <p className="text-xs text-primary mt-1 leading-tight line-clamp-1 font-medium">
                          {latestArticle.city}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground/50 mt-1">No story yet</p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {!statesLoading && statesWithNews === 0 && (
            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-2 text-sm text-muted-foreground bg-muted/60 border border-border rounded-md px-4 py-3">
                <Zap className="h-4 w-4 text-primary" />
                <span>No stories published yet. Use the <Link href="/admin"><span className="text-primary underline cursor-pointer">admin panel</span></Link> to generate today's dispatches.</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Past Dispatches */}
      {pastArticles.length > 0 && (
        <section className="py-10 border-t">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
              <div>
                <h2 className="text-xl font-bold text-foreground">Past Dispatches</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Previously published expedition reports</p>
              </div>
              <Link href="/archive">
                <Button variant="outline" size="sm" className="gap-1.5" data-testid="button-view-archive">
                  <ChevronRight className="h-3.5 w-3.5" />
                  Full Archive
                </Button>
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pastArticles.slice(0, 6).map((article) => (
                <Link key={article.id} href={`/articles/${article.id}`}>
                  <Card className="h-full hover-elevate cursor-pointer" data-testid={`card-past-${article.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <Badge
                          className={`text-xs shrink-0 no-default-active-elevate ${CATEGORY_COLORS[article.category] || "bg-gray-100 text-gray-800 dark:bg-gray-800/40 dark:text-gray-300"}`}
                          variant="secondary"
                        >
                          {article.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(article.createdAt)}
                        </span>
                      </div>
                      <CardTitle className="text-sm leading-snug mt-2 line-clamp-2">{article.title}</CardTitle>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 text-primary" />
                        {article.city}, {article.stateName}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{article.summary}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Empty state — no content at all */}
      {!articlesLoading && articles.length === 0 && (
        <section className="flex-1 flex items-center justify-center py-20">
          <div className="text-center text-muted-foreground max-w-sm">
            <Compass className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-semibold text-foreground mb-2">The Expedition Awaits</h3>
            <p className="text-sm leading-relaxed mb-4">
              No travel dispatches have been published yet. Visit the admin panel to generate today's news for all 50 states.
            </p>
            <Link href="/admin">
              <span className="text-sm text-primary underline cursor-pointer">Go to Admin Panel</span>
            </Link>
          </div>
        </section>
      )}

      <SiteFooter />
    </div>
  );
}
