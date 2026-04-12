import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const tours = pgTable("tours", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  city: text("city").notNull(),
  state: text("state").notNull(),
  description: text("description").notNull(),
  highlights: text("highlights").array().notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  maxParticipants: integer("max_participants").notNull(),
  currentParticipants: integer("current_participants").notNull().default(0),
  imageUrl: text("image_url").notNull(),
});

export const signups = pgTable("signups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tourId: varchar("tour_id").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  participants: integer("participants").notNull(),
  receiveUpdates: integer("receive_updates").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const localPicksSignups = pgTable("local_picks_signups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  preferredStates: text("preferred_states").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  interests: text("interests").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const contactMessages = pgTable("contact_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  subscribedAt: timestamp("subscribed_at").notNull().defaultNow(),
});

export const userSignups = pgTable("user_signups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull(),
  email: text("email").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  website: text("website"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTourSchema = createInsertSchema(tours).omit({
  id: true,
  currentParticipants: true,
});

export const adminTourSchema = createInsertSchema(tours).omit({
  id: true,
});

export const insertSignupSchema = createInsertSchema(signups).omit({
  id: true,
  createdAt: true,
}).extend({
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  participants: z.number().min(1, "At least 1 participant is required").max(10, "Maximum 10 participants per booking"),
});

export const insertLocalPicksSignupSchema = createInsertSchema(localPicksSignups).omit({
  id: true,
  createdAt: true,
}).extend({
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  preferredStates: z.string().min(1, "Please select at least one state"),
  startDate: z.string().min(1, "Please select a start date"),
  endDate: z.string().min(1, "Please select an end date"),
  interests: z.string().min(10, "Please tell us a bit about your interests (at least 10 characters)"),
});

export const insertContactMessageSchema = createInsertSchema(contactMessages).omit({
  id: true,
  createdAt: true,
}).extend({
  email: z.string().email("Please enter a valid email address"),
  fullName: z.string().min(2, "Please enter your full name"),
  subject: z.string().min(3, "Please enter a subject"),
  message: z.string().min(10, "Please enter a message (at least 10 characters)"),
  honeypot: z.string().max(0, "Invalid submission").optional(),
});

export const insertNewsletterSubscriberSchema = createInsertSchema(newsletterSubscribers).omit({
  id: true,
  subscribedAt: true,
}).extend({
  email: z.string().email("Please enter a valid email address"),
});

export const insertUserSignupSchema = createInsertSchema(userSignups).omit({
  id: true,
  createdAt: true,
}).extend({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  firstName: z.string().min(2, "Please enter your first name"),
  lastName: z.string().min(2, "Please enter your last name"),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
});

export type InsertTour = z.infer<typeof insertTourSchema>;
export type AdminTour = z.infer<typeof adminTourSchema>;
export type Tour = typeof tours.$inferSelect;
export type InsertSignup = z.infer<typeof insertSignupSchema>;
export type Signup = typeof signups.$inferSelect;
export type InsertLocalPicksSignup = z.infer<typeof insertLocalPicksSignupSchema>;
export type LocalPicksSignup = typeof localPicksSignups.$inferSelect;
export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;
export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertNewsletterSubscriber = z.infer<typeof insertNewsletterSubscriberSchema>;
export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type InsertUserSignup = z.infer<typeof insertUserSignupSchema>;
export type UserSignup = typeof userSignups.$inferSelect;
