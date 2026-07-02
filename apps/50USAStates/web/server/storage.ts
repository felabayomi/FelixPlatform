import { eq, desc, and, getTableColumns } from "drizzle-orm";
import { db } from "./db.js";
import { articles, type Article, type InsertArticle, type ArticleStatus } from "../shared/schema.js";

// Exclude heavy base64 / large-JSON columns from list queries for fast responses
function listColumns() {
  const { audioUrl, imageUrl, wordTimestamps, ...cols } = getTableColumns(articles);
  return cols;
}

export interface IStorage {
  getPublishedArticles(): Promise<Article[]>;
  getDraftArticles(): Promise<Article[]>;
  getArticle(id: string): Promise<Article | undefined>;
  getPublishedByState(stateCode: string): Promise<Article[]>;
  getLatestPublishedByState(stateCode: string): Promise<Article | undefined>;
  getArticlesByDate(date: string): Promise<Article[]>;
  createArticle(article: InsertArticle): Promise<Article>;
  updateArticle(id: string, data: Partial<InsertArticle>): Promise<Article | undefined>;
  updateArticleStatus(id: string, status: ArticleStatus): Promise<Article | undefined>;
  deleteArticle(id: string): Promise<boolean>;
  moveArticlesToDate(fromDate: string, toDate: string): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  async getPublishedArticles(): Promise<Article[]> {
    return db
      .select(listColumns())
      .from(articles)
      .where(eq(articles.status, "published"))
      .orderBy(desc(articles.createdAt)) as unknown as Article[];
  }

  async getDraftArticles(): Promise<Article[]> {
    return db
      .select(listColumns())
      .from(articles)
      .where(eq(articles.status, "draft"))
      .orderBy(desc(articles.createdAt)) as unknown as Article[];
  }

  async getArticle(id: string): Promise<Article | undefined> {
    // Full select including imageUrl and audioUrl for single-article detail/TTS
    const [article] = await db.select().from(articles).where(eq(articles.id, id));
    return article;
  }

  async getPublishedByState(stateCode: string): Promise<Article[]> {
    return db
      .select(listColumns())
      .from(articles)
      .where(and(eq(articles.stateCode, stateCode), eq(articles.status, "published")))
      .orderBy(desc(articles.createdAt)) as unknown as Article[];
  }

  async getLatestPublishedByState(stateCode: string): Promise<Article | undefined> {
    const results = await this.getPublishedByState(stateCode);
    return results[0];
  }

  async getArticlesByDate(date: string): Promise<Article[]> {
    return db
      .select(listColumns())
      .from(articles)
      .where(and(eq(articles.publishedDate, date), eq(articles.status, "published")))
      .orderBy(desc(articles.createdAt)) as unknown as Article[];
  }

  async createArticle(article: InsertArticle): Promise<Article> {
    const [created] = await db.insert(articles).values(article).returning();
    return created;
  }

  async updateArticle(id: string, data: Partial<InsertArticle>): Promise<Article | undefined> {
    const [updated] = await db
      .update(articles)
      .set(data)
      .where(eq(articles.id, id))
      .returning();
    return updated;
  }

  async updateArticleStatus(id: string, status: ArticleStatus): Promise<Article | undefined> {
    const [updated] = await db
      .update(articles)
      .set({ status })
      .where(eq(articles.id, id))
      .returning();
    return updated;
  }

  async deleteArticle(id: string): Promise<boolean> {
    const result = await db.delete(articles).where(eq(articles.id, id)).returning();
    return result.length > 0;
  }

  async moveArticlesToDate(fromDate: string, toDate: string): Promise<number> {
    const result = await db
      .update(articles)
      .set({ publishedDate: toDate, status: "published" })
      .where(eq(articles.publishedDate, fromDate))
      .returning();
    return result.length;
  }
}

export const storage = new DatabaseStorage();

// Seed the database with sample articles if empty
async function seedIfEmpty() {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const existing = await storage.getPublishedArticles();
  if (existing.length > 0) return;

  const seeds: InsertArticle[] = [
    {
      stateCode: "NY",
      stateName: "New York",
      city: "New York City",
      title: "The High Line Blooms: Spring Art Installations Transform Manhattan's Elevated Park",
      summary: "New York City's beloved High Line park is bursting with spring color as a new season of immersive art installations opens along the elevated railway, drawing visitors from around the world to experience the intersection of urban nature and contemporary art.",
      content: `## Manhattan's Sky Garden Awakens\n\nThe High Line, New York City's beloved 1.45-mile elevated park built on a historic freight rail line on Manhattan's West Side, has launched its much-anticipated spring season with a series of breathtaking new art installations and horticultural displays that are drawing record crowds.\n\n## What's Blooming This Season\n\nSeasonal plantings of tulips, alliums, and native grasses create a living tapestry through the Chelsea and Hell's Kitchen neighborhoods. The park's horticultural team has curated over 500 species of plants inspired by the self-seeded landscape that grew in the rail yard's ruins before the park's opening in 2009.\n\n**Featured Installations:**\n\n- A monumental steel sculpture by Brooklyn-based artist Simone Leigh anchors the 14th Street Passage\n- Interactive light installations activate after dark along the northern stretch\n- A new community garden section invites visitors to contribute to ongoing pollinator research\n\n## Practical Information for Visitors\n\nThe High Line is free and open daily. Access points exist at Gansevoort Street, 14th, 16th, 18th, 20th, 23rd, 26th, 28th, and 30th Streets, as well as the 34th Street–Hudson Yards entrance. The park is at its most magical at golden hour, when the setting sun illuminates the Hudson River to the west.\n\n## Culinary Trail\n\nThe surrounding Meatpacking District and Chelsea neighborhoods offer a rich culinary trail. Visitors can fuel up at the celebrated Chelsea Market food hall before exploring, or grab artisan coffee at one of the many carts stationed along the route.`,
      category: "Arts & Entertainment",
      highlights: [
        "Over 500 plant species create dramatic spring displays",
        "Free admission — open daily to the public",
        "New monumental sculpture by acclaimed Brooklyn artist",
        "Multiple access points from Gansevoort to 34th Street",
        "Adjacent Chelsea Market and Meatpacking District dining",
      ],
      sources: ["High Line Official Park Updates", "NYC Parks Department", "The New York Times Arts Section"],
      publishedDate: today,
      status: "published",
      imageUrl: null,
    },
    {
      stateCode: "TX",
      stateName: "Texas",
      city: "San Antonio",
      title: "San Antonio's River Walk Fiesta Season: The Most Colorful Week in Texas",
      summary: "San Antonio's legendary Fiesta festival has transformed the city into a non-stop carnival of color, music, and food, with events spanning the River Walk and historic downtown as one of America's oldest and most beloved city celebrations returns for its 130th year.",
      content: `## Fiesta San Antonio: The Party That Defines a City\n\nFor ten days each spring, San Antonio becomes the undisputed celebration capital of America. Fiesta San Antonio, now celebrating its 130th year, draws over 3.5 million visitors for a non-stop series of parades, carnivals, music performances, and culinary events that honor the city's deep Mexican, Spanish, and Texan heritage.\n\n## Must-See Fiesta Events\n\n**The Battle of Flowers Parade** — One of the oldest parades in the United States, this spectacular procession along Broadway features floats, marching bands, and the annual crowning of the Fiesta Queen.\n\n**Fiesta Flambeau** — America's largest illuminated night parade sends over 750,000 spectators lining the streets as 75,000 participants carry glowing floats through the downtown core.\n\n**Night in Old San Antonio (NIOSA)** — Held across four evenings in the historic La Villita arts district, this beloved event serves over 200,000 people authentic regional foods representing San Antonio's multicultural heritage.\n\n## The River Walk During Fiesta\n\nThe already magical San Antonio River Walk reaches its festive peak during Fiesta. Restaurants spill onto expanded riverside decks, mariachi bands serenade diners from passing boats, and colored lights reflect off the gentle waters of the San Antonio River.`,
      category: "Events & Festivals",
      highlights: [
        "130-year-old festival drawing 3.5 million visitors",
        "Fiesta Flambeau — America's largest illuminated night parade",
        "Authentic multicultural food at Night in Old San Antonio",
        "River Walk dining reaches peak festive atmosphere",
        "Historic Alamo and King William District within walking distance",
      ],
      sources: ["Fiesta San Antonio Commission", "San Antonio Express-News", "Texas Tourism Board"],
      publishedDate: today,
      status: "published",
      imageUrl: null,
    },
    {
      stateCode: "LA",
      stateName: "Louisiana",
      city: "New Orleans",
      title: "New Orleans Jazz Fest 2026: The World's Greatest Music Festival Returns to City Park",
      summary: "The New Orleans Jazz & Heritage Festival is back with an extraordinary lineup spanning jazz, blues, gospel, Cajun, zydeco, and rock across seven stages, while local food vendors serve up the most authentic Creole and Cajun cooking found anywhere on earth.",
      content: `## Jazz Fest: Where Music and Culture Collide\n\nThe New Orleans Jazz & Heritage Festival — universally known as Jazz Fest — is not simply a music festival. It is a comprehensive celebration of the music, culture, food, and people of Louisiana, staged across the infield of the Fair Grounds Race Course over two consecutive weekends each spring.\n\n## The Music\n\nSeven stages run simultaneously from 11 AM to 7 PM daily. The main Acura Stage hosts the biggest names in music from all genres — Jazz Fest famously defies categorization, presenting jazz legends alongside rock titans, gospel choirs beside country stars, and indigenous brass bands moments from international superstars.\n\n## The Food: 100% Authentic Louisiana\n\nEvery vendor is from Louisiana, and recipes are closely vetted to ensure authenticity.\n\n**Essential dishes to seek out:**\n- Crawfish Monica — the festival's most iconic dish, a creamy pasta that has been a Jazz Fest staple for decades\n- Cochon de Lait po-boy — slow-roasted suckling pig on French bread\n- Mango freeze with a squeeze of lime\n- Bread pudding with whiskey sauce`,
      category: "Events & Festivals",
      highlights: [
        "Seven simultaneous stages spanning every American music genre",
        "The Gospel Tent — a transcendent, unmissable experience",
        "100% Louisiana-sourced food vendors with authentic Creole recipes",
        "Crawfish Monica — the festival's legendary signature dish",
        "57 years of musical heritage in a single infield",
      ],
      sources: ["New Orleans Jazz & Heritage Festival Foundation", "Louisiana Office of Tourism", "OffBeat Magazine"],
      publishedDate: today,
      status: "published",
      imageUrl: null,
    },
    {
      stateCode: "SC",
      stateName: "South Carolina",
      city: "Charleston",
      title: "Charleston in Full Bloom: Antebellum Gardens and the Romance of the Lowcountry",
      summary: "Spring has made Charleston, South Carolina arguably the most beautiful city in America right now, as centuries-old gardens burst into color and the city's remarkable preservation of Gullah Geechee culture offers travelers one of the most richly layered cultural experiences in the American South.",
      content: `## America's Most Beautiful Spring City\n\nIf there is one American city that demands a spring visit, it is Charleston, South Carolina. The combination of extraordinary antebellum architecture, ancient live oaks draped in Spanish moss, centuries-old formal gardens, and a culinary scene rooted in one of America's most distinctive indigenous cultures creates something that approaches perfection in March and April.\n\n## The Gardens\n\n**Magnolia Plantation and Gardens** — Dating to 1676, Magnolia is the oldest public garden in the United States. Its annual azalea bloom is one of the most photographed events in the American South.\n\n**Middleton Place** — The oldest landscaped formal gardens in America, designed in 1741, feature geometric terraced grass steps descending to the Ashley River.\n\n## The Gullah Geechee Culture\n\nCharleston and the Lowcountry coastline are the heartland of Gullah Geechee culture. Sweetgrass basket weaving, brought from West African traditions, is a living art form practiced by weavers on Market Street.`,
      category: "History & Heritage",
      highlights: [
        "Magnolia Plantation — oldest public garden in the US, peak azalea bloom",
        "Gullah Geechee sweetgrass basket weavers on Market Street",
        "Middleton Place — formal 1741 gardens descending to the Ashley River",
        "Shrimp and grits at a dozen celebrated local restaurants",
        "The Battery and Rainbow Row — most photogenic street in America",
      ],
      sources: ["Charleston Area Convention & Visitors Bureau", "Gullah Geechee Cultural Heritage Corridor", "Garden & Gun Magazine"],
      publishedDate: today,
      status: "published",
      imageUrl: null,
    },
  ];

  for (const seed of seeds) {
    await storage.createArticle(seed);
  }
  console.log("[seed] Populated database with sample articles.");
}

seedIfEmpty().catch(err => console.error("[seed] Error:", err));
