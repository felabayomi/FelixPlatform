import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, decimal, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email").notNull(),
  dropoffDate: text("dropoff_date").notNull(),
  dropoffTime: text("dropoff_time").notNull(),
  pickupDate: text("pickup_date"),
  pickupTime: text("pickup_time"),
  soapType: text("soap_type").notNull(),
  hasHeavyItems: boolean("has_heavy_items").default(false),
  heavyItemsCount: integer("heavy_items_count").default(0),
  specialInstructions: text("special_instructions"),
  status: text("status").notNull().default("scheduled"),
  rescheduleToken: text("reschedule_token"),
  remindersSent: text("reminders_sent").array().default(sql`ARRAY[]::text[]`),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
  status: true,
  rescheduleToken: true,
  remindersSent: true,
}).extend({
  customerEmail: z.string().email(),
  customerPhone: z.string().min(10),
});

export const updateAppointmentSchema = insertAppointmentSchema.partial().extend({
  status: z.enum(["scheduled", "in-progress", "completed", "cancelled"]).optional(),
});

export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type UpdateAppointment = z.infer<typeof updateAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;
