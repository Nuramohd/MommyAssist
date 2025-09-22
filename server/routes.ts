import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  insertAncAppointmentSchema,
  insertRiskAssessmentSchema,
  insertImmunizationSchema,
  insertCommunityPostSchema,
  insertCommunityCommentSchema,
} from "@shared/schema";
import { ZodError } from "zod";

// ML Risk Assessment Mock (replace with actual ML model integration)
async function assessRisk(data: {
  bloodPressure?: string;
  weight?: number;
  babyMovement?: string;
  symptoms?: string;
  pregnancyWeeks?: number;
}): Promise<{
  riskLevel: string;
  riskFactors: string[];
  recommendations: string;
}> {
  // This is a simplified mock - replace with actual ML model
  const riskFactors: string[] = [];
  let riskLevel = "low";
  
  if (data.bloodPressure && (data.bloodPressure.includes("high") || data.bloodPressure.includes("140"))) {
    riskFactors.push("High blood pressure");
    riskLevel = "high";
  }
  
  if (data.weight && data.pregnancyWeeks) {
    // Simple weight gain assessment
    const expectedWeight = 0.5 * data.pregnancyWeeks; // kg per week average
    if (data.weight > expectedWeight * 1.5) {
      riskFactors.push("Excessive weight gain");
      riskLevel = riskLevel === "high" ? "high" : "medium";
    }
  }
  
  if (data.babyMovement === "reduced") {
    riskFactors.push("Reduced fetal movement");
    riskLevel = "high";
  }
  
  if (data.symptoms && data.symptoms.toLowerCase().includes("bleeding")) {
    riskFactors.push("Bleeding symptoms");
    riskLevel = "high";
  }

  const recommendations = riskLevel === "high" 
    ? "Please contact your healthcare provider immediately and schedule an urgent appointment."
    : riskLevel === "medium"
    ? "Monitor symptoms closely and schedule a follow-up appointment within the week."
    : "Continue with regular prenatal care and maintain healthy habits.";

  return { riskLevel, riskFactors, recommendations };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update user profile
  app.patch('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updates = req.body;
      const user = await storage.upsertUser({
        id: userId,
        ...updates,
      });
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // ANC Appointment routes
  app.get('/api/appointments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const appointments = await storage.getUserAncAppointments(userId);
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.post('/api/appointments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const appointmentData = insertAncAppointmentSchema.parse({
        ...req.body,
        userId,
      });
      const appointment = await storage.createAncAppointment(appointmentData);
      res.status(201).json(appointment);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid appointment data", errors: error.errors });
      }
      console.error("Error creating appointment:", error);
      res.status(500).json({ message: "Failed to create appointment" });
    }
  });

  app.patch('/api/appointments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const appointment = await storage.updateAncAppointment(id, updates);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      res.json(appointment);
    } catch (error) {
      console.error("Error updating appointment:", error);
      res.status(500).json({ message: "Failed to update appointment" });
    }
  });

  app.delete('/api/appointments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteAncAppointment(id);
      if (!success) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting appointment:", error);
      res.status(500).json({ message: "Failed to delete appointment" });
    }
  });

  // Risk Assessment routes
  app.get('/api/risk-assessments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const assessments = await storage.getUserRiskAssessments(userId);
      res.json(assessments);
    } catch (error) {
      console.error("Error fetching risk assessments:", error);
      res.status(500).json({ message: "Failed to fetch risk assessments" });
    }
  });

  app.get('/api/risk-assessments/latest', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const assessment = await storage.getLatestRiskAssessment(userId);
      res.json(assessment);
    } catch (error) {
      console.error("Error fetching latest risk assessment:", error);
      res.status(500).json({ message: "Failed to fetch latest risk assessment" });
    }
  });

  app.post('/api/risk-assessments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Get ML risk assessment
      const riskAnalysis = await assessRisk({
        ...req.body,
        pregnancyWeeks: user?.pregnancyWeeks,
      });

      const assessmentData = insertRiskAssessmentSchema.parse({
        ...req.body,
        userId,
        riskLevel: riskAnalysis.riskLevel,
        riskFactors: riskAnalysis.riskFactors,
        recommendations: riskAnalysis.recommendations,
      });

      const assessment = await storage.createRiskAssessment(assessmentData);
      res.status(201).json(assessment);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid assessment data", errors: error.errors });
      }
      console.error("Error creating risk assessment:", error);
      res.status(500).json({ message: "Failed to create risk assessment" });
    }
  });

  // Immunization routes
  app.get('/api/immunizations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const immunizations = await storage.getUserImmunizations(userId);
      res.json(immunizations);
    } catch (error) {
      console.error("Error fetching immunizations:", error);
      res.status(500).json({ message: "Failed to fetch immunizations" });
    }
  });

  app.post('/api/immunizations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const immunizationData = insertImmunizationSchema.parse({
        ...req.body,
        userId,
      });
      const immunization = await storage.createImmunization(immunizationData);
      res.status(201).json(immunization);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid immunization data", errors: error.errors });
      }
      console.error("Error creating immunization:", error);
      res.status(500).json({ message: "Failed to create immunization" });
    }
  });

  app.patch('/api/immunizations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const immunization = await storage.updateImmunization(id, updates);
      if (!immunization) {
        return res.status(404).json({ message: "Immunization not found" });
      }
      res.json(immunization);
    } catch (error) {
      console.error("Error updating immunization:", error);
      res.status(500).json({ message: "Failed to update immunization" });
    }
  });

  app.delete('/api/immunizations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteImmunization(id);
      if (!success) {
        return res.status(404).json({ message: "Immunization not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting immunization:", error);
      res.status(500).json({ message: "Failed to delete immunization" });
    }
  });

  // Community routes
  app.get('/api/community/posts', async (req, res) => {
    try {
      const { limit = 20, offset = 0 } = req.query;
      const posts = await storage.getCommunityPosts(
        parseInt(limit as string), 
        parseInt(offset as string)
      );
      res.json(posts);
    } catch (error) {
      console.error("Error fetching community posts:", error);
      res.status(500).json({ message: "Failed to fetch community posts" });
    }
  });

  app.post('/api/community/posts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postData = insertCommunityPostSchema.parse({
        ...req.body,
        userId,
      });
      const post = await storage.createCommunityPost(postData);
      res.status(201).json(post);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid post data", errors: error.errors });
      }
      console.error("Error creating community post:", error);
      res.status(500).json({ message: "Failed to create community post" });
    }
  });

  app.post('/api/community/posts/:id/like', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const post = await storage.likeCommunityPost(id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error("Error liking post:", error);
      res.status(500).json({ message: "Failed to like post" });
    }
  });

  app.get('/api/community/posts/:id/comments', async (req, res) => {
    try {
      const { id } = req.params;
      const comments = await storage.getPostComments(id);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post('/api/community/posts/:id/comments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: postId } = req.params;
      const commentData = insertCommunityCommentSchema.parse({
        ...req.body,
        postId,
        userId,
      });
      const comment = await storage.createCommunityComment(commentData);
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid comment data", errors: error.errors });
      }
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
