import { useEffect, useState } from 'react';
import API from '../services/api';

const defaultOverview = {
    species: 0,
    habitats: 0,
    projects: 0,
    posts: 0,
    sightings: 0,
    volunteers: 0,
    donors: 0,
};

const defaultContent = {
    heroEyebrow: '',
    heroTitle: '',
    heroText: '',
    heroPrimaryLabel: '',
    heroPrimaryLink: '',
    heroSecondaryLabel: '',
    heroSecondaryLink: '',
    supportEmail: '',
    footerTitle: '',
    footerText: '',
    footerSubtext: '',
    pages: [],
};

const createDraftId = (prefix) => `draft-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const isDraftRecord = (value) => String(value || '').startsWith('draft-');

const formatDate = (value) => {
    if (!value) {
        return '—';
    }

    try {
        return new Date(value).toLocaleString();
    } catch (_error) {
        return String(value);
    }
};

const createBlankSection = () => ({
    id: createDraftId('section'),
    eyebrow: '',
    title: '',
    body: '',
    items: [],
    ctaLabel: '',
    ctaLink: '',
    image: '',
});

const createBlankPage = () => ({
    id: createDraftId('page'),
    slug: '',
    title: '',
    navigationLabel: '',
    heroTitle: '',
    heroText: '',
    intro: '',
    image: '',
    showInNav: true,
    sections: [createBlankSection()],
});

const createBlankSpecies = () => ({
    id: createDraftId('species'),
    slug: '',
    name: '',
    scientificName: '',
    summary: '',
    body: '',
    habitat: '',
    rangeText: '',
    diet: '',
    conservationStatus: '',
    riskLevel: '',
    coexistenceTips: '',
    image: '',
    featured: false,
    sortOrder: 0,
});

const createBlankHabitat = () => ({
    id: createDraftId('habitat'),
    slug: '',
    title: '',
    summary: '',
    body: '',
    humanInteraction: '',
    region: '',
    image: '',
    featured: false,
    sortOrder: 0,
});

const createBlankProject = () => ({
    id: createDraftId('project'),
    slug: '',
    title: '',
    summary: '',
    body: '',
    status: 'Active',
    ctaLabel: '',
    ctaLink: '',
    image: '',
    featured: false,
    sortOrder: 0,
});

const createBlankPost = () => ({
    id: createDraftId('post'),
    slug: '',
    title: '',
    excerpt: '',
    body: '',
    category: 'Insights',
    image: '',
    featured: false,
    publishedAt: '',
    sortOrder: 0,
});

function WildlifePedia() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savingRecordKey, setSavingRecordKey] = useState('');
    const [deletingRecordKey, setDeletingRecordKey] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [updatedAt, setUpdatedAt] = useState('');
    const [updatedByEmail, setUpdatedByEmail] = useState('');
    const [overview, setOverview] = useState(defaultOverview);
    const [content, setContent] = useState(defaultContent);
    const [species, setSpecies] = useState([]);
    const [habitats, setHabitats] = useState([]);
    const [projects, setProjects] = useState([]);
    const [posts, setPosts] = useState([]);
    const [sightings, setSightings] = useState([]);
    const [volunteers, setVolunteers] = useState([]);
    const [donors, setDonors] = useState([]);

    const loadData = async () => {
        setLoading(true);
        setError('');

        try {
            const [
                overviewRes,
                contentRes,
                speciesRes,
                habitatsRes,
                projectsRes,
                postsRes,
                sightingsRes,
                volunteersRes,
                donorsRes,
            ] = await Promise.all([
                API.get('/api/wildlife-pedia/admin/overview'),
                API.get('/api/wildlife-pedia/admin/site-content'),
                API.get('/api/wildlife-pedia/admin/species'),
                API.get('/api/wildlife-pedia/admin/habitats'),
                API.get('/api/wildlife-pedia/admin/projects'),
                API.get('/api/wildlife-pedia/admin/posts'),
                API.get('/api/wildlife-pedia/admin/sightings'),
                API.get('/api/wildlife-pedia/admin/volunteers'),
                API.get('/api/wildlife-pedia/admin/donors'),
            ]);

            setOverview(overviewRes.data?.overview || defaultOverview);
            setContent({
                ...defaultContent,
                ...(contentRes.data?.content || {}),
                pages: Array.isArray(contentRes.data?.content?.pages) ? contentRes.data.content.pages : [],
            });
            setUpdatedAt(contentRes.data?.updatedAt || '');
            setUpdatedByEmail(contentRes.data?.updatedByEmail || '');
            setSpecies(Array.isArray(speciesRes.data?.items) ? speciesRes.data.items : []);
            setHabitats(Array.isArray(habitatsRes.data?.items) ? habitatsRes.data.items : []);
            setProjects(Array.isArray(projectsRes.data?.items) ? projectsRes.data.items : []);
            setPosts(Array.isArray(postsRes.data?.items) ? postsRes.data.items : []);
            setSightings(Array.isArray(sightingsRes.data?.items) ? sightingsRes.data.items : []);
            setVolunteers(Array.isArray(volunteersRes.data?.items) ? volunteersRes.data.items : []);
            setDonors(Array.isArray(donorsRes.data?.items) ? donorsRes.data.items : []);
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.message || err?.response?.data || 'Unable to load Wildlife-Pedia admin records.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const updateContentField = (field, value) => {
        setContent((current) => ({ ...current, [field]: value }));
    };

    const updatePageField = (pageIndex, field, value) => {
        setContent((current) => ({
            ...current,
            pages: (Array.isArray(current.pages) ? current.pages : []).map((page, index) => (
                index === pageIndex ? { ...page, [field]: value } : page
            )),
        }));
    };

    const updatePageSectionField = (pageIndex, sectionIndex, field, value) => {
        setContent((current) => ({
            ...current,
            pages: (Array.isArray(current.pages) ? current.pages : []).map((page, currentPageIndex) => {
                if (currentPageIndex !== pageIndex) {
                    return page;
                }

                return {
                    ...page,
                    sections: (Array.isArray(page.sections) ? page.sections : []).map((section, currentSectionIndex) => (
                        currentSectionIndex === sectionIndex
                            ? { ...section, [field]: value }
                            : section
                    )),
                };
            }),
        }));
    };

    const addPage = () => {
        setContent((current) => ({
            ...current,
            pages: [...(Array.isArray(current.pages) ? current.pages : []), createBlankPage()],
        }));
    };

    const removePage = (pageIndex) => {
        setContent((current) => ({
            ...current,
            pages: (Array.isArray(current.pages) ? current.pages : []).filter((_, index) => index !== pageIndex),
        }));
    };

    const addSectionToPage = (pageIndex) => {
        setContent((current) => ({
            ...current,
            pages: (Array.isArray(current.pages) ? current.pages : []).map((page, index) => (
                index === pageIndex
                    ? { ...page, sections: [...(Array.isArray(page.sections) ? page.sections : []), createBlankSection()] }
                    : page
            )),
        }));
    };

    const removeSectionFromPage = (pageIndex, sectionIndex) => {
        setContent((current) => ({
            ...current,
            pages: (Array.isArray(current.pages) ? current.pages : []).map((page, index) => (
                index === pageIndex
                    ? { ...page, sections: (Array.isArray(page.sections) ? page.sections : []).filter((_, currentIndex) => currentIndex !== sectionIndex) }
                    : page
            )),
        }));
    };

    const handleSaveContent = async () => {
        setSaving(true);
        setError('');
        setMessage('');

        try {
            const res = await API.put('/api/wildlife-pedia/admin/site-content', {
                ...content,
                pages: (Array.isArray(content.pages) ? content.pages : []).map((page) => ({
                    ...page,
                    sections: (Array.isArray(page.sections) ? page.sections : []).map((section) => ({
                        ...section,
                        items: Array.isArray(section.items)
                            ? section.items.filter(Boolean)
                            : String(section.items || '')
                                .split('\n')
                                .map((item) => item.trim())
                                .filter(Boolean),
                    })),
                })),
            });

            setContent({
                ...defaultContent,
                ...(res.data?.content || {}),
                pages: Array.isArray(res.data?.content?.pages) ? res.data.content.pages : [],
            });
            setUpdatedAt(res.data?.updatedAt || '');
            setUpdatedByEmail(res.data?.updatedByEmail || '');
            setMessage(res.data?.message || 'Wildlife-Pedia content saved successfully.');
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.message || err?.response?.data || 'Unable to save Wildlife-Pedia content.');
        } finally {
            setSaving(false);
        }
    };

    const updateListItem = (setter, index, field, value) => {
        setter((current) => current.map((item, currentIndex) => (
            currentIndex === index ? { ...item, [field]: value } : item
        )));
    };

    const saveSpecies = async (item, index) => {
        const recordKey = `species:${item.id || index}`;
        setSavingRecordKey(recordKey);
        setMessage('');
        setError('');

        try {
            const payload = {
                slug: item.slug,
                name: item.name,
                scientificName: item.scientificName,
                summary: item.summary,
                body: item.body,
                habitat: item.habitat,
                rangeText: item.rangeText,
                diet: item.diet,
                conservationStatus: item.conservationStatus,
                riskLevel: item.riskLevel,
                coexistenceTips: item.coexistenceTips,
                image: item.image,
                featured: Boolean(item.featured),
                sortOrder: Number(item.sortOrder || 0),
            };
            const res = isDraftRecord(item.id)
                ? await API.post('/api/wildlife-pedia/admin/species', payload)
                : await API.put(`/api/wildlife-pedia/admin/species/${item.id}`, payload);

            const saved = res.data?.item || payload;
            setSpecies((current) => current.map((entry, currentIndex) => (currentIndex === index ? saved : entry)));
            setMessage('Species record saved successfully.');
            loadData();
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.message || err?.response?.data || 'Unable to save species record.');
        } finally {
            setSavingRecordKey('');
        }
    };

    const saveHabitat = async (item, index) => {
        const recordKey = `habitat:${item.id || index}`;
        setSavingRecordKey(recordKey);
        setMessage('');
        setError('');

        try {
            const payload = {
                slug: item.slug,
                title: item.title,
                summary: item.summary,
                body: item.body,
                humanInteraction: item.humanInteraction,
                region: item.region,
                image: item.image,
                featured: Boolean(item.featured),
                sortOrder: Number(item.sortOrder || 0),
            };
            const res = isDraftRecord(item.id)
                ? await API.post('/api/wildlife-pedia/admin/habitats', payload)
                : await API.put(`/api/wildlife-pedia/admin/habitats/${item.id}`, payload);

            const saved = res.data?.item || payload;
            setHabitats((current) => current.map((entry, currentIndex) => (currentIndex === index ? saved : entry)));
            setMessage('Habitat record saved successfully.');
            loadData();
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.message || err?.response?.data || 'Unable to save habitat record.');
        } finally {
            setSavingRecordKey('');
        }
    };

    const saveProject = async (item, index) => {
        const recordKey = `project:${item.id || index}`;
        setSavingRecordKey(recordKey);
        setMessage('');
        setError('');

        try {
            const payload = {
                slug: item.slug,
                title: item.title,
                summary: item.summary,
                body: item.body,
                status: item.status,
                ctaLabel: item.ctaLabel,
                ctaLink: item.ctaLink,
                image: item.image,
                featured: Boolean(item.featured),
                sortOrder: Number(item.sortOrder || 0),
            };
            const res = isDraftRecord(item.id)
                ? await API.post('/api/wildlife-pedia/admin/projects', payload)
                : await API.put(`/api/wildlife-pedia/admin/projects/${item.id}`, payload);

            const saved = res.data?.item || payload;
            setProjects((current) => current.map((entry, currentIndex) => (currentIndex === index ? saved : entry)));
            setMessage('Project record saved successfully.');
            loadData();
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.message || err?.response?.data || 'Unable to save project record.');
        } finally {
            setSavingRecordKey('');
        }
    };

    const savePost = async (item, index) => {
        const recordKey = `post:${item.id || index}`;
        setSavingRecordKey(recordKey);
        setMessage('');
        setError('');

        try {
            const payload = {
                slug: item.slug,
                title: item.title,
                excerpt: item.excerpt,
                body: item.body,
                category: item.category,
                image: item.image,
                featured: Boolean(item.featured),
                publishedAt: item.publishedAt,
                sortOrder: Number(item.sortOrder || 0),
            };
            const res = isDraftRecord(item.id)
                ? await API.post('/api/wildlife-pedia/admin/posts', payload)
                : await API.put(`/api/wildlife-pedia/admin/posts/${item.id}`, payload);

            const saved = res.data?.item || payload;
            setPosts((current) => current.map((entry, currentIndex) => (currentIndex === index ? saved : entry)));
            setMessage('Blog post saved successfully.');
            loadData();
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.message || err?.response?.data || 'Unable to save blog post.');
        } finally {
            setSavingRecordKey('');
        }
    };

    const deleteRecord = async ({ type, id, endpoint, setter }) => {
        if (!id || !window.confirm(`Delete this ${type}?`)) {
            return;
        }

        const recordKey = `${type}:${id}`;
        setDeletingRecordKey(recordKey);
        setMessage('');
        setError('');

        try {
            if (isDraftRecord(id)) {
                setter((current) => current.filter((item) => item.id !== id));
            } else {
                await API.delete(endpoint);
                setter((current) => current.filter((item) => item.id !== id));
            }
            setMessage(`${type.charAt(0).toUpperCase() + type.slice(1)} removed successfully.`);
            loadData();
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.message || err?.response?.data || `Unable to delete ${type}.`);
        } finally {
            setDeletingRecordKey('');
        }
    };

    return (
        <div className="page-section">
            <div className="section-actions">
                <div>
                    <h1>Wildlife-Pedia</h1>
                    <p className="muted">Edit page copy, page sections, species, habitats, projects, and blog content from the shared Felix admin dashboard.</p>
                    {updatedAt ? <p className="muted">Last saved: {formatDate(updatedAt)}{updatedByEmail ? ` by ${updatedByEmail}` : ''}</p> : null}
                </div>
                <div className="toolbar-actions">
                    <a href="https://wildlife-pedia.com" target="_blank" rel="noreferrer" className="secondary-button refresh-button">Open live domain</a>
                    <a href="https://wildlife-pedia-web.vercel.app" target="_blank" rel="noreferrer" className="secondary-button refresh-button">Open preview</a>
                    <button type="button" className="secondary-button refresh-button" onClick={loadData} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</button>
                    <button type="button" className="primary-button" onClick={handleSaveContent} disabled={saving}>{saving ? 'Saving…' : 'Save page content'}</button>
                </div>
            </div>

            {message ? <p className="message-success">{message}</p> : null}
            {error ? <p className="message-error">{error}</p> : null}

            <div className="stats-grid">
                <div className="stat-card"><strong>Species</strong><span>{overview.species || 0} profiles</span></div>
                <div className="stat-card"><strong>Habitats</strong><span>{overview.habitats || 0} habitat records</span></div>
                <div className="stat-card"><strong>Projects</strong><span>{overview.projects || 0} conservation initiatives</span></div>
                <div className="stat-card"><strong>Posts</strong><span>{overview.posts || 0} insight articles</span></div>
                <div className="stat-card"><strong>Sightings</strong><span>{overview.sightings || 0} submitted reports</span></div>
                <div className="stat-card"><strong>Supporters</strong><span>{(overview.volunteers || 0) + (overview.donors || 0)} leads</span></div>
            </div>

            <div className="list-card">
                <div className="record-header">
                    <div>
                        <h3>Global site content</h3>
                        <p className="muted">These fields control the homepage hero, footer, and shared site identity.</p>
                    </div>
                </div>
                <div className="edit-form">
                    <label><span>Hero badge</span><input value={content.heroEyebrow || ''} onChange={(event) => updateContentField('heroEyebrow', event.target.value)} /></label>
                    <label><span>Hero title</span><input value={content.heroTitle || ''} onChange={(event) => updateContentField('heroTitle', event.target.value)} /></label>
                    <label><span>Hero text</span><textarea rows="4" value={content.heroText || ''} onChange={(event) => updateContentField('heroText', event.target.value)} /></label>
                    <label><span>Primary CTA label</span><input value={content.heroPrimaryLabel || ''} onChange={(event) => updateContentField('heroPrimaryLabel', event.target.value)} /></label>
                    <label><span>Primary CTA link</span><input value={content.heroPrimaryLink || ''} onChange={(event) => updateContentField('heroPrimaryLink', event.target.value)} /></label>
                    <label><span>Secondary CTA label</span><input value={content.heroSecondaryLabel || ''} onChange={(event) => updateContentField('heroSecondaryLabel', event.target.value)} /></label>
                    <label><span>Secondary CTA link</span><input value={content.heroSecondaryLink || ''} onChange={(event) => updateContentField('heroSecondaryLink', event.target.value)} /></label>
                    <label><span>Support email</span><input value={content.supportEmail || ''} onChange={(event) => updateContentField('supportEmail', event.target.value)} /></label>
                    <label><span>Footer title</span><input value={content.footerTitle || ''} onChange={(event) => updateContentField('footerTitle', event.target.value)} /></label>
                    <label><span>Footer text</span><textarea rows="3" value={content.footerText || ''} onChange={(event) => updateContentField('footerText', event.target.value)} /></label>
                    <label><span>Footer subtext</span><textarea rows="3" value={content.footerSubtext || ''} onChange={(event) => updateContentField('footerSubtext', event.target.value)} /></label>
                </div>
            </div>

            <div className="list-card">
                <div className="record-header">
                    <div>
                        <h3>Pages & sections</h3>
                        <p className="muted">Edit each page, add more pages, and add or remove sections inside any page. New pages resolve automatically from their slug.</p>
                    </div>
                    <button type="button" className="secondary-button" onClick={addPage}>Add page</button>
                </div>

                {(Array.isArray(content.pages) ? content.pages : []).map((page, pageIndex) => (
                    <div key={page.id || pageIndex} className="product-card" style={{ marginBottom: 16 }}>
                        <div className="record-header">
                            <div>
                                <h3>{page.title || `Page ${pageIndex + 1}`}</h3>
                                <p className="muted">/{page.slug || 'page-slug'}</p>
                            </div>
                            <div className="toolbar-actions">
                                <button type="button" className="secondary-button" onClick={() => addSectionToPage(pageIndex)}>Add section</button>
                                <button type="button" className="secondary-button" onClick={() => removePage(pageIndex)}>Remove page</button>
                            </div>
                        </div>

                        <div className="edit-form">
                            <label><span>Page slug</span><input value={page.slug || ''} onChange={(event) => updatePageField(pageIndex, 'slug', event.target.value)} /></label>
                            <label><span>Navigation label</span><input value={page.navigationLabel || ''} onChange={(event) => updatePageField(pageIndex, 'navigationLabel', event.target.value)} /></label>
                            <label><span>Page title</span><input value={page.title || ''} onChange={(event) => updatePageField(pageIndex, 'title', event.target.value)} /></label>
                            <label><span>Hero title</span><input value={page.heroTitle || ''} onChange={(event) => updatePageField(pageIndex, 'heroTitle', event.target.value)} /></label>
                            <label><span>Hero text</span><textarea rows="3" value={page.heroText || ''} onChange={(event) => updatePageField(pageIndex, 'heroText', event.target.value)} /></label>
                            <label><span>Intro</span><textarea rows="3" value={page.intro || ''} onChange={(event) => updatePageField(pageIndex, 'intro', event.target.value)} /></label>
                            <label><span>Hero image URL</span><input value={page.image || ''} onChange={(event) => updatePageField(pageIndex, 'image', event.target.value)} /></label>
                            <label>
                                <span>Show in navigation</span>
                                <select value={page.showInNav ? 'yes' : 'no'} onChange={(event) => updatePageField(pageIndex, 'showInNav', event.target.value === 'yes')}>
                                    <option value="yes">Yes</option>
                                    <option value="no">No</option>
                                </select>
                            </label>
                        </div>

                        {(Array.isArray(page.sections) ? page.sections : []).map((section, sectionIndex) => (
                            <div key={section.id || sectionIndex} className="record-card" style={{ marginTop: 12 }}>
                                <div className="record-header">
                                    <div>
                                        <strong>{section.title || `Section ${sectionIndex + 1}`}</strong>
                                        <p className="muted">Add body text, bullets, CTAs, and media for this section.</p>
                                    </div>
                                    <button type="button" className="secondary-button" onClick={() => removeSectionFromPage(pageIndex, sectionIndex)}>Remove section</button>
                                </div>
                                <div className="edit-form">
                                    <label><span>Eyebrow</span><input value={section.eyebrow || ''} onChange={(event) => updatePageSectionField(pageIndex, sectionIndex, 'eyebrow', event.target.value)} /></label>
                                    <label><span>Title</span><input value={section.title || ''} onChange={(event) => updatePageSectionField(pageIndex, sectionIndex, 'title', event.target.value)} /></label>
                                    <label><span>Body</span><textarea rows="4" value={section.body || ''} onChange={(event) => updatePageSectionField(pageIndex, sectionIndex, 'body', event.target.value)} /></label>
                                    <label><span>Items (one per line)</span><textarea rows="4" value={Array.isArray(section.items) ? section.items.join('\n') : ''} onChange={(event) => updatePageSectionField(pageIndex, sectionIndex, 'items', event.target.value.split('\n').map((item) => item.trim()).filter(Boolean))} /></label>
                                    <label><span>CTA label</span><input value={section.ctaLabel || ''} onChange={(event) => updatePageSectionField(pageIndex, sectionIndex, 'ctaLabel', event.target.value)} /></label>
                                    <label><span>CTA link</span><input value={section.ctaLink || ''} onChange={(event) => updatePageSectionField(pageIndex, sectionIndex, 'ctaLink', event.target.value)} /></label>
                                    <label><span>Image URL</span><input value={section.image || ''} onChange={(event) => updatePageSectionField(pageIndex, sectionIndex, 'image', event.target.value)} /></label>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            <div className="list-card" id="species">
                <div className="record-header">
                    <div>
                        <h3>Species editor</h3>
                        <p className="muted">Add, edit, save, or remove species profiles used across the public site.</p>
                    </div>
                    <button type="button" className="secondary-button" onClick={() => setSpecies((current) => [...current, createBlankSpecies()])}>Add species</button>
                </div>
                <div className="record-list">
                    {species.map((item, index) => {
                        const recordKey = `species:${item.id || index}`;
                        return (
                            <div key={item.id || index} className="product-card">
                                <div className="edit-form">
                                    <label><span>Name</span><input value={item.name || ''} onChange={(event) => updateListItem(setSpecies, index, 'name', event.target.value)} /></label>
                                    <label><span>Slug</span><input value={item.slug || ''} onChange={(event) => updateListItem(setSpecies, index, 'slug', event.target.value)} /></label>
                                    <label><span>Scientific name</span><input value={item.scientificName || ''} onChange={(event) => updateListItem(setSpecies, index, 'scientificName', event.target.value)} /></label>
                                    <label><span>Habitat</span><input value={item.habitat || ''} onChange={(event) => updateListItem(setSpecies, index, 'habitat', event.target.value)} /></label>
                                    <label><span>Range</span><input value={item.rangeText || ''} onChange={(event) => updateListItem(setSpecies, index, 'rangeText', event.target.value)} /></label>
                                    <label><span>Diet</span><input value={item.diet || ''} onChange={(event) => updateListItem(setSpecies, index, 'diet', event.target.value)} /></label>
                                    <label><span>Conservation status</span><input value={item.conservationStatus || ''} onChange={(event) => updateListItem(setSpecies, index, 'conservationStatus', event.target.value)} /></label>
                                    <label><span>Risk level</span><input value={item.riskLevel || ''} onChange={(event) => updateListItem(setSpecies, index, 'riskLevel', event.target.value)} /></label>
                                    <label><span>Image URL</span><input value={item.image || ''} onChange={(event) => updateListItem(setSpecies, index, 'image', event.target.value)} /></label>
                                    <label><span>Summary</span><textarea rows="3" value={item.summary || ''} onChange={(event) => updateListItem(setSpecies, index, 'summary', event.target.value)} /></label>
                                    <label><span>Body</span><textarea rows="4" value={item.body || ''} onChange={(event) => updateListItem(setSpecies, index, 'body', event.target.value)} /></label>
                                    <label><span>Coexistence tips</span><textarea rows="3" value={item.coexistenceTips || ''} onChange={(event) => updateListItem(setSpecies, index, 'coexistenceTips', event.target.value)} /></label>
                                    <label><span>Featured</span><select value={item.featured ? 'yes' : 'no'} onChange={(event) => updateListItem(setSpecies, index, 'featured', event.target.value === 'yes')}><option value="yes">Yes</option><option value="no">No</option></select></label>
                                </div>
                                <div className="product-actions">
                                    <button type="button" className="secondary-button" onClick={() => saveSpecies(item, index)} disabled={savingRecordKey === recordKey}>{savingRecordKey === recordKey ? 'Saving…' : 'Save species'}</button>
                                    <button type="button" className="secondary-button" onClick={() => deleteRecord({ type: 'species', id: item.id, endpoint: `/api/wildlife-pedia/admin/species/${item.id}`, setter: setSpecies })} disabled={deletingRecordKey === recordKey}>{deletingRecordKey === recordKey ? 'Deleting…' : 'Delete'}</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="list-card" id="habitats">
                <div className="record-header">
                    <div>
                        <h3>Habitats editor</h3>
                        <p className="muted">Edit every habitat card and add new ecosystem entries for the public site.</p>
                    </div>
                    <button type="button" className="secondary-button" onClick={() => setHabitats((current) => [...current, createBlankHabitat()])}>Add habitat</button>
                </div>
                <div className="record-list">
                    {habitats.map((item, index) => {
                        const recordKey = `habitat:${item.id || index}`;
                        return (
                            <div key={item.id || index} className="product-card">
                                <div className="edit-form">
                                    <label><span>Title</span><input value={item.title || ''} onChange={(event) => updateListItem(setHabitats, index, 'title', event.target.value)} /></label>
                                    <label><span>Slug</span><input value={item.slug || ''} onChange={(event) => updateListItem(setHabitats, index, 'slug', event.target.value)} /></label>
                                    <label><span>Region</span><input value={item.region || ''} onChange={(event) => updateListItem(setHabitats, index, 'region', event.target.value)} /></label>
                                    <label><span>Image URL</span><input value={item.image || ''} onChange={(event) => updateListItem(setHabitats, index, 'image', event.target.value)} /></label>
                                    <label><span>Summary</span><textarea rows="3" value={item.summary || ''} onChange={(event) => updateListItem(setHabitats, index, 'summary', event.target.value)} /></label>
                                    <label><span>Body</span><textarea rows="4" value={item.body || ''} onChange={(event) => updateListItem(setHabitats, index, 'body', event.target.value)} /></label>
                                    <label><span>Human interaction</span><textarea rows="3" value={item.humanInteraction || ''} onChange={(event) => updateListItem(setHabitats, index, 'humanInteraction', event.target.value)} /></label>
                                    <label><span>Featured</span><select value={item.featured ? 'yes' : 'no'} onChange={(event) => updateListItem(setHabitats, index, 'featured', event.target.value === 'yes')}><option value="yes">Yes</option><option value="no">No</option></select></label>
                                </div>
                                <div className="product-actions">
                                    <button type="button" className="secondary-button" onClick={() => saveHabitat(item, index)} disabled={savingRecordKey === recordKey}>{savingRecordKey === recordKey ? 'Saving…' : 'Save habitat'}</button>
                                    <button type="button" className="secondary-button" onClick={() => deleteRecord({ type: 'habitat', id: item.id, endpoint: `/api/wildlife-pedia/admin/habitats/${item.id}`, setter: setHabitats })} disabled={deletingRecordKey === recordKey}>{deletingRecordKey === recordKey ? 'Deleting…' : 'Delete'}</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="list-card" id="projects">
                <div className="record-header">
                    <div>
                        <h3>Projects editor</h3>
                        <p className="muted">Manage the conservation projects and CTAs shown on Wildlife-Pedia.</p>
                    </div>
                    <button type="button" className="secondary-button" onClick={() => setProjects((current) => [...current, createBlankProject()])}>Add project</button>
                </div>
                <div className="record-list">
                    {projects.map((item, index) => {
                        const recordKey = `project:${item.id || index}`;
                        return (
                            <div key={item.id || index} className="product-card">
                                <div className="edit-form">
                                    <label><span>Title</span><input value={item.title || ''} onChange={(event) => updateListItem(setProjects, index, 'title', event.target.value)} /></label>
                                    <label><span>Slug</span><input value={item.slug || ''} onChange={(event) => updateListItem(setProjects, index, 'slug', event.target.value)} /></label>
                                    <label><span>Status</span><input value={item.status || ''} onChange={(event) => updateListItem(setProjects, index, 'status', event.target.value)} /></label>
                                    <label><span>CTA label</span><input value={item.ctaLabel || ''} onChange={(event) => updateListItem(setProjects, index, 'ctaLabel', event.target.value)} /></label>
                                    <label><span>CTA link</span><input value={item.ctaLink || ''} onChange={(event) => updateListItem(setProjects, index, 'ctaLink', event.target.value)} /></label>
                                    <label><span>Image URL</span><input value={item.image || ''} onChange={(event) => updateListItem(setProjects, index, 'image', event.target.value)} /></label>
                                    <label><span>Summary</span><textarea rows="3" value={item.summary || ''} onChange={(event) => updateListItem(setProjects, index, 'summary', event.target.value)} /></label>
                                    <label><span>Body</span><textarea rows="4" value={item.body || ''} onChange={(event) => updateListItem(setProjects, index, 'body', event.target.value)} /></label>
                                    <label><span>Featured</span><select value={item.featured ? 'yes' : 'no'} onChange={(event) => updateListItem(setProjects, index, 'featured', event.target.value === 'yes')}><option value="yes">Yes</option><option value="no">No</option></select></label>
                                </div>
                                <div className="product-actions">
                                    <button type="button" className="secondary-button" onClick={() => saveProject(item, index)} disabled={savingRecordKey === recordKey}>{savingRecordKey === recordKey ? 'Saving…' : 'Save project'}</button>
                                    <button type="button" className="secondary-button" onClick={() => deleteRecord({ type: 'project', id: item.id, endpoint: `/api/wildlife-pedia/admin/projects/${item.id}`, setter: setProjects })} disabled={deletingRecordKey === recordKey}>{deletingRecordKey === recordKey ? 'Deleting…' : 'Delete'}</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="list-card" id="posts">
                <div className="record-header">
                    <div>
                        <h3>Blog editor</h3>
                        <p className="muted">Create, edit, and save the posts that feed the Wildlife-Pedia insights page.</p>
                    </div>
                    <button type="button" className="secondary-button" onClick={() => setPosts((current) => [...current, createBlankPost()])}>Add post</button>
                </div>
                <div className="record-list">
                    {posts.map((item, index) => {
                        const recordKey = `post:${item.id || index}`;
                        return (
                            <div key={item.id || index} className="product-card">
                                <div className="edit-form">
                                    <label><span>Title</span><input value={item.title || ''} onChange={(event) => updateListItem(setPosts, index, 'title', event.target.value)} /></label>
                                    <label><span>Slug</span><input value={item.slug || ''} onChange={(event) => updateListItem(setPosts, index, 'slug', event.target.value)} /></label>
                                    <label><span>Category</span><input value={item.category || ''} onChange={(event) => updateListItem(setPosts, index, 'category', event.target.value)} /></label>
                                    <label><span>Published date</span><input type="date" value={item.publishedAt || ''} onChange={(event) => updateListItem(setPosts, index, 'publishedAt', event.target.value)} /></label>
                                    <label><span>Image URL</span><input value={item.image || ''} onChange={(event) => updateListItem(setPosts, index, 'image', event.target.value)} /></label>
                                    <label><span>Excerpt</span><textarea rows="3" value={item.excerpt || ''} onChange={(event) => updateListItem(setPosts, index, 'excerpt', event.target.value)} /></label>
                                    <label><span>Body</span><textarea rows="5" value={item.body || ''} onChange={(event) => updateListItem(setPosts, index, 'body', event.target.value)} /></label>
                                    <label><span>Featured</span><select value={item.featured ? 'yes' : 'no'} onChange={(event) => updateListItem(setPosts, index, 'featured', event.target.value === 'yes')}><option value="yes">Yes</option><option value="no">No</option></select></label>
                                </div>
                                <div className="product-actions">
                                    <button type="button" className="secondary-button" onClick={() => savePost(item, index)} disabled={savingRecordKey === recordKey}>{savingRecordKey === recordKey ? 'Saving…' : 'Save post'}</button>
                                    <button type="button" className="secondary-button" onClick={() => deleteRecord({ type: 'post', id: item.id, endpoint: `/api/wildlife-pedia/admin/posts/${item.id}`, setter: setPosts })} disabled={deletingRecordKey === recordKey}>{deletingRecordKey === recordKey ? 'Deleting…' : 'Delete'}</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="list-card" id="reports">
                <div className="record-header">
                    <div>
                        <h3>Sighting reports</h3>
                        <p className="muted">Recent community-submitted sightings from the public report form.</p>
                    </div>
                </div>
                <div className="record-list">
                    {sightings.length ? sightings.map((item) => (
                        <div key={item.id} className="record-card">
                            <div className="record-header">
                                <div>
                                    <h3>{item.species_guess || 'Unknown species'}</h3>
                                    <p className="muted">{item.location_text} • {formatDate(item.created_at)}</p>
                                </div>
                                <span className="table-chip">{item.status || 'new'}</span>
                            </div>
                            <p>{item.notes || 'No notes were included.'}</p>
                        </div>
                    )) : <p className="muted">No sighting reports have been submitted yet.</p>}
                </div>
            </div>

            <div className="content-editor-grid">
                <div className="list-card" id="volunteers">
                    <h3>Volunteer interest</h3>
                    <div className="record-list">
                        {volunteers.length ? volunteers.map((item) => (
                            <div key={item.id} className="record-card compact-card">
                                <strong>{item.full_name}</strong>
                                <span>{item.email}</span>
                                <span className="muted">{item.interests || 'General interest'}</span>
                            </div>
                        )) : <p className="muted">No volunteer leads yet.</p>}
                    </div>
                </div>

                <div className="list-card" id="donors">
                    <h3>Donor / adoption interest</h3>
                    <div className="record-list">
                        {donors.length ? donors.map((item) => (
                            <div key={item.id} className="record-card compact-card">
                                <strong>{item.full_name}</strong>
                                <span>{item.email}</span>
                                <span className="muted">{item.support_type || 'Wildlife support'} {item.amount_text ? `• ${item.amount_text}` : ''}</span>
                            </div>
                        )) : <p className="muted">No donor leads yet.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default WildlifePedia;
