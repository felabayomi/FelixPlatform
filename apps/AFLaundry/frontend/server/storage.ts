import { type Appointment, type InsertAppointment, type UpdateAppointment } from "@shared/schema";
import { randomUUID } from "crypto";

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
      hasHeavyItems: insertAppointment.hasHeavyItems ?? null,
      heavyItemsCount: insertAppointment.heavyItemsCount ?? null,
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
      hasHeavyItems: updates.hasHeavyItems !== undefined ? updates.hasHeavyItems ?? null : appointment.hasHeavyItems,
      heavyItemsCount: updates.heavyItemsCount !== undefined ? updates.heavyItemsCount ?? null : appointment.heavyItemsCount,
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
    if (appointment) {
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
    return Array.from(this.appointments.values()).find(apt => apt.rescheduleToken === token);
  }
}

export const storage = new MemStorage();
