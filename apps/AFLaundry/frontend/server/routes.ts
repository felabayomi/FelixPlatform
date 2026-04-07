import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAppointmentSchema, updateAppointmentSchema } from "@shared/schema";
import { z } from "zod";
import { sendBookingNotification, sendPickupScheduledNotification, sendQuoteRequestNotificationEmail } from "./email";
import { sendLaundryReadyNotification, sendThankYouEmail } from "./reminder-emails";

const FELIX_PLATFORM_API_BASE_URL = (process.env.FELIX_PLATFORM_API_BASE_URL
  || process.env.FELIX_BACKEND_URL
  || "https://felix-platform-backend.onrender.com").replace(/\/$/, "");

const quoteRequestSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  customerPhone: z.string().min(10, "Customer phone is required"),
  customerEmail: z.string().email("A valid email address is required"),
  serviceType: z.string().min(1, "Service type is required"),
  preferredDate: z.string().min(1, "Preferred date is required"),
  serviceWindow: z.string().optional().nullable(),
  pickupAddress: z.string().min(1, "Pickup or contact address is required"),
  deliveryAddress: z.string().optional().nullable(),
  estimatedWeight: z.string().optional().nullable(),
  preferredFulfillment: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  source: z.string().optional().default("web"),
});

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

  // Get all appointments or filter by customer contact info for public tracking
  app.get("/api/appointments", async (req, res) => {
    try {
      const phone = typeof req.query.phone === "string" ? req.query.phone : undefined;
      const email = typeof req.query.email === "string" ? req.query.email : undefined;
      const appointments = phone || email
        ? await storage.findAppointmentsByContact(phone, email)
        : await storage.getAllAppointments();
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

  // Submit a public laundry quote request into the shared Felix Platform workflow
  app.post("/api/quotes", async (req, res) => {
    try {
      const validatedData = quoteRequestSchema.parse(req.body);
      const estimatedWeightNumber = Number.parseInt(String(validatedData.estimatedWeight ?? ""), 10);

      const detailLines = [
        "App: A & F Laundry",
        `Source: ${validatedData.source || "web"}`,
        `Customer: ${validatedData.customerName}`,
        `Phone: ${validatedData.customerPhone}`,
        `Email: ${validatedData.customerEmail}`,
        `Service type: ${validatedData.serviceType}`,
        `Service date: ${validatedData.preferredDate}`,
        validatedData.serviceWindow ? `Window: ${validatedData.serviceWindow}` : null,
        `Pickup address: ${validatedData.pickupAddress}`,
        validatedData.deliveryAddress ? `Delivery address: ${validatedData.deliveryAddress}` : null,
        validatedData.estimatedWeight ? `Weight estimate: ${validatedData.estimatedWeight} lbs` : null,
        validatedData.preferredFulfillment ? `Preferred fulfillment: ${validatedData.preferredFulfillment}` : null,
        "Reference estimate: $1.50 per pound base rate",
        validatedData.notes ? `Notes: ${validatedData.notes}` : null,
      ].filter(Boolean).join("\n");

      const upstreamResponse = await fetch(`${FELIX_PLATFORM_API_BASE_URL}/quote-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id: null,
          quantity: Number.isFinite(estimatedWeightNumber) && estimatedWeightNumber > 0 ? estimatedWeightNumber : 1,
          details: detailLines,
          status: "pending",
          quoted_price: null,
          admin_notes: null,
        }),
      });

      const upstreamBody = await upstreamResponse.text();

      if (!upstreamResponse.ok) {
        res.status(upstreamResponse.status).send(upstreamBody || "Failed to submit quote request");
        return;
      }

      const parsedQuoteResponse = upstreamBody ? JSON.parse(upstreamBody) : {};
      const emailResult = await sendQuoteRequestNotificationEmail({
        id: parsedQuoteResponse.id,
        customerName: validatedData.customerName,
        customerPhone: validatedData.customerPhone,
        customerEmail: validatedData.customerEmail,
        serviceType: validatedData.serviceType,
        preferredDate: validatedData.preferredDate,
        serviceWindow: validatedData.serviceWindow,
        pickupAddress: validatedData.pickupAddress,
        deliveryAddress: validatedData.deliveryAddress,
        estimatedWeight: validatedData.estimatedWeight,
        preferredFulfillment: validatedData.preferredFulfillment,
        notes: validatedData.notes,
      });

      res.status(upstreamResponse.status).json({
        ...parsedQuoteResponse,
        admin_email_sent: Boolean(emailResult.adminEmailResult?.success || parsedQuoteResponse.admin_email_sent),
        customer_email_sent: Boolean(emailResult.customerEmailResult?.success || parsedQuoteResponse.customer_email_sent),
        customer_email_recipient: validatedData.customerEmail,
        quote_email_provider: "A&F Laundry Resend",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        console.error("Failed to submit laundry quote request:", error);
        res.status(500).json({ error: "Failed to submit quote request" });
      }
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
