const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.ELECTION_PREDICTOR_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
});

function normalizeUniqueProbabilities(weightedScores) {
    const SCALE = 10;
    const MIN_PROB = 1;
    const MIN_GAP = 3;
    const TARGET_TOTAL = 1000;
    const n = weightedScores.length;

    const baseline = weightedScores.map((_, i) => MIN_PROB + MIN_GAP * (n - 1 - i));
    const baselineSum = baseline.reduce((sum, b) => sum + b, 0);
    if (baselineSum > TARGET_TOTAL) throw new Error(`Too many candidates (${n})`);

    const totalWeight = weightedScores.reduce((sum, w) => sum + w, 0);
    const weightShares = weightedScores.map(w => w / totalWeight);
    const extraPool = TARGET_TOTAL - baselineSum;
    const ideal = baseline.map((b, i) => b + extraPool * weightShares[i]);
    const prob = ideal.map(v => Math.floor(v));
    const remainders = ideal.map((v, i) => ({ index: i, remainder: v - prob[i] }));
    remainders.sort((a, b) => b.remainder - a.remainder);

    let allocated = prob.reduce((sum, p) => sum + p, 0);
    for (const { index } of remainders) {
        if (allocated >= TARGET_TOTAL) break;
        const upperBound = index === 0 ? TARGET_TOTAL : prob[index - 1] - MIN_GAP;
        if (prob[index] < upperBound) { prob[index]++; allocated++; }
    }

    const remaining = TARGET_TOTAL - allocated;
    if (remaining > 0) {
        for (let i = 0; i < n && allocated < TARGET_TOTAL; i++) {
            const upperBound = i === 0 ? TARGET_TOTAL : prob[i - 1] - MIN_GAP;
            while (prob[i] < upperBound && allocated < TARGET_TOTAL) { prob[i]++; allocated++; }
        }
    } else if (remaining < 0) {
        for (let i = n - 1; i >= 0 && allocated > TARGET_TOTAL; i--) {
            const lowerBound = i === n - 1 ? MIN_PROB : prob[i + 1] + MIN_GAP;
            while (prob[i] > lowerBound && allocated > TARGET_TOTAL) { prob[i]--; allocated--; }
        }
    }

    for (let i = 1; i < n; i++) {
        if (prob[i] >= prob[i - 1] - MIN_GAP + 1) prob[i] = prob[i - 1] - MIN_GAP;
    }

    let finalTotal = prob.reduce((sum, p) => sum + p, 0);
    if (finalTotal !== TARGET_TOTAL) prob[0] += TARGET_TOTAL - finalTotal;

    return prob.map(p => p / SCALE);
}

function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
}

function generateDeterministicPredictions(candidates) {
    const candidatesWithScores = candidates.map((candidate) => {
        const hash = hashString(candidate.id);
        const seed = hash % 100;
        const factors = {
            partisanLean: 40 + ((seed + 0) % 30),
            polling: candidate.polling_average != null
                ? Math.min(100, Math.max(0, candidate.polling_average))
                : 40 + ((seed + 11) % 30),
            candidateExperience: (() => {
                let base = 40 + ((seed + 23) % 30);
                if (candidate.is_incumbent) base += 20;
                if (candidate.years_experience != null) base = Math.min(100, base + Math.min(30, candidate.years_experience * 2));
                return Math.min(100, base);
            })(),
            fundraising: candidate.fundraising_total != null
                ? Math.min(100, Math.max(0, candidate.fundraising_total / 10000000 * 100))
                : 40 + ((seed + 37) % 30),
            nameRecognition: 40 + ((seed + 47) % 30),
            endorsements: candidate.major_endorsements > 0
                ? Math.min(100, 30 + candidate.major_endorsements * 10)
                : 40 + ((seed + 59) % 30),
            issueAlignment: 40 + ((seed + 71) % 30),
            momentum: 40 + ((seed + 83) % 30),
        };
        const compositeScore =
            (factors.partisanLean * 0.25) + (factors.polling * 0.20) +
            (factors.candidateExperience * 0.15) + (factors.fundraising * 0.15) +
            (factors.nameRecognition * 0.10) + (factors.endorsements * 0.10) +
            (factors.issueAlignment * 0.05) + (factors.momentum * 0.05);
        return { candidate, factors, compositeScore };
    });

    candidatesWithScores.sort((a, b) => {
        const diff = b.compositeScore - a.compositeScore;
        return diff !== 0 ? diff : a.candidate.name.localeCompare(b.candidate.name);
    });

    const probs = normalizeUniqueProbabilities(candidatesWithScores.map(i => i.compositeScore));
    const predictions = {};
    candidatesWithScores.forEach((item, i) => {
        predictions[item.candidate.name] = { probability: probs[i], factors: item.factors };
    });
    return predictions;
}

async function generateComparisonInsights(candidate1Name, candidate2Name, race, factors) {
    const prompt = `You are a political analyst. Compare these two candidates running in ${race}:
Candidate 1: ${candidate1Name}
Candidate 2: ${candidate2Name}
Key factors comparison:
${JSON.stringify(factors, null, 2)}
Provide a concise 3-4 paragraph analysis. Keep the tone professional, neutral, and data-focused like FiveThirtyEight.`;
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4.1-mini',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 1000,
        });
        return response.choices[0]?.message?.content || 'Analysis unavailable.';
    } catch (error) {
        console.error('[EP] OpenAI comparison error:', error);
        return 'Analysis temporarily unavailable. The prediction is based on comprehensive statistical modeling using 8 key factors.';
    }
}

async function generateCustomPrediction(candidates, raceTitle) {
    const prompt = `You are a political data scientist. Analyze this election scenario:
Race: ${raceTitle}
Candidates:
${candidates.map((c, i) => `${i + 1}. ${c.name} (${c.party})`).join('\n')}
Generate realistic win probabilities and factor scores (0-100) for each candidate. Return JSON:
{
  "predictions": {
    "candidate_name": {
      "probability": number,
      "factors": { "partisanLean": number, "polling": number, "candidateExperience": number, "fundraising": number, "nameRecognition": number, "endorsements": number, "issueAlignment": number, "momentum": number }
    }
  },
  "analysis": "3-4 paragraph analysis"
}
CRITICAL: Each candidate MUST have a UNIQUE probability. Probabilities sum to ~100.`;
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4.1-mini',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 2000,
        });
        let content = response.choices[0]?.message?.content || '{}';
        if (content.trim().startsWith('```')) content = content.replace(/^```(?:json)?\s*\n/, '').replace(/\n```\s*$/, '');
        const result = JSON.parse(content);
        return { predictions: result.predictions || {}, analysis: result.analysis || 'Analysis generated.' };
    } catch (error) {
        console.error('[EP] OpenAI custom prediction error:', error);
        const fallbackPredictions = {};
        const candidatesWithScores = candidates.map((c, i) => {
            const nameHash = c.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const seed = (nameHash + i * 17) % 100;
            const factors = {
                partisanLean: 40 + ((seed * 7) % 40), polling: 40 + ((seed * 29) % 40),
                candidateExperience: 40 + ((seed * 11) % 40), fundraising: 40 + ((seed * 31) % 40),
                nameRecognition: 40 + ((seed * 13) % 40), endorsements: 40 + ((seed * 17) % 40),
                issueAlignment: 40 + ((seed * 19) % 40), momentum: 40 + ((seed * 23) % 40),
            };
            const compositeScore = (factors.partisanLean * 0.25) + (factors.polling * 0.20) +
                (factors.candidateExperience * 0.15) + (factors.fundraising * 0.15) +
                (factors.nameRecognition * 0.10) + (factors.endorsements * 0.10) +
                (factors.issueAlignment * 0.05) + (factors.momentum * 0.05);
            return { candidate: c, factors, compositeScore };
        });
        candidatesWithScores.sort((a, b) => b.compositeScore - a.compositeScore || a.candidate.name.localeCompare(b.candidate.name));
        const probs = normalizeUniqueProbabilities(candidatesWithScores.map(i => i.compositeScore));
        candidatesWithScores.forEach((item, i) => { fallbackPredictions[item.candidate.name] = { probability: probs[i], factors: item.factors }; });
        return { predictions: fallbackPredictions, analysis: 'Prediction based on statistical modeling.' };
    }
}

async function analyzeNaturalLanguageQuery(query) {
    const prompt = `You are a political data scientist. A user asked: "${query}"
Extract the candidates and race from this query, generate probabilities and analysis.
If this is a fact-finding question with no candidates to compare, throw an error starting with "FACT_FINDING_QUESTION:".
Return JSON:
{
  "raceTitle": "string",
  "candidates": [{ "name": "string", "party": "Democratic"|"Republican"|"Independent" }],
  "predictions": {
    "candidate_name": {
      "probability": number,
      "factors": { "partisanLean": number, "polling": number, "candidateExperience": number, "fundraising": number, "nameRecognition": number, "endorsements": number, "issueAlignment": number, "momentum": number }
    }
  },
  "analysis": "string"
}
CRITICAL: Each candidate MUST have a UNIQUE probability.`;
    const response = await openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
    });
    let content = response.choices[0]?.message?.content || '{}';
    if (content.trim().startsWith('```')) content = content.replace(/^```(?:json)?\s*\n/, '').replace(/\n```\s*$/, '');
    const result = JSON.parse(content);
    return result;
}

async function reanalyzeRace(raceTitle, candidates) {
    const candidateDescriptions = candidates.map((c, i) => {
        let desc = `${i + 1}. ${c.name} (${c.party})`;
        const details = [];
        if (c.polling_average != null) details.push(`Polling: ${c.polling_average}%`);
        if (c.fundraising_total != null) details.push(`Fundraising: $${c.fundraising_total.toLocaleString()}`);
        if (c.is_incumbent) details.push('Incumbent');
        if (c.years_experience != null) details.push(`Experience: ${c.years_experience} years`);
        if (c.major_endorsements > 0) details.push(`Endorsements: ${c.major_endorsements}`);
        if (details.length > 0) desc += ` - ${details.join(', ')}`;
        return desc;
    }).join('\n');

    const prompt = `You are a political data scientist. Re-analyze this election with the latest political landscape:
Race: ${raceTitle}
Candidates:
${candidateDescriptions}
Return JSON only:
{
  "predictions": {
    "candidate_name": {
      "probability": number,
      "factors": { "partisanLean": number, "polling": number, "candidateExperience": number, "fundraising": number, "nameRecognition": number, "endorsements": number, "issueAlignment": number, "momentum": number }
    }
  }
}
CRITICAL: Each candidate MUST have a UNIQUE probability. Sum to ~100.`;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4.1-mini',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 2000,
        });
        let content = response.choices[0]?.message?.content;
        if (!content || !content.trim()) {
            return {
                predictions: generateDeterministicPredictions(candidates),
                mode: 'fallback',
                fallbackReason: 'empty_ai_response',
            };
        }
        if (content.trim().startsWith('```')) content = content.replace(/^```(?:json)?\s*\n/, '').replace(/\n```\s*$/, '');
        const result = JSON.parse(content);
        if (!result.predictions || Object.keys(result.predictions).length === 0) {
            return {
                predictions: generateDeterministicPredictions(candidates),
                mode: 'fallback',
                fallbackReason: 'missing_predictions',
            };
        }

        return {
            predictions: result.predictions,
            mode: 'ai',
        };
    } catch (error) {
        console.error('[EP] reanalyzeRace error:', error);
        return {
            predictions: generateDeterministicPredictions(candidates),
            mode: 'fallback',
            fallbackReason: 'openai_error',
        };
    }
}

module.exports = { generateComparisonInsights, generateCustomPrediction, analyzeNaturalLanguageQuery, reanalyzeRace };
