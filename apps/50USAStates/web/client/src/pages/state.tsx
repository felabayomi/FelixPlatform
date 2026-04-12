import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/header";
import { SiteFooter } from "@/components/site-footer";
import { buildApiUrl } from "@/lib/queryClient";
import type { Article } from "@shared/schema";
import { US_STATES } from "@shared/schema";
import {
  ArrowLeft,
  Clock,
  MapPin,
  Loader2,
  Compass,
  Star,
} from "lucide-react";

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

export default function StatePage() {
  const [, params] = useRoute("/state/:code");
  const stateCode = params?.code?.toUpperCase() || "";
  const stateInfo = US_STATES.find(s => s.code === stateCode);

  const { data: articles = [], isLoading } = useQuery<Article[]>({
    queryKey: ["/api/articles/state", stateCode],
    queryFn: () => fetch(buildApiUrl(`/api/articles/state/${stateCode}`)).then(r => r.json()),
    enabled: !!stateCode,
  });

  if (!stateInfo) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground">
          <Compass className="h-12 w-12 opacity-25" />
          <p className="font-medium">State not found</p>
          <Link href="/">
            <span className="text-sm text-primary underline cursor-pointer">Back to Expedition</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="mb-6">
            <Link href="/">
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                <ArrowLeft className="h-4 w-4" />
                All States
              </span>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">{stateInfo.name}</h1>
            <p className="text-muted-foreground mt-1">
              {isLoading ? "..." : `${articles.length} travel dispatch${articles.length !== 1 ? "es" : ""}`}
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Compass className="h-10 w-10 mx-auto mb-3 opacity-25" />
              <p className="font-medium mb-1">No dispatches yet for {stateInfo.name}</p>
              <p className="text-sm">Check back soon — dispatches are published daily.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {articles.map((article) => (
                <Link key={article.id} href={`/articles/${article.id}`}>
                  <Card className="hover-elevate cursor-pointer" data-testid={`card-state-article-${article.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge
                          className={`text-xs no-default-active-elevate ${CATEGORY_COLORS[article.category] || "bg-gray-100 text-gray-800"}`}
                          variant="secondary"
                        >
                          {article.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(article.createdAt)}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-primary" />
                          {article.city}
                        </span>
                      </div>
                      <CardTitle className="text-base leading-snug mt-2">{article.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-3">
                        {article.summary}
                      </p>
                      {article.highlights.length > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
                          <Star className="h-3 w-3" />
                          {article.highlights.length} expedition highlights
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
