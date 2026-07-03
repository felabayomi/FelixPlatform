import { useRef, useState, useEffect } from "react";
import { AdminLogin } from "@/components/admin-login";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Article } from "@shared/schema";
import { US_STATES, ARTICLE_CATEGORIES } from "@shared/schema";
import { apiRequest, buildApiUrl } from "@/lib/queryClient";
import {
  Compass,
  RefreshCw,
  Loader2,
  Zap,
  Globe,
  Clock,
  MapPin,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Settings,
  PenLine,
  Bot,
  Plus,
  X,
  FileText,
  CheckCheck,
  InboxIcon,
  Upload,
  Link2,
  ChevronLeft,
  Save,
  Eye,
  EyeOff,
  Sparkles,
  Copy,
} from "lucide-react";

interface StateStatus {
  code: string;
  name: string;
  hasToday: boolean;
  latestArticle: { id: string; title: string; category: string; city: string } | null;
}

interface GenerationProgress {
  phase: "idle" | "running" | "done" | "error";
  message: string;
  completed: number;
  total: number;
  recentStates: { code: string; name: string; title: string }[];
}

interface SingleGenState {
  [stateCode: string]: "idle" | "working" | "done" | "error";
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const EMPTY_FORM = {
  stateCode: "",
  city: "",
  title: "",
  summary: "",
  content: "",
  category: "",
  highlights: ["", "", "", "", ""],
  sources: ["", "", ""],
};

// ── Full Draft Editor ──────────────────────────────────────────────
function DraftEditor({
  article,
  onBack,
  onSaved,
  onPublished,
}: {
  article: Article;
  onBack: () => void;
  onSaved: (updated: Article) => void;
  onPublished: () => void;
}) {
  const [title, setTitle] = useState(article.title);
  const [city, setCity] = useState(article.city);
  const [stateCode, setStateCode] = useState(article.stateCode);
  const [category, setCategory] = useState(article.category);
  const [summary, setSummary] = useState(article.summary);
  const [content, setContent] = useState(article.content);
  const [highlights, setHighlights] = useState<string[]>(article.highlights.length ? article.highlights : [""]);
  const [sources, setSources] = useState<string[]>(article.sources.length ? article.sources : [""]);
  const [imageUrl, setImageUrl] = useState(article.imageUrl || "");
  const [imageMode, setImageMode] = useState<"url" | "upload">("url");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [previewContent, setPreviewContent] = useState(false);
  const [generatingExcerpt, setGeneratingExcerpt] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleGenerateExcerpt = async () => {
    if (!title.trim() || !content.trim()) {
      toast({ title: "Add a title and content first", variant: "destructive" });
      return;
    }
    setGeneratingExcerpt(true);
    try {
      const stateName = US_STATES.find(s => s.code === stateCode)?.name || stateCode;
      const res = await fetch(buildApiUrl("/api/articles/generate-excerpt"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getStoredToken() || ""}`,
        },
        body: JSON.stringify({ title: title.trim(), content: content.trim(), stateName, city: city.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      const { excerpt } = await res.json();
      setSummary(excerpt);
      toast({ title: "Excerpt generated" });
    } catch {
      toast({ title: "Could not generate excerpt", variant: "destructive" });
    } finally {
      setGeneratingExcerpt(false);
    }
  };

  const buildPayload = () => ({
    title: title.trim(),
    city: city.trim(),
    stateCode,
    stateName: US_STATES.find(s => s.code === stateCode)?.name || stateCode,
    category,
    summary: summary.trim(),
    content: content.trim(),
    highlights: highlights.map(h => h.trim()).filter(Boolean),
    sources: sources.map(s => s.trim()).filter(Boolean),
    imageUrl: imageUrl.trim() || null,
  });

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const authToken = getStoredToken();
      const res = await fetch(buildApiUrl("/api/upload"), {
        method: "POST",
        body: fd,
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      setImageUrl(url);
      toast({ title: "Image uploaded" });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const isPublished = article.status === "published";

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await apiRequest("PATCH", `/api/articles/${article.id}`, buildPayload());
      const updated = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/articles/drafts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/articles/all"] });
      if (isPublished) {
        queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
        queryClient.invalidateQueries({ queryKey: ["/api/articles/states"] });
        toast({ title: "Changes saved", description: "The live article has been updated." });
      } else {
        toast({ title: "Draft saved" });
      }
      onSaved(updated);
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const todayStrET = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await apiRequest("PATCH", `/api/articles/${article.id}`, buildPayload());
      await apiRequest("PATCH", `/api/articles/${article.id}/status`, { status: "published" });
      queryClient.invalidateQueries({ queryKey: ["/api/articles/drafts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/articles/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/articles/states"] });
      toast({ title: "Published!", description: `"${title}" is now live.` });
      onPublished();
    } catch {
      toast({ title: "Publish failed", variant: "destructive" });
    } finally {
      setPublishing(false);
    }
  };

  const handlePublishForToday = async () => {
    setPublishing(true);
    try {
      await apiRequest("PATCH", `/api/articles/${article.id}`, { ...buildPayload(), publishedDate: todayStrET });
      await apiRequest("PATCH", `/api/articles/${article.id}/status`, { status: "published" });
      queryClient.invalidateQueries({ queryKey: ["/api/articles/drafts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/articles/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/articles/states"] });
      toast({ title: "Published for Today!", description: `"${title}" is live and dated today.` });
      onPublished();
    } catch {
      toast({ title: "Publish failed", variant: "destructive" });
    } finally {
      setPublishing(false);
    }
  };

  const updateHighlight = (i: number, val: string) => {
    setHighlights(prev => { const h = [...prev]; h[i] = val; return h; });
  };
  const updateSource = (i: number, val: string) => {
    setSources(prev => { const s = [...prev]; s[i] = val; return s; });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back button */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 -ml-2">
          <ChevronLeft className="h-4 w-4" />
          {isPublished ? "Back to Articles" : "Back to Drafts"}
        </Button>
        <div className="flex items-center gap-2 ml-auto">
          <Badge
            variant={isPublished ? "secondary" : "outline"}
            className={`text-xs no-default-active-elevate ${isPublished ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" : ""}`}
          >
            {isPublished ? "Live" : "Draft"}
          </Badge>
          <span className="text-xs text-muted-foreground">{article.stateCode} · {formatDate(article.createdAt)}</span>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-foreground">
          {isPublished ? "Edit Live Article" : "Review & Edit Draft"}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {isPublished
            ? "Changes save directly to the live article on the public site."
            : "Make any changes you want, then save or publish directly to the public site."}
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-5">

          {/* Image */}
          <div className="space-y-2">
            <Label>Article Image <span className="text-xs font-normal text-muted-foreground">(optional)</span></Label>
            <div className="flex gap-2 mb-2">
              <Button
                size="sm" variant={imageMode === "url" ? "secondary" : "outline"}
                className="gap-1.5" onClick={() => setImageMode("url")}
              >
                <Link2 className="h-3.5 w-3.5" />Image URL
              </Button>
              <Button
                size="sm" variant={imageMode === "upload" ? "secondary" : "outline"}
                className="gap-1.5" onClick={() => setImageMode("upload")}
              >
                <Upload className="h-3.5 w-3.5" />Upload File
              </Button>
            </div>

            {imageMode === "url" && (
              <Input
                placeholder="https://example.com/photo.jpg"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                data-testid="input-image-url"
              />
            )}
            {imageMode === "upload" && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
                  data-testid="input-image-upload"
                />
                <Button
                  variant="outline"
                  className="gap-2 w-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {uploading ? "Uploading..." : "Choose image file (max 10 MB)"}
                </Button>
              </div>
            )}

            {imageUrl && (
              <div className="relative rounded-md overflow-hidden border">
                <img
                  src={imageUrl}
                  alt="Article image preview"
                  className="w-full max-h-52 object-cover"
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <Button
                  size="icon" variant="secondary"
                  className="absolute top-2 right-2 h-7 w-7"
                  onClick={() => setImageUrl("")}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>

          {/* State + City */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>State</Label>
              <Select value={stateCode} onValueChange={setStateCode}>
                <SelectTrigger data-testid="select-edit-state">
                  <SelectValue placeholder="Select state..." />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map(s => (
                    <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Featured City / Region</Label>
              <Input
                placeholder="e.g. New Orleans..."
                value={city}
                onChange={e => setCity(e.target.value)}
                data-testid="input-edit-city"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger data-testid="select-edit-category">
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent>
                {ARTICLE_CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Headline */}
          <div className="space-y-1.5">
            <Label>Headline</Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              data-testid="input-edit-title"
            />
          </div>

          {/* Summary */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label>Opening Hook / Summary</Label>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 h-7 text-xs"
                onClick={handleGenerateExcerpt}
                disabled={generatingExcerpt}
                data-testid="button-generate-excerpt"
              >
                {generatingExcerpt ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                {generatingExcerpt ? "Generating…" : "Generate Excerpt"}
              </Button>
            </div>
            <Textarea
              value={summary}
              onChange={e => setSummary(e.target.value)}
              className="resize-none"
              rows={3}
              data-testid="textarea-edit-summary"
            />
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label>
                Full Article
                <span className="text-xs font-normal text-muted-foreground ml-2">Markdown supported</span>
              </Label>
              <Button
                size="sm" variant="ghost"
                className="gap-1.5 h-7 text-xs"
                onClick={() => setPreviewContent(p => !p)}
              >
                {previewContent ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {previewContent ? "Edit" : "Preview"}
              </Button>
            </div>
            {previewContent ? (
              <div className="border rounded-md p-4 bg-muted/30 min-h-64 max-h-96 overflow-y-auto">
                <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">{content}</pre>
              </div>
            ) : (
              <Textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                className="resize-y font-mono text-xs"
                rows={18}
                data-testid="textarea-edit-content"
              />
            )}
          </div>

          {/* Highlights */}
          <div className="space-y-2">
            <Label>Expedition Highlights <span className="text-xs font-normal text-muted-foreground">(optional)</span></Label>
            <div className="space-y-2">
              {highlights.map((h, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <span className="text-xs text-muted-foreground w-4 shrink-0 text-right">{i + 1}</span>
                  <Input
                    placeholder={`Highlight ${i + 1}...`}
                    value={h}
                    onChange={e => updateHighlight(i, e.target.value)}
                    data-testid={`input-edit-highlight-${i}`}
                  />
                  {highlights.length > 1 && (
                    <Button size="icon" variant="ghost" className="shrink-0"
                      onClick={() => setHighlights(prev => prev.filter((_, idx) => idx !== i))}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="gap-1.5"
              onClick={() => setHighlights(prev => [...prev, ""])}>
              <Plus className="h-3.5 w-3.5" />Add Highlight
            </Button>
          </div>

          {/* Sources */}
          <div className="space-y-2">
            <Label>Sources / References <span className="text-xs font-normal text-muted-foreground">(optional)</span></Label>
            <div className="space-y-2">
              {sources.map((s, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input
                    placeholder="Source name or URL..."
                    value={s}
                    onChange={e => updateSource(i, e.target.value)}
                    data-testid={`input-edit-source-${i}`}
                  />
                  {sources.length > 1 && (
                    <Button size="icon" variant="ghost" className="shrink-0"
                      onClick={() => setSources(prev => prev.filter((_, idx) => idx !== i))}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="gap-1.5"
              onClick={() => setSources(prev => [...prev, ""])}>
              <Plus className="h-3.5 w-3.5" />Add Source
            </Button>
          </div>

          {/* Action buttons */}
          <div className="pt-2 border-t flex items-center gap-3 flex-wrap">
            {isPublished ? (
              <Button
                onClick={handleSave}
                disabled={saving}
                className="gap-2 bg-green-700 hover:bg-green-800 text-white"
                data-testid="button-editor-save-live"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            ) : (
              <>
                <Button
                  onClick={handlePublish}
                  disabled={saving || publishing}
                  className="gap-2"
                  data-testid="button-editor-publish"
                >
                  {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
                  {publishing ? "Publishing..." : "Approve & Publish"}
                </Button>
                {article.publishedDate !== todayStrET && (
                  <Button
                    variant="secondary"
                    onClick={handlePublishForToday}
                    disabled={saving || publishing}
                    className="gap-2"
                    data-testid="button-editor-publish-today"
                  >
                    {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
                    {publishing ? "Publishing..." : "Publish for Today"}
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={handleSave}
                  disabled={saving || publishing}
                  className="gap-2"
                  data-testid="button-editor-save"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? "Saving..." : "Save Draft"}
                </Button>
              </>
            )}
            <Button
              variant="ghost" size="sm"
              onClick={onBack}
              disabled={saving || publishing}
              className="ml-auto"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Draft summary card ─────────────────────────────────────────────
function DraftCard({
  article,
  onEdit,
  onDiscard,
  discarding,
}: {
  article: Article;
  onEdit: () => void;
  onDiscard: () => void;
  discarding: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyExcerpt = () => {
    if (!article.summary) return;
    navigator.clipboard.writeText(article.summary).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Card data-testid={`draft-card-${article.id}`}>
      <CardContent className="pt-4 pb-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start gap-3 flex-wrap">
          {article.imageUrl && (
            <img
              src={article.imageUrl}
              alt=""
              className="w-20 h-16 object-cover rounded-md shrink-0"
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          )}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs shrink-0 no-default-active-elevate">{article.stateCode}</Badge>
              <Badge variant="outline" className="text-xs shrink-0 no-default-active-elevate">{article.category}</Badge>
              <span className="text-xs text-muted-foreground">{article.city}</span>
            </div>
            <h3 className="font-semibold text-foreground text-sm leading-snug">{article.title}</h3>
          </div>
        </div>

        {/* Excerpt block */}
        <div className="rounded-md bg-muted/50 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Excerpt</span>
            {article.summary && (
              <Button
                size="sm"
                variant="ghost"
                className="gap-1 shrink-0"
                onClick={handleCopyExcerpt}
                data-testid={`button-copy-excerpt-${article.id}`}
              >
                {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            )}
          </div>
          {article.summary ? (
            <p className="text-sm text-foreground leading-relaxed" data-testid={`text-excerpt-${article.id}`}>{article.summary}</p>
          ) : (
            <p className="text-xs text-muted-foreground italic">No excerpt yet — open the editor and click "Generate Excerpt".</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm" onClick={onEdit} className="gap-1.5"
            data-testid={`button-edit-${article.id}`}
          >
            <PenLine className="h-3.5 w-3.5" />
            Read &amp; Edit
          </Button>
          <span className="text-xs text-muted-foreground ml-auto">{formatDate(article.createdAt)}</span>
          <Button
            size="sm" variant="ghost"
            onClick={onDiscard}
            disabled={discarding}
            className="gap-1.5 text-muted-foreground"
            data-testid={`button-discard-${article.id}`}
          >
            {discarding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Discard
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── All-articles manage row ─────────────────────────────────────────
function ArticleManageRow({
  article,
  onEdit,
  onDelete,
  deleting,
}: {
  article: Article;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!article.summary) return;
    navigator.clipboard.writeText(article.summary).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="rounded-md border bg-card px-4 py-3 space-y-2" data-testid={`admin-article-${article.id}`}>
      {/* Title row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="text-xs font-semibold shrink-0">{article.stateCode}</span>
          <span className="text-xs font-medium text-foreground truncate">{article.title}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Badge variant={article.status === "published" ? "secondary" : "outline"} className="text-xs no-default-active-elevate">
            {article.status === "published" ? "Live" : "Draft"}
          </Badge>
          <span className="text-xs text-muted-foreground hidden sm:flex items-center gap-1">
            <Clock className="h-3 w-3" />{formatDate(article.createdAt)}
          </span>
          {article.status === "draft" && (
            <button className="text-xs text-amber-600 hover:underline cursor-pointer" onClick={onEdit}>Edit</button>
          )}
          {article.status === "published" && (
            <div className="flex items-center gap-2">
              <button className="text-xs text-amber-600 hover:underline cursor-pointer" onClick={onEdit} data-testid={`button-edit-published-${article.id}`}>Edit</button>
              <Link href={`/articles/${article.id}`}>
                <span className="text-xs text-primary cursor-pointer hover:underline">View</span>
              </Link>
            </div>
          )}
          <Button size="icon" variant="ghost" className="text-muted-foreground"
            onClick={onDelete} disabled={deleting}
            data-testid={`button-delete-${article.id}`}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Excerpt row */}
      {article.summary && (
        <div className="flex items-start gap-2 rounded-md bg-muted/40 px-3 py-2">
          <p className="text-xs text-muted-foreground leading-relaxed flex-1" data-testid={`text-excerpt-manage-${article.id}`}>
            {article.summary}
          </p>
          <Button
            size="sm" variant="ghost"
            className="gap-1 shrink-0 text-xs"
            onClick={handleCopy}
            data-testid={`button-copy-excerpt-manage-${article.id}`}
          >
            {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Move past articles to today panel ────────────────────────────────
function MoveToTodayPanel() {
  const todayET = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const [fromDate, setFromDate] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleMove = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/admin/move-to-today", { fromDate });
      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/articles/drafts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/articles/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/articles/states"] });
      if (data.updated === 0) {
        toast({ title: "No articles found for that date" });
      } else {
        toast({ title: `Moved ${data.updated} article${data.updated !== 1 ? "s" : ""} to today (${data.date})` });
      }
    } catch {
      toast({ title: "Failed to move articles", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4">
      <p className="text-sm font-medium text-foreground mb-1">Move Published Articles to Today</p>
      <p className="text-xs text-muted-foreground mb-3">
        Reschedules all articles from the chosen date to today ({todayET}) and marks them published.
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        <input
          type="date"
          value={fromDate}
          max={todayET}
          onChange={e => setFromDate(e.target.value)}
          data-testid="input-move-from-date"
          aria-label="Choose a date to move into today"
          className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <Button size="sm" onClick={handleMove} disabled={loading || !fromDate || fromDate === todayET} data-testid="button-move-to-today">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
          Move to Today
        </Button>
      </div>
    </Card>
  );
}

// ── Main admin page ────────────────────────────────────────────────
const ADMIN_TOKEN_KEY = "ea_admin_token";

function getStoredToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY) || sessionStorage.getItem(ADMIN_TOKEN_KEY);
}

function AdminContent() {
  const [activeTab, setActiveTab] = useState<"drafts" | "write" | "ai" | "manage">("drafts");
  const [editingDraft, setEditingDraft] = useState<Article | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [discardingId, setDiscardingId] = useState<string | null>(null);

  const [genProgress, setGenProgress] = useState<GenerationProgress>({
    phase: "idle", message: "", completed: 0, total: 50, recentStates: [],
  });
  const [singleGen, setSingleGen] = useState<SingleGenState>({});
  const abortRef = useRef<boolean>(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });

  const { data: drafts = [], isLoading: draftsLoading } = useQuery<Article[]>({
    queryKey: ["/api/articles/drafts"],
    refetchInterval: genProgress.phase === "running" ? 3000 : 5000,
  });

  const { data: allArticles = [], isLoading: allLoading } = useQuery<Article[]>({
    queryKey: ["/api/articles/all"],
  });

  const { data: stateStatus = [], isLoading: statesLoading } = useQuery<StateStatus[]>({
    queryKey: ["/api/articles/states"],
    refetchInterval: genProgress.phase === "running" ? 3000 : false,
  });

  const statesWithToday = stateStatus.filter(s => s.hasToday).length;
  const draftCount = drafts.length;

  const approve = async (id: string, title: string) => {
    try {
      await apiRequest("PATCH", `/api/articles/${id}/status`, { status: "published" });
      queryClient.invalidateQueries({ queryKey: ["/api/articles/drafts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/articles/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/articles/states"] });
      toast({ title: "Published!", description: `"${title}" is now live.` });
    } catch {
      toast({ title: "Failed to publish", variant: "destructive" });
    }
  };

  const deleteArticle = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/articles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles/drafts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/articles/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/articles/states"] });
      toast({ title: "Deleted" });
    },
    onError: () => toast({ title: "Delete failed", variant: "destructive" }),
  });

  const submitManual = useMutation({
    mutationFn: async () => {
      const errors: Record<string, string> = {};
      if (!form.stateCode) errors.stateCode = "Please select a state";
      if (!form.city.trim()) errors.city = "City is required";
      if (!form.title.trim()) errors.title = "Title is required";
      if (!form.summary.trim()) errors.summary = "Summary is required";
      if (!form.content.trim()) errors.content = "Content is required";
      if (!form.category) errors.category = "Please select a category";
      if (Object.keys(errors).length > 0) { setFormErrors(errors); throw new Error("validation"); }
      setFormErrors({});
      const stateName = US_STATES.find(s => s.code === form.stateCode)?.name || form.stateCode;
      const payload = {
        stateCode: form.stateCode, stateName,
        city: form.city.trim(), title: form.title.trim(),
        summary: form.summary.trim(), content: form.content.trim(),
        category: form.category,
        highlights: form.highlights.map(h => h.trim()).filter(Boolean),
        sources: form.sources.map(s => s.trim()).filter(Boolean),
        publishedDate: todayStr, status: "published",
      };
      return apiRequest("POST", "/api/articles", payload);
    },
    onSuccess: async (res: any) => {
      const saved = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/articles/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/articles/states"] });
      toast({ title: "Dispatch Published!", description: `"${form.title}" is live.` });
      setForm(EMPTY_FORM);
      navigate(`/articles/${saved.id}`);
    },
    onError: (err: any) => {
      if (err.message !== "validation") toast({ title: "Failed to publish", variant: "destructive" });
    },
  });

  const generateDaily = async () => {
    abortRef.current = false;
    setGenProgress({ phase: "running", message: "Scanning for today's best travel stories...", completed: 0, total: 3, recentStates: [] });
    try {
      const response = await fetch(buildApiUrl("/api/articles/generate-daily"), {
        method: "POST",
        headers: { Authorization: `Bearer ${getStoredToken() || ""}` },
      });
      if (!response.body) throw new Error("No response body");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        if (abortRef.current) { reader.cancel(); break; }
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === "progress") {
              setGenProgress(prev => ({ ...prev, message: event.message || `Researching ${event.stateName}...`, completed: event.completed ?? prev.completed }));
            } else if (event.type === "selection") {
              setGenProgress(prev => ({ ...prev, total: event.total, message: event.message }));
            } else if (event.type === "state_error") {
              setGenProgress(prev => ({ ...prev, message: `Could not cover ${event.stateName}, moving on...`, completed: event.completed ?? prev.completed }));
            } else if (event.type === "state_complete") {
              queryClient.invalidateQueries({ queryKey: ["/api/articles/drafts"] });
              setGenProgress(prev => ({
                ...prev, completed: event.completed, total: event.total,
                message: `Drafted: ${event.stateName} — ${event.article?.city}`,
                recentStates: [{ code: event.stateCode, name: event.stateName, title: event.article?.title || "" }, ...prev.recentStates].slice(0, 5),
              }));
            } else if (event.type === "all_complete") {
              queryClient.invalidateQueries({ queryKey: ["/api/articles/drafts"] });
              setGenProgress(prev => ({ ...prev, phase: "done", message: event.message, completed: event.completed }));
              toast({ title: "Drafts Ready!", description: event.message });
            }
          } catch (e) { if (!(e instanceof SyntaxError)) throw e; }
        }
      }
    } catch (err: any) {
      setGenProgress(prev => ({ ...prev, phase: "error", message: err?.message || "Generation failed" }));
      toast({ title: "Generation failed", variant: "destructive" });
    }
  };

  const generateSingle = async (stateCode: string, stateName: string) => {
    setSingleGen(prev => ({ ...prev, [stateCode]: "working" }));
    try {
      const response = await fetch(buildApiUrl("/api/articles/generate"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getStoredToken() || ""}`,
        },
        body: JSON.stringify({ stateCode }),
      });
      if (!response.body) throw new Error("No response body");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === "complete") {
              queryClient.invalidateQueries({ queryKey: ["/api/articles/drafts"] });
              setSingleGen(prev => ({ ...prev, [stateCode]: "done" }));
              toast({ title: `Draft ready: ${stateName}`, description: "Review it in the Drafts tab." });
              setTimeout(() => setSingleGen(prev => ({ ...prev, [stateCode]: "idle" })), 3000);
            } else if (event.type === "error") { throw new Error(event.message); }
          } catch (e) { if (!(e instanceof SyntaxError)) throw e; }
        }
      }
    } catch {
      setSingleGen(prev => ({ ...prev, [stateCode]: "error" }));
      toast({ title: `Failed for ${stateName}`, variant: "destructive" });
      setTimeout(() => setSingleGen(prev => ({ ...prev, [stateCode]: "idle" })), 3000);
    }
  };

  const isGenerating = genProgress.phase === "running";
  const progressPct = genProgress.total > 0 ? Math.round((genProgress.completed / genProgress.total) * 100) : 0;

  const updateHighlight = (i: number, val: string) => {
    setForm(prev => { const h = [...prev.highlights]; h[i] = val; return { ...prev, highlights: h }; });
  };
  const updateSource = (i: number, val: string) => {
    setForm(prev => { const s = [...prev.sources]; s[i] = val; return { ...prev, sources: s }; });
  };

  const tabs = [
    { id: "drafts" as const, label: "Review Drafts", icon: InboxIcon, count: draftCount },
    { id: "write" as const, label: "Write Article", icon: PenLine },
    { id: "ai" as const, label: "AI Generator", icon: Bot },
    { id: "manage" as const, label: "All Articles", icon: FileText },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/">
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                <ArrowLeft className="h-4 w-4" />Public Site
              </span>
            </Link>
            <span className="text-muted-foreground/40">|</span>
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Admin Panel</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {draftCount > 0 && (
              <Badge variant="secondary" className="text-xs no-default-active-elevate gap-1">
                <InboxIcon className="h-3 w-3" />{draftCount} pending review
              </Badge>
            )}
            <Badge variant="secondary" className="text-xs no-default-active-elevate gap-1">
              <Globe className="h-3 w-3" />{statesWithToday}/50 today
            </Badge>
          </div>
        </div>
      </header>

      {/* Tabs — hidden when editing a draft */}
      {!editingDraft && (
        <div className="border-b bg-muted/30">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex gap-0">
              {tabs.map(({ id, label, icon: Icon, count }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${activeTab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  data-testid={`tab-${id}`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  {count !== undefined && count > 0 && (
                    <span className={`inline-flex items-center justify-center rounded-full text-xs font-semibold px-1.5 min-w-[18px] h-[18px] ${activeTab === id ? "bg-primary text-primary-foreground" : "bg-amber-500 text-white"
                      }`}>{count}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 py-8">
        <div className="max-w-6xl mx-auto px-6">

          {/* ── DRAFT EDITOR (replaces drafts list) ── */}
          {editingDraft && (
            <DraftEditor
              article={editingDraft}
              onBack={() => setEditingDraft(null)}
              onSaved={(updated) => setEditingDraft(updated)}
              onPublished={() => { setEditingDraft(null); setActiveTab("drafts"); }}
            />
          )}

          {/* ── REVIEW DRAFTS TAB ── */}
          {!editingDraft && activeTab === "drafts" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-foreground">Review AI Drafts</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  These dispatches were researched and written by the generator. Read and edit each one, then publish when ready.
                </p>
              </div>

              {/* Move past articles to today */}
              <MoveToTodayPanel />

              {draftsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="h-28 rounded-md bg-muted animate-pulse" />)}
                </div>
              ) : drafts.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  <InboxIcon className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-medium">No drafts waiting</p>
                  <p className="text-xs mt-1">Use the AI Generator to research and draft today's dispatches.</p>
                  <Button className="mt-4" variant="outline" onClick={() => setActiveTab("ai")}>
                    Go to AI Generator
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <p className="text-xs text-muted-foreground">{drafts.length} draft{drafts.length !== 1 ? "s" : ""} awaiting review</p>
                    <Button
                      size="sm"
                      variant="secondary"
                      data-testid="button-publish-all-today"
                      onClick={async () => {
                        try {
                          const res = await apiRequest("POST", "/api/admin/publish-drafts-today", {});
                          const data = await res.json();
                          queryClient.invalidateQueries({ queryKey: ["/api/articles/drafts"] });
                          queryClient.invalidateQueries({ queryKey: ["/api/articles/all"] });
                          queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
                          queryClient.invalidateQueries({ queryKey: ["/api/articles/states"] });
                          toast({ title: `Published ${data.updated} article${data.updated !== 1 ? "s" : ""} for ${data.date}` });
                        } catch {
                          toast({ title: "Failed to publish", variant: "destructive" });
                        }
                      }}
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      Publish All for Today
                    </Button>
                  </div>
                  {drafts.map(article => (
                    <DraftCard
                      key={article.id}
                      article={article}
                      onEdit={() => setEditingDraft(article)}
                      onDiscard={() => {
                        setDiscardingId(article.id);
                        deleteArticle.mutate(article.id, { onSettled: () => setDiscardingId(null) });
                      }}
                      discarding={discardingId === article.id}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── WRITE ARTICLE TAB ── */}
          {!editingDraft && activeTab === "write" && (
            <div className="max-w-3xl space-y-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">Write a Travel Dispatch</h2>
                <p className="text-sm text-muted-foreground mt-1">Publish your own expert article directly to the public site — no review step needed.</p>
              </div>
              <Card>
                <CardContent className="pt-6 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>State <span className="text-destructive">*</span></Label>
                      <Select value={form.stateCode} onValueChange={v => setForm(prev => ({ ...prev, stateCode: v }))}>
                        <SelectTrigger data-testid="select-state"><SelectValue placeholder="Select state..." /></SelectTrigger>
                        <SelectContent>
                          {US_STATES.map(s => <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {formErrors.stateCode && <p className="text-xs text-destructive">{formErrors.stateCode}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label>Featured City / Region <span className="text-destructive">*</span></Label>
                      <Input placeholder="e.g. New Orleans..." value={form.city}
                        onChange={e => setForm(prev => ({ ...prev, city: e.target.value }))} data-testid="input-city" />
                      {formErrors.city && <p className="text-xs text-destructive">{formErrors.city}</p>}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Category <span className="text-destructive">*</span></Label>
                    <Select value={form.category} onValueChange={v => setForm(prev => ({ ...prev, category: v }))}>
                      <SelectTrigger data-testid="select-category"><SelectValue placeholder="Select category..." /></SelectTrigger>
                      <SelectContent>
                        {ARTICLE_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {formErrors.category && <p className="text-xs text-destructive">{formErrors.category}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Headline <span className="text-destructive">*</span></Label>
                    <Input placeholder="Write a compelling headline..." value={form.title}
                      onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))} data-testid="input-title" />
                    {formErrors.title && <p className="text-xs text-destructive">{formErrors.title}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Opening Hook <span className="text-destructive">*</span></Label>
                    <Textarea placeholder="2–3 sentences that grab the reader..." value={form.summary}
                      onChange={e => setForm(prev => ({ ...prev, summary: e.target.value }))}
                      className="resize-none" rows={3} data-testid="textarea-summary" />
                    {formErrors.summary && <p className="text-xs text-destructive">{formErrors.summary}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Full Article <span className="text-destructive">*</span>
                      <span className="text-xs font-normal text-muted-foreground ml-2">Markdown supported</span>
                    </Label>
                    <Textarea placeholder={`## Section Heading\n\nWrite your expert content here...`} value={form.content}
                      onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
                      className="resize-y font-mono text-xs" rows={16} data-testid="textarea-content" />
                    {formErrors.content && <p className="text-xs text-destructive">{formErrors.content}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Highlights <span className="text-xs font-normal text-muted-foreground">(optional)</span></Label>
                    <div className="space-y-2">
                      {form.highlights.map((h, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <span className="text-xs text-muted-foreground w-4 shrink-0 text-right">{i + 1}</span>
                          <Input placeholder={`Highlight ${i + 1}...`} value={h}
                            onChange={e => updateHighlight(i, e.target.value)} data-testid={`input-highlight-${i}`} />
                          {form.highlights.length > 1 && (
                            <Button size="icon" variant="ghost" className="shrink-0"
                              onClick={() => setForm(prev => ({ ...prev, highlights: prev.highlights.filter((_, idx) => idx !== i) }))}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" className="gap-1.5"
                      onClick={() => setForm(prev => ({ ...prev, highlights: [...prev.highlights, ""] }))}>
                      <Plus className="h-3.5 w-3.5" />Add Highlight
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label>Sources <span className="text-xs font-normal text-muted-foreground">(optional)</span></Label>
                    <div className="space-y-2">
                      {form.sources.map((s, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <Input placeholder="Source name or URL..." value={s}
                            onChange={e => updateSource(i, e.target.value)} data-testid={`input-source-${i}`} />
                          {form.sources.length > 1 && (
                            <Button size="icon" variant="ghost" className="shrink-0"
                              onClick={() => setForm(prev => ({ ...prev, sources: prev.sources.filter((_, idx) => idx !== i) }))}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" className="gap-1.5"
                      onClick={() => setForm(prev => ({ ...prev, sources: [...prev.sources, ""] }))}>
                      <Plus className="h-3.5 w-3.5" />Add Source
                    </Button>
                  </div>
                  <div className="pt-2 flex items-center gap-3">
                    <Button onClick={() => submitManual.mutate()} disabled={submitManual.isPending} className="gap-2" data-testid="button-publish">
                      {submitManual.isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Publishing...</> : <><PenLine className="h-4 w-4" />Publish Dispatch</>}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { setForm(EMPTY_FORM); setFormErrors({}); }}>Clear</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── AI GENERATOR TAB ── */}
          {!editingDraft && activeTab === "ai" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">AI Generator</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Researches live travel news and writes dispatches as <strong>drafts</strong>. You review, edit, and approve before anything goes public.
                </p>
              </div>
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />Generate Today's Dispatches
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Scans for major US travel events and selects 2–3 states that don't already have coverage today. States with pending drafts are automatically skipped.
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <Button onClick={generateDaily} disabled={isGenerating} className="gap-2" data-testid="button-generate-daily">
                      {isGenerating
                        ? <><Loader2 className="h-4 w-4 animate-spin" />Researching {genProgress.completed}/{genProgress.total}...</>
                        : <><RefreshCw className="h-4 w-4" />Generate Today's Selection</>}
                    </Button>
                    {isGenerating && (
                      <Button variant="outline" size="sm" onClick={() => { abortRef.current = true; setGenProgress(prev => ({ ...prev, phase: "idle" })); }}>Stop</Button>
                    )}
                  </div>
                  {(isGenerating || genProgress.phase === "done") && (
                    <div className="p-4 rounded-md bg-muted/60 border space-y-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="text-sm font-medium flex items-center gap-2">
                          {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                          {genProgress.message}
                        </p>
                        <span className="text-xs font-semibold text-primary">{progressPct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-border overflow-hidden">
                        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progressPct}%` }} />
                      </div>
                      {genProgress.phase === "done" && (
                        <Button size="sm" variant="outline" onClick={() => setActiveTab("drafts")} className="gap-1.5">
                          <InboxIcon className="h-3.5 w-3.5" />Review Drafts
                        </Button>
                      )}
                      {genProgress.recentStates.length > 0 && (
                        <div className="space-y-1">
                          {genProgress.recentStates.map(s => (
                            <p key={s.code} className="text-xs text-muted-foreground truncate">
                              <span className="font-medium text-primary">{s.name}</span> — {s.title}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {genProgress.phase === "error" && (
                    <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                      <p className="text-sm text-destructive">{genProgress.message}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div>
                <h3 className="text-base font-semibold text-foreground mb-1">Target a Specific State</h3>
                <p className="text-xs text-muted-foreground mb-3">Draft a single dispatch for any state at any time — regardless of today's selection.</p>
                {statesLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Array.from({ length: 9 }).map((_, i) => <div key={i} className="h-20 rounded-md bg-muted animate-pulse" />)}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {US_STATES.map(state => {
                      const st = stateStatus.find(s => s.code === state.code);
                      const hasToday = st?.hasToday || false;
                      const latestArticle = st?.latestArticle;
                      const sg = singleGen[state.code] || "idle";
                      return (
                        <div key={state.code} className="rounded-md border bg-card p-3 space-y-2" data-testid={`admin-state-${state.code}`}>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {hasToday ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> : <div className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/30 shrink-0" />}
                              <span className="text-sm font-semibold truncate">{state.name}</span>
                            </div>
                            <Button size="sm" variant="outline" className="shrink-0 gap-1 h-7 px-2 text-xs"
                              disabled={sg === "working" || isGenerating}
                              onClick={() => generateSingle(state.code, state.name)}
                              data-testid={`button-gen-${state.code}`}>
                              {sg === "working" ? <Loader2 className="h-3 w-3 animate-spin" /> : sg === "done" ? <CheckCircle2 className="h-3 w-3 text-emerald-600" /> : <RefreshCw className="h-3 w-3" />}
                              {sg === "working" ? "Drafting..." : sg === "done" ? "Drafted!" : "Draft"}
                            </Button>
                          </div>
                          {latestArticle ? (
                            <Link href={`/articles/${latestArticle.id}`}>
                              <p className="text-xs text-muted-foreground line-clamp-1 hover:text-primary cursor-pointer">{latestArticle.city} — {latestArticle.title}</p>
                            </Link>
                          ) : (
                            <p className="text-xs text-muted-foreground/50 italic">No published dispatch yet</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── ALL ARTICLES TAB ── */}
          {!editingDraft && activeTab === "manage" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">All Dispatches</h2>
                <p className="text-sm text-muted-foreground mt-1">{allArticles.length} total articles</p>
              </div>
              {allLoading ? (
                <div className="space-y-2">{[1, 2, 3, 4].map(i => <div key={i} className="h-14 rounded-md bg-muted animate-pulse" />)}</div>
              ) : allArticles.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Compass className="h-8 w-8 mx-auto mb-2 opacity-25" />
                  <p className="text-sm">No dispatches yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {allArticles.map(article => (
                    <ArticleManageRow
                      key={article.id}
                      article={article}
                      onEdit={() => setEditingDraft(article)}
                      onDelete={() => deleteArticle.mutate(article.id)}
                      deleting={deleteArticle.isPending}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      <footer className="border-t py-4 bg-muted/30">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between flex-wrap gap-2">
          <p className="text-xs text-muted-foreground">Expedition America — Admin Panel</p>
          <div className="flex items-center gap-4">
            <Link href="/"><span className="text-xs text-primary cursor-pointer hover:underline">View Public Site</span></Link>
            <button
              onClick={() => {
                localStorage.removeItem("ea_admin_token");
                sessionStorage.removeItem("ea_admin_token");
                window.location.reload();
              }}
              className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors cursor-pointer"
              data-testid="button-admin-signout"
            >
              Sign out
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Auth wrapper ───────────────────────────────────────────────────
export default function AdminPage() {
  const [authed, setAuthed] = useState<"checking" | "yes" | "no">("checking");

  useEffect(() => {
    const token = getStoredToken();
    if (!token) { setAuthed("no"); return; }
    fetch(buildApiUrl("/api/admin/verify"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(r => setAuthed(r.ok ? "yes" : "no"))
      .catch(() => setAuthed("no"));
  }, []);

  const handleAuthenticated = (token: string, remember: boolean) => {
    if (remember) {
      localStorage.setItem(ADMIN_TOKEN_KEY, token);
    } else {
      sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
    }
    setAuthed("yes");
  };

  if (authed === "checking") {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (authed === "no") {
    return <AdminLogin onAuthenticated={handleAuthenticated} />;
  }

  return <AdminContent />;
}
