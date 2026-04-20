'use strict';
const OpenAI = require('openai');
const crypto = require('crypto');
const { db } = require('./db');
const { eq, and, desc, inArray } = require('drizzle-orm');
const {
  aiContentChunks, aiSummaries, userAiSettings, reflections, reportVersions,
  comments, resources, inquiries, users, inquiryMappings, sectionLensMappings,
  sectionFocusContext, reportSections, justiceLenses, appSettings,
} = require('./schema');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

function computeHash(text) {
  return crypto.createHash('md5').update(text).digest('hex');
}

function chunkByParagraphs(text, maxChunkLength = 800) {
  const paragraphs = text.split(/\n\n+/);
  const chunks = [];
  let currentChunk = '';
  let currentStart = 0;
  let offset = 0;

  for (const para of paragraphs) {
    if (currentChunk.length + para.length > maxChunkLength && currentChunk.length > 0) {
      chunks.push({ text: currentChunk.trim(), startOffset: currentStart, endOffset: offset - 1 });
      currentChunk = para;
      currentStart = offset;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + para;
    }
    offset += para.length + 2;
  }

  if (currentChunk.trim()) {
    chunks.push({ text: currentChunk.trim(), startOffset: currentStart, endOffset: offset });
  }

  return chunks;
}

async function indexContent(sourceType, sourceId, userId, content, sectionId, metadata, visibility = 'cohort') {
  const contentHash = computeHash(content);

  const existing = await db.select()
    .from(aiContentChunks)
    .where(and(eq(aiContentChunks.sourceType, sourceType), eq(aiContentChunks.sourceId, sourceId)))
    .limit(1);

  if (existing.length > 0 && existing[0].contentHash === contentHash) return;

  if (existing.length > 0) {
    await db.delete(aiContentChunks)
      .where(and(eq(aiContentChunks.sourceType, sourceType), eq(aiContentChunks.sourceId, sourceId)));
  }

  const chunks = chunkByParagraphs(content);
  for (let i = 0; i < chunks.length; i++) {
    await db.insert(aiContentChunks).values({
      sourceType, sourceId, userId, sectionId: sectionId || null,
      chunkIndex: i, chunkText: chunks[i].text,
      startOffset: chunks[i].startOffset, endOffset: chunks[i].endOffset,
      contentHash, metadata: metadata || {}, visibility, excludeFromAI: false,
    });
  }
}

async function getUserAiSettings(userId) {
  const [settings] = await db.select().from(userAiSettings).where(eq(userAiSettings.userId, userId));
  return settings || { userId, includePrivateInAI: false };
}

async function updateUserAiSettings(userId, includePrivateInAI) {
  const [existing] = await db.select().from(userAiSettings).where(eq(userAiSettings.userId, userId));
  if (existing) {
    await db.update(userAiSettings).set({ includePrivateInAI, updatedAt: new Date() }).where(eq(userAiSettings.userId, userId));
  } else {
    await db.insert(userAiSettings).values({ userId, includePrivateInAI });
  }
}

async function getChunksForUser(userId, limit = 30) {
  const settings = await getUserAiSettings(userId);
  const whereConditions = [
    eq(aiContentChunks.userId, userId),
    eq(aiContentChunks.excludeFromAI, false),
  ];
  if (!settings.includePrivateInAI) {
    whereConditions.push(inArray(aiContentChunks.visibility, ['group', 'cohort']));
  }
  return db.select({ chunk: aiContentChunks, user: users })
    .from(aiContentChunks)
    .leftJoin(users, eq(aiContentChunks.userId, users.id))
    .where(and(...whereConditions))
    .orderBy(desc(aiContentChunks.createdAt))
    .limit(limit);
}

async function getChunksForSection(sectionId, limit = 30) {
  return db.select({ chunk: aiContentChunks, user: users })
    .from(aiContentChunks)
    .leftJoin(users, eq(aiContentChunks.userId, users.id))
    .where(and(
      eq(aiContentChunks.sectionId, sectionId),
      eq(aiContentChunks.excludeFromAI, false),
      eq(aiContentChunks.visibility, 'cohort'),
    ))
    .orderBy(desc(aiContentChunks.createdAt))
    .limit(limit);
}

async function generateJourneySummary(userId) {
  const chunksResult = await getChunksForUser(userId, 25);

  if (chunksResult.length === 0) {
    return {
      highLevelSummary: "You haven't added any content yet. Start by adding reflections, resources, or contributing to the report.",
      keyThemes: [], notableQuotes: [],
      openQuestions: ["What inquiry questions are you exploring?"],
      recommendedNextSteps: ["Add your first weekly reflection", "Share a resource with the cohort"],
      evidence: [],
    };
  }

  const chunksText = chunksResult.map((r, i) => `[${i + 1}] (${r.chunk.sourceType}) ${r.chunk.chunkText}`).join('\n\n');

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: 'You are an AI assistant helping cohort members synthesize their inquiry journey. Always respond with valid JSON.' },
      { role: 'user', content: `Analyze these content chunks from a cohort member's inquiry journey:\n\n${chunksText}\n\nRespond with JSON: {"highLevelSummary":"...","keyThemes":[],"notableQuotes":[{"text":"...","chunkId":1}],"openQuestions":[],"recommendedNextSteps":[],"evidence":[{"chunkId":1,"sourceType":"...","excerpt":"..."}]}` },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 2000,
  });

  const parsed = JSON.parse(response.choices[0]?.message?.content || '{}');
  parsed.evidence = (parsed.evidence || []).map(e => {
    const chunk = chunksResult[e.chunkId - 1];
    return { ...e, sourceType: chunk?.chunk.sourceType || e.sourceType, sourceId: chunk?.chunk.sourceId || 0, authorName: chunk?.user?.fullName || 'Unknown' };
  });
  parsed.notableQuotes = (parsed.notableQuotes || []).map(q => {
    const chunk = chunksResult[q.chunkId - 1];
    return { ...q, sourceType: chunk?.chunk.sourceType, sourceId: chunk?.chunk.sourceId };
  });

  await db.insert(aiSummaries).values({ type: 'my_journey', scope: 'personal', userId, content: parsed, evidenceChunkIds: chunksResult.map(r => r.chunk.id) });
  return parsed;
}

async function getActiveMappingContext(sectionId) {
  const [section] = await db.select().from(reportSections).where(eq(reportSections.id, sectionId));
  if (!section) return '';

  const [inquiryFocusSetting] = await db.select().from(appSettings).where(eq(appSettings.key, 'inquiry_focus'));
  const inquiryFocus = inquiryFocusSetting?.value || '';

  const [activeMapping] = await db.select().from(inquiryMappings).where(eq(inquiryMappings.isActive, true)).limit(1);
  if (!activeMapping) {
    return inquiryFocus ? `\n\nIMPORTANT: This inquiry focuses on "${inquiryFocus}".` : '';
  }

  const [focusCtx] = await db.select().from(sectionFocusContext)
    .where(and(eq(sectionFocusContext.mappingId, activeMapping.id), eq(sectionFocusContext.sectionSlug, section.slug)));

  const mappings = await db.select().from(sectionLensMappings)
    .where(and(eq(sectionLensMappings.mappingId, activeMapping.id), eq(sectionLensMappings.sectionSlug, section.slug)));

  const lensData = await db.select().from(justiceLenses);
  const lensMap = Object.fromEntries(lensData.map(l => [l.slug, l]));

  const contextParts = [];
  if (inquiryFocus) contextParts.push(`This inquiry focuses on "${inquiryFocus}".`);
  if (focusCtx?.focusContext) contextParts.push(`Section framing: ${focusCtx.focusContext}`);

  const lensContextParts = mappings.map(m => {
    const lens = lensMap[m.lensSlug];
    if (!lens) return null;
    const indices = m.indices?.length > 0 ? `: ${m.indices.join(', ')}` : '';
    return `- ${lens.label}${indices}`;
  }).filter(Boolean);

  if (lensContextParts.length > 0) contextParts.push(`Lenses:\n${lensContextParts.join('\n')}`);
  return contextParts.length > 0 ? `\n\nANALYTICAL FRAMEWORK:\n${contextParts.join('\n\n')}` : '';
}

async function generateSectionSynthesis(sectionId) {
  const chunksResult = await getChunksForSection(sectionId, 25);

  if (chunksResult.length === 0) {
    return {
      highLevelSummary: 'No contributions yet in this section.',
      keyThemes: [], notableQuotes: [],
      openQuestions: ["What would you like to contribute to this section?"],
      recommendedNextSteps: ["Be the first to add a contribution"],
      evidence: [],
    };
  }

  const chunksText = chunksResult.map((r, i) => `[${i + 1}] (by ${r.user?.fullName || 'Unknown'}) ${r.chunk.chunkText}`).join('\n\n');
  const mappingContext = await getActiveMappingContext(sectionId);

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: `You synthesize collaborative doctoral research.${mappingContext} Always respond with valid JSON.` },
      { role: 'user', content: `Synthesize these contributions:\n\n${chunksText}\n\nRespond with JSON: {"highLevelSummary":"...","keyThemes":[],"notableQuotes":[{"text":"...","chunkId":1}],"openQuestions":[],"recommendedNextSteps":[],"evidence":[{"chunkId":1,"sourceType":"...","excerpt":"..."}]}` },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 2000,
  });

  const parsed = JSON.parse(response.choices[0]?.message?.content || '{}');
  parsed.evidence = (parsed.evidence || []).map(e => {
    const chunk = chunksResult[e.chunkId - 1];
    return { ...e, sourceType: chunk?.chunk.sourceType || e.sourceType, sourceId: chunk?.chunk.sourceId || 0, sectionId: chunk?.chunk.sectionId || sectionId, authorName: chunk?.user?.fullName || 'Unknown' };
  });
  parsed.notableQuotes = (parsed.notableQuotes || []).map(q => {
    const chunk = chunksResult[q.chunkId - 1];
    return { ...q, sourceType: chunk?.chunk.sourceType, sourceId: chunk?.chunk.sourceId };
  });

  await db.insert(aiSummaries).values({ type: 'section_draft', scope: 'cohort', sectionId, content: parsed, evidenceChunkIds: chunksResult.map(r => r.chunk.id) });
  return parsed;
}

async function getRecentSummaries(userId, type) {
  const conditions = type
    ? and(eq(aiSummaries.userId, userId), eq(aiSummaries.type, type))
    : eq(aiSummaries.userId, userId);
  return db.select().from(aiSummaries).where(conditions).orderBy(desc(aiSummaries.generatedAt)).limit(10);
}

async function getSectionSummaries(sectionId) {
  return db.select().from(aiSummaries)
    .where(and(eq(aiSummaries.sectionId, sectionId), eq(aiSummaries.type, 'section_draft')))
    .orderBy(desc(aiSummaries.generatedAt))
    .limit(5);
}

module.exports = {
  indexContent, getUserAiSettings, updateUserAiSettings,
  generateJourneySummary, generateSectionSynthesis,
  getRecentSummaries, getSectionSummaries,
};
