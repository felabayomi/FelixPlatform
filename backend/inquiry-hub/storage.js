'use strict';
const { eq, desc, and } = require('drizzle-orm');
const { db, pool } = require('./db');
const {
  users, inquiries, reflections, resources, meetings, reportSections,
  inquiryComments, reportVersions, comments, appSettings, justiceLenses,
  inquiryMappings, sectionLensMappings, sectionFocusContext,
  postReads, postReactions,
} = require('./schema');
const session = require('express-session');
const connectPg = require('connect-pg-simple');

const PostgresSessionStore = connectPg(session);

class DatabaseStorage {
  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
      tableName: 'iq_session',
    });
  }

  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user) {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async getAllUsers() {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUserRole(id, isAdmin) {
    const [updated] = await db.update(users)
      .set({ isAdmin, role: isAdmin ? 'admin' : 'member' })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async updateUserPassword(id, hashedPassword) {
    const [updated] = await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async updateUserUsername(id, username) {
    const [updated] = await db.update(users)
      .set({ username })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async getInquiryByUserId(userId) {
    const [inquiry] = await db.select().from(inquiries).where(eq(inquiries.userId, userId));
    return inquiry;
  }

  async getInquiryById(id) {
    const [inquiry] = await db.select().from(inquiries).where(eq(inquiries.id, id));
    return inquiry;
  }

  async createOrUpdateInquiry(inquiry) {
    const existing = await this.getInquiryByUserId(inquiry.userId);
    if (existing) {
      const [updated] = await db.update(inquiries)
        .set({ ...inquiry })
        .where(eq(inquiries.id, existing.id))
        .returning();
      return updated;
    }
    const [newInquiry] = await db.insert(inquiries).values(inquiry).returning();
    return newInquiry;
  }

  async getReflections(inquiryId) {
    return await db.select().from(reflections)
      .where(eq(reflections.inquiryId, inquiryId))
      .orderBy(desc(reflections.createdAt));
  }

  async getAllReflections() {
    return await db.select().from(reflections).orderBy(desc(reflections.createdAt));
  }

  async createReflection(reflection) {
    const [newReflection] = await db.insert(reflections).values(reflection).returning();
    return newReflection;
  }

  async getReflectionById(id) {
    const [reflection] = await db.select().from(reflections).where(eq(reflections.id, id));
    return reflection;
  }

  async deleteReflection(id) {
    await db.delete(reflections).where(eq(reflections.id, id));
  }

  async getResources() {
    return await db.query.resources.findMany({
      with: { user: true },
      orderBy: desc(resources.createdAt),
    });
  }

  async createResource(resource) {
    const [newResource] = await db.insert(resources).values(resource).returning();
    return newResource;
  }

  async getMeetings() {
    return await db.select().from(meetings).orderBy(desc(meetings.date));
  }

  async createMeeting(meeting) {
    const [newMeeting] = await db.insert(meetings).values(meeting).returning();
    return newMeeting;
  }

  async updateMeeting(id, updates) {
    const [updated] = await db.update(meetings)
      .set(updates)
      .where(eq(meetings.id, id))
      .returning();
    return updated;
  }

  async getAllInquiries() {
    const results = await db.query.inquiries.findMany({
      with: {
        user: true,
        reflections: { orderBy: desc(reflections.createdAt) },
      },
    });
    return await Promise.all(results.map(async (inquiry) => {
      const cmts = await this.getInquiryComments(inquiry.id);
      return { ...inquiry, comments: cmts };
    }));
  }

  async getInquiryComments(inquiryId) {
    return await db.query.inquiryComments.findMany({
      where: eq(inquiryComments.inquiryId, inquiryId),
      orderBy: desc(inquiryComments.createdAt),
      with: { user: true },
    });
  }

  async addInquiryComment(comment) {
    const [newComment] = await db.insert(inquiryComments).values(comment).returning();
    return newComment;
  }

  async getReportSections() {
    return await db.select().from(reportSections).orderBy(reportSections.orderIndex);
  }

  async createReportSection(section) {
    const [newSection] = await db.insert(reportSections).values(section).returning();
    return newSection;
  }

  async updateReportSection(id, section) {
    const [updated] = await db.update(reportSections)
      .set(section)
      .where(eq(reportSections.id, id))
      .returning();
    return updated;
  }

  async deleteReportSection(id) {
    await db.delete(reportVersions).where(eq(reportVersions.sectionId, id));
    await db.delete(comments).where(eq(comments.sectionId, id));
    await db.delete(reportSections).where(eq(reportSections.id, id));
  }

  async getLatestReportVersion(sectionId) {
    return await db.query.reportVersions.findFirst({
      where: eq(reportVersions.sectionId, sectionId),
      orderBy: desc(reportVersions.createdAt),
      with: { author: true },
    });
  }

  async getReportHistory(sectionId) {
    return await db.query.reportVersions.findMany({
      where: eq(reportVersions.sectionId, sectionId),
      orderBy: desc(reportVersions.createdAt),
      with: { author: true },
    });
  }

  async getAllReportVersions() {
    return await db.select().from(reportVersions).orderBy(desc(reportVersions.createdAt));
  }

  async createReportVersion(version) {
    const [newVersion] = await db.insert(reportVersions).values(version).returning();
    return newVersion;
  }

  async getComments(sectionId) {
    return await db.query.comments.findMany({
      where: eq(comments.sectionId, sectionId),
      orderBy: desc(comments.createdAt),
      with: { author: true },
    });
  }

  async createComment(comment) {
    const [newComment] = await db.insert(comments).values(comment).returning();
    return newComment;
  }

  async getSettings() {
    return await db.select().from(appSettings);
  }

  async getSetting(key) {
    const [setting] = await db.select().from(appSettings).where(eq(appSettings.key, key));
    return setting;
  }

  async updateSetting(setting) {
    const [updated] = await db.insert(appSettings)
      .values(setting)
      .onConflictDoUpdate({ target: appSettings.key, set: { value: setting.value } })
      .returning();
    return updated;
  }

  async seedReportSections(sections) {
    const existing = await this.getReportSections();
    if (existing.length === 0) {
      await db.insert(reportSections).values(sections);
    }
  }

  async getJusticeLenses() {
    return await db.select().from(justiceLenses).orderBy(justiceLenses.orderIndex);
  }

  async createJusticeLens(lens) {
    const [newLens] = await db.insert(justiceLenses).values(lens).returning();
    return newLens;
  }

  async updateJusticeLens(id, lens) {
    const [updated] = await db.update(justiceLenses)
      .set(lens)
      .where(eq(justiceLenses.id, id))
      .returning();
    return updated;
  }

  async deleteJusticeLens(id) {
    const result = await db.delete(justiceLenses).where(eq(justiceLenses.id, id)).returning();
    return result.length > 0;
  }

  async seedJusticeLenses(lenses) {
    const existing = await this.getJusticeLenses();
    if (existing.length === 0) {
      await db.insert(justiceLenses).values(lenses);
    }
  }

  async markVersionRead(versionId, userId) {
    const existing = await db.select().from(postReads)
      .where(and(eq(postReads.versionId, versionId), eq(postReads.userId, userId)));
    if (existing.length > 0) return existing[0];
    const [newRead] = await db.insert(postReads).values({ versionId, userId }).returning();
    return newRead;
  }

  async getVersionReads(versionId) {
    return await db.query.postReads.findMany({
      where: eq(postReads.versionId, versionId),
      with: { user: true },
    });
  }

  async getUserReadVersionIds(userId) {
    const reads = await db.select({ versionId: postReads.versionId })
      .from(postReads)
      .where(eq(postReads.userId, userId));
    return reads.map(r => r.versionId);
  }

  async toggleReaction(versionId, userId, reactionType) {
    const existing = await db.select().from(postReactions)
      .where(and(
        eq(postReactions.versionId, versionId),
        eq(postReactions.userId, userId),
        eq(postReactions.reactionType, reactionType),
      ));
    if (existing.length > 0) {
      await db.delete(postReactions).where(eq(postReactions.id, existing[0].id));
      return { added: false };
    }
    await db.insert(postReactions).values({ versionId, userId, reactionType });
    return { added: true };
  }

  async getVersionReactions(versionId) {
    return await db.query.postReactions.findMany({
      where: eq(postReactions.versionId, versionId),
      with: { user: true },
    });
  }

  async getAllVersionsWithEngagement() {
    const versions = await db.query.reportVersions.findMany({
      orderBy: desc(reportVersions.createdAt),
      with: { author: true },
    });
    return await Promise.all(versions.map(async (version) => {
      const reads = await this.getVersionReads(version.id);
      const reactions = await this.getVersionReactions(version.id);
      return { ...version, reads, reactions };
    }));
  }

  async getInquiryMappings() {
    return await db.select().from(inquiryMappings).orderBy(desc(inquiryMappings.createdAt));
  }

  async getActiveMapping() {
    const [mapping] = await db.select().from(inquiryMappings).where(eq(inquiryMappings.isActive, true)).limit(1);
    return mapping;
  }

  async createInquiryMapping(mapping) {
    const [newMapping] = await db.insert(inquiryMappings).values(mapping).returning();
    return newMapping;
  }

  async updateInquiryMapping(id, mapping) {
    const [updated] = await db.update(inquiryMappings).set(mapping).where(eq(inquiryMappings.id, id)).returning();
    return updated;
  }

  async deleteInquiryMapping(id) {
    await db.delete(sectionFocusContext).where(eq(sectionFocusContext.mappingId, id));
    await db.delete(sectionLensMappings).where(eq(sectionLensMappings.mappingId, id));
    await db.delete(inquiryMappings).where(eq(inquiryMappings.id, id));
  }

  async setActiveMapping(id) {
    await db.update(inquiryMappings).set({ isActive: false });
    await db.update(inquiryMappings).set({ isActive: true }).where(eq(inquiryMappings.id, id));
  }

  async getSectionLensMappings(mappingId) {
    return await db.select().from(sectionLensMappings).where(eq(sectionLensMappings.mappingId, mappingId));
  }

  async saveSectionLensMappings(mappingId, mappings) {
    await db.delete(sectionLensMappings).where(eq(sectionLensMappings.mappingId, mappingId));
    if (mappings.length > 0) {
      await db.insert(sectionLensMappings).values(mappings);
    }
  }

  async getSectionFocusContexts(mappingId) {
    return await db.select().from(sectionFocusContext).where(eq(sectionFocusContext.mappingId, mappingId));
  }

  async saveSectionFocusContexts(mappingId, contexts) {
    await db.delete(sectionFocusContext).where(eq(sectionFocusContext.mappingId, mappingId));
    if (contexts.length > 0) {
      await db.insert(sectionFocusContext).values(contexts);
    }
  }
}

const storage = new DatabaseStorage();
module.exports = { storage };
