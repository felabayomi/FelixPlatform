import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTourSchema, insertSignupSchema, insertLocalPicksSignupSchema, insertContactMessageSchema, insertNewsletterSubscriberSchema, insertUserSignupSchema, localPicksSignups } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { getImagePath } from "./imageMap";
import { sendSignupConfirmation, sendAdminNotification, sendLocalPicksConfirmation, sendLocalPicksAdminNotification, sendContactConfirmation, sendContactAdminNotification, sendNewsletterWelcome, sendUserSignupNotification } from "./email";
import { db } from "./db";
import fs from "fs";

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/images/:imageName", async (req, res) => {
    try {
      const imageName = req.params.imageName.replace(".png", "");
      const imagePath = getImagePath(imageName);
      
      if (fs.existsSync(imagePath)) {
        res.sendFile(imagePath);
      } else {
        res.status(404).send("Image not found");
      }
    } catch (error) {
      console.error("Image serving error:", error);
      res.status(500).send("Error serving image");
    }
  });

  app.get("/api/tours", async (req, res) => {
    try {
      const tours = await storage.getTours();
      res.json(tours);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tours" });
    }
  });

  app.get("/api/tours/:id", async (req, res) => {
    try {
      const tour = await storage.getTour(req.params.id);
      if (!tour) {
        return res.status(404).json({ error: "Tour not found" });
      }
      res.json(tour);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tour" });
    }
  });

  app.post("/api/tours", async (req, res) => {
    try {
      const validationResult = insertTourSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).message;
        return res.status(400).json({ error: errorMessage });
      }

      const currentParticipants = typeof req.body.currentParticipants === 'number' 
        ? req.body.currentParticipants 
        : parseInt(req.body.currentParticipants) || 0;

      const tourData = {
        ...validationResult.data,
        currentParticipants
      };

      const tour = await storage.createTour(tourData);
      res.status(201).json(tour);
    } catch (error) {
      console.error("Create tour error:", error);
      res.status(500).json({ error: "Failed to create tour" });
    }
  });

  app.patch("/api/tours/:id", async (req, res) => {
    try {
      const tour = await storage.updateTour(req.params.id, req.body);
      res.json(tour);
    } catch (error) {
      if (error instanceof Error && error.message === "Tour not found") {
        return res.status(404).json({ error: "Tour not found" });
      }
      console.error("Update tour error:", error);
      res.status(500).json({ error: "Failed to update tour" });
    }
  });

  app.delete("/api/tours/:id", async (req, res) => {
    try {
      await storage.deleteTour(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete tour error:", error);
      res.status(500).json({ error: "Failed to delete tour" });
    }
  });

  app.post("/api/signups", async (req, res) => {
    try {
      const validationResult = insertSignupSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).message;
        return res.status(400).json({ error: errorMessage });
      }

      const tour = await storage.getTour(validationResult.data.tourId);
      if (!tour) {
        return res.status(404).json({ error: "Tour not found" });
      }

      const spotsLeft = tour.maxParticipants - tour.currentParticipants;
      if (spotsLeft < validationResult.data.participants) {
        return res.status(400).json({ 
          error: `Not enough spots available. Only ${spotsLeft} spots remaining.` 
        });
      }

      const signup = await storage.createSignup(validationResult.data);

      sendSignupConfirmation(signup, tour).catch((error) => {
        console.error("Failed to send confirmation email:", error);
      });

      sendAdminNotification(signup, tour).catch((error) => {
        console.error("Failed to send admin notification:", error);
      });

      res.status(201).json(signup);
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ error: "Failed to create signup" });
    }
  });

  app.post("/api/local-picks", async (req, res) => {
    try {
      const validationResult = insertLocalPicksSignupSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).message;
        return res.status(400).json({ error: errorMessage });
      }

      const result = await db.insert(localPicksSignups).values(validationResult.data).returning();
      const signup = result[0];

      sendLocalPicksConfirmation(signup).catch((error) => {
        console.error("Failed to send Local Picks confirmation email:", error);
      });

      sendLocalPicksAdminNotification(signup).catch((error) => {
        console.error("Failed to send Local Picks admin notification:", error);
      });

      res.status(201).json(signup);
    } catch (error) {
      console.error("Local Picks signup error:", error);
      res.status(500).json({ error: "Failed to create Local Picks signup" });
    }
  });

  app.post("/api/contact", async (req, res) => {
    try {
      const validationResult = insertContactMessageSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).message;
        return res.status(400).json({ error: errorMessage });
      }

      if (validationResult.data.honeypot && validationResult.data.honeypot.length > 0) {
        return res.status(400).json({ error: "Invalid submission" });
      }

      const message = await storage.createContactMessage(validationResult.data);

      sendContactConfirmation(message).catch((error) => {
        console.error("Failed to send contact confirmation email:", error);
      });

      sendContactAdminNotification(message).catch((error) => {
        console.error("Failed to send contact admin notification:", error);
      });

      res.status(201).json(message);
    } catch (error) {
      console.error("Contact form error:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  app.post("/api/newsletter", async (req, res) => {
    try {
      const validationResult = insertNewsletterSubscriberSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).message;
        return res.status(400).json({ error: errorMessage });
      }

      const subscriber = await storage.createNewsletterSubscriber(validationResult.data);

      sendNewsletterWelcome(subscriber).catch((error) => {
        console.error("Failed to send newsletter welcome email:", error);
      });

      res.status(201).json({ message: "Successfully subscribed to newsletter!" });
    } catch (error: any) {
      console.error("Newsletter signup error:", error);
      
      if (error.code === '23505') {
        return res.status(400).json({ error: "This email is already subscribed to our newsletter" });
      }
      
      res.status(500).json({ error: "Failed to subscribe to newsletter" });
    }
  });

  app.post("/api/user-signup", async (req, res) => {
    try {
      const validationResult = insertUserSignupSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).message;
        return res.status(400).json({ error: errorMessage });
      }

      const userSignup = await storage.createUserSignup(validationResult.data);

      sendUserSignupNotification(userSignup).catch((error) => {
        console.error("Failed to send user signup notification:", error);
      });

      res.status(201).json({ message: "Account request submitted successfully!" });
    } catch (error: any) {
      console.error("User signup error:", error);
      res.status(500).json({ error: "Failed to submit account request" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
