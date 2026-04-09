import { useEffect, useMemo, useState } from 'react';
import API from '../services/api';

const WACI_CONTEXT_PARAMS = {
    app_name: 'WACI',
    storefront_key: 'waci',
};

const WACI_SECTION_LINKS = [
    { id: 'overview', label: 'Overview' },
    { id: 'programs', label: 'Programs' },
    { id: 'stories', label: 'Stories' },
    { id: 'resources', label: 'Resources' },
    { id: 'newsletter-subscribers', label: 'Newsletter Subscribers' },
    { id: 'volunteers', label: 'Volunteers' },
    { id: 'partner-requests', label: 'Partner Requests' },
    { id: 'donors-sponsors', label: 'Donors/Sponsors' },
];

const defaultContent = {
    heroEyebrow: 'A home for Africans and friends of Africa who care about wildlife',
    heroTitle: 'Inspiring a growing generation for Africa’s wildlife.',
    heroText:
        'Wildlife Africa Conservation Initiative (WACI) brings together local communities, conservation partners, and practical action to protect biodiversity for the long term.',
    heroPrimaryLabel: 'Join the Movement',
    heroPrimaryLink: '#join',
    heroSecondaryLabel: 'Explore Wildlife',
    heroSecondaryLink: '#learn',
    heroImageOne: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80',
    heroImageTwo: 'https://images.unsplash.com/photo-1549366021-9f761d040a94?auto=format&fit=crop&w=1200&q=80',
    heroImageThree: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    heroImageFour: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=1200&q=80',
    heroWildPlacesTitle: 'Wild places',
    heroWildPlacesText: 'Savannas, forests, wetlands, mountains, and all the life they hold.',
    heroWhyTitle: 'Why WACI',
    heroWhyText: 'Wildlife protection becomes stronger when curiosity, community, and practical action meet.',
    heroVisionTitle: 'Vision',
    heroVisionText: 'A future where African biodiversity thrives because enough people stood up to protect it.',
    heroMissionTitle: 'Mission',
    heroMissionText: 'Bridge the gap between passion and practical action through learning, collaboration, and community.',
    featuredEyebrow: 'Priority campaigns',
    featuredTitle: 'Where WACI is focusing now',
    featuredText: 'Highlight live WACI campaigns, updates, and initiatives here through the shared Felix content system.',
    servicesEyebrow: 'Our Work',
    servicesTitle: 'Five pillars that turn care into conservation action',
    servicesText:
        'Through education, community engagement, research, storytelling, and collaboration, WACI helps people move from admiration of wildlife to active stewardship.',
    services: [
        { id: 'education-awareness', title: 'Education & Awareness', text: 'School outreach, youth wildlife clubs, community workshops, and digital learning experiences that make conservation practical and inspiring.', image: '' },
        { id: 'community-conservation', title: 'Community Conservation', text: 'Projects that elevate local voices, strengthen capacity, and support communities living alongside wildlife and wild places.', image: '' },
        { id: 'research-citizen-science', title: 'Research & Citizen Science', text: 'Field data, student research, citizen science, and ecosystem knowledge that help improve conservation decisions across Africa.', image: '' },
        { id: 'storytelling-media', title: 'Storytelling & Media', text: 'Documentaries, podcasts, blogs, and photo stories that move hearts, shape public understanding, and inspire action.', image: '' },
        { id: 'professional-network', title: 'Professional Network', text: 'A growing cross-border community connecting rangers, researchers, students, NGOs, artists, and supporters of African wildlife.', image: '' },
    ],
    successEyebrow: 'Thank you',
    successTitle: 'Your message has reached WACI',
    successText: 'A WACI team member will follow up shortly.',
    footerTitle: 'Wildlife Africa Conservation Initiative',
    footerText: 'Protecting species, restoring habitats, and inspiring lasting stewardship.',
    footerSubtext: "Powered by Felix Platform's shared admin, support, and email infrastructure.",
    supportEmail: 'hello@wildlifeafrica.org',
};

const SUPPORT_STATUS_OPTIONS = [
    { label: 'New', status: 'new' },
    { label: 'In Progress', status: 'in_progress' },
    { label: 'Resolved', status: 'resolved' },
    { label: 'Closed', status: 'closed' },
];

const formatDateTime = (value) => {
    if (!value) {
        return '—';
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleString();
};

function WACI() {
    const [content, setContent] = useState(defaultContent);
    const [supportRequests, setSupportRequests] = useState([]);
    const [overview, setOverview] = useState(null);
    const [programs, setPrograms] = useState([]);
    const [stories, setStories] = useState([]);
    const [resources, setResources] = useState([]);
    const [newsletterSubscribers, setNewsletterSubscribers] = useState([]);
    const [volunteers, setVolunteers] = useState([]);
    const [partnerRequests, setPartnerRequests] = useState([]);
    const [donorRequests, setDonorRequests] = useState([]);
    const [loadingContent, setLoadingContent] = useState(true);
    const [loadingSupport, setLoadingSupport] = useState(true);
    const [loadingResources, setLoadingResources] = useState(true);
    const [saving, setSaving] = useState(false);
    const [updatingSupportId, setUpdatingSupportId] = useState(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [updatedAt, setUpdatedAt] = useState('');
    const [updatedByEmail, setUpdatedByEmail] = useState('');

    const openSupportCount = useMemo(
        () => supportRequests.filter((request) => !['resolved', 'closed'].includes(String(request.status || 'new').toLowerCase())).length,
        [supportRequests],
    );

    const generalInquiries = useMemo(() => {
        return supportRequests.filter((request) => {
            const subject = String(request.subject || '').toLowerCase();
            return !subject.includes('volunteer') && !subject.includes('partner') && !subject.includes('donor') && !subject.includes('newsletter');
        });
    }, [supportRequests]);

    const loadContent = async () => {
        setLoadingContent(true);
        setError('');

        try {
            const res = await API.get('/api/admin/storefront/content', {
                params: WACI_CONTEXT_PARAMS,
            });
            setContent(res.data?.content || defaultContent);
            setUpdatedAt(res.data?.updatedAt || '');
            setUpdatedByEmail(res.data?.updatedByEmail || '');
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.message || err?.response?.data || 'Unable to load WACI content settings.');
        } finally {
            setLoadingContent(false);
        }
    };

    const loadSupportRequests = async () => {
        setLoadingSupport(true);

        try {
            const res = await API.get('/support-requests', {
                params: WACI_CONTEXT_PARAMS,
            });
            setSupportRequests(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.message || err?.response?.data || 'Unable to load WACI inquiries.');
        } finally {
            setLoadingSupport(false);
        }
    };

    const loadWaciResources = async () => {
        setLoadingResources(true);

        try {
            const [overviewRes, programsRes, storiesRes, resourcesRes, subscribersRes, volunteersRes, partnerRes, donorsRes] = await Promise.all([
                API.get('/api/waci/admin/overview'),
                API.get('/api/waci/admin/programs'),
                API.get('/api/waci/admin/stories'),
                API.get('/api/waci/admin/resources'),
                API.get('/api/waci/admin/newsletter'),
                API.get('/api/waci/admin/volunteers'),
                API.get('/api/waci/admin/partners'),
                API.get('/api/waci/admin/donors'),
            ]);

            setOverview(overviewRes.data?.overview || null);
            setPrograms(Array.isArray(programsRes.data?.items) ? programsRes.data.items : []);
            setStories(Array.isArray(storiesRes.data?.items) ? storiesRes.data.items : []);
            setResources(Array.isArray(resourcesRes.data?.items) ? resourcesRes.data.items : []);
            setNewsletterSubscribers(Array.isArray(subscribersRes.data?.items) ? subscribersRes.data.items : (Array.isArray(subscribersRes.data) ? subscribersRes.data : []));
            setVolunteers(Array.isArray(volunteersRes.data?.items) ? volunteersRes.data.items : (Array.isArray(volunteersRes.data) ? volunteersRes.data : []));
            setPartnerRequests(Array.isArray(partnerRes.data?.items) ? partnerRes.data.items : (Array.isArray(partnerRes.data) ? partnerRes.data : []));
            setDonorRequests(Array.isArray(donorsRes.data?.items) ? donorsRes.data.items : (Array.isArray(donorsRes.data) ? donorsRes.data : []));
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.message || err?.response?.data || 'Unable to load WACI admin records.');
        } finally {
            setLoadingResources(false);
        }
    };

    useEffect(() => {
        loadContent();
        loadSupportRequests();
        loadWaciResources();
    }, []);

    const updateField = (field, value) => {
        setContent((current) => ({
            ...current,
            [field]: value,
        }));
    };

    const updateService = (index, field, value) => {
        setContent((current) => ({
            ...current,
            services: current.services.map((service, serviceIndex) => (
                serviceIndex === index
                    ? { ...service, [field]: value }
                    : service
            )),
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        setMessage('');

        try {
            const res = await API.put('/api/admin/storefront/content', {
                ...content,
                ...WACI_CONTEXT_PARAMS,
            });
            setContent(res.data?.content || content);
            setUpdatedAt(res.data?.updatedAt || '');
            setUpdatedByEmail(res.data?.updatedByEmail || '');
            setMessage(res.data?.message || 'WACI content saved successfully.');
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.message || err?.response?.data || 'Unable to save WACI content.');
        } finally {
            setSaving(false);
        }
    };

    const updateSupportStatus = async (id, status) => {
        setUpdatingSupportId(id);
        setError('');
        setMessage('');

        try {
            const res = await API.patch(`/support-requests/${id}`, { status });
            setSupportRequests((current) => current.map((request) => (
                request.id === id ? res.data : request
            )));
            setMessage('WACI inquiry updated successfully.');
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.message || err?.response?.data || 'Unable to update WACI inquiry.');
        } finally {
            setUpdatingSupportId(null);
        }
    };

    const handleRefresh = () => {
        loadContent();
        loadSupportRequests();
        loadWaciResources();
    };

    return (
        <div className="page-section">
            <div className="section-actions">
                <div>
                    <h1>WACI</h1>
                    <p className="muted">Manage Wildlife Africa Conservation Initiative from the shared Felix admin dashboard — no separate admin app required.</p>
                </div>
                <div className="toolbar-actions">
                    <button
                        type="button"
                        className="secondary-button refresh-button"
                        onClick={handleRefresh}
                        disabled={saving || loadingContent || loadingSupport || loadingResources}
                    >
                        {(loadingContent || loadingSupport || loadingResources) ? 'Refreshing…' : 'Refresh WACI'}
                    </button>
                    <button type="button" className="edit-button refresh-button" onClick={handleSave} disabled={saving || loadingContent}>
                        {saving ? 'Saving…' : 'Save WACI'}
                    </button>
                </div>
            </div>

            {message ? <p className="message-success">{message}</p> : null}
            {error ? <p className="message-error">{error}</p> : null}

            <div className="tab-row">
                {WACI_SECTION_LINKS.map((section) => (
                    <a key={section.id} href={`#${section.id}`} className="tab-button preview-link">
                        {section.label}
                    </a>
                ))}
            </div>

            <div className="stats-grid" id="overview">
                <div className="stat-card">
                    <span className="muted">Focus areas</span>
                    <strong>{content.services?.length || 0}</strong>
                </div>
                <div className="stat-card">
                    <span className="muted">Programs</span>
                    <strong>{overview?.programs ?? programs.length}</strong>
                </div>
                <div className="stat-card">
                    <span className="muted">Stories</span>
                    <strong>{overview?.stories ?? stories.length}</strong>
                </div>
                <div className="stat-card">
                    <span className="muted">Resources</span>
                    <strong>{overview?.resources ?? resources.length}</strong>
                </div>
                <div className="stat-card">
                    <span className="muted">Newsletter</span>
                    <strong>{overview?.newsletterSubscribers ?? newsletterSubscribers.length}</strong>
                </div>
                <div className="stat-card">
                    <span className="muted">Volunteers</span>
                    <strong>{overview?.volunteerApplications ?? volunteers.length}</strong>
                </div>
                <div className="stat-card">
                    <span className="muted">Partner requests</span>
                    <strong>{overview?.partnerInquiries ?? partnerRequests.length}</strong>
                </div>
                <div className="stat-card">
                    <span className="muted">Donors/Sponsors</span>
                    <strong>{overview?.donors ?? donorRequests.length}</strong>
                </div>
                <div className="stat-card">
                    <span className="muted">Open inquiries</span>
                    <strong>{openSupportCount}</strong>
                </div>
            </div>

            <div className="waci-section-stack">
                <div className="content-editor-grid">
                    <div className="list-card">
                        <h3>Homepage content</h3>
                        <p className="muted section-subtitle">This keeps the public WACI homepage editable inside the shared admin and changes go live as soon as you save.</p>
                        <div className="edit-form">
                            <label>
                                <span>Hero badge text</span>
                                <input value={content.heroEyebrow || ''} onChange={(event) => updateField('heroEyebrow', event.target.value)} />
                            </label>
                            <label>
                                <span>Hero title</span>
                                <input value={content.heroTitle || ''} onChange={(event) => updateField('heroTitle', event.target.value)} />
                            </label>
                            <label>
                                <span>Hero text</span>
                                <textarea rows="4" value={content.heroText || ''} onChange={(event) => updateField('heroText', event.target.value)} />
                            </label>
                            <label>
                                <span>Primary CTA label</span>
                                <input value={content.heroPrimaryLabel || ''} onChange={(event) => updateField('heroPrimaryLabel', event.target.value)} />
                            </label>
                            <label>
                                <span>Primary CTA link</span>
                                <input value={content.heroPrimaryLink || ''} onChange={(event) => updateField('heroPrimaryLink', event.target.value)} />
                            </label>
                            <label>
                                <span>Secondary CTA label</span>
                                <input value={content.heroSecondaryLabel || ''} onChange={(event) => updateField('heroSecondaryLabel', event.target.value)} />
                            </label>
                            <label>
                                <span>Secondary CTA link</span>
                                <input value={content.heroSecondaryLink || ''} onChange={(event) => updateField('heroSecondaryLink', event.target.value)} />
                            </label>
                            <label>
                                <span>Hero image 1 URL</span>
                                <input value={content.heroImageOne || ''} onChange={(event) => updateField('heroImageOne', event.target.value)} />
                            </label>
                            <label>
                                <span>Hero image 2 URL</span>
                                <input value={content.heroImageTwo || ''} onChange={(event) => updateField('heroImageTwo', event.target.value)} />
                            </label>
                            <label>
                                <span>Hero image 3 URL</span>
                                <input value={content.heroImageThree || ''} onChange={(event) => updateField('heroImageThree', event.target.value)} />
                            </label>
                            <label>
                                <span>Hero image 4 URL</span>
                                <input value={content.heroImageFour || ''} onChange={(event) => updateField('heroImageFour', event.target.value)} />
                            </label>
                            <label>
                                <span>Wild places title</span>
                                <input value={content.heroWildPlacesTitle || ''} onChange={(event) => updateField('heroWildPlacesTitle', event.target.value)} />
                            </label>
                            <label>
                                <span>Wild places text</span>
                                <textarea rows="3" value={content.heroWildPlacesText || ''} onChange={(event) => updateField('heroWildPlacesText', event.target.value)} />
                            </label>
                            <label>
                                <span>Why WACI title</span>
                                <input value={content.heroWhyTitle || ''} onChange={(event) => updateField('heroWhyTitle', event.target.value)} />
                            </label>
                            <label>
                                <span>Why WACI text</span>
                                <textarea rows="3" value={content.heroWhyText || ''} onChange={(event) => updateField('heroWhyText', event.target.value)} />
                            </label>
                            <label>
                                <span>Vision title</span>
                                <input value={content.heroVisionTitle || ''} onChange={(event) => updateField('heroVisionTitle', event.target.value)} />
                            </label>
                            <label>
                                <span>Vision text</span>
                                <textarea rows="3" value={content.heroVisionText || ''} onChange={(event) => updateField('heroVisionText', event.target.value)} />
                            </label>
                            <label>
                                <span>Mission title</span>
                                <input value={content.heroMissionTitle || ''} onChange={(event) => updateField('heroMissionTitle', event.target.value)} />
                            </label>
                            <label>
                                <span>Mission text</span>
                                <textarea rows="3" value={content.heroMissionText || ''} onChange={(event) => updateField('heroMissionText', event.target.value)} />
                            </label>
                            <label>
                                <span>Our Work eyebrow</span>
                                <input value={content.servicesEyebrow || ''} onChange={(event) => updateField('servicesEyebrow', event.target.value)} />
                            </label>
                            <label>
                                <span>Our Work title</span>
                                <input value={content.servicesTitle || ''} onChange={(event) => updateField('servicesTitle', event.target.value)} />
                            </label>
                            <label>
                                <span>Our Work intro</span>
                                <textarea rows="3" value={content.servicesText || ''} onChange={(event) => updateField('servicesText', event.target.value)} />
                            </label>
                            <label>
                                <span>Featured section title</span>
                                <input value={content.featuredTitle || ''} onChange={(event) => updateField('featuredTitle', event.target.value)} />
                            </label>
                            <label>
                                <span>Featured section text</span>
                                <textarea rows="3" value={content.featuredText || ''} onChange={(event) => updateField('featuredText', event.target.value)} />
                            </label>
                            <label>
                                <span>Footer title</span>
                                <input value={content.footerTitle || ''} onChange={(event) => updateField('footerTitle', event.target.value)} />
                            </label>
                            <label>
                                <span>Footer text</span>
                                <textarea rows="3" value={content.footerText || ''} onChange={(event) => updateField('footerText', event.target.value)} />
                            </label>
                            <label>
                                <span>Footer subtext</span>
                                <textarea rows="3" value={content.footerSubtext || ''} onChange={(event) => updateField('footerSubtext', event.target.value)} />
                            </label>
                            <label>
                                <span>Support email</span>
                                <input value={content.supportEmail || ''} onChange={(event) => updateField('supportEmail', event.target.value)} />
                            </label>
                        </div>

                        {(updatedAt || updatedByEmail) ? (
                            <p className="muted" style={{ marginTop: '12px' }}>
                                Last saved {updatedAt ? formatDateTime(updatedAt) : 'recently'}
                                {updatedByEmail ? ` by ${updatedByEmail}` : ''}
                            </p>
                        ) : null}
                    </div>

                    <div className="record-card">
                        <div className="record-header">
                            <div>
                                <h3>Homepage focus areas</h3>
                                <p className="muted">Update the cards shown on the WACI public homepage.</p>
                            </div>
                        </div>

                        <div className="edit-form">
                            {content.services?.map((service, index) => (
                                <div key={service.id || index} className="product-card">
                                    <label>
                                        <span>Title</span>
                                        <input value={service.title || ''} onChange={(event) => updateService(index, 'title', event.target.value)} />
                                    </label>
                                    <label>
                                        <span>Description</span>
                                        <textarea rows="3" value={service.text || ''} onChange={(event) => updateService(index, 'text', event.target.value)} />
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <section id="programs" className="record-card">
                    <div className="record-header">
                        <div>
                            <h3>Programs</h3>
                            <p className="muted">Shared WACI program records available to the site and internal team.</p>
                        </div>
                    </div>

                    {loadingResources ? (
                        <p className="muted">Loading programs…</p>
                    ) : programs.length ? (
                        <div className="record-list">
                            {programs.map((program) => (
                                <div key={program.id} className="product-card">
                                    <h4>{program.title}</h4>
                                    <p className="muted">{program.region || 'Region not set'} · {program.status || 'active'}</p>
                                    <p style={{ marginTop: '8px' }}>{program.text}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="muted">No WACI programs yet.</p>
                    )}
                </section>

                <section id="stories" className="record-card">
                    <div className="record-header">
                        <div>
                            <h3>Stories</h3>
                            <p className="muted">Recent conservation stories and updates managed inside the existing admin.</p>
                        </div>
                    </div>

                    {loadingResources ? (
                        <p className="muted">Loading stories…</p>
                    ) : stories.length ? (
                        <div className="record-list">
                            {stories.map((story) => (
                                <div key={story.id} className="product-card">
                                    <h4>{story.title}</h4>
                                    <p className="muted">{story.location || 'Location not set'} · {story.publishedAt || 'Draft'}</p>
                                    <p style={{ marginTop: '8px' }}>{story.summary}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="muted">No WACI stories yet.</p>
                    )}
                </section>

                <section id="resources" className="record-card">
                    <div className="record-header">
                        <div>
                            <h3>Resources</h3>
                            <p className="muted">Knowledge hub items and media records available to the WACI site and admin team.</p>
                        </div>
                    </div>

                    {loadingResources ? (
                        <p className="muted">Loading resources…</p>
                    ) : resources.length ? (
                        <div className="record-list">
                            {resources.map((resource) => (
                                <div key={resource.id} className="product-card">
                                    <h4>{resource.title || 'Untitled resource'}</h4>
                                    <p className="muted">{resource.media_type || resource.resource_type || 'resource'}{resource.audience ? ` · ${resource.audience}` : ''}</p>
                                    <p style={{ marginTop: '8px' }}>{resource.caption || resource.excerpt || resource.alt_text || 'No summary yet.'}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="muted">No WACI resources yet.</p>
                    )}
                </section>

                <section id="newsletter-subscribers" className="record-card">
                    <div className="record-header">
                        <div>
                            <h3>Newsletter Subscribers</h3>
                            <p className="muted">People who joined WACI updates through the shared platform backend.</p>
                        </div>
                    </div>

                    {loadingResources ? (
                        <p className="muted">Loading newsletter subscribers…</p>
                    ) : newsletterSubscribers.length ? (
                        <div className="table-card">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Interests</th>
                                        <th>Source</th>
                                        <th>Joined</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {newsletterSubscribers.map((subscriber) => (
                                        <tr key={subscriber.id}>
                                            <td>{subscriber.full_name || '—'}</td>
                                            <td>{subscriber.email}</td>
                                            <td>{subscriber.interests?.length ? subscriber.interests.join(', ') : '—'}</td>
                                            <td>{subscriber.source || 'website'}</td>
                                            <td>{formatDateTime(subscriber.created_at)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="muted">No newsletter subscribers yet.</p>
                    )}
                </section>

                <section id="volunteers" className="record-card">
                    <div className="record-header">
                        <div>
                            <h3>Volunteers</h3>
                            <p className="muted">Volunteer interest captured inside the shared Felix admin stack.</p>
                        </div>
                    </div>

                    {loadingResources ? (
                        <p className="muted">Loading volunteers…</p>
                    ) : volunteers.length ? (
                        <div className="table-card">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Interest</th>
                                        <th>Availability</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {volunteers.map((volunteer) => (
                                        <tr key={volunteer.id}>
                                            <td>{volunteer.full_name}</td>
                                            <td>{volunteer.email}</td>
                                            <td>{volunteer.area_of_interest || '—'}</td>
                                            <td>{volunteer.availability || '—'}</td>
                                            <td>{volunteer.status || 'new'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="muted">No volunteer records yet.</p>
                    )}
                </section>

                <section id="partner-requests" className="record-card">
                    <div className="record-header">
                        <div>
                            <h3>Partner Requests</h3>
                            <p className="muted">Partner and sponsorship enquiries live inside the existing admin dashboard.</p>
                        </div>
                    </div>

                    {loadingResources ? (
                        <p className="muted">Loading partner requests…</p>
                    ) : partnerRequests.length ? (
                        <div className="table-card">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Contact</th>
                                        <th>Organization</th>
                                        <th>Email</th>
                                        <th>Type</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {partnerRequests.map((partner) => (
                                        <tr key={partner.id}>
                                            <td>{partner.contact_name}</td>
                                            <td>{partner.organization || '—'}</td>
                                            <td>{partner.email}</td>
                                            <td>{partner.partnership_type || '—'}</td>
                                            <td>{partner.status || 'new'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="muted">No partner requests yet.</p>
                    )}
                </section>

                <section id="donors-sponsors" className="record-card">
                    <div className="record-header">
                        <div>
                            <h3>Donors/Sponsors</h3>
                            <p className="muted">Donor and sponsor interest captured through the shared WACI backend.</p>
                        </div>
                    </div>

                    {loadingResources ? (
                        <p className="muted">Loading donor and sponsor records…</p>
                    ) : donorRequests.length ? (
                        <div className="table-card">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Organization</th>
                                        <th>Email</th>
                                        <th>Support type</th>
                                        <th>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {donorRequests.map((donor) => (
                                        <tr key={donor.id}>
                                            <td>{donor.full_name}</td>
                                            <td>{donor.organization || '—'}</td>
                                            <td>{donor.email}</td>
                                            <td>{donor.support_type || '—'}</td>
                                            <td>{donor.amount_text || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="muted">No donor or sponsor records yet.</p>
                    )}
                </section>

                <section className="record-card">
                    <div className="record-header">
                        <div>
                            <h3>General inquiries</h3>
                            <p className="muted">Messages submitted from the public WACI contact form and tracked through `support_requests`.</p>
                        </div>
                    </div>

                    {loadingSupport ? (
                        <p className="muted">Loading WACI inquiries…</p>
                    ) : generalInquiries.length ? (
                        <div className="record-list">
                            {generalInquiries.map((request) => (
                                <div key={request.id} className="product-card">
                                    <h4>{request.subject || 'Support request'}</h4>
                                    <p className="muted">{request.contact_name} · {request.contact_email}</p>
                                    <p style={{ marginTop: '8px', whiteSpace: 'pre-wrap' }}>{request.message}</p>
                                    <label style={{ marginTop: '10px', display: 'block' }}>
                                        <span>Status</span>
                                        <select
                                            value={request.status || 'new'}
                                            onChange={(event) => updateSupportStatus(request.id, event.target.value)}
                                            disabled={updatingSupportId === request.id}
                                        >
                                            {SUPPORT_STATUS_OPTIONS.map((option) => (
                                                <option key={option.status} value={option.status}>{option.label}</option>
                                            ))}
                                        </select>
                                    </label>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="muted">No WACI general inquiries yet.</p>
                    )}
                </section>
            </div>
        </div>
    );
}

export default WACI;
