const express = require('express');
const { randomUUID } = require('crypto');
const router = express.Router();
const pool = require('../db');
const ensureSchema = require('../services/ensureElectionPredictorSchema');
const { generateComparisonInsights, generateCustomPrediction, analyzeNaturalLanguageQuery, reanalyzeRace } = require('../services/electionPredictorAI');

// Ensure tables exist before any request
router.use(async (_req, _res, next) => {
    try { await ensureSchema(); next(); } catch (err) { next(err); }
});

// ─── Helpers ────────────────────────────────────────────────────────────────

function mapCandidate(r) {
    return {
        id: r.id, name: r.name, party: r.party,
        photoUrl: r.photo_url || undefined,
        position: r.position || undefined,
        district: r.district || undefined,
        state: r.state || undefined,
        pollingAverage: r.polling_average ?? undefined,
        fundraisingTotal: r.fundraising_total ?? undefined,
        isIncumbent: r.is_incumbent ?? undefined,
        yearsExperience: r.years_experience ?? undefined,
        majorEndorsements: r.major_endorsements ?? undefined,
        // keep snake_case for AI fallback too
        polling_average: r.polling_average,
        fundraising_total: r.fundraising_total,
        is_incumbent: r.is_incumbent,
        years_experience: r.years_experience,
        major_endorsements: r.major_endorsements,
    };
}

function mapRace(r) {
    return {
        id: r.id, type: r.type, title: r.title,
        state: r.state || undefined, district: r.district || undefined,
        electionDate: r.election_date, description: r.description || undefined,
        viewCount: r.view_count || 0,
    };
}

function mapPrediction(r) {
    return {
        raceId: r.race_id, candidateId: r.candidate_id,
        winProbability: r.win_probability,
        confidenceInterval: { low: r.confidence_interval_low, high: r.confidence_interval_high },
        factors: r.factors, lastUpdated: r.last_updated,
        methodology: r.methodology, aiAnalysis: r.ai_analysis || undefined,
    };
}

function inferRaceTypeFromText(input) {
    const text = String(input || '').toLowerCase();
    if (/president|presidential|white\s+house/.test(text)) return 'Presidential';
    if (/senate|senator/.test(text)) return 'Senate';
    if (/house|congressional|representative\b/.test(text)) return 'House';
    if (/governor|gubernatorial/.test(text)) return 'Governor';
    if (/mayor|city\s+council|county|school\s+board|local/.test(text)) return 'Local';
    return 'Local';
}

async function getCandidatesByRace(raceId) {
    const res = await pool.query(
        `SELECT c.* FROM ep_candidates c JOIN ep_race_candidates rc ON rc.candidate_id = c.id WHERE rc.race_id = $1`,
        [raceId]
    );
    return res.rows.map(mapCandidate);
}

async function getPredictionsByRace(raceId) {
    const res = await pool.query(`SELECT * FROM ep_predictions WHERE race_id = $1`, [raceId]);
    return res.rows.map(mapPrediction);
}

async function upsertPrediction(p) {
    await pool.query(
        `INSERT INTO ep_predictions (race_id, candidate_id, win_probability, confidence_interval_low, confidence_interval_high, factors, last_updated, methodology, ai_analysis)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (race_id, candidate_id) DO UPDATE SET
           win_probability=$3, confidence_interval_low=$4, confidence_interval_high=$5,
           factors=$6, last_updated=$7, methodology=$8, ai_analysis=$9`,
        [p.raceId, p.candidateId, p.winProbability,
        p.confidenceInterval.low, p.confidenceInterval.high,
        JSON.stringify(p.factors), p.lastUpdated || new Date().toISOString(),
        p.methodology, p.aiAnalysis || null]
    );
}

async function createRaceWithCandidates(race, candidates, predictions) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(
            `INSERT INTO ep_races (id, type, title, state, district, election_date, description) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
            [race.id, race.type, race.title, race.state || null, race.district || null, race.electionDate, race.description || null]
        );
        for (const c of candidates) {
            await client.query(
                `INSERT INTO ep_candidates (id, name, party) VALUES ($1,$2,$3) ON CONFLICT (id) DO NOTHING`,
                [c.id, c.name, c.party]
            );
            await client.query(
                `INSERT INTO ep_race_candidates (race_id, candidate_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
                [race.id, c.id]
            );
        }
        for (const p of predictions) {
            await client.query(
                `INSERT INTO ep_predictions (race_id, candidate_id, win_probability, confidence_interval_low, confidence_interval_high, factors, last_updated, methodology)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
                [p.raceId, p.candidateId, p.winProbability, p.confidenceInterval.low, p.confidenceInterval.high,
                JSON.stringify(p.factors), p.lastUpdated || new Date().toISOString(), p.methodology]
            );
        }
        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

// ─── Public Routes ───────────────────────────────────────────────────────────

router.get('/races', async (_req, res) => {
    try {
        const races = (await pool.query(`SELECT * FROM ep_races`)).rows;
        const racesWithData = await Promise.all(races.map(async (r) => ({
            race: mapRace(r),
            candidates: await getCandidatesByRace(r.id),
            predictions: await getPredictionsByRace(r.id),
        })));

        racesWithData.sort((a, b) => {
            const electionA = Date.parse(a.race.electionDate);
            const electionB = Date.parse(b.race.electionDate);
            const dateDiff = (Number.isNaN(electionB) ? 0 : electionB) - (Number.isNaN(electionA) ? 0 : electionA);
            if (dateDiff !== 0) return dateDiff;

            return a.race.title.localeCompare(b.race.title);
        });

        res.json(racesWithData);
    } catch (err) { res.status(500).json({ error: 'Failed to fetch races' }); }
});

router.get('/races/:id', async (req, res) => {
    try {
        const r = (await pool.query(`SELECT * FROM ep_races WHERE id=$1`, [req.params.id])).rows[0];
        if (!r) return res.status(404).json({ error: 'Race not found' });
        res.json({ race: mapRace(r), candidates: await getCandidatesByRace(r.id), predictions: await getPredictionsByRace(r.id) });
    } catch (err) { res.status(500).json({ error: 'Failed to fetch race' }); }
});

router.post('/races/:id/view', async (req, res) => {
    try {
        await pool.query(`UPDATE ep_races SET view_count = COALESCE(view_count,0)+1 WHERE id=$1`, [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed to increment views' }); }
});

router.get('/candidates', async (_req, res) => {
    try {
        const rows = (await pool.query(`SELECT * FROM ep_candidates`)).rows;
        res.json(rows.map(mapCandidate));
    } catch (err) { res.status(500).json({ error: 'Failed to fetch candidates' }); }
});

router.get('/featured-matchups', async (_req, res) => {
    try {
        const rows = (await pool.query(`SELECT * FROM ep_featured_matchups ORDER BY display_order`)).rows;
        res.json(rows.map(r => ({ id: r.id, title: r.title, description: r.description, url: r.url, displayOrder: r.display_order, createdAt: r.created_at })));
    } catch (err) { res.status(500).json({ error: 'Failed to fetch featured matchups' }); }
});

router.post('/compare', async (req, res) => {
    try {
        const { candidate1Id, candidate2Id } = req.body;
        if (!candidate1Id || !candidate2Id) return res.status(400).json({ error: 'Both candidate IDs are required' });

        const c1Row = (await pool.query(`SELECT * FROM ep_candidates WHERE id=$1`, [candidate1Id])).rows[0];
        const c2Row = (await pool.query(`SELECT * FROM ep_candidates WHERE id=$1`, [candidate2Id])).rows[0];
        if (!c1Row || !c2Row) return res.status(404).json({ error: 'One or both candidates not found' });

        // Find shared race
        const raceRes = await pool.query(
            `SELECT rc1.race_id FROM ep_race_candidates rc1 JOIN ep_race_candidates rc2 ON rc1.race_id=rc2.race_id WHERE rc1.candidate_id=$1 AND rc2.candidate_id=$2 LIMIT 1`,
            [candidate1Id, candidate2Id]
        );
        if (!raceRes.rows[0]) return res.status(400).json({ error: 'Candidates are not in the same race' });

        const raceId = raceRes.rows[0].race_id;
        const raceRow = (await pool.query(`SELECT * FROM ep_races WHERE id=$1`, [raceId])).rows[0];
        const p1Row = (await pool.query(`SELECT * FROM ep_predictions WHERE race_id=$1 AND candidate_id=$2`, [raceId, candidate1Id])).rows[0];
        const p2Row = (await pool.query(`SELECT * FROM ep_predictions WHERE race_id=$1 AND candidate_id=$2`, [raceId, candidate2Id])).rows[0];
        if (!raceRow || !p1Row || !p2Row) return res.status(404).json({ error: 'Prediction data not found' });

        const candidate1 = mapCandidate(c1Row);
        const candidate2 = mapCandidate(c2Row);
        const prediction1 = mapPrediction(p1Row);
        const prediction2 = mapPrediction(p2Row);

        const factorKeys = ['partisanLean', 'polling', 'candidateExperience', 'fundraising', 'nameRecognition', 'endorsements', 'issueAlignment', 'momentum'];
        const factorLabels = {
            partisanLean: 'Partisan Lean / Demographics', polling: 'Polling Average',
            candidateExperience: 'Candidate Experience / Incumbency', fundraising: 'Fundraising / Campaign Resources',
            nameRecognition: 'Name Recognition / Public Visibility', endorsements: 'Endorsements / Party Support',
            issueAlignment: 'Issue Alignment / Ideology Fit', momentum: 'Momentum / Public Engagement',
        };

        const factorComparison = factorKeys.map(factor => ({
            factor, label: factorLabels[factor],
            candidate1Score: prediction1.factors[factor],
            candidate2Score: prediction2.factors[factor],
            advantage: prediction1.factors[factor] > prediction2.factors[factor] ? candidate1.name : candidate2.name,
        }));

        const aiInsights = await generateComparisonInsights(candidate1.name, candidate2.name, mapRace(raceRow).title, factorComparison);
        res.json({ candidate1, candidate2, race: mapRace(raceRow), prediction1, prediction2, factorComparison, aiInsights });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to generate comparison' }); }
});

router.post('/custom-prediction', async (req, res) => {
    try {
        const { candidates, raceTitle, raceType } = req.body;
        if (!Array.isArray(candidates) || candidates.length < 2) return res.status(400).json({ error: 'At least 2 candidates required' });

        const normalized = candidates.map(c => ({ name: c.name?.trim(), party: c.party })).filter(c => c.name && c.party);
        const names = normalized.map(c => c.name.toLowerCase());
        if (new Set(names).size !== names.length) return res.status(400).json({ error: 'All candidates must be different' });

        const allowedRaceTypes = ['Presidential', 'Senate', 'House', 'Governor', 'Local'];
        const selectedRaceType = allowedRaceTypes.includes(raceType)
            ? raceType
            : inferRaceTypeFromText(raceTitle);

        const result = await generateCustomPrediction(normalized, raceTitle?.trim() || 'Custom Race');
        const raceId = randomUUID();
        const race = {
            id: raceId, type: selectedRaceType, title: raceTitle?.trim() || 'Custom Race Analysis',
            electionDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), description: 'Custom race via manual entry'
        };

        const newCandidates = normalized.map(c => ({ id: randomUUID(), name: c.name, party: c.party }));
        const predictions = newCandidates.map(c => {
            const predData = result.predictions[c.name];
            if (!predData) return {
                raceId, candidateId: c.id, winProbability: 50,
                confidenceInterval: { low: 40, high: 60 },
                factors: { partisanLean: 50, polling: 50, candidateExperience: 50, fundraising: 50, nameRecognition: 50, endorsements: 50, issueAlignment: 50, momentum: 50 },
                lastUpdated: new Date().toISOString(), methodology: 'AI-powered custom prediction (default)'
            };
            return {
                raceId, candidateId: c.id, winProbability: predData.probability,
                confidenceInterval: { low: Math.max(0, predData.probability - 10), high: Math.min(100, predData.probability + 10) },
                factors: predData.factors, lastUpdated: new Date().toISOString(), methodology: 'AI-powered custom prediction'
            };
        });

        await createRaceWithCandidates(race, newCandidates, predictions);
        res.json({ raceId, title: race.title, candidates: newCandidates, predictions, analysis: result.analysis });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to generate prediction' }); }
});

router.post('/natural-language-analysis', async (req, res) => {
    try {
        const { query } = req.body;
        if (!query || typeof query !== 'string' || !query.trim()) return res.status(400).json({ error: 'Query is required' });

        const result = await analyzeNaturalLanguageQuery(query.trim());
        if (!result.candidates || result.candidates.length === 0) return res.status(400).json({ error: 'Could not extract candidates from query.' });

        const raceId = randomUUID();
        const inferredRaceType = inferRaceTypeFromText(`${query} ${result.raceTitle}`);
        const race = {
            id: raceId, type: inferredRaceType, title: result.raceTitle,
            electionDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            description: `AI analysis from query: "${query.substring(0, 100)}"`
        };

        const newCandidates = result.candidates.map(c => ({ id: randomUUID(), name: c.name.trim(), party: c.party }));
        const predictions = newCandidates.map(c => {
            const predData = result.predictions?.[c.name];
            if (!predData) return {
                raceId, candidateId: c.id, winProbability: 50,
                confidenceInterval: { low: 40, high: 60 },
                factors: { partisanLean: 50, polling: 50, candidateExperience: 50, fundraising: 50, nameRecognition: 50, endorsements: 50, issueAlignment: 50, momentum: 50 },
                lastUpdated: new Date().toISOString(), methodology: 'AI natural language analysis (default)'
            };
            return {
                raceId, candidateId: c.id, winProbability: predData.probability,
                confidenceInterval: { low: Math.max(0, predData.probability - 8), high: Math.min(100, predData.probability + 8) },
                factors: predData.factors, lastUpdated: new Date().toISOString(), methodology: 'AI natural language analysis'
            };
        });

        await createRaceWithCandidates(race, newCandidates, predictions);
        res.json({ raceId, query, raceTitle: result.raceTitle, candidates: newCandidates, predictions, analysis: result.analysis });
    } catch (err) {
        console.error(err);
        if (err.message?.startsWith('FACT_FINDING_QUESTION:')) return res.status(400).json({ error: err.message });
        res.status(500).json({ error: 'Failed to analyze query' });
    }
});

// ─── Admin Routes ─────────────────────────────────────────────────────────────

router.post('/admin/races', async (req, res) => {
    try {
        const { type, title, state, district, electionDate, description } = req.body;
        if (!type || !title || !electionDate) return res.status(400).json({ error: 'type, title, electionDate required' });
        const id = randomUUID();
        const row = (await pool.query(
            `INSERT INTO ep_races (id, type, title, state, district, election_date, description) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
            [id, type, title, state || null, district || null, electionDate, description || null]
        )).rows[0];
        res.json(mapRace(row));
    } catch (err) { res.status(500).json({ error: 'Failed to create race' }); }
});

router.put('/admin/races/:id', async (req, res) => {
    try {
        const { type, title, state, district, electionDate, description } = req.body;
        const row = (await pool.query(
            `UPDATE ep_races SET type=COALESCE($2,type), title=COALESCE($3,title), state=$4, district=$5,
             election_date=COALESCE($6,election_date), description=$7 WHERE id=$1 RETURNING *`,
            [req.params.id, type || null, title || null, state || null, district || null, electionDate || null, description || null]
        )).rows[0];
        if (!row) return res.status(404).json({ error: 'Race not found' });
        res.json(mapRace(row));
    } catch (err) { res.status(500).json({ error: 'Failed to update race' }); }
});

router.delete('/admin/races/:id', async (req, res) => {
    try {
        await pool.query(`DELETE FROM ep_races WHERE id=$1`, [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed to delete race' }); }
});

router.post('/admin/races/:id/reanalyze', async (req, res) => {
    try {
        const raceRow = (await pool.query(`SELECT * FROM ep_races WHERE id=$1`, [req.params.id])).rows[0];
        if (!raceRow) return res.status(404).json({ error: 'Race not found' });

        const candidates = await getCandidatesByRace(req.params.id);
        if (candidates.length === 0) return res.status(400).json({ error: 'Race must have candidates to reanalyze' });

        const newPredictions = await reanalyzeRace(raceRow.title, candidates);

        for (const candidate of candidates) {
            const predData = newPredictions[candidate.name];
            if (predData) {
                await upsertPrediction({
                    raceId: raceRow.id, candidateId: candidate.id,
                    winProbability: predData.probability,
                    confidenceInterval: { low: Math.max(0, predData.probability - 5), high: Math.min(100, predData.probability + 5) },
                    factors: predData.factors || predData,
                    lastUpdated: new Date().toISOString(),
                    methodology: 'AI-powered reanalysis using 8-factor model.',
                    aiAnalysis: 'Updated based on current political landscape.',
                });
            }
        }

        const updatedPredictions = await getPredictionsByRace(raceRow.id);
        res.json({ success: true, predictions: updatedPredictions, message: 'Race reanalyzed successfully' });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to reanalyze race' }); }
});

router.post('/admin/races/:raceId/candidates', async (req, res) => {
    try {
        const { name, party, photoUrl, position, district, state, pollingAverage, fundraisingTotal, isIncumbent, yearsExperience, majorEndorsements } = req.body;
        if (!name || !party) return res.status(400).json({ error: 'name and party required' });
        const id = randomUUID();
        await pool.query(
            `INSERT INTO ep_candidates (id, name, party, photo_url, position, district, state, polling_average, fundraising_total, is_incumbent, years_experience, major_endorsements)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
            [id, name, party, photoUrl || null, position || null, district || null, state || null,
                pollingAverage ?? null, fundraisingTotal ?? null, isIncumbent ? 1 : 0, yearsExperience ?? null, majorEndorsements ?? null]
        );
        await pool.query(`INSERT INTO ep_race_candidates (race_id, candidate_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [req.params.raceId, id]);
        const row = (await pool.query(`SELECT * FROM ep_candidates WHERE id=$1`, [id])).rows[0];
        res.json(mapCandidate(row));
    } catch (err) { res.status(500).json({ error: 'Failed to create candidate' }); }
});

router.get('/admin/races/:raceId/candidates', async (req, res) => {
    try { res.json(await getCandidatesByRace(req.params.raceId)); }
    catch (err) { res.status(500).json({ error: 'Failed to fetch candidates' }); }
});

router.put('/admin/candidates/:id', async (req, res) => {
    try {
        const { name, party, photoUrl, position, district, state, pollingAverage, fundraisingTotal, isIncumbent, yearsExperience, majorEndorsements } = req.body;
        const row = (await pool.query(
            `UPDATE ep_candidates SET name=COALESCE($2,name), party=COALESCE($3,party), photo_url=$4, position=$5,
             district=$6, state=$7, polling_average=$8, fundraising_total=$9, is_incumbent=$10, years_experience=$11, major_endorsements=$12
             WHERE id=$1 RETURNING *`,
            [req.params.id, name || null, party || null, photoUrl || null, position || null, district || null, state || null,
            pollingAverage ?? null, fundraisingTotal ?? null, isIncumbent !== undefined ? isIncumbent ? 1 : 0 : null, yearsExperience ?? null, majorEndorsements ?? null]
        )).rows[0];
        if (!row) return res.status(404).json({ error: 'Candidate not found' });
        res.json(mapCandidate(row));
    } catch (err) { res.status(500).json({ error: 'Failed to update candidate' }); }
});

router.delete('/admin/candidates/:id', async (req, res) => {
    try {
        await pool.query(`DELETE FROM ep_candidates WHERE id=$1`, [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed to delete candidate' }); }
});

router.post('/admin/featured-matchups', async (req, res) => {
    try {
        const { title, description, url, displayOrder } = req.body;
        if (!title || !description || !url) return res.status(400).json({ error: 'title, description, url required' });
        const id = randomUUID();
        const row = (await pool.query(
            `INSERT INTO ep_featured_matchups (id, title, description, url, display_order) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
            [id, title, description, url, displayOrder || 0]
        )).rows[0];
        res.json({ id: row.id, title: row.title, description: row.description, url: row.url, displayOrder: row.display_order, createdAt: row.created_at });
    } catch (err) { res.status(500).json({ error: 'Failed to create featured matchup' }); }
});

router.put('/admin/featured-matchups/:id', async (req, res) => {
    try {
        const { title, description, url, displayOrder } = req.body;
        const row = (await pool.query(
            `UPDATE ep_featured_matchups SET title=COALESCE($2,title), description=COALESCE($3,description), url=COALESCE($4,url), display_order=COALESCE($5,display_order) WHERE id=$1 RETURNING *`,
            [req.params.id, title || null, description || null, url || null, displayOrder ?? null]
        )).rows[0];
        if (!row) return res.status(404).json({ error: 'Matchup not found' });
        res.json({ id: row.id, title: row.title, description: row.description, url: row.url, displayOrder: row.display_order, createdAt: row.created_at });
    } catch (err) { res.status(500).json({ error: 'Failed to update featured matchup' }); }
});

router.delete('/admin/featured-matchups/:id', async (req, res) => {
    try {
        await pool.query(`DELETE FROM ep_featured_matchups WHERE id=$1`, [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed to delete featured matchup' }); }
});

module.exports = router;
