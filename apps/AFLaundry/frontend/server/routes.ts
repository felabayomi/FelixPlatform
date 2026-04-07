import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAppointmentSchema, updateAppointmentSchema } from "@shared/schema";
import { z } from "zod";
import { sendBookingNotification, sendPickupScheduledNotification } from "./email";
import { sendLaundryReadyNotification, sendThankYouEmail } from "./reminder-emails";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create appointment
  app.post("/api/appointments", async (req, res) => {
    try {
      const validatedData = insertAppointmentSchema.parse(req.body);
      const appointment = await storage.createAppointment(validatedData);
      
      // Generate reschedule token for the appointment
      await storage.generateRescheduleToken(appointment.id).catch(err =>
        console.error('Failed to generate reschedule token:', err)
      );
      
      // Send email notification to aflaundryservice@gmail.com
      sendBookingNotification(appointment).catch(err => 
        console.error('Failed to send email notification:', err)
      );
      
      res.json(appointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create appointment" });
      }
    }
  });

  // Get all appointments
  app.get("/api/appointments", async (req, res) => {
    try {
      const appointments = await storage.getAllAppointments();
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });

  // Get single appointment
  app.get("/api/appointments/:id", async (req, res) => {
    try {
      const appointment = await storage.getAppointment(req.params.id);
      if (!appointment) {
        res.status(404).json({ error: "Appointment not found" });
        return;
      }
      res.json(appointment);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch appointment" });
    }
  });

  // Update appointment (for scheduling pickup later)
  app.patch("/api/appointments/:id", async (req, res) => {
    try {
      const validatedUpdates = updateAppointmentSchema.parse(req.body);
      
      // Get existing appointment to check pickup status before update
      const existingAppointment = await storage.getAppointment(req.params.id);
      if (!existingAppointment) {
        res.status(404).json({ error: "Appointment not found" });
        return;
      }
      
      // Track if pickup was previously incomplete
      const hadIncompletePickup = !existingAppointment.pickupDate || !existingAppointment.pickupTime;
      const previousStatus = existingAppointment.status;
      
      const appointment = await storage.updateAppointment(req.params.id, validatedUpdates);
      if (!appointment) {
        res.status(404).json({ error: "Appointment not found" });
        return;
      }
      
      // Send pickup scheduled email if pickup just became complete (has both date AND time)
      const hasCompletePickup = appointment.pickupDate && appointment.pickupTime;
      if (hadIncompletePickup && hasCompletePickup) {
        sendPickupScheduledNotification(appointment).catch(err => 
          console.error('Failed to send pickup scheduled email notification:', err)
        );
      }
      
      // Send laundry ready email when status changes to completed (laundry is done)
      if (previousStatus !== 'completed' && appointment.status === 'completed' && appointment.pickupDate) {
        sendLaundryReadyNotification(appointment).catch(err =>
          console.error('Failed to send laundry ready notification:', err)
        );
      }
      
      res.json(appointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update appointment" });
      }
    }
  });

  // Delete appointment
  app.delete("/api/appointments/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteAppointment(req.params.id);
      if (!deleted) {
        res.status(404).json({ error: "Appointment not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete appointment" });
    }
  });

  // Get appointment by reschedule token
  app.get("/api/reschedule/:token", async (req, res) => {
    try {
      const appointment = await storage.getAppointmentByToken(req.params.token);
      if (!appointment) {
        res.status(404).json({ error: "Invalid or expired reschedule link" });
        return;
      }
      res.json(appointment);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch appointment" });
    }
  });

  // Reschedule appointment
  app.post("/api/reschedule/:token", async (req, res) => {
    try {
      const appointment = await storage.getAppointmentByToken(req.params.token);
      if (!appointment) {
        res.status(404).json({ error: "Invalid or expired reschedule link" });
        return;
      }

      // Check if trying to reschedule within 6 hours
      const now = new Date();
      const dropoffDateTime = new Date(`${appointment.dropoffDate} ${appointment.dropoffTime}`);
      const pickupDateTime = appointment.pickupDate && appointment.pickupTime 
        ? new Date(`${appointment.pickupDate} ${appointment.pickupTime}`) 
        : null;
      
      const sixHoursInMs = 6 * 60 * 60 * 1000;
      const dropoffTooSoon = dropoffDateTime.getTime() - now.getTime() < sixHoursInMs;
      const pickupTooSoon = pickupDateTime && (pickupDateTime.getTime() - now.getTime() < sixHoursInMs);

      if (dropoffTooSoon || pickupTooSoon) {
        res.status(400).json({ 
          error: "Cannot reschedule within 6 hours of appointment. Please call us at 240-664-2270" 
        });
        return;
      }

      const validatedUpdates = updateAppointmentSchema.parse(req.body);
      const updated = await storage.updateAppointment(appointment.id, validatedUpdates);
      
      if (!updated) {
        res.status(404).json({ error: "Failed to reschedule" });
        return;
      }

      res.json({ success: true, appointment: updated });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to reschedule appointment" });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
