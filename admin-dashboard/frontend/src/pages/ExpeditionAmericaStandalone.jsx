import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const EMPTY_FORM = {
    pageKey: 'home',
    sectionKey: '',
    title: '',
    subtitle: '',
    body: '',
    ctaLabel: '',
    ctaUrl: '',
    imageUrl: '',
    sortOrder: 0,
};

function ExpeditionAmericaStandalone() {
    const baseUrl = (
        import.meta.env.VITE_EXPEDITION_AMERICA_APP_SITE_URL
        || 'https://expedition-america-kj011p40q-felabayomis-projects.vercel.app'
    ).trim().replace(/\/$/, '');

    const [sections, setSections] = useState([]);
    const [form, setForm] = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const pageGroups = useMemo(() => {
        const grouped = new Map();
        sections.forEach((section) => {
            const key = section.pageKey || 'unassigned';
            if (!grouped.has(key)) {
                grouped.set(key, []);
            }
            grouped.get(key).push(section);
        });
        return Array.from(grouped.entries());
    }, [sections]);

    const resetForm = () => {
        setForm(EMPTY_FORM);
        setEditingId('');
    };

    const loadContent = async () => {
        setIsLoading(true);
        setError('');
        try {
            const { data } = await api.get('/api/expedition-america-standalone/admin/content');
            setSections(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            setError('Failed to load standalone content. Ensure you are logged in as admin.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadContent();
    }, []);

    const startEdit = (section) => {
        setEditingId(section.id);
        setForm({
            pageKey: section.pageKey || 'home',
            sectionKey: section.sectionKey || '',
            title: section.title || '',
            subtitle: section.subtitle || '',
            body: section.body || '',
            ctaLabel: section.ctaLabel || '',
            ctaUrl: section.ctaUrl || '',
            imageUrl: section.imageUrl || '',
            sortOrder: Number(section.sortOrder || 0),
        });
        setMessage('');
        setError('');
    };

    const saveSection = async (event) => {
        event.preventDefault();
        setIsSaving(true);
        setMessage('');
        setError('');

        try {
            const payload = {
                ...form,
                sortOrder: Number(form.sortOrder || 0),
            };

            if (!payload.pageKey || !payload.sectionKey || !payload.title) {
                throw new Error('Page key, section key, and title are required.');
            }

            if (editingId) {
                await api.patch(`/api/expedition-america-standalone/admin/content/${editingId}`, payload);
                setMessage('Section updated successfully.');
            } else {
                await api.post('/api/expedition-america-standalone/admin/content', payload);
                setMessage('Section created successfully.');
            }

            await loadContent();
            resetForm();
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.error || err?.message || 'Failed to save section');
        } finally {
            setIsSaving(false);
        }
    };

    const removeSection = async (id) => {
        const confirmed = window.confirm('Delete this section? This cannot be undone.');
        if (!confirmed) {
            return;
        }

        setError('');
        setMessage('');
        try {
            await api.delete(`/api/expedition-america-standalone/admin/content/${id}`);
            setMessage('Section deleted successfully.');
            if (editingId === id) {
                resetForm();
            }
            await loadContent();
        } catch (err) {
            console.error(err);
            setError('Failed to delete section.');
        }
    };

    return (
        <div className="page-section" style={{ gap: 16, display: 'grid' }}>
            <div className="page-header" style={{ marginBottom: 0 }}>
                <h1>Expedition America (Standalone Project)</h1>
                <p className="muted">
                    Standalone content manager isolated from 50USAStates. Create and update page sections here, then wire the standalone site to
                    this API feed.
                </p>
            </div>

            <div className="toolbar-actions">
                <a href={baseUrl} target="_blank" rel="noreferrer" className="cancel-button" style={{ textDecoration: 'none' }}>
                    Open Frontend Site
                </a>
                <button type="button" className="secondary-button" onClick={loadContent}>
                    Refresh Content
                </button>
                <button type="button" className="secondary-button" onClick={resetForm}>
                    New Section
                </button>
            </div>

            <p className="muted" style={{ marginTop: -6 }}>
                Note: the standalone deployment currently blocks iframe/admin embedding (`401 + X-Frame-Options: DENY`), so this native Felix admin
                editor is used instead.
            </p>

            {message ? <p className="status-pill" style={{ width: 'fit-content' }}>{message}</p> : null}
            {error ? <p className="empty-state" style={{ borderStyle: 'solid', borderColor: '#fecaca', color: '#b91c1c' }}>{error}</p> : null}

            <form className="edit-form" onSubmit={saveSection}>
                <div className="details-grid">
                    <label>
                        <span>Page Key</span>
                        <input
                            value={form.pageKey}
                            onChange={(event) => setForm((current) => ({ ...current, pageKey: event.target.value }))}
                            placeholder="home"
                        />
                    </label>

                    <label>
                        <span>Section Key</span>
                        <input
                            value={form.sectionKey}
                            onChange={(event) => setForm((current) => ({ ...current, sectionKey: event.target.value }))}
                            placeholder="hero"
                        />
                    </label>

                    <label>
                        <span>Sort Order</span>
                        <input
                            type="number"
                            value={form.sortOrder}
                            onChange={(event) => setForm((current) => ({ ...current, sortOrder: Number(event.target.value || 0) }))}
                        />
                    </label>
                </div>

                <label>
                    <span>Title</span>
                    <input
                        value={form.title}
                        onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                    />
                </label>

                <label>
                    <span>Subtitle</span>
                    <input
                        value={form.subtitle}
                        onChange={(event) => setForm((current) => ({ ...current, subtitle: event.target.value }))}
                    />
                </label>

                <label>
                    <span>Body</span>
                    <textarea
                        rows={6}
                        value={form.body}
                        onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
                    />
                </label>

                <div className="details-grid">
                    <label>
                        <span>CTA Label</span>
                        <input
                            value={form.ctaLabel}
                            onChange={(event) => setForm((current) => ({ ...current, ctaLabel: event.target.value }))}
                        />
                    </label>
                    <label>
                        <span>CTA URL</span>
                        <input
                            value={form.ctaUrl}
                            onChange={(event) => setForm((current) => ({ ...current, ctaUrl: event.target.value }))}
                        />
                    </label>
                    <label>
                        <span>Image URL</span>
                        <input
                            value={form.imageUrl}
                            onChange={(event) => setForm((current) => ({ ...current, imageUrl: event.target.value }))}
                        />
                    </label>
                </div>

                <div className="toolbar-actions">
                    <button type="submit" className="edit-button" disabled={isSaving}>
                        {isSaving ? 'Saving...' : editingId ? 'Update Section' : 'Create Section'}
                    </button>
                    {editingId ? (
                        <button type="button" className="cancel-button" onClick={resetForm}>
                            Cancel Edit
                        </button>
                    ) : null}
                </div>
            </form>

            <div className="record-list">
                {isLoading ? <p className="empty-state">Loading content...</p> : null}
                {!isLoading && !sections.length ? <p className="empty-state">No sections yet. Create your first section above.</p> : null}

                {pageGroups.map(([pageKey, pageSections]) => (
                    <div key={pageKey} className="record-card">
                        <div className="record-header" style={{ marginBottom: 8 }}>
                            <div>
                                <h3 style={{ margin: 0 }}>Page: {pageKey}</h3>
                                <p className="muted" style={{ margin: '6px 0 0' }}>{pageSections.length} section(s)</p>
                            </div>
                        </div>

                        <div className="record-list" style={{ gap: 10 }}>
                            {pageSections.map((section) => (
                                <div key={section.id} className="details-grid" style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 10 }}>
                                    <div>
                                        <strong>{section.sectionKey}</strong>
                                        <span className="muted">{section.title}</span>
                                        <span className="muted">Order: {section.sortOrder}</span>
                                    </div>
                                    <div>
                                        <strong>Updated</strong>
                                        <span className="muted">{new Date(section.updatedAt).toLocaleString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <button type="button" className="edit-button" onClick={() => startEdit(section)}>Edit</button>
                                        <button type="button" className="delete-button" onClick={() => removeSection(section.id)}>Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ExpeditionAmericaStandalone;
