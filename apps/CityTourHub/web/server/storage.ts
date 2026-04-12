import { 
  type Tour, 
  type InsertTour, 
  type Signup, 
  type InsertSignup, 
  type ContactMessage,
  type InsertContactMessage,
  type LocalPicksSignup,
  type InsertLocalPicksSignup,
  type NewsletterSubscriber,
  type InsertNewsletterSubscriber,
  type UserSignup,
  type InsertUserSignup,
  tours, 
  signups,
  contactMessages,
  localPicksSignups,
  newsletterSubscribers,
  userSignups
} from "@shared/schema";
import { randomUUID } from "crypto";
import { tourData } from "./tourData";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";

export interface IStorage {
  getTours(): Promise<Tour[]>;
  getTour(id: string): Promise<Tour | undefined>;
  createTour(tour: InsertTour): Promise<Tour>;
  updateTour(id: string, tour: Partial<InsertTour>): Promise<Tour>;
  deleteTour(id: string): Promise<void>;
  createSignup(signup: InsertSignup): Promise<Signup>;
  getSignupsByTourId(tourId: string): Promise<Signup[]>;
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
  createLocalPicksSignup(signup: InsertLocalPicksSignup): Promise<LocalPicksSignup>;
  createNewsletterSubscriber(subscriber: InsertNewsletterSubscriber): Promise<NewsletterSubscriber>;
  createUserSignup(userSignup: InsertUserSignup): Promise<UserSignup>;
}

export class MemStorage implements IStorage {
  private tours: Map<string, Tour>;
  private signups: Map<string, Signup>;
  private contactMessages: Map<string, ContactMessage>;
  private localPicksSignups: Map<string, LocalPicksSignup>;
  private newsletterSubscribers: Map<string, NewsletterSubscriber>;

  constructor() {
    this.tours = new Map();
    this.signups = new Map();
    this.contactMessages = new Map();
    this.localPicksSignups = new Map();
    this.newsletterSubscribers = new Map();
    this.initializeTours();
  }

  private initializeTours() {
    tourData.forEach((tour) => {
      const id = randomUUID();
      const currentParticipants = Math.floor(Math.random() * Math.min(tour.maxParticipants - 5, 8));
      this.tours.set(id, { ...tour, id, currentParticipants });
    });
  }

  async getTours(): Promise<Tour[]> {
    return Array.from(this.tours.values());
  }

  async getTour(id: string): Promise<Tour | undefined> {
    return this.tours.get(id);
  }

  async createTour(insertTour: InsertTour): Promise<Tour> {
    const id = randomUUID();
    const tour: Tour = { ...insertTour, id, currentParticipants: 0 };
    this.tours.set(id, tour);
    return tour;
  }

  async updateTour(id: string, updates: Partial<InsertTour>): Promise<Tour> {
    const tour = this.tours.get(id);
    if (!tour) {
      throw new Error("Tour not found");
    }
    const updatedTour = { ...tour, ...updates };
    this.tours.set(id, updatedTour);
    return updatedTour;
  }

  async deleteTour(id: string): Promise<void> {
    this.tours.delete(id);
  }

  async createSignup(insertSignup: InsertSignup): Promise<Signup> {
    const id = randomUUID();
    const signup: Signup = { 
      ...insertSignup,
      receiveUpdates: insertSignup.receiveUpdates ?? 0,
      id, 
      createdAt: new Date()
    };
    this.signups.set(id, signup);

    const tour = this.tours.get(insertSignup.tourId);
    if (tour) {
      tour.currentParticipants += insertSignup.participants;
      this.tours.set(tour.id, tour);
    }

    return signup;
  }

  async getSignupsByTourId(tourId: string): Promise<Signup[]> {
    return Array.from(this.signups.values()).filter(
      (signup) => signup.tourId === tourId
    );
  }

  async createContactMessage(insertMessage: InsertContactMessage): Promise<ContactMessage> {
    const id = randomUUID();
    const message: ContactMessage = {
      id,
      fullName: insertMessage.fullName,
      email: insertMessage.email,
      subject: insertMessage.subject,
      message: insertMessage.message,
      createdAt: new Date(),
    };
    this.contactMessages.set(id, message);
    return message;
  }

  async createLocalPicksSignup(insertSignup: InsertLocalPicksSignup): Promise<LocalPicksSignup> {
    const id = randomUUID();
    const signup: LocalPicksSignup = {
      id,
      fullName: insertSignup.fullName,
      email: insertSignup.email,
      phone: insertSignup.phone,
      preferredStates: insertSignup.preferredStates,
      startDate: insertSignup.startDate,
      endDate: insertSignup.endDate,
      interests: insertSignup.interests,
      createdAt: new Date(),
    };
    this.localPicksSignups.set(id, signup);
    return signup;
  }

  async createNewsletterSubscriber(insertSubscriber: InsertNewsletterSubscriber): Promise<NewsletterSubscriber> {
    const id = randomUUID();
    const subscriber: NewsletterSubscriber = {
      id,
      email: insertSubscriber.email,
      subscribedAt: new Date(),
    };
    this.newsletterSubscribers.set(id, subscriber);
    return subscriber;
  }

  async createUserSignup(insertUserSignup: InsertUserSignup): Promise<UserSignup> {
    const id = randomUUID();
    const userSignup: UserSignup = {
      id,
      username: insertUserSignup.username,
      email: insertUserSignup.email,
      firstName: insertUserSignup.firstName,
      lastName: insertUserSignup.lastName,
      website: insertUserSignup.website || null,
      createdAt: new Date(),
    };
    return userSignup;
  }
}

export class DbStorage implements IStorage {
  private initPromise: Promise<void> | null = null;

  async init() {
    if (this.initPromise) {
      return this.initPromise;
    }
    
    this.initPromise = (async () => {
      const existingTours = await db.select().from(tours);
      if (existingTours.length === 0) {
        for (const tour of tourData) {
          await db.insert(tours).values({
            city: tour.city,
            state: tour.state,
            description: tour.description,
            highlights: tour.highlights,
            startDate: tour.startDate,
            endDate: tour.endDate,
            maxParticipants: tour.maxParticipants,
            currentParticipants: 3,
            imageUrl: tour.imageUrl,
          });
        }
      }
    })();
    
    return this.initPromise;
  }

  async getTours(): Promise<Tour[]> {
    await this.init();
    return await db.select().from(tours);
  }

  async getTour(id: string): Promise<Tour | undefined> {
    await this.init();
    const result = await db.select().from(tours).where(eq(tours.id, id));
    return result[0];
  }

  async createTour(insertTour: InsertTour): Promise<Tour> {
    await this.init();
    const result = await db.insert(tours).values(insertTour).returning();
    return result[0];
  }

  async updateTour(id: string, updates: Partial<InsertTour>): Promise<Tour> {
    await this.init();
    const result = await db.update(tours)
      .set(updates)
      .where(eq(tours.id, id))
      .returning();
    if (result.length === 0) {
      throw new Error("Tour not found");
    }
    return result[0];
  }

  async deleteTour(id: string): Promise<void> {
    await this.init();
    await db.delete(tours).where(eq(tours.id, id));
  }

  async createSignup(insertSignup: InsertSignup): Promise<Signup> {
    await this.init();
    
    const result = await db.insert(signups).values(insertSignup).returning();
    const signup = result[0];

    await db
      .update(tours)
      .set({
        currentParticipants: sql`${tours.currentParticipants} + ${insertSignup.participants}`,
      })
      .where(eq(tours.id, insertSignup.tourId));

    return signup;
  }

  async getSignupsByTourId(tourId: string): Promise<Signup[]> {
    await this.init();
    return await db.select().from(signups).where(eq(signups.tourId, tourId));
  }

  async createContactMessage(insertMessage: InsertContactMessage): Promise<ContactMessage> {
    await this.init();
    const result = await db.insert(contactMessages).values({
      fullName: insertMessage.fullName,
      email: insertMessage.email,
      subject: insertMessage.subject,
      message: insertMessage.message,
    }).returning();
    return result[0];
  }

  async createLocalPicksSignup(insertSignup: InsertLocalPicksSignup): Promise<LocalPicksSignup> {
    await this.init();
    const result = await db.insert(localPicksSignups).values(insertSignup).returning();
    return result[0];
  }

  async createNewsletterSubscriber(insertSubscriber: InsertNewsletterSubscriber): Promise<NewsletterSubscriber> {
    await this.init();
    const result = await db.insert(newsletterSubscribers).values(insertSubscriber).returning();
    return result[0];
  }

  async createUserSignup(insertUserSignup: InsertUserSignup): Promise<UserSignup> {
    await this.init();
    const result = await db.insert(userSignups).values(insertUserSignup).returning();
    return result[0];
  }
}

export const storage = new DbStorage();
