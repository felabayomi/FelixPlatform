import { Pool } from "@neondatabase/serverless";
import { randomUUID } from "crypto";
import { type Appointment, type InsertAppointment, type UpdateAppointment } from "@shared/schema";

export interface IStorage {
  getAppointment(id: string): Promise<Appointment | undefined>;
  getAllAppointments(): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: string, appointment: UpdateAppointment): Promise<Appointment | undefined>;
  deleteAppointment(id: string): Promise<boolean>;
  addReminderSent(id: string, reminderType: string): Promise<void>;
  generateRescheduleToken(id: string): Promise<string>;
  getAppointmentByToken(token: string): Promise<Appointment | undefined>;
}

type AppointmentRow = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  dropoffDate: string;
  dropoffTime: string;
  pickupDate: string | null;
  pickupTime: string | null;
  soapType: string;
  hasHeavyItems: boolean | null;
  heavyItemsCount: number | null;
  specialInstructions: string | null;
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  rescheduleToken: string | null;
  remindersSent: string[] | null;
  createdAt: string | Date | null;
};

const databaseUrl = process.env.DATABASE_URL?.trim();
const pool = databaseUrl ? new Pool({ connectionString: databaseUrl }) : null;
let databaseReadyPromise: Promise<void> | null = null;

const appointmentSelect = `
  SELECT
    id,
    customer_name AS "customerName",
    customer_phone AS "customerPhone",
    customer_email AS "customerEmail",
    dropoff_date AS "dropoffDate",
    dropoff_time AS "dropoffTime",
    pickup_date AS "pickupDate",
    pickup_time AS "pickupTime",
    soap_type AS "soapType",
    has_heavy_items AS "hasHeavyItems",
    heavy_items_count AS "heavyItemsCount",
    special_instructions AS "specialInstructions",
    status,
    reschedule_token AS "rescheduleToken",
    reminders_sent AS "remindersSent",
    created_at AS "createdAt"
  FROM appointments
`;

function mapRowToAppointment(row: AppointmentRow): Appointment {
  return {
    ...row,
    pickupDate: row.pickupDate ?? null,
    pickupTime: row.pickupTime ?? null,
    hasHeavyItems: row.hasHeavyItems ?? false,
    heavyItemsCount: row.heavyItemsCount ?? 0,
    specialInstructions: row.specialInstructions ?? null,
    rescheduleToken: row.rescheduleToken ?? null,
    remindersSent: row.remindersSent ?? [],
    createdAt: row.createdAt ? new Date(row.createdAt) : null,
  };
}

async function ensureDatabaseReady() {
  if (!pool) {
    return;
  }

  if (!databaseReadyPromise) {
    databaseReadyPromise = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS appointments (
          id text PRIMARY KEY,
          customer_name text NOT NULL,
          customer_phone text NOT NULL,
          customer_email text NOT NULL,
          dropoff_date text NOT NULL,
          dropoff_time text NOT NULL,
          pickup_date text,
          pickup_time text,
          soap_type text NOT NULL,
          has_heavy_items boolean DEFAULT false,
          heavy_items_count integer DEFAULT 0,
          special_instructions text,
          status text NOT NULL DEFAULT 'scheduled',
          reschedule_token text,
          reminders_sent text[] NOT NULL DEFAULT ARRAY[]::text[],
          created_at timestamptz NOT NULL DEFAULT now()
        )
      `);
      await pool.query(`CREATE INDEX IF NOT EXISTS appointments_reschedule_token_idx ON appointments (reschedule_token)`);
      await pool.query(`CREATE INDEX IF NOT EXISTS appointments_dropoff_date_idx ON appointments (dropoff_date)`);
    })().catch((error) => {
      databaseReadyPromise = null;
      throw error;
    });
  }

  await databaseReadyPromise;
}

export class MemStorage implements IStorage {
  private appointments: Map<string, Appointment>;

  constructor() {
    this.appointments = new Map();
  }

  async getAppointment(id: string): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }

  async getAllAppointments(): Promise<Appointment[]> {
    return Array.from(this.appointments.values());
  }

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const id = randomUUID();
    const appointment: Appointment = {
      id,
      customerName: insertAppointment.customerName,
      customerPhone: insertAppointment.customerPhone,
      customerEmail: insertAppointment.customerEmail,
      dropoffDate: insertAppointment.dropoffDate,
      dropoffTime: insertAppointment.dropoffTime,
      pickupDate: insertAppointment.pickupDate ?? null,
      pickupTime: insertAppointment.pickupTime ?? null,
      soapType: insertAppointment.soapType,
      hasHeavyItems: insertAppointment.hasHeavyItems ?? false,
      heavyItemsCount: insertAppointment.heavyItemsCount ?? 0,
      specialInstructions: insertAppointment.specialInstructions ?? null,
      status: "scheduled",
      rescheduleToken: null,
      remindersSent: [],
      createdAt: new Date(),
    };

    this.appointments.set(id, appointment);
    return appointment;
  }

  async updateAppointment(id: string, updates: UpdateAppointment): Promise<Appointment | undefined> {
    const appointment = this.appointments.get(id);
    if (!appointment) return undefined;

    const updated: Appointment = {
      ...appointment,
      ...updates,
      pickupDate: updates.pickupDate !== undefined ? updates.pickupDate ?? null : appointment.pickupDate,
      pickupTime: updates.pickupTime !== undefined ? updates.pickupTime ?? null : appointment.pickupTime,
      hasHeavyItems: updates.hasHeavyItems !== undefined ? updates.hasHeavyItems ?? false : appointment.hasHeavyItems,
      heavyItemsCount: updates.heavyItemsCount !== undefined ? updates.heavyItemsCount ?? 0 : appointment.heavyItemsCount,
      specialInstructions: updates.specialInstructions !== undefined ? updates.specialInstructions ?? null : appointment.specialInstructions,
    };

    this.appointments.set(id, updated);
    return updated;
  }

  async deleteAppointment(id: string): Promise<boolean> {
    return this.appointments.delete(id);
  }

  async addReminderSent(id: string, reminderType: string): Promise<void> {
    const appointment = this.appointments.get(id);
    if (appointment && !(appointment.remindersSent || []).includes(reminderType)) {
      appointment.remindersSent = [...(appointment.remindersSent || []), reminderType];
      this.appointments.set(id, appointment);
    }
  }

  async generateRescheduleToken(id: string): Promise<string> {
    const appointment = this.appointments.get(id);
    if (!appointment) throw new Error("Appointment not found");

    const token = randomUUID();
    appointment.rescheduleToken = token;
    this.appointments.set(id, appointment);
    return token;
  }

  async getAppointmentByToken(token: string): Promise<Appointment | undefined> {
    return Array.from(this.appointments.values()).find((apt) => apt.rescheduleToken === token);
  }
}

export class DatabaseStorage implements IStorage {
  private async fetchAppointments(queryText: string, params: unknown[] = []): Promise<Appointment[]> {
    await ensureDatabaseReady();
    const result = await pool!.query<AppointmentRow>(queryText, params);
    return result.rows.map(mapRowToAppointment);
  }

  private async saveAppointment(appointment: Appointment): Promise<Appointment> {
    await ensureDatabaseReady();

    const result = await pool!.query<AppointmentRow>(
      `
        UPDATE appointments
        SET
          customer_name = $2,
          customer_phone = $3,
          customer_email = $4,
          dropoff_date = $5,
          dropoff_time = $6,
          pickup_date = $7,
          pickup_time = $8,
          soap_type = $9,
          has_heavy_items = $10,
          heavy_items_count = $11,
          special_instructions = $12,
          status = $13,
          reschedule_token = $14,
          reminders_sent = $15
        WHERE id = $1
        RETURNING
          id,
          customer_name AS "customerName",
          customer_phone AS "customerPhone",
          customer_email AS "customerEmail",
          dropoff_date AS "dropoffDate",
          dropoff_time AS "dropoffTime",
          pickup_date AS "pickupDate",
          pickup_time AS "pickupTime",
          soap_type AS "soapType",
          has_heavy_items AS "hasHeavyItems",
          heavy_items_count AS "heavyItemsCount",
          special_instructions AS "specialInstructions",
          status,
          reschedule_token AS "rescheduleToken",
          reminders_sent AS "remindersSent",
          created_at AS "createdAt"
      `,
      [
        appointment.id,
        appointment.customerName,
        appointment.customerPhone,
        appointment.customerEmail,
        appointment.dropoffDate,
        appointment.dropoffTime,
        appointment.pickupDate ?? null,
        appointment.pickupTime ?? null,
        appointment.soapType,
        appointment.hasHeavyItems ?? false,
        appointment.heavyItemsCount ?? 0,
        appointment.specialInstructions ?? null,
        appointment.status,
        appointment.rescheduleToken ?? null,
        appointment.remindersSent ?? [],
      ],
    );

    return mapRowToAppointment(result.rows[0]);
  }

  async getAppointment(id: string): Promise<Appointment | undefined> {
    const [appointment] = await this.fetchAppointments(`${appointmentSelect} WHERE id = $1 LIMIT 1`, [id]);
    return appointment;
  }

  async getAllAppointments(): Promise<Appointment[]> {
    return this.fetchAppointments(`${appointmentSelect} ORDER BY created_at DESC`);
  }

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    await ensureDatabaseReady();

    const id = randomUUID();
    const result = await pool!.query<AppointmentRow>(
      `
        INSERT INTO appointments (
          id,
          customer_name,
          customer_phone,
          customer_email,
          dropoff_date,
          dropoff_time,
          pickup_date,
          pickup_time,
          soap_type,
          has_heavy_items,
          heavy_items_count,
          special_instructions,
          status,
          reschedule_token
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING
          id,
          customer_name AS "customerName",
          customer_phone AS "customerPhone",
          customer_email AS "customerEmail",
          dropoff_date AS "dropoffDate",
          dropoff_time AS "dropoffTime",
          pickup_date AS "pickupDate",
          pickup_time AS "pickupTime",
          soap_type AS "soapType",
          has_heavy_items AS "hasHeavyItems",
          heavy_items_count AS "heavyItemsCount",
          special_instructions AS "specialInstructions",
          status,
          reschedule_token AS "rescheduleToken",
          reminders_sent AS "remindersSent",
          created_at AS "createdAt"
      `,
      [
        id,
        insertAppointment.customerName,
        insertAppointment.customerPhone,
        insertAppointment.customerEmail,
        insertAppointment.dropoffDate,
        insertAppointment.dropoffTime,
        insertAppointment.pickupDate ?? null,
        insertAppointment.pickupTime ?? null,
        insertAppointment.soapType,
        insertAppointment.hasHeavyItems ?? false,
        insertAppointment.heavyItemsCount ?? 0,
        insertAppointment.specialInstructions ?? null,
        "scheduled",
        null,
      ],
    );

    return mapRowToAppointment(result.rows[0]);
  }

  async updateAppointment(id: string, updates: UpdateAppointment): Promise<Appointment | undefined> {
    const existing = await this.getAppointment(id);
    if (!existing) {
      return undefined;
    }

    const merged: Appointment = {
      ...existing,
      ...updates,
      pickupDate: updates.pickupDate !== undefined ? updates.pickupDate ?? null : existing.pickupDate,
      pickupTime: updates.pickupTime !== undefined ? updates.pickupTime ?? null : existing.pickupTime,
      hasHeavyItems: updates.hasHeavyItems !== undefined ? updates.hasHeavyItems ?? false : existing.hasHeavyItems,
      heavyItemsCount: updates.heavyItemsCount !== undefined ? updates.heavyItemsCount ?? 0 : existing.heavyItemsCount,
      specialInstructions: updates.specialInstructions !== undefined ? updates.specialInstructions ?? null : existing.specialInstructions,
    };

    return this.saveAppointment(merged);
  }

  async deleteAppointment(id: string): Promise<boolean> {
    await ensureDatabaseReady();
    const result = await pool!.query<{ id: string }>(`DELETE FROM appointments WHERE id = $1 RETURNING id`, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async addReminderSent(id: string, reminderType: string): Promise<void> {
    const existing = await this.getAppointment(id);
    if (!existing || (existing.remindersSent || []).includes(reminderType)) {
      return;
    }

    await this.saveAppointment({
      ...existing,
      remindersSent: [...(existing.remindersSent || []), reminderType],
    });
  }

  async generateRescheduleToken(id: string): Promise<string> {
    const existing = await this.getAppointment(id);
    if (!existing) {
      throw new Error("Appointment not found");
    }

    const token = randomUUID();
    await this.saveAppointment({
      ...existing,
      rescheduleToken: token,
    });
    return token;
  }

  async getAppointmentByToken(token: string): Promise<Appointment | undefined> {
    const [appointment] = await this.fetchAppointments(`${appointmentSelect} WHERE reschedule_token = $1 LIMIT 1`, [token]);
    return appointment;
  }
}

function createStorage(): IStorage {
  if (pool) {
    console.log("[Storage] Using Neon Postgres for persistent A&F Laundry appointments.");
    return new DatabaseStorage();
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("[Storage] DATABASE_URL is required in production for persistent A&F Laundry bookings.");
  }

  console.warn("[Storage] DATABASE_URL is not set. Falling back to in-memory storage for local development.");
  return new MemStorage();
}

export const storage = createStorage();

export async function prepareStorage() {
  if (storage instanceof DatabaseStorage) {
    await ensureDatabaseReady();
  }
}
