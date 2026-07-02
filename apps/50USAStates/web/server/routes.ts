import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateArticleSchema, insertArticleSchema, US_STATES } from "@shared/schema";
import OpenAI, { toFile } from "openai";
import multer from "multer";
import crypto from "crypto";
import { textToSpeech } from "./replit_integrations/audio/client";

function makeAdminToken(): string {
  const code = process.env.ADMIN_CODE || "";
  return crypto.createHash("sha256").update(`expedition-admin:${code}`).digest("hex");
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

async function webSearch(query: string): Promise<{ title: string; url: string; snippet: string }[]> {
  try {
    const response = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=8&freshness=pw`,
      {
        headers: {
          "Accept": "application/json",
          "Accept-Encoding": "gzip",
          "X-Subscription-Token": process.env.BRAVE_SEARCH_API_KEY || "",
        },
      }
    );
    if (!response.ok) return [];
    const data = await response.json() as any;
    return (data.web?.results || []).map((r: any) => ({
      title: r.title || "",
      url: r.url || "",
      snippet: r.description || "",
    }));
  } catch {
    return [];
  }
}

function getTodayDate(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

function getTomorrowDate(): string {
  // Get today in ET, then add exactly one calendar day (avoids UTC drift)
  const todayET = getTodayDate(); // "YYYY-MM-DD"
  const [y, m, d] = todayET.split("-").map(Number);
  const tomorrow = new Date(y, m - 1, d + 1);
  return [
    tomorrow.getFullYear(),
    String(tomorrow.getMonth() + 1).padStart(2, "0"),
    String(tomorrow.getDate()).padStart(2, "0"),
  ].join("-");
}

function getETHour(): number {
  return parseInt(
    new Date().toLocaleString("en-US", { timeZone: "America/New_York", hour: "numeric", hour12: false }),
    10
  );
}

function buildTravelPrompt(
  stateName: string,
  stateCode: string,
  searchResults: { title: string; url: string; snippet: string }[],
  publishDate?: string
): string {
  // Use the publish date (ET) so articles written for tomorrow reference the correct date
  const today = publishDate
    ? new Date(publishDate + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/New_York" });

  const sourcesText = searchResults.length > 0
    ? searchResults
      .map((r, i) => `[${i + 1}] ${r.title}\n    URL: ${r.url}\n    Excerpt: ${r.snippet}`)
      .join("\n\n")
    : "";

  return `You are a senior travel journalist for "Expedition America," a prestigious daily publication dedicated to rediscovering and understanding America through its travel and tourism experiences. Today is ${today}.

STATE: ${stateName} (${stateCode})

${sourcesText ? `LIVE RESEARCH GATHERED:\n${sourcesText}\n\n` : ""}YOUR MISSION:

Write a compelling, richly detailed travel news article about what is most important, interesting, and informative happening in ${stateName} RIGHT NOW for travelers. Choose the single most captivating travel story — an event, natural phenomenon, cultural experience, food scene, historic site, outdoor adventure, or hidden gem — that travelers should know about today.

Write with the authority of a seasoned travel journalist who has been everywhere in America. Be specific with place names, local details, historic context, and practical travel information. Evoke a sense of wonder and the joy of discovery.

ABSOLUTE RULES:
- Never write "live web results," "my training data," "I cannot access," "as an AI," or any AI self-reference
- If specific current dates are uncertain, write authoritatively about the seasonal context
- Write as a confident journalist reporting on the ground, not as a computer describing limitations
- Be specific: name actual places, dishes, streets, neighborhoods, prices where relevant
- Minimum 600 words in the content field

REQUIRED OUTPUT — RESPOND WITH VALID JSON ONLY (no markdown fences, no text outside the JSON):

{
  "city": "The specific city or region this article focuses on",
  "title": "A vivid, compelling headline that makes readers want to visit",
  "summary": "2-3 sentences of the most compelling hook — why this matters right now, what makes it special",
  "category": "One of exactly: Events & Festivals, Natural Wonders, Food & Culture, History & Heritage, Adventure & Outdoors, Arts & Entertainment, Hidden Gems, Seasonal Highlights",
  "content": "Full article in markdown. Use ## for main sections, ### for subsections, - for bullet points. Write with narrative flair and specificity. Include: what makes this destination special right now, what to see/do/eat, practical visitor information, insider tips, historical or cultural context. Minimum 600 words.",
  "highlights": ["5-6 specific, vivid bullet points — the most compelling reasons to visit or things to know"],
  "sources": ["4-6 named sources such as: state tourism board, local newspapers, national park service, travel publications, local organizations"]
}`;
}

function sanitize(text: string): string {
  if (!text) return "";
  return text
    .replace(/^\* /gm, "- ")
    .replace(/^(\s+)\* /gm, "$1- ")
    .replace(/[^\n]*(?:live web results|live search results|not available (?:here|to me)|my training data|my knowledge cutoff|as of my training|I cannot access|I don't have access|beyond my training|outside my training|I was unable to|I am unable to|cannot be verified here|cannot confirm|as a language model|as an AI)[^\n]*/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function generateArticleForState(stateCode: string, stateName: string, publishDate?: string): Promise<any> {
  const resolvedPublishDate = publishDate || getTomorrowDate();

  const searchQueries = [
    `${stateName} travel tourism things to do spring 2026`,
    `${stateName} events festivals March April 2026`,
    `best places visit ${stateName} right now`,
    `${stateName} travel news attractions 2026`,
  ];

  const allResults: { title: string; url: string; snippet: string }[] = [];
  for (const query of searchQueries) {
    const results = await webSearch(query);
    allResults.push(...results);
  }

  const seen = new Set<string>();
  const uniqueResults = allResults.filter(r => {
    if (!r.url || seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  }).slice(0, 12);

  const prompt = buildTravelPrompt(stateName, stateCode, uniqueResults, resolvedPublishDate);

  const completion = await openai.chat.completions.create({
    model: "gpt-5.2",
    messages: [
      {
        role: "system",
        content: "You are a senior travel journalist for Expedition America. Respond ONLY with valid JSON. No markdown code fences. No preamble. No commentary outside the JSON object.",
      },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 3500,
  });

  const rawContent = completion.choices[0]?.message?.content || "{}";
  let parsed: any;
  try {
    parsed = JSON.parse(rawContent);
  } catch {
    throw new Error(`Failed to parse AI response for ${stateName}`);
  }

  const liveSourceTitles = uniqueResults.slice(0, 4).map(r => r.title || r.url).filter(Boolean);
  const aiSources: string[] = Array.isArray(parsed.sources) ? parsed.sources : [];
  const mergedSources = Array.from(new Set([...aiSources, ...liveSourceTitles])).slice(0, 6);

  return {
    stateCode,
    stateName,
    city: sanitize(parsed.city || stateName),
    title: sanitize(parsed.title || `Exploring ${stateName}: Today's Top Story`),
    summary: sanitize(parsed.summary || ""),
    content: sanitize(parsed.content || ""),
    category: parsed.category || "Seasonal Highlights",
    highlights: Array.isArray(parsed.highlights) ? parsed.highlights.map((h: string) => sanitize(h)) : [],
    sources: mergedSources,
    publishedDate: resolvedPublishDate,
    status: "completed",
  };
}

// ── Scheduled tasks ────────────────────────────────────────────────────────

async function autoPublishDraftsForToday(): Promise<void> {
  const today = getTodayDate();
  try {
    const drafts = await storage.getDraftArticles();
    const toPublish = drafts.filter(d => d.publishedDate === today);
    for (const draft of toPublish) {
      await storage.updateArticleStatus(draft.id, "published");
    }
    if (toPublish.length > 0) {
      console.log(`[Scheduler] Auto-published ${toPublish.length} article(s) for ${today}`);
    }
  } catch (err) {
    console.error("[Scheduler] Auto-publish error:", err);
  }
}

async function runDailyGeneration(): Promise<void> {
  const tomorrow = getTomorrowDate();
  console.log(`[Scheduler] Starting daily generation for ${tomorrow}...`);
  try {
    const [published, drafts] = await Promise.all([
      storage.getPublishedArticles(),
      storage.getDraftArticles(),
    ]);
    // Stop if we already have 1+ article (draft or published) for tomorrow — prevents double-gen on restarts
    const existingTomorrow = [
      ...published.filter(a => a.publishedDate === tomorrow),
      ...drafts.filter(a => a.publishedDate === tomorrow),
    ];
    if (existingTomorrow.length >= 1) {
      console.log(`[Scheduler] Already have ${existingTomorrow.length} article(s) for ${tomorrow}, skipping.`);
      return;
    }

    const covered = new Set(existingTomorrow.map(a => a.stateCode));
    const available = US_STATES.filter(s => !covered.has(s.code));
    if (available.length === 0) {
      console.log(`[Scheduler] All states already have coverage for ${tomorrow}, skipping.`);
      return;
    }
    const month = new Date().toLocaleString("en-US", { month: "long" });
    const eventResults = await webSearch(`major US travel events festivals tourism ${month} ${new Date().getFullYear()} this week`);
    const eventText = eventResults.map(r => `${r.title} ${r.snippet}`).join(" ").toLowerCase();
    const eventPriority = available.filter(s =>
      eventText.includes(s.name.toLowerCase()) || eventText.includes(s.code.toLowerCase())
    );
    const count = 1;
    const chosen: typeof US_STATES[number][] = [];
    for (const s of eventPriority.sort(() => Math.random() - 0.5)) {
      if (chosen.length >= count) break;
      chosen.push(s);
    }
    for (const s of available.filter(s => !chosen.find(c => c.code === s.code)).sort(() => Math.random() - 0.5)) {
      if (chosen.length >= count) break;
      chosen.push(s);
    }
    for (const state of chosen) {
      try {
        const articleData = await generateArticleForState(state.code, state.name);
        const v = insertArticleSchema.safeParse(articleData);
        if (v.success) {
          await storage.createArticle({ ...v.data, status: "draft" });
          console.log(`[Scheduler] Draft created: ${state.name}`);
        }
      } catch (err: any) {
        console.error(`[Scheduler] Failed to generate for ${state.name}:`, err?.message);
      }
      await new Promise(r => setTimeout(r, 1000));
    }
    console.log(`[Scheduler] Daily generation complete. ${chosen.length} drafts queued for ${tomorrow}.`);
  } catch (err) {
    console.error("[Scheduler] Daily generation error:", err);
  }
}

let lastAutoPublishDate = "";
let lastAutoGenerateDate = "";

function startScheduler(): void {
  async function tick() {
    const hour = getETHour();
    const today = getTodayDate();
    const tomorrow = getTomorrowDate();

    // 3pm ET — auto-generate tomorrow's draft
    if (hour >= 15 && lastAutoGenerateDate !== tomorrow) {
      lastAutoGenerateDate = tomorrow;
      runDailyGeneration();
    }

    // 12am ET (midnight) — auto-publish today's unapproved drafts
    if (lastAutoPublishDate !== today) {
      lastAutoPublishDate = today;
      autoPublishDraftsForToday();
    }
  }

  // Run immediately on startup (catches the case where server restarts after 9am)
  tick();
  // Then every 5 minutes
  setInterval(tick, 5 * 60 * 1000);
}

// Background auto-generation tracker
let autoGenerationRunning = false;
const generationQueue: string[] = [];

export async function registerRoutes(app: Express): Promise<Server> {
  const isCronAuthorized = (req: any) => {
    const hasVercelCronHeader = Boolean(
      req.headers["x-vercel-cron"] || req.headers["x-vercel-cron-schedule"],
    );
    const userAgent = String(req.headers["user-agent"] || "").toLowerCase();
    const isVercelCronUserAgent = userAgent.includes("vercel-cron/");
    if (hasVercelCronHeader || isVercelCronUserAgent) {
      return true;
    }

    const configuredSecret = String(process.env.CRON_SECRET || "").trim();
    if (!configuredSecret) {
      return false;
    }

    const authHeader = String(req.headers["authorization"] || "").trim();
    if (authHeader === `Bearer ${configuredSecret}`) {
      return true;
    }

    const providedSecret = String(req.headers["x-cron-secret"] || req.query?.secret || "").trim();
    return providedSecret === configuredSecret;
  };

  app.get("/api/cron/auto-publish", async (req: any, res: Response) => {
    try {
      if (!isCronAuthorized(req)) {
        return res.status(401).json({ message: "Unauthorized cron invocation" });
      }
      await autoPublishDraftsForToday();
      return res.json({ ok: true, message: "Auto-publish executed." });
    } catch (error: any) {
      console.error("[Cron] auto-publish failed:", error);
      return res.status(500).json({ message: error?.message || "Cron auto-publish failed" });
    }
  });

  app.get("/api/cron/generate-tomorrow", async (req: any, res: Response) => {
    try {
      if (!isCronAuthorized(req)) {
        return res.status(401).json({ message: "Unauthorized cron invocation" });
      }
      await runDailyGeneration();
      return res.json({ ok: true, message: "Tomorrow generation executed." });
    } catch (error: any) {
      console.error("[Cron] generate-tomorrow failed:", error);
      return res.status(500).json({ message: error?.message || "Cron generation failed" });
    }
  });

  // Public: only published articles
  // Generate excerpt/summary from title + content
  app.post("/api/articles/generate-excerpt", async (req: Request, res: Response) => {
    const { title, content, stateName, city } = req.body as {
      title?: string; content?: string; stateName?: string; city?: string;
    };
    if (!title || !content) {
      return res.status(400).json({ error: "title and content are required" });
    }
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [
          {
            role: "system",
            content: "You are an expert travel editor who writes irresistible article summaries for Expedition America. Write exactly 2–3 sentences. Be vivid, specific, and enticing — make the reader want to read on. Use the journalist's voice: present tense, active, evocative. Never use AI language or refer to the article in the third person. Output only the summary text, no quotes, no labels.",
          },
          {
            role: "user",
            content: `Write a 2–3 sentence opening hook/summary for this travel article.\n\nTitle: ${title}\nLocation: ${city ? `${city}, ` : ""}${stateName || ""}\n\nArticle content:\n${content.slice(0, 3000)}`,
          },
        ],
        max_completion_tokens: 200,
      });
      const excerpt = completion.choices[0]?.message?.content?.trim() || "";
      if (!excerpt) {
        console.error("Excerpt generation returned empty content");
        return res.status(500).json({ error: "AI returned an empty excerpt" });
      }
      res.json({ excerpt });
    } catch (err: any) {
      console.error("Excerpt generation error:", err?.message);
      res.status(500).json({ error: "Failed to generate excerpt" });
    }
  });

  // Admin authentication
  app.post("/api/admin/auth", (req: Request, res: Response) => {
    const { code } = req.body as { code?: string };
    const expected = process.env.ADMIN_CODE;
    if (!expected) return res.status(503).json({ error: "Admin access not configured" });
    if (!code || code !== expected) {
      return res.status(401).json({ error: "Incorrect code" });
    }
    res.json({ token: makeAdminToken() });
  });

  // Move ALL articles from a given date to today and publish them
  app.post("/api/admin/move-to-today", async (req: Request, res: Response) => {
    try {
      const todayET = getTodayDate();
      const { fromDate } = req.body as { fromDate?: string };
      if (!fromDate) return res.status(400).json({ error: "fromDate is required" });
      if (fromDate === todayET) return res.json({ updated: 0, date: todayET });
      const count = await storage.moveArticlesToDate(fromDate, todayET);
      res.json({ updated: count, date: todayET });
    } catch {
      res.status(500).json({ error: "Failed to move articles" });
    }
  });

  // Move all draft articles to today's ET date and publish them
  app.post("/api/admin/publish-drafts-today", async (_req: Request, res: Response) => {
    try {
      const todayET = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
      const drafts = await storage.getDraftArticles();
      const updated = await Promise.all(
        drafts.map(async d => {
          await storage.updateArticle(d.id, { publishedDate: todayET });
          return storage.updateArticleStatus(d.id, "published");
        })
      );
      res.json({ updated: updated.length, date: todayET });
    } catch {
      res.status(500).json({ error: "Failed to publish drafts for today" });
    }
  });

  // Verify admin token (used by frontend on page load)
  app.post("/api/admin/verify", (req: Request, res: Response) => {
    const { token } = req.body as { token?: string };
    const expected = makeAdminToken();
    if (!token || token !== expected) {
      return res.status(401).json({ error: "Invalid session" });
    }
    res.json({ valid: true });
  });

  // Helper: run Whisper on an audio buffer and return word timestamps
  async function getWhisperTimestamps(audioBuffer: Buffer): Promise<{ word: string; start: number; end: number }[]> {
    const audioFile = await toFile(audioBuffer, "audio.mp3", { type: "audio/mpeg" });
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "gpt-4o-transcribe",
      response_format: "verbose_json",
      timestamp_granularities: ["word"],
    } as Parameters<typeof openai.audio.transcriptions.create>[0]);
    return ((transcription as unknown as { words?: { word: string; start: number; end: number }[] }).words) || [];
  }

  // Text-to-speech (admin only): returns cached or freshly generated MP3 for an article
  app.post("/api/tts/:id", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization || "";
      const token = authHeader.replace("Bearer ", "");
      if (!token || token !== makeAdminToken()) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const articleId = req.params.id;
      const article = await storage.getArticle(articleId);
      if (!article) return res.status(404).json({ error: "Article not found" });

      // Return cached audio (and generate Whisper timestamps if not yet cached)
      if (article.audioUrl) {
        const audioBuffer = Buffer.from(article.audioUrl.replace(/^data:audio\/mpeg;base64,/, ""), "base64");
        if (!article.wordTimestamps) {
          // Fire-and-forget: generate timestamps in background for existing cached audio
          getWhisperTimestamps(audioBuffer)
            .then(words => storage.updateArticle(articleId, { wordTimestamps: JSON.stringify(words) }))
            .catch(e => console.warn("Whisper bg error:", e));
        }
        res.set("Content-Type", "audio/mpeg");
        res.set("Cache-Control", "public, max-age=86400");
        return res.send(audioBuffer);
      }

      // Generate fresh audio
      const cleanContent = (article.content || "")
        .replace(/#{1,6}\s+/g, "")
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/\*(.+?)\*/g, "$1")
        .replace(/^[-*]\s+/gm, "")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      const fullText = [article.title, article.summary, cleanContent].filter(Boolean).join("\n\n");

      function splitChunks(text: string, max = 2000): string[] {
        const chunks: string[] = [];
        let remaining = text;
        while (remaining.length > max) {
          let cut = remaining.lastIndexOf(". ", max);
          if (cut === -1) cut = remaining.lastIndexOf(" ", max);
          if (cut === -1) cut = max;
          else cut += 1;
          chunks.push(remaining.slice(0, cut).trim());
          remaining = remaining.slice(cut).trim();
        }
        if (remaining.length > 0) chunks.push(remaining);
        return chunks;
      }

      const chunks = splitChunks(fullText);
      const buffers: Buffer[] = [];
      for (const chunk of chunks) {
        const audio = await textToSpeech(chunk, "onyx", "mp3");
        buffers.push(audio);
      }

      const combined = Buffer.concat(buffers);
      const audioUrl = `data:audio/mpeg;base64,${combined.toString("base64")}`;

      // Save audio immediately, then generate timestamps
      await storage.updateArticle(articleId, { audioUrl });

      // Generate Whisper word timestamps (non-blocking so audio is returned fast)
      getWhisperTimestamps(combined)
        .then(words => storage.updateArticle(articleId, { wordTimestamps: JSON.stringify(words) }))
        .catch(e => console.warn("Whisper error:", e));

      res.set("Content-Type", "audio/mpeg");
      res.set("Cache-Control", "public, max-age=86400");
      res.send(combined);
    } catch (err) {
      console.error("TTS error:", err);
      res.status(500).json({ error: "Failed to generate audio" });
    }
  });

  // Word timestamps for an article (admin only) — returns Whisper word-level timing data
  app.get("/api/tts/:id/timestamps", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization || "";
      const token = authHeader.replace("Bearer ", "");
      if (!token || token !== makeAdminToken()) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const article = await storage.getArticle(req.params.id);
      if (!article) return res.status(404).json({ error: "Not found" });
      const timestamps = article.wordTimestamps ? JSON.parse(article.wordTimestamps) : [];
      res.json({ timestamps });
    } catch (err) {
      console.error("Timestamps error:", err);
      res.status(500).json({ error: "Failed to get timestamps" });
    }
  });

  app.get("/api/articles", async (_req: Request, res: Response) => {
    try {
      const articles = await storage.getPublishedArticles();
      res.json(articles);
    } catch {
      res.status(500).json({ error: "Failed to fetch articles" });
    }
  });

  // Admin: drafts awaiting approval
  app.get("/api/articles/drafts", async (_req: Request, res: Response) => {
    try {
      const drafts = await storage.getDraftArticles();
      res.json(drafts);
    } catch {
      res.status(500).json({ error: "Failed to fetch drafts" });
    }
  });

  // Admin: all articles (published + draft) for management view
  app.get("/api/articles/all", async (_req: Request, res: Response) => {
    try {
      const [published, drafts] = await Promise.all([
        storage.getPublishedArticles(),
        storage.getDraftArticles(),
      ]);
      res.json([...published, ...drafts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch {
      res.status(500).json({ error: "Failed to fetch articles" });
    }
  });

  app.get("/api/articles/today", async (_req: Request, res: Response) => {
    try {
      const articles = await storage.getArticlesByDate(getTodayDate());
      res.json(articles);
    } catch {
      res.status(500).json({ error: "Failed to fetch today's articles" });
    }
  });

  // Admin state status — uses latest published per state
  app.get("/api/articles/states", async (_req: Request, res: Response) => {
    try {
      const today = getTodayDate();
      const stateStatus = await Promise.all(
        US_STATES.map(async (state) => {
          const latest = await storage.getLatestPublishedByState(state.code);
          return {
            code: state.code,
            name: state.name,
            hasToday: latest?.publishedDate === today,
            latestArticle: latest
              ? { id: latest.id, title: latest.title, category: latest.category, city: latest.city }
              : null,
          };
        })
      );
      res.json(stateStatus);
    } catch {
      res.status(500).json({ error: "Failed to fetch state status" });
    }
  });

  app.get("/api/articles/state/:code", async (req: Request, res: Response) => {
    try {
      const articles = await storage.getPublishedByState(req.params.code.toUpperCase());
      res.json(articles);
    } catch {
      res.status(500).json({ error: "Failed to fetch state articles" });
    }
  });

  app.get("/api/articles/:id", async (req: Request, res: Response) => {
    try {
      const article = await storage.getArticle(req.params.id);
      if (!article) return res.status(404).json({ error: "Article not found" });
      res.json(article);
    } catch {
      res.status(500).json({ error: "Failed to fetch article" });
    }
  });

  app.delete("/api/articles/:id", async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteArticle(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Article not found" });
      res.status(204).send();
    } catch {
      res.status(500).json({ error: "Failed to delete article" });
    }
  });

  // Image upload — converts to base64 data URL stored in the database (survives deployments)
  app.post("/api/upload", upload.single("image"), (req: Request, res: Response) => {
    if (!req.file) return res.status(400).json({ error: "No image file provided" });
    const base64 = req.file.buffer.toString("base64");
    const url = `data:${req.file.mimetype};base64,${base64}`;
    res.json({ url });
  });

  // Update article fields (for editing drafts before publishing)
  app.patch("/api/articles/:id", async (req: Request, res: Response) => {
    try {
      const updated = await storage.updateArticle(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: "Article not found" });
      res.json(updated);
    } catch {
      res.status(500).json({ error: "Failed to update article" });
    }
  });

  // Approve a draft (publish it) or reject it (keep as draft / change status)
  app.patch("/api/articles/:id/status", async (req: Request, res: Response) => {
    const { status } = req.body;
    if (status !== "published" && status !== "draft") {
      return res.status(400).json({ error: "status must be 'published' or 'draft'" });
    }
    try {
      const updated = await storage.updateArticleStatus(req.params.id, status);
      if (!updated) return res.status(404).json({ error: "Article not found" });
      res.json(updated);
    } catch {
      res.status(500).json({ error: "Failed to update article status" });
    }
  });

  // Manual article creation by the expert — always published immediately
  app.post("/api/articles", async (req: Request, res: Response) => {
    const validation = insertArticleSchema.safeParse({ ...req.body, status: "published" });
    if (!validation.success) {
      return res.status(400).json({ error: "Invalid article data", details: validation.error.errors });
    }
    try {
      const saved = await storage.createArticle({ ...validation.data, status: "published" });
      res.status(201).json(saved);
    } catch {
      res.status(500).json({ error: "Failed to save article" });
    }
  });

  // Generate article for a single state (SSE)
  app.post("/api/articles/generate", async (req: Request, res: Response) => {
    const validation = generateArticleSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Invalid request", details: validation.error.errors });
    }

    const { stateCode } = validation.data;
    const stateInfo = US_STATES.find(s => s.code === stateCode);
    if (!stateInfo) {
      return res.status(400).json({ error: "Unknown state code" });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

    try {
      send({ type: "status", message: `Researching what's happening in ${stateInfo.name}...` });

      const articleData = await generateArticleForState(stateCode, stateInfo.name);

      send({ type: "status", message: `Writing today's ${stateInfo.name} story...` });

      const insertValidation = insertArticleSchema.safeParse(articleData);
      if (!insertValidation.success) {
        throw new Error("Article data validation failed");
      }

      const savedArticle = await storage.createArticle({ ...insertValidation.data, status: "draft" });

      send({ type: "complete", article: savedArticle });
      res.end();
    } catch (error: any) {
      console.error("Article generation error:", error);
      send({ type: "error", message: error?.message || "Failed to generate article" });
      res.end();
    }
  });

  // Smart daily generation: picks 2-3 states, skips already-covered states, prioritizes major events
  app.post("/api/articles/generate-daily", async (req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const send = (data: object) => {
      try { res.write(`data: ${JSON.stringify(data)}\n\n`); } catch { }
    };

    const tomorrow = getTomorrowDate();

    // Step 1: find states already covered for tomorrow (draft or published)
    send({ type: "progress", message: "Checking what's already lined up for tomorrow..." });
    const [published, drafts] = await Promise.all([
      storage.getPublishedArticles(),
      storage.getDraftArticles(),
    ]);
    const coveredTomorrow = new Set([
      ...published.filter(a => a.publishedDate === tomorrow).map(a => a.stateCode),
      ...drafts.filter(a => a.publishedDate === tomorrow).map(a => a.stateCode),
    ]);

    const available = US_STATES.filter(s => !coveredTomorrow.has(s.code));
    if (available.length === 0) {
      send({ type: "all_complete", completed: 0, failed: 0, message: "All states already have tomorrow's coverage ready." });
      return res.end();
    }

    // Step 2: search for major US travel events to find priority states
    send({ type: "progress", message: "Scanning for major travel events and stories across America..." });
    const month = new Date().toLocaleString("en-US", { month: "long" });
    const eventResults = await webSearch(`major US travel events festivals tourism ${month} ${new Date().getFullYear()} this week`);
    const eventText = eventResults.map(r => `${r.title} ${r.snippet}`).join(" ").toLowerCase();

    // Identify which available states are mentioned in event search results
    const eventPriority = available.filter(s =>
      eventText.includes(s.name.toLowerCase()) ||
      eventText.includes(s.code.toLowerCase())
    );

    // Step 3: pick 1 state — event-driven first, then random
    const count = 1;
    const chosen: typeof US_STATES[number][] = [];

    // Add event-priority states first (up to count)
    const shuffledPriority = eventPriority.sort(() => Math.random() - 0.5);
    for (const s of shuffledPriority) {
      if (chosen.length >= count) break;
      chosen.push(s);
    }

    // Fill remaining slots randomly from available states
    const remaining = available.filter(s => !chosen.find(c => c.code === s.code))
      .sort(() => Math.random() - 0.5);
    for (const s of remaining) {
      if (chosen.length >= count) break;
      chosen.push(s);
    }

    const priorityNames = eventPriority.slice(0, 3).map(s => s.name);
    const selectionNote = priorityNames.length > 0
      ? `Found major events in ${priorityNames.join(", ")}. Selected ${chosen.map(s => s.name).join(", ")}.`
      : `No major events found — randomly selected ${chosen.map(s => s.name).join(", ")}.`;

    send({
      type: "selection",
      states: chosen.map(s => ({ code: s.code, name: s.name })),
      total: chosen.length,
      message: selectionNote,
    });

    // Step 4: generate articles for chosen states
    let completed = 0;
    let failed = 0;

    for (const state of chosen) {
      if (res.writableEnded) break;
      send({ type: "progress", stateCode: state.code, stateName: state.name, completed, total: chosen.length, message: `Researching ${state.name}...` });

      try {
        const articleData = await generateArticleForState(state.code, state.name);
        const insertValidation = insertArticleSchema.safeParse(articleData);
        if (insertValidation.success) {
          const saved = await storage.createArticle({ ...insertValidation.data, status: "draft" });
          completed++;
          send({
            type: "state_complete",
            stateCode: state.code,
            stateName: state.name,
            article: { id: saved.id, title: saved.title, category: saved.category, city: saved.city },
            completed,
            total: chosen.length,
          });
        } else {
          failed++;
          send({ type: "state_error", stateCode: state.code, stateName: state.name, completed, total: chosen.length });
        }
      } catch (err: any) {
        failed++;
        console.error(`Error generating for ${state.name}:`, err?.message);
        send({ type: "state_error", stateCode: state.code, stateName: state.name, completed, total: chosen.length });
      }

      await new Promise(r => setTimeout(r, 500));
    }

    send({
      type: "all_complete",
      completed,
      failed,
      message: `Done! ${completed} new draft${completed !== 1 ? "s" : ""} ready for your review.`,
    });
    res.end();
  });

  if (!process.env.VERCEL) {
    startScheduler();
  }

  const httpServer = createServer(app);
  return httpServer;
}
