import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
  integer,
  boolean,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - mandatory for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  pregnancyWeeks: integer("pregnancy_weeks"),
  dueDate: date("due_date"),
  isPostpartum: boolean("is_postpartum").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ANC appointments table
export const ancAppointments = pgTable("anc_appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  doctorName: varchar("doctor_name").notNull(),
  appointmentDate: timestamp("appointment_date").notNull(),
  appointmentType: varchar("appointment_type").notNull(), // 'routine', 'urgent', 'follow-up'
  location: varchar("location").notNull(),
  notes: text("notes"),
  status: varchar("status").notNull().default('scheduled'), // 'scheduled', 'completed', 'cancelled'
  reminderSent: boolean("reminder_sent").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Risk assessments table
export const riskAssessments = pgTable("risk_assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  bloodPressure: varchar("blood_pressure"),
  weight: integer("weight"), // in kg
  babyMovement: varchar("baby_movement"), // 'active', 'normal', 'reduced'
  symptoms: text("symptoms"),
  riskLevel: varchar("risk_level").notNull(), // 'low', 'medium', 'high'
  riskFactors: jsonb("risk_factors"), // Array of identified risk factors
  recommendations: text("recommendations"),
  assessmentDate: timestamp("assessment_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Child immunizations table
export const immunizations = pgTable("immunizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  childName: varchar("child_name").notNull(),
  childBirthDate: date("child_birth_date"),
  vaccineName: varchar("vaccine_name").notNull(),
  scheduledDate: date("scheduled_date").notNull(),
  completedDate: date("completed_date"),
  location: varchar("location"),
  notes: text("notes"),
  reminderSent: boolean("reminder_sent").default(false),
  status: varchar("status").notNull().default('pending'), // 'pending', 'completed', 'overdue'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Community posts table
export const communityPosts = pgTable("community_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: varchar("title"),
  content: text("content").notNull(),
  category: varchar("category"), // 'general', 'pregnancy', 'postpartum', 'childcare'
  likes: integer("likes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Community comments table
export const communityComments = pgTable("community_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().references(() => communityPosts.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  ancAppointments: many(ancAppointments),
  riskAssessments: many(riskAssessments),
  immunizations: many(immunizations),
  communityPosts: many(communityPosts),
  communityComments: many(communityComments),
}));

export const ancAppointmentsRelations = relations(ancAppointments, ({ one }) => ({
  user: one(users, {
    fields: [ancAppointments.userId],
    references: [users.id],
  }),
}));

export const riskAssessmentsRelations = relations(riskAssessments, ({ one }) => ({
  user: one(users, {
    fields: [riskAssessments.userId],
    references: [users.id],
  }),
}));

export const immunizationsRelations = relations(immunizations, ({ one }) => ({
  user: one(users, {
    fields: [immunizations.userId],
    references: [users.id],
  }),
}));

export const communityPostsRelations = relations(communityPosts, ({ one, many }) => ({
  user: one(users, {
    fields: [communityPosts.userId],
    references: [users.id],
  }),
  comments: many(communityComments),
}));

export const communityCommentsRelations = relations(communityComments, ({ one }) => ({
  post: one(communityPosts, {
    fields: [communityComments.postId],
    references: [communityPosts.id],
  }),
  user: one(users, {
    fields: [communityComments.userId],
    references: [users.id],
  }),
}));

// Zod schemas for validation
export const upsertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertAncAppointmentSchema = createInsertSchema(ancAppointments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  reminderSent: true,
});

export const insertRiskAssessmentSchema = createInsertSchema(riskAssessments).omit({
  id: true,
  createdAt: true,
});

export const insertImmunizationSchema = createInsertSchema(immunizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  reminderSent: true,
});

export const insertCommunityPostSchema = createInsertSchema(communityPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  likes: true,
});

export const insertCommunityCommentSchema = createInsertSchema(communityComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Type exports
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertAncAppointment = z.infer<typeof insertAncAppointmentSchema>;
export type AncAppointment = typeof ancAppointments.$inferSelect;
export type InsertRiskAssessment = z.infer<typeof insertRiskAssessmentSchema>;
export type RiskAssessment = typeof riskAssessments.$inferSelect;
export type InsertImmunization = z.infer<typeof insertImmunizationSchema>;
export type Immunization = typeof immunizations.$inferSelect;
export type InsertCommunityPost = z.infer<typeof insertCommunityPostSchema>;
export type CommunityPost = typeof communityPosts.$inferSelect;
export type InsertCommunityComment = z.infer<typeof insertCommunityCommentSchema>;
export type CommunityComment = typeof communityComments.$inferSelect;
