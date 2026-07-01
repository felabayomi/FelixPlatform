const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://app-7mggnqfx6-felabayomis-projects.vercel.app',
    'https://app-mu-liart-41.vercel.app'
  ],
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));

app.get('/', (req, res) => {
  res.json({
    message: 'Felix Platform Backend Running',
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 5000,
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'campaign-signal-studio-api',
    environment: process.env.NODE_ENV || 'production',
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/auth/signup', (req, res) => {
  const { email, name, organizationName } = req.body || {};

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  res.json({
    ok: true,
    message: 'Signup smoke test passed',
    user: {
      id: 'demo-user',
      email,
      name: name || 'Demo User',
    },
    organization: {
      id: 'demo-org',
      name: organizationName || 'Demo Organization',
    },
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email } = req.body || {};

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  res.json({
    ok: true,
    message: 'Login smoke test passed',
    user: {
      id: 'demo-user',
      email,
      role: 'organization_admin',
    },
    token: 'demo-token',
  });
});

app.get('/api/organization', (req, res) => {
  res.json({
    organization: {
      id: 'demo-org',
      name: 'Demo Organization',
      accessState: 'active_subscription',
      hasPremiumAccess: true,
    },
  });
});

app.post('/api/campaign-signal', async (req, res) => {
  const input = req.body || {};

  res.json({
    raceSnapshot: `Signal report generated for ${input.candidateName || 'the candidate'}.`,
    opponentWatch: `Monitor public activity from ${input.opponentName || 'the opponent'}.`,
    messageOpportunities: [
      'Clarify the candidate’s core message.',
      'Respond with a practical contrast.',
      'Turn the recent moment into short-form content.'
    ],
    contentIdeas: [
      'Create a 60-second explainer video.',
      'Publish a quote graphic.',
      'Send a short fundraising email.'
    ],
    videoAngles: [
      'What this issue means for local families',
      'The candidate’s practical plan',
      'A calm response to the latest attack'
    ],
    quoteGraphics: [
      'Leadership means showing up with a plan.',
      'Our campaign is focused on people, not political noise.'
    ],
    fundraisingCaptions: [
      'Help us keep this campaign focused on local priorities.',
      'Chip in today to help us reach more voters.'
    ],
    weeklyMemo: 'Focus this week on one clear issue, three short content pieces, and one direct call to action.',
  });
});

/**
 * Temporary compatibility routes.
 * These support accidental double-prefix calls like:
 * /api/campaign-signal/api/health
 */
app.get('/api/campaign-signal/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'campaign-signal-studio-api',
    compatibilityRoute: true,
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/campaign-signal/api/auth/signup', (req, res) => {
  const { email, name, organizationName } = req.body || {};

  res.json({
    ok: true,
    compatibilityRoute: true,
    message: 'Signup smoke test passed',
    user: {
      id: 'demo-user',
      email,
      name: name || 'Demo User',
    },
    organization: {
      id: 'demo-org',
      name: organizationName || 'Demo Organization',
    },
  });
});

app.post('/api/campaign-signal/api/auth/login', (req, res) => {
  const { email } = req.body || {};

  res.json({
    ok: true,
    compatibilityRoute: true,
    message: 'Login smoke test passed',
    user: {
      id: 'demo-user',
      email,
      role: 'organization_admin',
    },
    token: 'demo-token',
  });
});

app.get('/api/campaign-signal/api/organization', (req, res) => {
  res.json({
    organization: {
      id: 'demo-org',
      name: 'Demo Organization',
      accessState: 'active_subscription',
      hasPremiumAccess: true,
    },
    compatibilityRoute: true,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});