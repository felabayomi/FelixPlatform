import { useEffect, useState } from 'react';
import API from '../services/api';

const SECTION_LINKS = [
    { id: 'races', label: 'Races' },
    { id: 'featured-matchups', label: 'Featured Matchups' },
];

const PARTY_COLORS = {
    Democratic: '#3b82f6',
    Republican: '#ef4444',
    Independent: '#8b5cf6',
};

function PartyBadge({ party }) {
    return (
        <span style={{
            background: PARTY_COLORS[party] || '#6b7280',
            color: '#fff',
            borderRadius: 4,
            padding: '2px 8px',
            fontSize: 12,
            fontWeight: 600,
        }}>
            {party}
        </span>
    );
}

// ─── Races Section ────────────────────────────────────────────────────────────

function RacesSection() {
    const [races, setRaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expanded, setExpanded] = useState(null);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({ title: '', type: 'Senate', state: '', electionDate: '', description: '' });
    const [saving, setSaving] = useState(false);
    const [reanalyzing, setReanalyzing] = useState(null);

    const load = async () => {
        setLoading(true);
        try {
            const data = await API.get('/api/election-predictor/races');
            setRaces(data);
        } catch (e) {
            setError('Failed to load races');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await API.post('/api/election-predictor/admin/races', form);
            setCreating(false);
            setForm({ title: '', type: 'Senate', state: '', electionDate: '', description: '' });
            load();
        } catch (e) {
            alert('Failed to create race');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this race and all its candidates/predictions?')) return;
        try {
            await API.delete(`/api/election-predictor/admin/races/${id}`);
            load();
        } catch (e) {
            alert('Failed to delete race');
        }
    };

    const handleReanalyze = async (id) => {
        setReanalyzing(id);
        try {
            await API.post(`/api/election-predictor/admin/races/${id}/reanalyze`, {});
            load();
        } catch (e) {
            alert('Failed to reanalyze race');
        } finally {
            setReanalyzing(null);
        }
    };

    if (loading) return <p style={{ color: '#888' }}>Loading races…</p>;
    if (error) return <p style={{ color: '#ef4444' }}>{error}</p>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0 }}>Election Races ({races.length})</h3>
                <button className="btn-primary" onClick={() => setCreating(!creating)}>
                    {creating ? 'Cancel' : '+ Add Race'}
                </button>
            </div>

            {creating && (
                <form onSubmit={handleCreate} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20, marginBottom: 20 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <label style={{ fontSize: 13, fontWeight: 600 }}>Title *</label>
                            <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="2028 Presidential General" />
                        </div>
                        <div>
                            <label style={{ fontSize: 13, fontWeight: 600 }}>Type *</label>
                            <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                                {['Presidential', 'Senate', 'House', 'Governor', 'Local'].map(t => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: 13, fontWeight: 600 }}>State</label>
                            <input className="input" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} placeholder="e.g. Texas" />
                        </div>
                        <div>
                            <label style={{ fontSize: 13, fontWeight: 600 }}>Election Date *</label>
                            <input className="input" type="date" value={form.electionDate} onChange={e => setForm(f => ({ ...f, electionDate: e.target.value }))} required />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ fontSize: 13, fontWeight: 600 }}>Description</label>
                            <textarea className="input" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" />
                        </div>
                    </div>
                    <button className="btn-primary" type="submit" disabled={saving} style={{ marginTop: 12 }}>
                        {saving ? 'Creating…' : 'Create Race'}
                    </button>
                </form>
            )}

            {races.length === 0 && <p style={{ color: '#888' }}>No races yet. Add one above.</p>}

            {races.map(({ race, candidates, predictions }) => (
                <div key={race.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 12, overflow: 'hidden' }}>
                    <div
                        style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: expanded === race.id ? '#f0f9ff' : '#fff' }}
                        onClick={() => setExpanded(expanded === race.id ? null : race.id)}
                    >
                        <div>
                            <span style={{ fontWeight: 700 }}>{race.title}</span>
                            <span style={{ marginLeft: 10, fontSize: 12, background: '#e5e7eb', borderRadius: 4, padding: '2px 8px' }}>{race.type}</span>
                            {race.state && <span style={{ marginLeft: 6, fontSize: 12, color: '#6b7280' }}>{race.state}</span>}
                            <span style={{ marginLeft: 10, fontSize: 12, color: '#6b7280' }}>{candidates.length} candidates • {race.viewCount || 0} views</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button
                                className="btn-secondary"
                                style={{ fontSize: 12, padding: '4px 10px' }}
                                disabled={reanalyzing === race.id}
                                onClick={(e) => { e.stopPropagation(); handleReanalyze(race.id); }}
                            >
                                {reanalyzing === race.id ? 'Reanalyzing…' : '🔄 Reanalyze'}
                            </button>
                            <a
                                href={`https://electionpredictor.net/race/${race.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-secondary"
                                style={{ fontSize: 12, padding: '4px 10px' }}
                                onClick={e => e.stopPropagation()}
                            >
                                View Live ↗
                            </a>
                            <button
                                style={{ fontSize: 12, padding: '4px 10px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                                onClick={(e) => { e.stopPropagation(); handleDelete(race.id); }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>

                    {expanded === race.id && (
                        <div style={{ padding: 16, borderTop: '1px solid #e5e7eb', background: '#fafafa' }}>
                            <CandidatesSection raceId={race.id} candidates={candidates} predictions={predictions} onRefresh={load} />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

// ─── Candidates Section ───────────────────────────────────────────────────────

function CandidatesSection({ raceId, candidates, predictions, onRefresh }) {
    const [adding, setAdding] = useState(false);
    const [form, setForm] = useState({ name: '', party: 'Democratic', pollingAverage: '', fundraisingTotal: '', isIncumbent: false, yearsExperience: '', majorEndorsements: '' });
    const [saving, setSaving] = useState(false);

    const predMap = {};
    predictions.forEach(p => { predMap[p.candidateId] = p; });

    const handleAdd = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await API.post(`/api/election-predictor/admin/races/${raceId}/candidates`, {
                ...form,
                pollingAverage: form.pollingAverage ? parseFloat(form.pollingAverage) : null,
                fundraisingTotal: form.fundraisingTotal ? parseFloat(form.fundraisingTotal) : null,
                yearsExperience: form.yearsExperience ? parseInt(form.yearsExperience) : null,
                majorEndorsements: form.majorEndorsements ? parseInt(form.majorEndorsements) : null,
            });
            setAdding(false);
            setForm({ name: '', party: 'Democratic', pollingAverage: '', fundraisingTotal: '', isIncumbent: false, yearsExperience: '', majorEndorsements: '' });
            onRefresh();
        } catch (e) {
            alert('Failed to add candidate');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Remove this candidate?')) return;
        try {
            await API.delete(`/api/election-predictor/admin/candidates/${id}`);
            onRefresh();
        } catch (e) {
            alert('Failed to delete candidate');
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <strong>Candidates</strong>
                <button className="btn-secondary" style={{ fontSize: 12 }} onClick={() => setAdding(!adding)}>
                    {adding ? 'Cancel' : '+ Add Candidate'}
                </button>
            </div>

            {adding && (
                <form onSubmit={handleAdd} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 600 }}>Name *</label>
                            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                        </div>
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 600 }}>Party *</label>
                            <select className="input" value={form.party} onChange={e => setForm(f => ({ ...f, party: e.target.value }))}>
                                {['Democratic', 'Republican', 'Independent'].map(p => <option key={p}>{p}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 600 }}>Polling Avg (%)</label>
                            <input className="input" type="number" step="0.1" value={form.pollingAverage} onChange={e => setForm(f => ({ ...f, pollingAverage: e.target.value }))} />
                        </div>
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 600 }}>Fundraising ($)</label>
                            <input className="input" type="number" value={form.fundraisingTotal} onChange={e => setForm(f => ({ ...f, fundraisingTotal: e.target.value }))} />
                        </div>
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 600 }}>Years Experience</label>
                            <input className="input" type="number" value={form.yearsExperience} onChange={e => setForm(f => ({ ...f, yearsExperience: e.target.value }))} />
                        </div>
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 600 }}>Major Endorsements</label>
                            <input className="input" type="number" value={form.majorEndorsements} onChange={e => setForm(f => ({ ...f, majorEndorsements: e.target.value }))} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input type="checkbox" checked={form.isIncumbent} onChange={e => setForm(f => ({ ...f, isIncumbent: e.target.checked }))} id="incumbent" />
                            <label htmlFor="incumbent" style={{ fontSize: 12, fontWeight: 600 }}>Incumbent</label>
                        </div>
                    </div>
                    <button className="btn-primary" type="submit" disabled={saving} style={{ marginTop: 10, fontSize: 12 }}>
                        {saving ? 'Adding…' : 'Add Candidate'}
                    </button>
                </form>
            )}

            {candidates.length === 0 && <p style={{ color: '#888', fontSize: 13 }}>No candidates yet.</p>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {candidates.map(c => {
                    const pred = predMap[c.id];
                    return (
                        <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: '8px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <PartyBadge party={c.party} />
                                <span style={{ fontWeight: 600 }}>{c.name}</span>
                                {c.isIncumbent ? <span style={{ fontSize: 11, color: '#6b7280' }}>Incumbent</span> : null}
                                {c.pollingAverage != null && <span style={{ fontSize: 12, color: '#6b7280' }}>📊 {c.pollingAverage}%</span>}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                {pred && (
                                    <span style={{ fontSize: 14, fontWeight: 700, color: pred.winProbability >= 50 ? '#22c55e' : '#6b7280' }}>
                                        {pred.winProbability.toFixed(1)}% win prob
                                    </span>
                                )}
                                <button
                                    style={{ fontSize: 12, padding: '3px 8px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                                    onClick={() => handleDelete(c.id)}
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Featured Matchups Section ─────────────────────────────────────────────────

function FeaturedMatchupsSection() {
    const [matchups, setMatchups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({ title: '', description: '', url: '', displayOrder: 0 });
    const [saving, setSaving] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const data = await API.get('/api/election-predictor/featured-matchups');
            setMatchups(data);
        } catch (e) {
            // ignore
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await API.post('/api/election-predictor/admin/featured-matchups', { ...form, displayOrder: parseInt(form.displayOrder) || 0 });
            setCreating(false);
            setForm({ title: '', description: '', url: '', displayOrder: 0 });
            load();
        } catch (e) {
            alert('Failed to create matchup');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this featured matchup?')) return;
        try {
            await API.delete(`/api/election-predictor/admin/featured-matchups/${id}`);
            load();
        } catch (e) {
            alert('Failed to delete matchup');
        }
    };

    if (loading) return <p style={{ color: '#888' }}>Loading featured matchups…</p>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0 }}>Featured Matchups ({matchups.length})</h3>
                <button className="btn-primary" onClick={() => setCreating(!creating)}>
                    {creating ? 'Cancel' : '+ Add Matchup'}
                </button>
            </div>

            {creating && (
                <form onSubmit={handleCreate} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20, marginBottom: 20 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <label style={{ fontSize: 13, fontWeight: 600 }}>Title *</label>
                            <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
                        </div>
                        <div>
                            <label style={{ fontSize: 13, fontWeight: 600 }}>URL *</label>
                            <input className="input" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} required placeholder="/race/..." />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ fontSize: 13, fontWeight: 600 }}>Description *</label>
                            <textarea className="input" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
                        </div>
                        <div>
                            <label style={{ fontSize: 13, fontWeight: 600 }}>Display Order</label>
                            <input className="input" type="number" value={form.displayOrder} onChange={e => setForm(f => ({ ...f, displayOrder: e.target.value }))} />
                        </div>
                    </div>
                    <button className="btn-primary" type="submit" disabled={saving} style={{ marginTop: 12 }}>
                        {saving ? 'Saving…' : 'Create Matchup'}
                    </button>
                </form>
            )}

            {matchups.length === 0 && <p style={{ color: '#888' }}>No featured matchups yet.</p>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {matchups.map(m => (
                    <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: '10px 14px' }}>
                        <div>
                            <div style={{ fontWeight: 700 }}>{m.title}</div>
                            <div style={{ fontSize: 13, color: '#6b7280' }}>{m.description}</div>
                            <div style={{ fontSize: 12, color: '#3b82f6' }}>{m.url}</div>
                        </div>
                        <button
                            style={{ fontSize: 12, padding: '4px 10px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                            onClick={() => handleDelete(m.id)}
                        >
                            Delete
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ElectionPredictor() {
    const [section, setSection] = useState('races');

    return (
        <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h2 style={{ margin: 0 }}>Election Predictor</h2>
                    <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>
                        Manage races, candidates, and AI-powered predictions for{' '}
                        <a href="https://electionpredictor.net" target="_blank" rel="noopener noreferrer">electionpredictor.net</a>
                    </p>
                </div>
                <a href="https://electionpredictor.net" target="_blank" rel="noopener noreferrer" className="btn-secondary">
                    View Live Site ↗
                </a>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '2px solid #e5e7eb', paddingBottom: 0 }}>
                {SECTION_LINKS.map(link => (
                    <button
                        key={link.id}
                        onClick={() => setSection(link.id)}
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            padding: '8px 16px', fontWeight: 600, fontSize: 14,
                            borderBottom: section === link.id ? '2px solid #3b82f6' : '2px solid transparent',
                            color: section === link.id ? '#3b82f6' : '#6b7280',
                            marginBottom: -2,
                        }}
                    >
                        {link.label}
                    </button>
                ))}
            </div>

            {section === 'races' && <RacesSection />}
            {section === 'featured-matchups' && <FeaturedMatchupsSection />}
        </div>
    );
}
