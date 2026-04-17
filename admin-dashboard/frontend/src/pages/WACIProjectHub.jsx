import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../services/api';

const SECTION_LINKS = [
    { id: 'projects', label: 'Projects' },
    { id: 'assignments', label: 'Volunteer Assignments' },
    { id: 'grant-offers', label: 'Grant Offers' },
    { id: 'reports', label: 'Report Review' },
    { id: 'payments', label: 'Payment Status' },
    { id: 'grantees', label: 'Grantees' },
    { id: 'applications', label: 'Applications' },
];

const STATUS_COLORS = {
    active: '#22c55e',
    completed: '#3b82f6',
    paused: '#f59e0b',
    archived: '#6b7280',
    pending: '#f59e0b',
    accepted: '#22c55e',
    declined: '#ef4444',
    expired: '#6b7280',
    approved: '#22c55e',
    late: '#ef4444',
    rejected: '#ef4444',
    revision_requested: '#f59e0b',
    processing: '#3b82f6',
    failed: '#ef4444',
};

const SECTION_IDS = new Set(SECTION_LINKS.map((section) => section.id));

const getSectionFromHash = (hashValue) => {
    const normalized = String(hashValue || '').replace(/^#/, '');
    return SECTION_IDS.has(normalized) ? normalized : 'projects';
};

function StatusBadge({ status }) {
    return (
        <span style={{
            background: STATUS_COLORS[status] || '#6b7280',
            color: '#fff',
            borderRadius: 4,
            padding: '2px 8px',
            fontSize: 12,
            fontWeight: 600,
            textTransform: 'capitalize',
        }}>
            {status?.replace(/_/g, ' ') || '—'}
        </span>
    );
}

// ─── Projects Section ─────────────────────────────────────────
const WACI_HUB_FRONTEND = 'https://projecthub.wildlifeafrica.org';

function slugify(value) {
    return String(value || '').trim().toLowerCase()
        .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80);
}

function ProjectsSection() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ title: '', slug: '', region: '', status: 'active' });
    const [aiDraft, setAiDraft] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const load = () => {
        setLoading(true);
        API.get('/api/waci-hub/projects')
            .then((r) => setProjects(r.data))
            .catch(() => setError('Failed to load projects'))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const handleTitleChange = (e) => {
        const title = e.target.value;
        setForm((f) => ({ ...f, title, slug: slugify(title) }));
    };

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!form.title) return setError('Enter a project title first.');
        setGenerating(true);
        setError('');
        setAiDraft(null);
        setSuccessMsg('');

        try {
            const res = await API.post('/api/waci-hub/projects/generate', {
                input: `Project title: ${form.title}\nRegion: ${form.region || 'not specified'}\nSlug: ${form.slug}\n\nConduct deep ecological research specific to this project title and region. Generate a unique, grant-ready conservation project proposal.`,
            });

            const draft = res.data;
            setAiDraft(draft);
            setAiDraft((prev) => ({ ...prev, slug: form.slug, region: form.region, status: form.status }));
        } catch (err) {
            setError(err.message || 'AI generation failed');
        } finally {
            setGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!aiDraft) return;
        setSaving(true);
        setError('');
        try {
            await API.post('/api/waci-hub/projects', {
                title: aiDraft.title || form.title,
                slug: aiDraft.slug || form.slug,
                region: aiDraft.region || form.region,
                status: aiDraft.status || 'active',
                purpose: aiDraft.summary || '',
                objectives: aiDraft.objectives || [],
                methodology: aiDraft.methodology || [],
                deliverables: aiDraft.deliverables || [],
                expectations: aiDraft.reportingRequirements || [],
            });
            setAiDraft(null);
            setForm({ title: '', slug: '', region: '', status: 'active' });
            setSuccessMsg('Project created successfully.');
            load();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to save project');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this project? This cannot be undone.')) return;
        try {
            await API.delete(`/api/waci-hub/projects/${id}`);
            load();
        } catch {
            setError('Failed to delete project');
        }
    };

    if (loading) return <p>Loading projects…</p>;

    return (
        <div>
            <h3>Projects</h3>
            {error && <p style={{ color: 'red', marginBottom: 8 }}>{error}</p>}
            {successMsg && <p style={{ color: 'green', marginBottom: 8 }}>{successMsg}</p>}

            <form onSubmit={handleGenerate} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24, alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 12, color: '#374151' }}>Title *</label>
                    <input required placeholder="Title" value={form.title} onChange={handleTitleChange} style={{ minWidth: 220 }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 12, color: '#374151' }}>Slug (auto)</label>
                    <input placeholder="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} style={{ minWidth: 200, color: '#6b7280' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 12, color: '#374151' }}>Region</label>
                    <input placeholder="Region" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
                </div>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={{ alignSelf: 'flex-end' }}>
                    <option value="active">Active</option>
                    <option value="pilot">Pilot</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                </select>
                <button type="submit" disabled={generating} style={{ alignSelf: 'flex-end' }}>
                    {generating ? '🔬 Researching…' : 'Create Project'}
                </button>
            </form>

            {generating && (
                <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#0369a1' }}>
                    AI is conducting ecological research for <strong>{form.title}</strong>… This may take a few seconds.
                </div>
            )}

            {aiDraft && (
                <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: 20, marginBottom: 28 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <h4 style={{ margin: 0 }}>AI Draft — {aiDraft.title}</h4>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={handleSave} disabled={saving} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 16px', cursor: 'pointer' }}>
                                {saving ? 'Saving…' : '✓ Save Project'}
                            </button>
                            <button onClick={() => setAiDraft(null)} style={{ background: 'none', border: '1px solid #d1d5db', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 12 }}>
                                Discard
                            </button>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                        <div><strong>Location:</strong> {aiDraft.location || form.region}</div>
                        <div><strong>Duration:</strong> {aiDraft.durationMonths} months</div>
                        <div><strong>Monthly Funding:</strong> ${aiDraft.monthlyFunding}</div>
                        <div><strong>Focus:</strong> {aiDraft.focus}</div>
                    </div>
                    <p style={{ fontSize: 13, margin: '10px 0' }}><strong>Summary:</strong> {aiDraft.summary}</p>
                    {aiDraft.objectives?.length > 0 && (
                        <div style={{ marginBottom: 8 }}>
                            <strong style={{ fontSize: 13 }}>Objectives ({aiDraft.objectives.length}):</strong>
                            <ul style={{ margin: '4px 0 0 16px', fontSize: 12, color: '#374151' }}>
                                {aiDraft.objectives.map((o, i) => <li key={i}>{o}</li>)}
                            </ul>
                        </div>
                    )}
                    {aiDraft.deliverables?.length > 0 && (
                        <div>
                            <strong style={{ fontSize: 13 }}>Deliverables ({aiDraft.deliverables.length}):</strong>
                            <ul style={{ margin: '4px 0 0 16px', fontSize: 12, color: '#374151' }}>
                                {aiDraft.deliverables.map((d, i) => <li key={i}>{d}</li>)}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        {['Title', 'Slug', 'Region', 'Status', 'Volunteers', 'Actions'].map((h) => (
                            <th key={h} style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {projects.map((p) => (
                        <tr key={p.id}>
                            <td style={{ padding: '6px 8px' }}>{p.title}</td>
                            <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontSize: 12 }}>{p.slug}</td>
                            <td style={{ padding: '6px 8px' }}>{p.region || '—'}</td>
                            <td style={{ padding: '6px 8px' }}><StatusBadge status={p.status} /></td>
                            <td style={{ padding: '6px 8px' }}>{p.assignment_count ?? 0}</td>
                            <td style={{ padding: '6px 8px' }}>
                                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                    <a href={`https://projecthub.wildlifeafrica.org/projects/${p.slug}`} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>Open Frontend</a>
                                    <button onClick={() => handleDelete(p.id)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {projects.length === 0 && (
                        <tr><td colSpan={6} style={{ padding: 16, textAlign: 'center', color: '#6b7280' }}>No projects yet.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

// ─── Grant Offers Section ─────────────────────────────────────
function GrantOffersSection() {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        API.get('/api/waci-hub/grants')
            .then((r) => setOffers(r.data))
            .catch(() => setError('Failed to load grant offers'))
            .finally(() => setLoading(false));
    }, []);

    const updateStatus = async (id, status) => {
        try {
            await API.put(`/api/waci-hub/grants/${id}/status`, { status });
            setOffers((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
        } catch {
            setError('Failed to update status');
        }
    };

    if (loading) return <p>Loading grant offers…</p>;

    return (
        <div>
            <h3>Grant Offers</h3>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        {['Title', 'Project', 'Volunteer', 'Amount', 'Status', 'Actions'].map((h) => (
                            <th key={h} style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {offers.map((o) => (
                        <tr key={o.id}>
                            <td style={{ padding: '6px 8px' }}>{o.title}</td>
                            <td style={{ padding: '6px 8px' }}>{o.project_title}</td>
                            <td style={{ padding: '6px 8px' }}>{o.volunteer_name}</td>
                            <td style={{ padding: '6px 8px' }}>${((o.total_amount_cents || 0) / 100).toFixed(2)}</td>
                            <td style={{ padding: '6px 8px' }}><StatusBadge status={o.status} /></td>
                            <td style={{ padding: '6px 8px', display: 'flex', gap: 4 }}>
                                {o.status === 'pending' && (
                                    <>
                                        <button onClick={() => updateStatus(o.id, 'accepted')} style={{ fontSize: 12 }}>Accept</button>
                                        <button onClick={() => updateStatus(o.id, 'declined')} style={{ fontSize: 12, color: 'red' }}>Decline</button>
                                    </>
                                )}
                                {o.status === 'accepted' && (
                                    <button onClick={() => updateStatus(o.id, 'expired')} style={{ fontSize: 12 }}>Expire</button>
                                )}
                            </td>
                        </tr>
                    ))}
                    {offers.length === 0 && (
                        <tr><td colSpan={6} style={{ padding: 16, textAlign: 'center', color: '#6b7280' }}>No grant offers yet.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

// ─── Reports Section ──────────────────────────────────────────
function ReportsSection() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [reviewNotes, setReviewNotes] = useState({});

    useEffect(() => {
        API.get('/api/waci-hub/reports')
            .then((r) => setReports(r.data))
            .catch(() => setError('Failed to load reports'))
            .finally(() => setLoading(false));
    }, []);

    const review = async (id, status) => {
        try {
            await API.put(`/api/waci-hub/reports/${id}/review`, {
                status,
                admin_notes: reviewNotes[id] || '',
            });
            setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
        } catch {
            setError('Failed to submit review');
        }
    };

    if (loading) return <p>Loading reports…</p>;

    return (
        <div>
            <h3>Monthly Report Review</h3>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {reports.map((r) => (
                <div key={r.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <strong>{r.project_title} — {r.volunteer_name}</strong>
                        <StatusBadge status={r.status} />
                    </div>
                    <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>
                        Month: {r.report_month?.slice(0, 7)} · Submitted: {new Date(r.submitted_at).toLocaleDateString()}
                    </p>
                    <p style={{ fontSize: 12, color: r.payment_unlock_eligible ? '#16a34a' : '#6b7280', marginBottom: 6 }}>
                        Payment unlock: {r.payment_unlock_eligible ? 'Eligible (approved)' : 'Locked until approved'}
                    </p>
                    <p style={{ marginBottom: 4 }}><strong>Summary:</strong> {r.summary}</p>
                    {r.challenges && <p style={{ marginBottom: 4 }}><strong>Challenges:</strong> {r.challenges}</p>}
                    {r.next_steps && <p style={{ marginBottom: 4 }}><strong>Next Steps:</strong> {r.next_steps}</p>}
                    {(r.status === 'pending' || r.status === 'late') && (
                        <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <textarea
                                placeholder="Admin notes (optional)"
                                value={reviewNotes[r.id] || ''}
                                onChange={(e) => setReviewNotes((prev) => ({ ...prev, [r.id]: e.target.value }))}
                                style={{ flex: 1, minWidth: 200 }}
                                rows={2}
                            />
                            <button onClick={() => review(r.id, 'approved')} style={{ background: '#22c55e', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 4, cursor: 'pointer' }}>Approve</button>
                            <button onClick={() => review(r.id, 'revision_requested')} style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 4, cursor: 'pointer' }}>Request Revision</button>
                            <button onClick={() => review(r.id, 'rejected')} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 4, cursor: 'pointer' }}>Reject</button>
                        </div>
                    )}
                </div>
            ))}
            {reports.length === 0 && <p style={{ color: '#6b7280' }}>No reports yet.</p>}
        </div>
    );
}

// ─── Grantees Section ────────────────────────────────────────
function GranteesSection() {
    const [grantees, setGrantees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const load = () => {
        setLoading(true);
        API.get('/api/waci-hub/grantees')
            .then((r) => setGrantees(r.data))
            .catch(() => setError('Failed to load grantees'))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            await API.post('/api/waci-hub/grantees', form);
            setSuccess(`Account created for ${form.email}. Share these credentials with the grantee.`);
            setForm({ name: '', email: '', password: '' });
            load();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create grantee');
        } finally {
            setSaving(false);
        }
    };

    const handleRevoke = async (id, name) => {
        if (!window.confirm(`Revoke grantee access for ${name}? Their account will remain but lose grantee permissions.`)) return;
        try {
            await API.delete(`/api/waci-hub/grantees/${id}`);
            load();
        } catch {
            setError('Failed to revoke access');
        }
    };

    if (loading) return <p>Loading grantees…</p>;

    return (
        <div>
            <h3>Grantees</h3>
            <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 16 }}>
                Create login accounts for grantees. They log in at{' '}
                <a href="https://projecthub.wildlifeafrica.org/login" target="_blank" rel="noreferrer">
                    projecthub.wildlifeafrica.org/login
                </a>.
            </p>

            {error && <p style={{ color: 'red', marginBottom: 8 }}>{error}</p>}
            {success && (
                <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 6, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
                    ✅ {success}
                </div>
            )}

            <form onSubmit={handleCreate} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28, alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 12, color: '#374151' }}>Full Name</label>
                    <input
                        required
                        placeholder="e.g. Grace Okonkwo"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        style={{ minWidth: 180 }}
                    />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 12, color: '#374151' }}>Email</label>
                    <input
                        required
                        type="email"
                        placeholder="grantee@email.com"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        style={{ minWidth: 220 }}
                    />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 12, color: '#374151' }}>Temporary Password</label>
                    <input
                        required
                        type="text"
                        placeholder="min 8 characters"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        style={{ minWidth: 180 }}
                    />
                </div>
                <button type="submit" disabled={saving} style={{ alignSelf: 'flex-end' }}>
                    {saving ? 'Creating…' : 'Create Grantee'}
                </button>
            </form>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        {['Name', 'Email', 'Created', 'Actions'].map((h) => (
                            <th key={h} style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {grantees.map((g) => (
                        <tr key={g.id}>
                            <td style={{ padding: '6px 8px' }}>{g.name}</td>
                            <td style={{ padding: '6px 8px' }}>{g.email}</td>
                            <td style={{ padding: '6px 8px', fontSize: 12, color: '#6b7280' }}>
                                {new Date(g.created_at).toLocaleDateString()}
                            </td>
                            <td style={{ padding: '6px 8px' }}>
                                <button
                                    onClick={() => handleRevoke(g.id, g.name)}
                                    style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}
                                >
                                    Revoke Access
                                </button>
                            </td>
                        </tr>
                    ))}
                    {grantees.length === 0 && (
                        <tr><td colSpan={4} style={{ padding: 16, textAlign: 'center', color: '#6b7280' }}>No grantee accounts yet.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

// ─── Applications Section ────────────────────────────────────
const APPLICATION_STATUS_COLORS = {
    pending: '#f59e0b',
    shortlisted: '#3b82f6',
    approved: '#22c55e',
    rejected: '#ef4444',
};

function ApplicationsSection() {
    const [apps, setApps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notes, setNotes] = useState({});
    const [saving, setSaving] = useState({});

    const load = () => {
        setLoading(true);
        API.get('/api/waci-hub/apply')
            .then((r) => setApps(r.data))
            .catch(() => setError('Failed to load applications'))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const updateStatus = async (id, status) => {
        setSaving((s) => ({ ...s, [id]: true }));
        try {
            await API.put(`/api/waci-hub/apply/${id}/status`, { status, admin_notes: notes[id] || '' });
            setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status, admin_notes: notes[id] || a.admin_notes } : a)));
        } catch {
            setError('Failed to update application');
        } finally {
            setSaving((s) => ({ ...s, [id]: false }));
        }
    };

    if (loading) return <p>Loading applications…</p>;

    return (
        <div>
            <h3>Applications</h3>
            <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 16 }}>
                Review public applications submitted via project pages. Shortlist, approve, or reject.
                Approved applicants can then be issued a grantee account from the Grantees tab.
            </p>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        {['Name', 'Email', 'Project', 'Role', 'Location', 'Applied', 'Status', 'Notes', 'Actions'].map((h) => (
                            <th key={h} style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid #e5e7eb', fontSize: 12 }}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {apps.map((a) => (
                        <tr key={a.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '6px 8px', fontWeight: 500 }}>{a.name}</td>
                            <td style={{ padding: '6px 8px', fontSize: 12 }}>{a.email}</td>
                            <td style={{ padding: '6px 8px', fontSize: 12 }}>{a.project_slug}</td>
                            <td style={{ padding: '6px 8px', fontSize: 12 }}>{a.role_interest}</td>
                            <td style={{ padding: '6px 8px', fontSize: 12 }}>{a.location || '—'}</td>
                            <td style={{ padding: '6px 8px', fontSize: 11, color: '#6b7280' }}>
                                {new Date(a.created_at).toLocaleDateString()}
                            </td>
                            <td style={{ padding: '6px 8px' }}>
                                <span style={{
                                    background: APPLICATION_STATUS_COLORS[a.status] + '22',
                                    color: APPLICATION_STATUS_COLORS[a.status],
                                    borderRadius: 4,
                                    padding: '2px 8px',
                                    fontSize: 11,
                                    fontWeight: 600,
                                    textTransform: 'capitalize',
                                }}>{a.status}</span>
                            </td>
                            <td style={{ padding: '6px 8px' }}>
                                <input
                                    placeholder="Internal note…"
                                    value={notes[a.id] !== undefined ? notes[a.id] : (a.admin_notes || '')}
                                    onChange={(e) => setNotes((n) => ({ ...n, [a.id]: e.target.value }))}
                                    style={{ width: 140, fontSize: 12 }}
                                />
                            </td>
                            <td style={{ padding: '6px 8px', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                {a.status === 'pending' && (
                                    <button onClick={() => updateStatus(a.id, 'shortlisted')} disabled={saving[a.id]} style={{ fontSize: 11 }}>Shortlist</button>
                                )}
                                {(a.status === 'pending' || a.status === 'shortlisted') && (
                                    <button onClick={() => updateStatus(a.id, 'approved')} disabled={saving[a.id]} style={{ fontSize: 11, background: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac' }}>Approve</button>
                                )}
                                {a.status !== 'rejected' && (
                                    <button onClick={() => updateStatus(a.id, 'rejected')} disabled={saving[a.id]} style={{ fontSize: 11, background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' }}>Reject</button>
                                )}
                            </td>
                        </tr>
                    ))}
                    {apps.length === 0 && (
                        <tr><td colSpan={9} style={{ padding: 16, textAlign: 'center', color: '#6b7280' }}>No applications yet.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

// ─── Payments Section ─────────────────────────────────────────
function PaymentsSection() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        API.get('/api/waci-hub/reports/payments')
            .then((r) => setPayments(r.data))
            .catch(() => setError('Failed to load payments'))
            .finally(() => setLoading(false));
    }, []);

    const updateStatus = async (id, status) => {
        try {
            await API.put(`/api/waci-hub/reports/payments/${id}/status`, { status });
            setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
        } catch {
            setError('Failed to update payment');
        }
    };

    if (loading) return <p>Loading payments…</p>;

    return (
        <div>
            <h3>Payment Status</h3>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        {['Volunteer', 'Project', 'Month', 'Amount', 'Method', 'Status', 'Unlock', 'Actions'].map((h) => (
                            <th key={h} style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {payments.map((p) => (
                        <tr key={p.id}>
                            <td style={{ padding: '6px 8px' }}>{p.volunteer_name}</td>
                            <td style={{ padding: '6px 8px' }}>{p.project_title}</td>
                            <td style={{ padding: '6px 8px' }}>{p.payment_month?.slice(0, 7) || '—'}</td>
                            <td style={{ padding: '6px 8px' }}>${((p.amount_cents || 0) / 100).toFixed(2)}</td>
                            <td style={{ padding: '6px 8px' }}>{p.payout_method || '—'}</td>
                            <td style={{ padding: '6px 8px' }}><StatusBadge status={p.status} /></td>
                            <td style={{ padding: '6px 8px', fontSize: 12, color: p.payment_unlock_eligible ? '#16a34a' : '#6b7280' }}>
                                {p.payment_unlock_eligible ? 'Eligible' : 'Locked'}
                            </td>
                            <td style={{ padding: '6px 8px', display: 'flex', gap: 4 }}>
                                {p.status === 'pending' && (
                                    <button onClick={() => updateStatus(p.id, 'approved')} style={{ fontSize: 12 }}>Approve</button>
                                )}
                                {p.status === 'approved' && (
                                    <button onClick={() => updateStatus(p.id, 'processing')} style={{ fontSize: 12 }}>Mark Processing</button>
                                )}
                                {p.status === 'processing' && (
                                    <button onClick={() => updateStatus(p.id, 'completed')} style={{ fontSize: 12 }}>Mark Completed</button>
                                )}
                            </td>
                        </tr>
                    ))}
                    {payments.length === 0 && (
                        <tr><td colSpan={8} style={{ padding: 16, textAlign: 'center', color: '#6b7280' }}>No payments yet.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────
export default function WACIProjectHub() {
    const location = useLocation();
    const navigate = useNavigate();
    const initialSection = useMemo(() => getSectionFromHash(location.hash), [location.hash]);
    const [activeSection, setActiveSection] = useState(initialSection);

    useEffect(() => {
        setActiveSection(getSectionFromHash(location.hash));
    }, [location.hash]);

    const handleSectionChange = (sectionId) => {
        setActiveSection(sectionId);
        navigate(`${location.pathname}#${sectionId}`, { replace: true });
    };

    return (
        <div className="page-container">
            <h2>WACI Project Hub</h2>
            <p style={{ color: '#6b7280', marginBottom: 24 }}>
                Manage WACI field projects, volunteer assignments, grant offers, monthly reports, and payments.
            </p>

            <div style={{ marginBottom: 16, padding: 12, border: '1px solid #e5e7eb', borderRadius: 8, background: '#f8fafc' }}>
                <strong style={{ display: 'block', marginBottom: 6 }}>AI Command Center</strong>
                <p style={{ margin: 0, color: '#475569', fontSize: 13 }}>
                    Links removed for now. We will reintroduce this after workflow stabilization.
                </p>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32 }}>
                {SECTION_LINKS.map((s) => (
                    <button
                        key={s.id}
                        onClick={() => handleSectionChange(s.id)}
                        style={{
                            padding: '6px 16px',
                            borderRadius: 6,
                            border: '1px solid',
                            borderColor: activeSection === s.id ? '#111827' : '#e5e7eb',
                            background: activeSection === s.id ? '#111827' : '#fff',
                            color: activeSection === s.id ? '#fff' : '#111827',
                            fontWeight: activeSection === s.id ? 600 : 400,
                            cursor: 'pointer',
                        }}
                    >
                        {s.label}
                    </button>
                ))}
            </div>

            {activeSection === 'projects' && <ProjectsSection />}
            {activeSection === 'assignments' && <div><h3>Volunteer Assignments</h3><p style={{ color: '#6b7280' }}>Select a project above and manage assignments from the Projects section.</p></div>}
            {activeSection === 'grant-offers' && <GrantOffersSection />}
            {activeSection === 'reports' && <ReportsSection />}
            {activeSection === 'payments' && <PaymentsSection />}
            {activeSection === 'grantees' && <GranteesSection />}
            {activeSection === 'applications' && <ApplicationsSection />}
        </div>
    );
}
