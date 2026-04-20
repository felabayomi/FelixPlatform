'use strict';
const { pgTable, text, serial, integer, boolean, timestamp, jsonb } = require('drizzle-orm/pg-core');
const { relations } = require('drizzle-orm');
const { createInsertSchema } = require('drizzle-zod');
const { z } = require('zod');

// === USERS ===
const users = pgTable('users_iq', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  fullName: text('full_name').notNull(),
  role: text('role').default('member').notNull(),
  isAdmin: boolean('is_admin').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// === INQUIRIES (Personal) ===
const inquiries = pgTable('iq_inquiries', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  question: text('question').notNull(),
  pathway: text('pathway').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// === REFLECTIONS (Weekly) ===
const reflections = pgTable('iq_reflections', {
  id: serial('id').primaryKey(),
  inquiryId: integer('inquiry_id').references(() => inquiries.id).notNull(),
  weekOf: timestamp('week_of').notNull(),
  content: text('content').notNull(),
  visibility: text('visibility').notNull().default('private'),
  createdAt: timestamp('created_at').defaultNow(),
});

// === SHARED RESOURCES ===
const resources = pgTable('iq_resources', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  title: text('title').notNull(),
  url: text('url').notNull(),
  tags: text('tags').array(),
  annotation: text('annotation'),
  visibility: text('visibility').notNull().default('cohort'),
  createdAt: timestamp('created_at').defaultNow(),
});

// === MEETINGS ===
const meetings = pgTable('iq_meetings', {
  id: serial('id').primaryKey(),
  date: timestamp('date').notNull(),
  title: text('title').notNull(),
  agenda: text('agenda'),
  notes: text('notes'),
  actionItems: text('action_items'),
  zoomLink: text('zoom_link'),
  createdAt: timestamp('created_at').defaultNow(),
});

// === REPORT BUILDER ===
const reportSections = pgTable('iq_report_sections', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  orderIndex: integer('order_index').notNull(),
  slug: text('slug').notNull(),
});

// === INQUIRY COMMENTS (Admin Feedback) ===
const inquiryComments = pgTable('iq_inquiry_comments', {
  id: serial('id').primaryKey(),
  inquiryId: integer('inquiry_id').references(() => inquiries.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

const reportVersions = pgTable('iq_report_versions', {
  id: serial('id').primaryKey(),
  sectionId: integer('section_id').references(() => reportSections.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  content: text('content').notNull(),
  justiceLensTags: text('justice_lens_tags').array(),
  visibility: text('visibility').notNull().default('cohort'),
  createdAt: timestamp('created_at').defaultNow(),
});

const comments = pgTable('iq_comments', {
  id: serial('id').primaryKey(),
  sectionId: integer('section_id').references(() => reportSections.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// === SETTINGS (Admin) ===
const appSettings = pgTable('iq_app_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

// === JUSTICE LENSES ===
const justiceLenses = pgTable('iq_justice_lenses', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  label: text('label').notNull(),
  orderIndex: integer('order_index').notNull().default(0),
  indices: text('indices').array(),
});

// === INQUIRY MAPPINGS ===
const inquiryMappings = pgTable('iq_inquiry_mappings', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// === SECTION-LENS MAPPINGS ===
const sectionLensMappings = pgTable('iq_section_lens_mappings', {
  id: serial('id').primaryKey(),
  mappingId: integer('mapping_id').references(() => inquiryMappings.id).notNull(),
  sectionSlug: text('section_slug').notNull(),
  lensSlug: text('lens_slug').notNull(),
  indices: text('indices').array(),
});

// === SECTION FOCUS CONTEXT ===
const sectionFocusContext = pgTable('iq_section_focus_context', {
  id: serial('id').primaryKey(),
  mappingId: integer('mapping_id').references(() => inquiryMappings.id).notNull(),
  sectionSlug: text('section_slug').notNull(),
  focusContext: text('focus_context').notNull(),
});

// === POST READS ===
const postReads = pgTable('iq_post_reads', {
  id: serial('id').primaryKey(),
  versionId: integer('version_id').references(() => reportVersions.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  readAt: timestamp('read_at').defaultNow(),
});

// === POST REACTIONS ===
const postReactions = pgTable('iq_post_reactions', {
  id: serial('id').primaryKey(),
  versionId: integer('version_id').references(() => reportVersions.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  reactionType: text('reaction_type').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// === AI CONTENT CHUNKS ===
const aiContentChunks = pgTable('iq_ai_content_chunks', {
  id: serial('id').primaryKey(),
  sourceType: text('source_type').notNull(),
  sourceId: integer('source_id').notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  sectionId: integer('section_id').references(() => reportSections.id),
  chunkIndex: integer('chunk_index').notNull().default(0),
  chunkText: text('chunk_text').notNull(),
  startOffset: integer('start_offset'),
  endOffset: integer('end_offset'),
  contentHash: text('content_hash').notNull(),
  metadata: jsonb('metadata'),
  visibility: text('visibility').notNull().default('cohort'),
  excludeFromAI: boolean('exclude_from_ai').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// === AI SUMMARIES ===
const aiSummaries = pgTable('iq_ai_summaries', {
  id: serial('id').primaryKey(),
  type: text('type').notNull(),
  scope: text('scope').notNull(),
  userId: integer('user_id').references(() => users.id),
  sectionId: integer('section_id').references(() => reportSections.id),
  timeRangeStart: timestamp('time_range_start'),
  timeRangeEnd: timestamp('time_range_end'),
  content: jsonb('content').notNull(),
  evidenceChunkIds: integer('evidence_chunk_ids').array(),
  generatedAt: timestamp('generated_at').defaultNow(),
});

// === USER AI SETTINGS ===
const userAiSettings = pgTable('iq_user_ai_settings', {
  userId: integer('user_id').references(() => users.id).primaryKey(),
  includePrivateInAI: boolean('include_private_in_ai').notNull().default(false),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// === RELATIONS ===
const inquiriesRelations = relations(inquiries, ({ one, many }) => ({
  user: one(users, { fields: [inquiries.userId], references: [users.id] }),
  reflections: many(reflections),
}));

const reflectionsRelations = relations(reflections, ({ one }) => ({
  inquiry: one(inquiries, { fields: [reflections.inquiryId], references: [inquiries.id] }),
}));

const inquiryCommentsRelations = relations(inquiryComments, ({ one }) => ({
  inquiry: one(inquiries, { fields: [inquiryComments.inquiryId], references: [inquiries.id] }),
  user: one(users, { fields: [inquiryComments.userId], references: [users.id] }),
}));

const resourcesRelations = relations(resources, ({ one }) => ({
  user: one(users, { fields: [resources.userId], references: [users.id] }),
}));

const reportVersionsRelations = relations(reportVersions, ({ one }) => ({
  section: one(reportSections, { fields: [reportVersions.sectionId], references: [reportSections.id] }),
  author: one(users, { fields: [reportVersions.userId], references: [users.id] }),
}));

const commentsRelations = relations(comments, ({ one }) => ({
  section: one(reportSections, { fields: [comments.sectionId], references: [reportSections.id] }),
  author: one(users, { fields: [comments.userId], references: [users.id] }),
}));

const postReadsRelations = relations(postReads, ({ one }) => ({
  version: one(reportVersions, { fields: [postReads.versionId], references: [reportVersions.id] }),
  user: one(users, { fields: [postReads.userId], references: [users.id] }),
}));

const postReactionsRelations = relations(postReactions, ({ one }) => ({
  version: one(reportVersions, { fields: [postReactions.versionId], references: [reportVersions.id] }),
  user: one(users, { fields: [postReactions.userId], references: [users.id] }),
}));

// === INSERT SCHEMAS (Zod) ===
const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
const insertInquirySchema = createInsertSchema(inquiries).omit({ id: true, createdAt: true });
const insertReflectionSchema = createInsertSchema(reflections).omit({ id: true, createdAt: true });
const insertResourceSchema = createInsertSchema(resources).omit({ id: true, createdAt: true });
const insertMeetingSchema = createInsertSchema(meetings).omit({ id: true, createdAt: true });
const insertReportSectionSchema = createInsertSchema(reportSections).omit({ id: true });
const insertReportVersionSchema = createInsertSchema(reportVersions).omit({ id: true, createdAt: true });
const insertCommentSchema = createInsertSchema(comments).omit({ id: true, createdAt: true });
const insertInquiryCommentSchema = createInsertSchema(inquiryComments).omit({ id: true, createdAt: true });
const insertSettingSchema = createInsertSchema(appSettings);
const insertJusticeLensSchema = createInsertSchema(justiceLenses).omit({ id: true });
const insertInquiryMappingSchema = createInsertSchema(inquiryMappings).omit({ id: true, createdAt: true });
const insertSectionLensMappingSchema = createInsertSchema(sectionLensMappings).omit({ id: true });
const insertSectionFocusContextSchema = createInsertSchema(sectionFocusContext).omit({ id: true });
const insertPostReadSchema = createInsertSchema(postReads).omit({ id: true, readAt: true });
const insertPostReactionSchema = createInsertSchema(postReactions).omit({ id: true, createdAt: true });

module.exports = {
  users, inquiries, reflections, resources, meetings, reportSections,
  inquiryComments, reportVersions, comments, appSettings, justiceLenses,
  inquiryMappings, sectionLensMappings, sectionFocusContext,
  postReads, postReactions, aiContentChunks, aiSummaries, userAiSettings,
  inquiriesRelations, reflectionsRelations, inquiryCommentsRelations,
  resourcesRelations, reportVersionsRelations, commentsRelations,
  postReadsRelations, postReactionsRelations,
  insertUserSchema, insertInquirySchema, insertReflectionSchema, insertResourceSchema,
  insertMeetingSchema, insertReportSectionSchema, insertReportVersionSchema,
  insertCommentSchema, insertInquiryCommentSchema, insertSettingSchema,
  insertJusticeLensSchema, insertInquiryMappingSchema, insertSectionLensMappingSchema,
  insertSectionFocusContextSchema, insertPostReadSchema, insertPostReactionSchema,
};
