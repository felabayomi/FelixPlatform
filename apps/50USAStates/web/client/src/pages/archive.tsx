import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/header";
import { SiteFooter } from "@/components/site-footer";
import type { Article } from "@shared/schema";
import { ARTICLE_CATEGORIES } from "@shared/schema";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Compass,
  Loader2,
  CalendarDays,
  X,
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

function formatDisplayDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}

function formatShortDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

// ── Mini calendar ──────────────────────────────────────────────────
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function MiniCalendar({
  year, month, selectedDate, activeDates, onDateSelect, onMonthChange,
}: {
  year: number;
  month: number;
  selectedDate: string | null;
  activeDates: Set<string>;
  onDateSelect: (d: string | null) => void;
  onMonthChange: (y: number, m: number) => void;
}) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prev = () => {
    if (month === 0) onMonthChange(year - 1, 11);
    else onMonthChange(year, month - 1);
  };
  const next = () => {
    if (month === 11) onMonthChange(year + 1, 0);
    else onMonthChange(year, month + 1);
  };

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="rounded-md border bg-card p-3 select-none">
      <div className="flex items-center justify-between mb-3">
        <Button size="icon" variant="ghost" onClick={prev} data-testid="button-cal-prev">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-semibold">{MONTHS[month]} {year}</span>
        <Button size="icon" variant="ghost" onClick={next} data-testid="button-cal-next">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs text-muted-foreground font-medium py-0.5">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const hasArticles = activeDates.has(dateStr);
          const isSelected = selectedDate === dateStr;
          return (
            <button
              key={i}
              onClick={() => onDateSelect(isSelected ? null : dateStr)}
              data-testid={`cal-day-${dateStr}`}
              className={[
                "relative w-full aspect-square flex flex-col items-center justify-center rounded-md text-xs transition-colors",
                isSelected
                  ? "bg-primary text-primary-foreground font-semibold"
                  : hasArticles
                  ? "hover-elevate font-medium text-foreground cursor-pointer"
                  : "text-muted-foreground/50 cursor-default",
              ].join(" ")}
              disabled={!hasArticles && !isSelected}
            >
              {day}
              {hasArticles && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Archive page ───────────────────────────────────────────────────
export default function ArchivePage() {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());

  const { data: articles = [], isLoading } = useQuery<Article[]>({
    queryKey: ["/api/articles"],
  });

  const activeDates = useMemo(
    () => new Set(articles.map(a => a.publishedDate)),
    [articles],
  );

  const filtered = useMemo(() => {
    let list = [...articles];
    if (selectedDate) list = list.filter(a => a.publishedDate === selectedDate);
    if (selectedCategory !== "all") list = list.filter(a => a.category === selectedCategory);
    return list.sort((a, b) =>
      new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime()
    );
  }, [articles, selectedDate, selectedCategory]);

  const grouped = useMemo(() => {
    const map = new Map<string, Article[]>();
    for (const a of filtered) {
      const arr = map.get(a.publishedDate) ?? [];
      arr.push(a);
      map.set(a.publishedDate, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  const usedCategories = useMemo(
    () => Array.from(new Set(articles.map(a => a.category))).sort(),
    [articles],
  );

  const clearFilters = () => {
    setSelectedDate(null);
    setSelectedCategory("all");
  };

  const hasFilters = selectedDate !== null || selectedCategory !== "all";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 pt-20 pb-16">
        <div className="max-w-6xl mx-auto px-6">

          {/* Page header */}
          <div className="py-8 border-b mb-8">
            <div className="flex items-center gap-2 mb-1">
              <CalendarDays className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Expedition Archive</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Browse every dispatch by date and category.
              {articles.length > 0 && (
                <> {articles.length} total article{articles.length !== 1 ? "s" : ""} across {activeDates.size} day{activeDates.size !== 1 ? "s" : ""}.</>
              )}
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">

            {/* Sidebar */}
            <aside className="lg:w-64 shrink-0 space-y-5">
              {/* Calendar */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Filter by Date</p>
                <MiniCalendar
                  year={calYear}
                  month={calMonth}
                  selectedDate={selectedDate}
                  activeDates={activeDates}
                  onDateSelect={setSelectedDate}
                  onMonthChange={(y, m) => { setCalYear(y); setCalMonth(m); }}
                />
                {selectedDate && (
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                    data-testid="button-clear-date"
                  >
                    <X className="h-3 w-3" /> Clear date
                  </button>
                )}
              </div>

              {/* Category filter */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Filter by Category</p>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => setSelectedCategory("all")}
                    data-testid="button-cat-all"
                    className={[
                      "text-left text-sm px-3 py-1.5 rounded-md transition-colors",
                      selectedCategory === "all"
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-muted-foreground hover-elevate",
                    ].join(" ")}
                  >
                    All categories
                  </button>
                  {usedCategories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      data-testid={`button-cat-${cat}`}
                      className={[
                        "text-left text-sm px-3 py-1.5 rounded-md transition-colors",
                        selectedCategory === cat
                          ? "bg-primary text-primary-foreground font-medium"
                          : "text-muted-foreground hover-elevate",
                      ].join(" ")}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                  data-testid="button-clear-all"
                >
                  <X className="h-3 w-3" /> Clear all filters
                </button>
              )}
            </aside>

            {/* Article list */}
            <div className="flex-1 min-w-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-24">
                  <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
                </div>
              ) : grouped.length === 0 ? (
                <div className="text-center py-24 text-muted-foreground">
                  <Compass className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="font-medium text-foreground mb-1">No dispatches found</p>
                  <p className="text-sm">
                    {hasFilters ? "Try adjusting your filters." : "No articles have been published yet."}
                  </p>
                  {hasFilters && (
                    <button onClick={clearFilters} className="mt-3 text-sm text-primary hover:underline">
                      Clear filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-8">
                  {grouped.map(([date, dayArticles]) => (
                    <div key={date}>
                      {/* Date header */}
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className={[
                            "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold",
                            date === today
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground",
                          ].join(" ")}
                          data-testid={`date-group-${date}`}
                        >
                          <CalendarDays className="h-3.5 w-3.5" />
                          {date === today ? "Today — " : ""}{formatDisplayDate(date)}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {dayArticles.length} dispatch{dayArticles.length !== 1 ? "es" : ""}
                        </span>
                      </div>

                      {/* Articles grid */}
                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {dayArticles.map(article => (
                          <Link key={article.id} href={`/articles/${article.id}`}>
                            <Card className="h-full hover-elevate cursor-pointer" data-testid={`archive-card-${article.id}`}>
                              {article.imageUrl && (
                                <div className="rounded-t-md overflow-hidden h-36">
                                  <img
                                    src={article.imageUrl}
                                    alt={article.title}
                                    className="w-full h-full object-cover"
                                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                                  />
                                </div>
                              )}
                              <CardHeader className="pb-2 pt-3">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge
                                    variant="secondary"
                                    className={`text-xs shrink-0 no-default-active-elevate ${CATEGORY_COLORS[article.category] || "bg-gray-100 text-gray-800"}`}
                                  >
                                    {article.category}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <MapPin className="h-3 w-3 text-primary" />
                                    {article.stateCode}
                                  </span>
                                </div>
                                <CardTitle className="text-sm leading-snug mt-2 line-clamp-2">
                                  {article.title}
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">{article.city}</p>
                              </CardHeader>
                              <CardContent>
                                <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                                  {article.summary}
                                </p>
                              </CardContent>
                            </Card>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
