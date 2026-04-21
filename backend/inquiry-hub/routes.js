'use strict';
const express = require('express');
const passport = require('passport');
const { z } = require('zod');
const { setupAuth, hashPassword, comparePasswords } = require('./auth');
const { storage } = require('./storage');
const {
    insertUserSchema, insertInquirySchema, insertReflectionSchema,
    insertResourceSchema, insertMeetingSchema, insertReportVersionSchema,
    insertCommentSchema, insertSettingSchema, insertInquiryCommentSchema,
    insertReportSectionSchema, insertJusticeLensSchema,
    insertInquiryMappingSchema, insertSectionLensMappingSchema, insertSectionFocusContextSchema,
} = require('./schema');
const {
    indexContent, getUserAiSettings, updateUserAiSettings,
    generateJourneySummary, generateSectionSynthesis,
    getRecentSummaries, getSectionSummaries,
} = require('./ai-service');

// API path constants (mirrors shared/routes.ts paths)
const api = {
    auth: { register: '/api/register', login: '/api/login', logout: '/api/logout', me: '/api/user' },
    inquiries: { get: '/api/inquiries/mine', upsert: '/api/inquiries', listAll: '/api/admin/inquiries', addComment: '/api/inquiries/comments' },
    reflections: { create: '/api/reflections' },
    resources: { list: '/api/resources', create: '/api/resources' },
    meetings: { list: '/api/meetings', create: '/api/meetings', update: '/api/meetings/:id' },
    report: {
        sections: '/api/report/sections', createSection: '/api/admin/report/sections',
        latestVersions: '/api/report/sections/:sectionId/latest', history: '/api/report/sections/:sectionId/history',
        saveVersion: '/api/report/versions', comments: '/api/report/sections/:sectionId/comments',
        addComment: '/api/report/comments',
    },
    settings: { list: '/api/settings', update: '/api/settings' },
    users: {
        list: '/api/admin/users', updateOwnUsername: '/api/account/username', updateOwnPassword: '/api/account/password',
    },
    justiceLenses: { list: '/api/justice-lenses', create: '/api/admin/justice-lenses' },
    inquiryMappings: {
        list: '/api/inquiry-mappings', active: '/api/inquiry-mappings/active',
        create: '/api/inquiry-mappings', update: '/api/inquiry-mappings/:id',
        delete: '/api/inquiry-mappings/:id', setActive: '/api/inquiry-mappings/:id/activate',
        sectionMappings: '/api/inquiry-mappings/:id/sections', saveSectionMappings: '/api/inquiry-mappings/:id/sections',
        getFocusContexts: '/api/inquiry-mappings/:id/focus-contexts', saveFocusContexts: '/api/inquiry-mappings/:id/focus-contexts',
    },
};

async function registerRoutes(app) {
    // Setup session auth for inquiry hub (isolated with custom cookie name)
    setupAuth(app);

    // === AUTH ===
    app.post(api.auth.register, async (req, res) => {
        try {
            const { inviteCode, ...userData } = req.body;
            const magicCodeSetting = await storage.getSetting('magic_code');
            const validCode = magicCodeSetting?.value || 'cohort2026';
            if (inviteCode !== validCode) {
                return res.status(400).json({ message: 'Invalid invite code' });
            }
            const existingUser = await storage.getUserByUsername(userData.username);
            if (existingUser) {
                return res.status(400).json({ message: 'Username already taken' });
            }
            const input = insertUserSchema.parse(userData);
            const hashedPw = await hashPassword(input.password);
            const user = await storage.createUser({ ...input, password: hashedPw });
            req.login(user, (err) => {
                if (err) return res.status(500).json({ message: 'Login failed after registration' });
                const { password, ...safeUser } = user;
                res.status(201).json(safeUser);
            });
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    });

    app.post(api.auth.login, (req, res, next) => {
        passport.authenticate('local', (err, user) => {
            if (err) return next(err);
            if (!user) return res.status(401).json({ message: 'Invalid username or password' });
            req.login(user, (loginErr) => {
                if (loginErr) return next(loginErr);
                const { password, ...safeUser } = user;
                res.json(safeUser);
            });
        })(req, res, next);
    });

    app.post(api.auth.logout, (req, res) => {
        req.logout(() => res.json({ message: 'Logged out' }));
    });

    app.get(api.auth.me, (req, res) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        const { password, ...safeUser } = req.user;
        res.json(safeUser);
    });

    // === INQUIRIES ===
    app.get(api.inquiries.get, async (req, res) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        const inquiry = await storage.getInquiryByUserId(req.user.id);
        if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });
        const reflections = await storage.getReflections(inquiry.id);
        res.json({ ...inquiry, reflections });
    });

    app.post(api.inquiries.upsert, async (req, res) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        try {
            const input = insertInquirySchema.omit({ userId: true }).parse(req.body);
            const inquiry = await storage.createOrUpdateInquiry({ ...input, userId: req.user.id });
            res.json(inquiry);
        } catch (err) { res.status(400).json({ message: err.message }); }
    });

    app.delete('/api/reflections/:id', async (req, res) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        const reflectionId = Number(req.params.id);
        const reflection = await storage.getReflectionById(reflectionId);
        if (!reflection) return res.status(404).json({ message: 'Reflection not found' });
        const inquiry = await storage.getInquiryByUserId(req.user.id);
        if (!inquiry || reflection.inquiryId !== inquiry.id) return res.status(403).json({ message: 'Not authorized' });
        await storage.deleteReflection(reflectionId);
        res.json({ success: true });
    });

    app.get(api.inquiries.listAll, async (req, res) => {
        if (!req.isAuthenticated() || !req.user.isAdmin) return res.sendStatus(401);
        const inquiries = await storage.getAllInquiries();
        res.json(inquiries);
    });

    app.post(api.inquiries.addComment, async (req, res) => {
        if (!req.isAuthenticated() || !req.user.isAdmin) return res.sendStatus(401);
        try {
            const input = insertInquiryCommentSchema.omit({ userId: true }).parse(req.body);
            const comment = await storage.addInquiryComment({ ...input, userId: req.user.id });
            res.status(201).json(comment);
        } catch (err) { res.status(400).json({ message: err.message }); }
    });

    // === REFLECTIONS ===
    app.post(api.reflections.create, async (req, res) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        try {
            const body = { ...req.body, weekOf: req.body.weekOf ? new Date(req.body.weekOf) : undefined };
            const input = insertReflectionSchema.omit({ id: true, createdAt: true }).parse(body);
            const reflection = await storage.createReflection(input);
            try {
                await indexContent('reflection', reflection.id, req.user.id, input.content, undefined, { weekOf: input.weekOf }, input.visibility || 'private');
            } catch (e) { console.error('Failed to index reflection for AI:', e); }
            res.status(201).json(reflection);
        } catch (err) { res.status(400).json({ message: err.message }); }
    });

    // === RESOURCES ===
    app.get(api.resources.list, async (req, res) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        const items = await storage.getResources();
        res.json(items);
    });

    app.post(api.resources.create, async (req, res) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        try {
            const input = insertResourceSchema.omit({ userId: true }).parse(req.body);
            const resource = await storage.createResource({ ...input, userId: req.user.id });
            try {
                const contentToIndex = `${input.title}\n\n${input.annotation || ''}\n\n${input.url}`;
                await indexContent('resource', resource.id, req.user.id, contentToIndex, undefined, { tags: input.tags }, input.visibility || 'cohort');
            } catch (e) { console.error('Failed to index resource for AI:', e); }
            res.status(201).json(resource);
        } catch (err) { res.status(400).json({ message: err.message }); }
    });

    // === MEETINGS ===
    app.get(api.meetings.list, async (req, res) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        res.json(await storage.getMeetings());
    });

    app.post(api.meetings.create, async (req, res) => {
        if (!req.isAuthenticated() || !req.user.isAdmin) return res.sendStatus(401);
        try {
            const input = insertMeetingSchema.extend({ date: z.coerce.date() }).parse(req.body);
            res.status(201).json(await storage.createMeeting(input));
        } catch (err) { res.status(400).json({ message: err.message }); }
    });

    app.patch(api.meetings.update, async (req, res) => {
        if (!req.isAuthenticated() || !req.user.isAdmin) return res.sendStatus(401);
        try {
            const input = insertMeetingSchema.extend({ date: z.coerce.date() }).partial().parse(req.body);
            res.json(await storage.updateMeeting(Number(req.params.id), input));
        } catch (err) { res.status(400).json({ message: err.message }); }
    });

    // === REPORT BUILDER ===
    app.get(api.report.sections, async (req, res) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        res.json(await storage.getReportSections());
    });

    app.post(api.report.createSection, async (req, res) => {
        if (!req.isAuthenticated() || !req.user.isAdmin) return res.sendStatus(401);
        try {
            const input = insertReportSectionSchema.parse(req.body);
            res.status(201).json(await storage.createReportSection(input));
        } catch (err) { res.status(400).json({ message: err.message }); }
    });

    app.patch('/api/admin/report/sections/:id', async (req, res) => {
        if (!req.isAuthenticated() || !req.user.isAdmin) return res.sendStatus(401);
        try {
            const input = insertReportSectionSchema.partial().parse(req.body);
            const section = await storage.updateReportSection(Number(req.params.id), input);
            if (!section) return res.status(404).json({ message: 'Section not found' });
            res.json(section);
        } catch (err) { res.status(400).json({ message: err.message }); }
    });

    app.delete('/api/admin/report/sections/:id', async (req, res) => {
        if (!req.isAuthenticated() || !req.user.isAdmin) return res.sendStatus(401);
        await storage.deleteReportSection(Number(req.params.id));
        res.json({ success: true });
    });

    app.get(api.report.latestVersions, async (req, res) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        res.json(await storage.getLatestReportVersion(Number(req.params.sectionId)) || null);
    });

    app.get(api.report.history, async (req, res) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        res.json(await storage.getReportHistory(Number(req.params.sectionId)));
    });

    app.post(api.report.saveVersion, async (req, res) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        try {
            const input = insertReportVersionSchema.omit({ userId: true }).parse(req.body);
            const version = await storage.createReportVersion({ ...input, userId: req.user.id });
            try {
                await indexContent('report_post', version.id, req.user.id, input.content, input.sectionId, { justiceLensTags: input.justiceLensTags }, input.visibility || 'cohort');
            } catch (e) { console.error('Failed to index report version for AI:', e); }
            res.status(201).json(version);
        } catch (err) { res.status(400).json({ message: err.message }); }
    });

    app.get(api.report.comments, async (req, res) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        res.json(await storage.getComments(Number(req.params.sectionId)));
    });

    app.post(api.report.addComment, async (req, res) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        try {
            const input = insertCommentSchema.omit({ userId: true }).parse(req.body);
            const comment = await storage.createComment({ ...input, userId: req.user.id });
            try {
                await indexContent('comment', comment.id, req.user.id, input.content, input.sectionId, {}, 'cohort');
            } catch (e) { console.error('Failed to index comment for AI:', e); }
            res.status(201).json(comment);
        } catch (err) { res.status(400).json({ message: err.message }); }
    });

    // === POST READS & REACTIONS ===
    app.get('/api/report/versions/engagement', async (req, res) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        res.json(await storage.getAllVersionsWithEngagement());
    });

    app.get('/api/report/my-reads', async (req, res) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        res.json(await storage.getUserReadVersionIds(req.user.id));
    });

    app.post('/api/report/versions/:id/read', async (req, res) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        res.json(await storage.markVersionRead(Number(req.params.id), req.user.id));
    });

    app.get('/api/report/versions/:id/reads', async (req, res) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        res.json(await storage.getVersionReads(Number(req.params.id)));
    });

    app.post('/api/report/versions/:id/reactions', async (req, res) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        try {
            const { reactionType } = z.object({ reactionType: z.string() }).parse(req.body);
            res.json(await storage.toggleReaction(Number(req.params.id), req.user.id, reactionType));
        } catch (err) { res.status(400).json({ message: err.message }); }
    });

    app.get('/api/report/versions/:id/reactions', async (req, res) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        res.json(await storage.getVersionReactions(Number(req.params.id)));
    });

    // === COHORT INFO ===
    app.get('/api/cohort/user-count', async (req, res) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        const all = await storage.getAllUsers();
        res.json({ count: all.length });
    });

    // === SETTINGS ===
    app.get(api.settings.list, async (req, res) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        res.json(await storage.getSettings());
    });

    app.post(api.settings.update, async (req, res) => {
        if (!req.isAuthenticated() || !req.user.isAdmin) return res.sendStatus(401);
        try {
            const input = insertSettingSchema.parse(req.body);
            res.json(await storage.updateSetting(input));
        } catch (err) { res.status(400).json({ message: err.message }); }
    });

    // === USER MANAGEMENT ===
    app.get(api.users.list, async (req, res) => {
        if (!req.isAuthenticated() || !req.user.isAdmin) return res.sendStatus(401);
        const all = await storage.getAllUsers();
        res.json(all.map(({ password, ...rest }) => rest));
    });

    app.patch('/api/admin/users/:id/role', async (req, res) => {
        if (!req.isAuthenticated() || !req.user.isAdmin) return res.sendStatus(401);
        try {
            const { isAdmin } = z.object({ isAdmin: z.boolean() }).parse(req.body);
            const user = await storage.updateUserRole(Number(req.params.id), isAdmin);
            if (!user) return res.status(404).json({ message: 'User not found' });
            const { password, ...safeUser } = user;
            res.json(safeUser);
        } catch (err) { res.status(400).json({ message: err.message }); }
    });

    app.patch('/api/admin/users/:id/password', async (req, res) => {
        if (!req.isAuthenticated() || !req.user.isAdmin) return res.sendStatus(401);
        try {
            const { password } = z.object({ password: z.string().min(6) }).parse(req.body);
            const hashed = await hashPassword(password);
            const user = await storage.updateUserPassword(Number(req.params.id), hashed);
            if (!user) return res.status(404).json({ message: 'User not found' });
            res.json({ success: true });
        } catch (err) { res.status(400).json({ message: err.message }); }
    });

    app.patch(api.users.updateOwnUsername, async (req, res) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        try {
            const { username } = z.object({ username: z.string().min(3).max(30) }).parse(req.body);
            const existing = await storage.getUserByUsername(username);
            if (existing && existing.id !== req.user.id) return res.status(409).json({ message: 'Username already taken' });
            const user = await storage.updateUserUsername(req.user.id, username);
            if (!user) return res.status(404).json({ message: 'User not found' });
            const { password, ...safeUser } = user;
            res.json(safeUser);
        } catch (err) { res.status(400).json({ message: err.message }); }
    });

    app.patch(api.users.updateOwnPassword, async (req, res) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        try {
            const { currentPassword, newPassword } = z.object({ currentPassword: z.string(), newPassword: z.string().min(6) }).parse(req.body);
            const user = await storage.getUser(req.user.id);
            if (!user) return res.status(404).json({ message: 'User not found' });
            const isValid = await comparePasswords(currentPassword, user.password);
            if (!isValid) return res.status(400).json({ message: 'Current password is incorrect' });
            const hashed = await hashPassword(newPassword);
            await storage.updateUserPassword(req.user.id, hashed);
            res.json({ success: true });
        } catch (err) { res.status(400).json({ message: err.message }); }
    });

    // === JUSTICE LENSES ===
    app.get(api.justiceLenses.list, async (req, res) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        res.json(await storage.getJusticeLenses());
    });

    app.post(api.justiceLenses.create, async (req, res) => {
        if (!req.isAuthenticated() || !req.user.isAdmin) return res.sendStatus(401);
        try {
            const input = insertJusticeLensSchema.parse(req.body);
            res.status(201).json(await storage.createJusticeLens(input));
        } catch (err) { res.status(400).json({ message: err.message }); }
    });

    app.patch('/api/admin/justice-lenses/:id', async (req, res) => {
        if (!req.isAuthenticated() || !req.user.isAdmin) return res.sendStatus(401);
        try {
            const input = insertJusticeLensSchema.partial().parse(req.body);
            const lens = await storage.updateJusticeLens(Number(req.params.id), input);
            if (!lens) return res.status(404).json({ message: 'Justice lens not found' });
            res.json(lens);
        } catch (err) { res.status(400).json({ message: err.message }); }
    });

    app.delete('/api/admin/justice-lenses/:id', async (req, res) => {
        if (!req.isAuthenticated() || !req.user.isAdmin) return res.sendStatus(401);
        const deleted = await storage.deleteJusticeLens(Number(req.params.id));
        if (!deleted) return res.status(404).json({ message: 'Justice lens not found' });
        res.json({ success: true });
    });

    // === INQUIRY MAPPINGS ===
    app.get(api.inquiryMappings.list, async (req, res) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        res.json(await storage.getInquiryMappings());
    });

    app.get(api.inquiryMappings.active, async (req, res) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        res.json(await storage.getActiveMapping() || null);
    });

    app.post(api.inquiryMappings.create, async (req, res) => {
        if (!req.isAuthenticated() || !req.user.isAdmin) return res.sendStatus(401);
        try {
            const input = insertInquiryMappingSchema.parse(req.body);
            res.status(201).json(await storage.createInquiryMapping(input));
        } catch (err) { res.status(400).json({ message: err.message }); }
    });

    app.patch(api.inquiryMappings.update, async (req, res) => {
        if (!req.isAuthenticated() || !req.user.isAdmin) return res.sendStatus(401);
        try {
            const input = insertInquiryMappingSchema.partial().parse(req.body);
            const mapping = await storage.updateInquiryMapping(Number(req.params.id), input);
            if (!mapping) return res.status(404).json({ message: 'Mapping not found' });
            res.json(mapping);
        } catch (err) { res.status(400).json({ message: err.message }); }
    });

    app.delete(api.inquiryMappings.delete, async (req, res) => {
        if (!req.isAuthenticated() || !req.user.isAdmin) return res.sendStatus(401);
        await storage.deleteInquiryMapping(Number(req.params.id));
        res.json({ success: true });
    });

    app.post(api.inquiryMappings.setActive, async (req, res) => {
        if (!req.isAuthenticated() || !req.user.isAdmin) return res.sendStatus(401);
        await storage.setActiveMapping(Number(req.params.id));
        res.json({ success: true });
    });

    app.get(api.inquiryMappings.sectionMappings, async (req, res) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        res.json(await storage.getSectionLensMappings(Number(req.params.id)));
    });

    app.post(api.inquiryMappings.saveSectionMappings, async (req, res) => {
        if (!req.isAuthenticated() || !req.user.isAdmin) return res.sendStatus(401);
        try {
            const mappingId = Number(req.params.id);
            const input = z.array(insertSectionLensMappingSchema.omit({ mappingId: true })).parse(req.body);
            await storage.saveSectionLensMappings(mappingId, input.map(m => ({ ...m, mappingId })));
            res.json({ success: true });
        } catch (err) { res.status(400).json({ message: err.message }); }
    });

    app.get(api.inquiryMappings.getFocusContexts, async (req, res) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        res.json(await storage.getSectionFocusContexts(Number(req.params.id)));
    });

    app.post(api.inquiryMappings.saveFocusContexts, async (req, res) => {
        if (!req.isAuthenticated() || !req.user.isAdmin) return res.sendStatus(401);
        try {
            const mappingId = Number(req.params.id);
            const input = z.array(insertSectionFocusContextSchema.omit({ mappingId: true })).parse(req.body);
            await storage.saveSectionFocusContexts(mappingId, input.map(c => ({ ...c, mappingId })));
            res.json({ success: true });
        } catch (err) { res.status(400).json({ message: err.message }); }
    });

    // === AI INSIGHTS ===
    app.get('/api/ai/settings', async (req, res) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        res.json(await getUserAiSettings(req.user.id));
    });

    app.patch('/api/ai/settings', async (req, res) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        try {
            const { includePrivateInAI } = z.object({ includePrivateInAI: z.boolean() }).parse(req.body);
            await updateUserAiSettings(req.user.id, includePrivateInAI);
            res.json({ success: true });
        } catch (err) { res.status(400).json({ message: err.message }); }
    });

    app.post('/api/ai/journey-summary', async (req, res) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        try {
            res.json(await generateJourneySummary(req.user.id));
        } catch (err) {
            console.error('Error generating journey summary:', err);
            res.status(500).json({ message: 'Failed to generate summary' });
        }
    });

    app.post('/api/ai/section-synthesis/:sectionId', async (req, res) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        try {
            res.json(await generateSectionSynthesis(Number(req.params.sectionId)));
        } catch (err) {
            console.error('Error generating section synthesis:', err);
            res.status(500).json({ message: 'Failed to generate synthesis' });
        }
    });

    app.get('/api/ai/summaries', async (req, res) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        res.json(await getRecentSummaries(req.user.id, req.query.type));
    });

    app.get('/api/ai/section-summaries/:sectionId', async (req, res) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        res.json(await getSectionSummaries(Number(req.params.sectionId)));
    });

    app.post('/api/ai/reindex', async (req, res) => {
        if (!req.isAuthenticated() || !req.user.isAdmin) return res.sendStatus(401);
        try {
            const versions = await storage.getAllReportVersions();
            for (const v of versions) {
                await indexContent('report_post', v.id, v.userId, v.content, v.sectionId, { justiceLensTags: v.justiceLensTags }, 'cohort');
            }
            const allReflections = await storage.getAllReflections();
            for (const r of allReflections) {
                const inquiry = await storage.getInquiryById(r.inquiryId);
                if (inquiry) await indexContent('reflection', r.id, inquiry.userId, r.content, undefined, { weekOf: r.weekOf }, 'private');
            }
            res.json({ success: true, indexed: { versions: versions.length, reflections: allReflections.length } });
        } catch (err) {
            console.error('Reindex error:', err);
            res.status(500).json({ message: 'Failed to reindex content' });
        }
    });

    // Seed initial data
    await seedData();
}

async function seedData() {
    if (!(await storage.getUserByUsername('admin'))) {
        const hashed = await hashPassword('admin123');
        await storage.createUser({ username: 'admin', password: hashed, fullName: 'System Administrator', role: 'admin', isAdmin: true });
    }
    if (!(await storage.getSetting('magic_code'))) {
        await storage.updateSetting({ key: 'magic_code', value: 'cohort2026' });
        await storage.updateSetting({ key: 'cohort_name', value: 'Inquiry Cohort 2026' });
    }
    if (!(await storage.getSetting('cohort_start'))) {
        await storage.updateSetting({ key: 'cohort_start', value: '2026-01-13' });
        await storage.updateSetting({ key: 'cohort_end', value: '2026-07-01' });
    }
    await storage.seedReportSections([
        { title: 'Introduction/Context', orderIndex: 1, slug: 'intro', description: 'Describe the context of your inquiry and why it matters.' },
        { title: 'Inquiry Question(s)', orderIndex: 2, slug: 'question', description: 'State your core research question(s).' },
        { title: 'Methods / Learning Pathway', orderIndex: 3, slug: 'methods', description: 'What did you do? Books read, tools tested, etc.' },
        { title: 'Key Insights', orderIndex: 4, slug: 'insights', description: 'What were your major findings?' },
        { title: 'Ethical & Justice Considerations', orderIndex: 5, slug: 'ethics', description: 'Apply the justice lenses here.' },
        { title: 'Implications for Practice', orderIndex: 6, slug: 'implications', description: 'How does this change our work?' },
        { title: 'Recommendations / Next Steps', orderIndex: 7, slug: 'recommendations', description: 'What should happen next?' },
        { title: 'References', orderIndex: 8, slug: 'references', description: 'Cite your sources.' },
    ]);
    await storage.seedJusticeLenses([
        { slug: 'who_benefits', label: 'Who benefits?', orderIndex: 1 },
        { slug: 'who_is_harmed', label: 'Who is harmed?', orderIndex: 2 },
        { slug: 'labor', label: 'Invisible Labor', orderIndex: 3 },
        { slug: 'power', label: 'Power Dynamics', orderIndex: 4 },
    ]);
    const meetings = await storage.getMeetings();
    if (meetings.length === 0) {
        await storage.createMeeting({ date: new Date('2026-01-20T17:00:00'), title: 'Kickoff Meeting', agenda: '1. Introductions\n2. Review Syllabus\n3. Assign Groups', notes: 'Welcome everyone!', zoomLink: 'https://zoom.us/j/example' });
    }
}

module.exports = { registerRoutes };
