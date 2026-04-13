import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../services/api';

const SECTION_LINKS = [
    { id: 'projects', label: 'Projects' },
    { id: 'assignments', label: 'Volunteer Assignments' },
    { id: 'grant-offers', label: 'Grant Offers' },
    { id: 'reports', label: 'Report Review' },
    { id: 'payments', label: 'Payment Status' },
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
function ProjectsSection() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ title: '', slug: '', purpose: '', region: '', status: 'active' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const load = () => {
        setLoading(true);
        API.get('/api/waci-hub/projects')
            .then((r) => setProjects(r.data))
            .catch(() => setError('Failed to load projects'))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            await API.post('/api/waci-hub/projects', form);
            setForm({ title: '', slug: '', purpose: '', region: '', status: 'active' });
            load();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create project');
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
            {error && <p style={{ color: 'red' }}>{error}</p>}

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                <a
                    href="https://waci-project-hub.vercel.app/admin/projects"
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 13 }}
                >
                    Open AI Lifecycle Interface
                </a>
                <a
                    href="https://waci-project-hub.vercel.app/admin/projects/create"
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 13 }}
                >
                    Create Project in AI Interface
                </a>
            </div>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                <input required placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                <input required placeholder="Slug (e.g. airport-wildlife-watch-katsina)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
                <input placeholder="Region" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                </select>
                <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Create Project'}</button>
            </form>

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
                                    <a
                                        href={`https://waci-project-hub.vercel.app/projects/${p.slug}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{ fontSize: 12 }}
                                    >
                                        Open Frontend
                                    </a>
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
                    Open the full AI project lifecycle interface here if you need the advanced grant/report command center.
                </p>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
                    <a href="https://waci-project-hub.vercel.app/admin/projects" target="_blank" rel="noreferrer">Open AI Interface</a>
                    <a href="https://waci-project-hub.vercel.app/admin/projects/create" target="_blank" rel="noreferrer">New AI Project</a>
                </div>
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
        </div>
    );
}
