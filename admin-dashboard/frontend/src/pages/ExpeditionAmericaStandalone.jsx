import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const DEFAULT_MAPPER = {
    pages: [
        { key: 'home', label: 'Home', sections: [{ key: 'hero', label: 'Hero Banner', sortOrder: 0 }] },
        { key: 'about', label: 'About', sections: [{ key: 'about-hero', label: 'About Hero', sortOrder: 0 }] },
        { key: 'cities', label: 'Cities', sections: [{ key: 'cities-hero', label: 'Cities Hero', sortOrder: 0 }] },
        { key: 'experiences', label: 'Experiences', sections: [{ key: 'experiences-hero', label: 'Experiences Hero', sortOrder: 0 }] },
        { key: 'events', label: 'Events', sections: [{ key: 'events-hero', label: 'Events Hero', sortOrder: 0 }] },
        { key: 'deals', label: 'Deals', sections: [{ key: 'deals-hero', label: 'Deals Hero', sortOrder: 0 }] },
        { key: 'contact', label: 'Contact', sections: [{ key: 'contact-hero', label: 'Contact Hero', sortOrder: 0 }] },
    ],
};

const TEMPLATE_DEFAULTS = {
    'home:hero': {
        title: 'Explore America One Great City At A Time',
        subtitle: 'Plan city-first trips with practical guidance and fresh weekly inspiration.',
        body: 'Use this hero section for your main campaign message. Keep it short, clear, and specific to current city offers.',
        ctaLabel: 'Explore Deals',
        ctaUrl: '/deals',
    },
    'home:featured-cities-heading': {
        title: 'Featured Cities',
        subtitle: 'Start with these high-interest city guides.',
    },
    'home:city-new-york': {
        title: 'New York',
        subtitle: 'Discover skyline energy, borough culture, food, nightlife.',
        body: 'Use this card to highlight current deal windows, key neighborhoods, and seasonal event hooks.',
        ctaLabel: 'View New York',
        ctaUrl: '/cities/new-york',
    },
    'home:city-chicago': {
        title: 'Chicago',
        subtitle: 'Experience lakefront neighborhoods, architecture, deep flavor, music.',
        body: 'Use this card for route ideas, neighborhood picks, and upcoming city highlights.',
        ctaLabel: 'View Chicago',
        ctaUrl: '/cities/chicago',
    },
};

const buildEmptyForm = (pageKey = 'home', sectionKey = 'hero', sortOrder = 0) => ({
    pageKey,
    sectionKey,
    title: '',
    subtitle: '',
    body: '',
    ctaLabel: '',
    ctaUrl: '',
    imageUrl: '',
    sortOrder,
});

const applyTemplateDefaults = (form, pageKey, sectionKey, fallbackSortOrder = 0) => {
    const defaults = TEMPLATE_DEFAULTS[`${pageKey}:${sectionKey}`] || {};
    return {
        ...form,
        pageKey,
        sectionKey,
        title: defaults.title ?? form.title ?? '',
        subtitle: defaults.subtitle ?? form.subtitle ?? '',
        body: defaults.body ?? form.body ?? '',
        ctaLabel: defaults.ctaLabel ?? form.ctaLabel ?? '',
        ctaUrl: defaults.ctaUrl ?? form.ctaUrl ?? '',
        imageUrl: defaults.imageUrl ?? form.imageUrl ?? '',
        sortOrder: Number(form.sortOrder ?? fallbackSortOrder ?? 0),
    };
};

function ExpeditionAmericaStandalone() {
    const baseUrl = (
        import.meta.env.VITE_EXPEDITION_AMERICA_APP_SITE_URL
        || 'https://expedition-america-kj011p40q-felabayomis-projects.vercel.app'
    ).trim().replace(/\/$/, '');

    const [mapper, setMapper] = useState(DEFAULT_MAPPER);
    const [sections, setSections] = useState([]);
    const [form, setForm] = useState(buildEmptyForm());
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

    const activePage = useMemo(
        () => mapper.pages.find((page) => page.key === form.pageKey) || mapper.pages[0],
        [mapper.pages, form.pageKey]
    );

    const currentSectionOptions = useMemo(() => {
        const options = Array.isArray(activePage?.sections) ? [...activePage.sections] : [];
        if (form.sectionKey && !options.some((section) => section.key === form.sectionKey)) {
            options.push({ key: form.sectionKey, label: `Current: ${form.sectionKey}`, sortOrder: Number(form.sortOrder || 0) });
        }
        return options;
    }, [activePage?.sections, form.sectionKey, form.sortOrder]);

    const resetForm = () => {
        const firstPage = mapper.pages[0] || DEFAULT_MAPPER.pages[0];
        const firstSection = firstPage.sections?.[0];
        setForm(
            applyTemplateDefaults(
                buildEmptyForm(firstPage.key, firstSection?.key || 'hero', Number(firstSection?.sortOrder || 0)),
                firstPage.key,
                firstSection?.key || 'hero',
                Number(firstSection?.sortOrder || 0)
            )
        );
        setEditingId('');
    };

    const loadMapper = async () => {
        try {
            const { data } = await api.get('/api/expedition-america-standalone/contract');
            const nextMapper = Array.isArray(data?.pages) && data.pages.length ? data : DEFAULT_MAPPER;
            setMapper(nextMapper);

            if (!editingId) {
                const firstPage = nextMapper.pages[0] || DEFAULT_MAPPER.pages[0];
                const firstSection = firstPage.sections?.[0];
                setForm((current) => {
                    if (current.pageKey && current.sectionKey) {
                        return current;
                    }
                    return applyTemplateDefaults(
                        buildEmptyForm(firstPage.key, firstSection?.key || 'hero', Number(firstSection?.sortOrder || 0)),
                        firstPage.key,
                        firstSection?.key || 'hero',
                        Number(firstSection?.sortOrder || 0)
                    );
                });
            }
        } catch (err) {
            console.error(err);
            setMapper(DEFAULT_MAPPER);
        }
    };

    const loadContent = async () => {
        setIsLoading(true);
        setError('');
        try {
            const { data } = await api.get('/api/expedition-america-standalone/admin/content');
            setSections(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            const status = err?.response?.status;
            if (status === 401 || status === 403) {
                setError('Failed to load standalone content. Ensure you are logged in as admin.');
            } else if (status === 404) {
                setError('Standalone API route not found yet. Redeploy backend to publish /api/expedition-america-standalone.');
            } else {
                setError('Failed to load standalone content. Check backend deployment and try refresh.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadMapper();
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

    const handlePageChange = (nextPageKey) => {
        const nextPage = mapper.pages.find((page) => page.key === nextPageKey) || mapper.pages[0] || DEFAULT_MAPPER.pages[0];
        const firstSection = nextPage.sections?.[0];
        const nextSectionKey = firstSection?.key || form.sectionKey || 'hero';

        setForm((current) => applyTemplateDefaults(
            {
                ...current,
                pageKey: nextPage.key,
                sectionKey: nextSectionKey,
                sortOrder: Number(firstSection?.sortOrder ?? current.sortOrder ?? 0),
            },
            nextPage.key,
            nextSectionKey,
            Number(firstSection?.sortOrder || 0)
        ));
    };

    const handleSectionChange = (nextSectionKey) => {
        const nextTemplate = currentSectionOptions.find((entry) => entry.key === nextSectionKey);
        setForm((current) => applyTemplateDefaults(
            {
                ...current,
                sectionKey: nextSectionKey,
                sortOrder: Number(nextTemplate?.sortOrder ?? current.sortOrder ?? 0),
            },
            current.pageKey,
            nextSectionKey,
            Number(nextTemplate?.sortOrder || 0)
        ));
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

            <div className="record-card" style={{ background: '#f8fafc' }}>
                <strong>Structured Page Mapper</strong>
                <p className="muted" style={{ margin: '6px 0 10px' }}>
                    Editors should choose the page and mapped section template below. This keeps standalone content consistent with the live site nav.
                </p>
                <div className="details-grid">
                    {mapper.pages.map((page) => (
                        <div key={page.key}>
                            <strong>{page.label}</strong>
                            <span className="muted">Key: {page.key}</span>
                            <span className="muted">Sections: {(page.sections || []).map((item) => item.key).join(', ')}</span>
                        </div>
                    ))}
                </div>
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
                        <span>Page</span>
                        <select
                            value={form.pageKey}
                            onChange={(event) => handlePageChange(event.target.value)}
                        >
                            {mapper.pages.map((page) => (
                                <option key={page.key} value={page.key}>{page.label} ({page.key})</option>
                            ))}
                        </select>
                    </label>

                    <label>
                        <span>Section Template</span>
                        <select
                            value={form.sectionKey}
                            onChange={(event) => handleSectionChange(event.target.value)}
                        >
                            {currentSectionOptions.map((section) => (
                                <option key={section.key} value={section.key}>{section.label} ({section.key})</option>
                            ))}
                        </select>
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

                <p className="muted" style={{ marginTop: -6 }}>
                    Data key: <strong>{form.pageKey}:{form.sectionKey}</strong>
                </p>

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
