import {
  users,
  ancAppointments,
  riskAssessments,
  immunizations,
  communityPosts,
  communityComments,
  type User,
  type UpsertUser,
  type AncAppointment,
  type InsertAncAppointment,
  type RiskAssessment,
  type InsertRiskAssessment,
  type Immunization,
  type InsertImmunization,
  type CommunityPost,
  type InsertCommunityPost,
  type CommunityComment,
  type InsertCommunityComment,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // ANC appointment operations
  createAncAppointment(appointment: InsertAncAppointment): Promise<AncAppointment>;
  getUserAncAppointments(userId: string): Promise<AncAppointment[]>;
  updateAncAppointment(id: string, updates: Partial<AncAppointment>): Promise<AncAppointment | undefined>;
  deleteAncAppointment(id: string): Promise<boolean>;

  // Risk assessment operations
  createRiskAssessment(assessment: InsertRiskAssessment): Promise<RiskAssessment>;
  getUserRiskAssessments(userId: string): Promise<RiskAssessment[]>;
  getLatestRiskAssessment(userId: string): Promise<RiskAssessment | undefined>;

  // Immunization operations
  createImmunization(immunization: InsertImmunization): Promise<Immunization>;
  getUserImmunizations(userId: string): Promise<Immunization[]>;
  updateImmunization(id: string, updates: Partial<Immunization>): Promise<Immunization | undefined>;
  deleteImmunization(id: string): Promise<boolean>;

  // Community operations
  createCommunityPost(post: InsertCommunityPost): Promise<CommunityPost>;
  getCommunityPosts(limit?: number, offset?: number): Promise<(CommunityPost & { user: User, commentCount: number })[]>;
  getUserCommunityPosts(userId: string): Promise<CommunityPost[]>;
  likeCommunityPost(postId: string): Promise<CommunityPost | undefined>;
  createCommunityComment(comment: InsertCommunityComment): Promise<CommunityComment>;
  getPostComments(postId: string): Promise<(CommunityComment & { user: User })[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // ANC appointment operations
  async createAncAppointment(appointment: InsertAncAppointment): Promise<AncAppointment> {
    const [newAppointment] = await db
      .insert(ancAppointments)
      .values(appointment)
      .returning();
    return newAppointment;
  }

  async getUserAncAppointments(userId: string): Promise<AncAppointment[]> {
    return await db
      .select()
      .from(ancAppointments)
      .where(eq(ancAppointments.userId, userId))
      .orderBy(desc(ancAppointments.appointmentDate));
  }

  async updateAncAppointment(id: string, updates: Partial<AncAppointment>): Promise<AncAppointment | undefined> {
    const [updatedAppointment] = await db
      .update(ancAppointments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(ancAppointments.id, id))
      .returning();
    return updatedAppointment;
  }

  async deleteAncAppointment(id: string): Promise<boolean> {
    const result = await db
      .delete(ancAppointments)
      .where(eq(ancAppointments.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Risk assessment operations
  async createRiskAssessment(assessment: InsertRiskAssessment): Promise<RiskAssessment> {
    const [newAssessment] = await db
      .insert(riskAssessments)
      .values(assessment)
      .returning();
    return newAssessment;
  }

  async getUserRiskAssessments(userId: string): Promise<RiskAssessment[]> {
    return await db
      .select()
      .from(riskAssessments)
      .where(eq(riskAssessments.userId, userId))
      .orderBy(desc(riskAssessments.assessmentDate));
  }

  async getLatestRiskAssessment(userId: string): Promise<RiskAssessment | undefined> {
    const [assessment] = await db
      .select()
      .from(riskAssessments)
      .where(eq(riskAssessments.userId, userId))
      .orderBy(desc(riskAssessments.assessmentDate))
      .limit(1);
    return assessment;
  }

  // Immunization operations
  async createImmunization(immunization: InsertImmunization): Promise<Immunization> {
    const [newImmunization] = await db
      .insert(immunizations)
      .values(immunization)
      .returning();
    return newImmunization;
  }

  async getUserImmunizations(userId: string): Promise<Immunization[]> {
    return await db
      .select()
      .from(immunizations)
      .where(eq(immunizations.userId, userId))
      .orderBy(desc(immunizations.scheduledDate));
  }

  async updateImmunization(id: string, updates: Partial<Immunization>): Promise<Immunization | undefined> {
    const [updatedImmunization] = await db
      .update(immunizations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(immunizations.id, id))
      .returning();
    return updatedImmunization;
  }

  async deleteImmunization(id: string): Promise<boolean> {
    const result = await db
      .delete(immunizations)
      .where(eq(immunizations.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Community operations
  async createCommunityPost(post: InsertCommunityPost): Promise<CommunityPost> {
    const [newPost] = await db
      .insert(communityPosts)
      .values(post)
      .returning();
    return newPost;
  }

  async getCommunityPosts(limit: number = 20, offset: number = 0): Promise<(CommunityPost & { user: User, commentCount: number })[]> {
    const posts = await db
      .select({
        id: communityPosts.id,
        userId: communityPosts.userId,
        title: communityPosts.title,
        content: communityPosts.content,
        category: communityPosts.category,
        likes: communityPosts.likes,
        createdAt: communityPosts.createdAt,
        updatedAt: communityPosts.updatedAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          pregnancyWeeks: users.pregnancyWeeks,
          dueDate: users.dueDate,
          isPostpartum: users.isPostpartum,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        }
      })
      .from(communityPosts)
      .innerJoin(users, eq(communityPosts.userId, users.id))
      .orderBy(desc(communityPosts.createdAt))
      .limit(limit)
      .offset(offset);

    // Get comment counts for each post
    const postsWithCounts = await Promise.all(
      posts.map(async (post) => {
        const comments = await db
          .select()
          .from(communityComments)
          .where(eq(communityComments.postId, post.id));
        return {
          ...post,
          commentCount: comments.length,
        };
      })
    );

    return postsWithCounts;
  }

  async getUserCommunityPosts(userId: string): Promise<CommunityPost[]> {
    return await db
      .select()
      .from(communityPosts)
      .where(eq(communityPosts.userId, userId))
      .orderBy(desc(communityPosts.createdAt));
  }

  async likeCommunityPost(postId: string): Promise<CommunityPost | undefined> {
    const [updatedPost] = await db
      .update(communityPosts)
      .set({ 
        likes: sql`${communityPosts.likes} + 1`,
        updatedAt: new Date()
      })
      .where(eq(communityPosts.id, postId))
      .returning();
    return updatedPost;
  }

  async createCommunityComment(comment: InsertCommunityComment): Promise<CommunityComment> {
    const [newComment] = await db
      .insert(communityComments)
      .values(comment)
      .returning();
    return newComment;
  }

  async getPostComments(postId: string): Promise<(CommunityComment & { user: User })[]> {
    return await db
      .select({
        id: communityComments.id,
        postId: communityComments.postId,
        userId: communityComments.userId,
        content: communityComments.content,
        createdAt: communityComments.createdAt,
        updatedAt: communityComments.updatedAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          pregnancyWeeks: users.pregnancyWeeks,
          dueDate: users.dueDate,
          isPostpartum: users.isPostpartum,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        }
      })
      .from(communityComments)
      .innerJoin(users, eq(communityComments.userId, users.id))
      .where(eq(communityComments.postId, postId))
      .orderBy(desc(communityComments.createdAt));
  }
}

export const storage = new DatabaseStorage();
