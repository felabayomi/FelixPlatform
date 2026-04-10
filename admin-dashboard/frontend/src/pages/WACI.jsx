import { useEffect, useMemo, useState } from 'react';
import API from '../services/api';

const WACI_CONTEXT_PARAMS = {
    app_name: 'WACI',
    storefront_key: 'waci',
};

const WACI_SECTION_LINKS = [
    { id: 'overview', label: 'Overview' },
    { id: 'homepage-content', label: 'Homepage Content' },
    { id: 'who-we-are-editor', label: 'Who We Are' },
    { id: 'focus-areas', label: 'Focus Areas' },
    { id: 'programs', label: 'Programs' },
    { id: 'stories', label: 'Stories' },
    { id: 'story-attribution', label: 'Story Attribution' },
    { id: 'payout-requests', label: 'Payout Requests' },
    { id: 'resources', label: 'Resources' },
    { id: 'newsletter-subscribers', label: 'Newsletter Subscribers' },
    { id: 'volunteers', label: 'Volunteers' },
    { id: 'partner-requests', label: 'Partner Requests' },
    { id: 'donors-sponsors', label: 'Donors/Sponsors' },
    { id: 'general-inquiries', label: 'General Inquiries' },
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
    headerLogoUrl: 'https://mediahost.app/api/media/serve/a6a6a62c2c5d3698ffa2674ef586907e?w=400&h=400&fit=crop&crop=center&q=80',
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
    whoWeAreEyebrow: 'Who We Are',
    whoWeAreTitle: 'A platform for wildlife people',
    whoWeAreText: 'WACI was born from a simple truth: Africa’s wildlife needs more people who care, and those people need a place to connect, learn, and act. We exist to make conservation more inclusive, more informed, and more community-driven.',
    whoWeAreItems: [
        { id: 'community-inclusion', title: 'Community & Inclusion', text: 'Conservation belongs to everyone. We welcome professionals, students, creators, local communities, and global allies.', icon: 'users' },
        { id: 'knowledge-curiosity', title: 'Knowledge & Curiosity', text: 'We foster understanding of species, ecosystems, and conservation challenges so people can act with clarity.', icon: 'trees' },
        { id: 'action-accountability', title: 'Action & Accountability', text: 'We believe awareness matters, but measurable action for wildlife and habitats matters more.', icon: 'shield' },
    ],
    featuredEyebrow: 'Priority campaigns',
    featuredTitle: 'Where WACI is focusing now',
    featuredText: 'Highlight live WACI campaigns, updates, and initiatives here through the shared Felix content system.',
    storiesEyebrow: 'Stories & Media',
    storiesTitle: 'Conservation comes alive when people can see it, hear it, and feel it',
    storiesText: 'WACI uses storytelling to connect people to real ecosystems, real communities, and real conservation work across Africa.',
    featuredStoryEyebrow: 'Featured Story',
    featuredStoryTitle: 'Why WACI exists: turning admiration into action',
    featuredStoryText: 'Africa’s wildlife faces habitat loss, climate pressure, poaching, pollution, and human-wildlife conflict. WACI exists to help more people move from caring deeply about these realities to doing something meaningful about them.',
    featuredStoryImage: '',
    featuredStoryImageTwo: '',
    featuredStoryImageThree: '',
    featuredStoryImageFour: '',
    featuredStoryImages: [],
    featuredStoryAlt: 'African landscape with wildlife',
    featuredStoryCtaLabel: 'Join Our Movement',
    featuredStoryCtaLink: '#join',
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

const PROGRAM_STATUS_OPTIONS = [
    { label: 'Active', value: 'active' },
    { label: 'Planned', value: 'planned' },
    { label: 'Draft', value: 'draft' },
    { label: 'Archived', value: 'archived' },
];

const STORY_STATUS_OPTIONS = [
    { label: 'Pending Review', value: 'pending' },
    { label: 'Published', value: 'published' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Archived', value: 'archived' },
];

const RESOURCE_TYPE_OPTIONS = [
    { label: 'Image', value: 'image' },
    { label: 'Video', value: 'video' },
    { label: 'Article', value: 'article' },
    { label: 'PDF', value: 'pdf' },
    { label: 'Link', value: 'link' },
];

const WHO_WE_ARE_ICON_OPTIONS = [
    { label: 'People', value: 'users' },
    { label: 'Trees / Nature', value: 'trees' },
    { label: 'Shield', value: 'shield' },
    { label: 'Globe', value: 'globe' },
    { label: 'Heart / Partnership', value: 'heart-handshake' },
    { label: 'Book / Learning', value: 'book-open' },
    { label: 'Camera / Media', value: 'camera' },
    { label: 'Bird / Wildlife', value: 'bird' },
];

const createDraftId = (prefix) => `draft-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const isDraftRecord = (id) => String(id || '').startsWith('draft-');

const formatDateTime = (value) => {
    if (!value) {
        return '—';
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleString();
};

const formatCurrency = (value) => {
    const amount = Number(value || 0);
    return Number.isFinite(amount)
        ? amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
        : '$0.00';
};

const resolveImageUrl = (value) => {
    const normalized = String(value || '').trim();

    if (!normalized) {
        return '';
    }

    if (/^(https?:)?\/\//i.test(normalized) || normalized.startsWith('data:') || normalized.startsWith('blob:')) {
        return normalized;
    }

    const baseUrl = String(API.defaults?.baseURL || '').replace(/\/$/, '');

    if (normalized.startsWith('/')) {
        return baseUrl ? `${baseUrl}${normalized}` : normalized;
    }

    if (/^(uploads|api\/|media\/)/i.test(normalized)) {
        return baseUrl ? `${baseUrl}/${normalized.replace(/^\/+/, '')}` : normalized;
    }

    return normalized;
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
    const [authorAttribution, setAuthorAttribution] = useState([]);
    const [payoutRequests, setPayoutRequests] = useState([]);
    const [loadingContent, setLoadingContent] = useState(true);
    const [loadingSupport, setLoadingSupport] = useState(true);
    const [loadingResources, setLoadingResources] = useState(true);
    const [saving, setSaving] = useState(false);
    const [updatingSupportId, setUpdatingSupportId] = useState(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [updatedAt, setUpdatedAt] = useState('');
    const [updatedByEmail, setUpdatedByEmail] = useState('');
    const [uploadingImageTarget, setUploadingImageTarget] = useState('');
    const [savingRecordKey, setSavingRecordKey] = useState('');
    const [deletingRecordKey, setDeletingRecordKey] = useState('');
    const [updatingPayoutRequestId, setUpdatingPayoutRequestId] = useState('');
    const [activeSectionId, setActiveSectionId] = useState(WACI_SECTION_LINKS[0]?.id || 'overview');
    const [storyStatusFilter, setStoryStatusFilter] = useState('all');

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

    const storyCountsByStatus = useMemo(() => {
        return stories.reduce((totals, story) => {
            const status = String(story.status || (story.publishedAt ? 'published' : 'pending')).toLowerCase();
            totals[status] = (totals[status] || 0) + 1;
            if (story.featured) {
                totals.featured = (totals.featured || 0) + 1;
            }
            totals.all = (totals.all || 0) + 1;
            return totals;
        }, { all: 0, pending: 0, published: 0, rejected: 0, archived: 0, featured: 0 });
    }, [stories]);

    const visibleStories = useMemo(() => {
        const indexedStories = stories.map((story, index) => ({ ...story, _listIndex: index }));

        if (storyStatusFilter === 'all') {
            return indexedStories;
        }

        if (storyStatusFilter === 'featured') {
            return indexedStories.filter((story) => Boolean(story.featured));
        }

        return indexedStories.filter((story) => String(story.status || (story.publishedAt ? 'published' : 'pending')).toLowerCase() === storyStatusFilter);
    }, [stories, storyStatusFilter]);

    const loadContent = async () => {
        setLoadingContent(true);
        setError('');

        try {
            const res = await API.get('/api/admin/storefront/content', {
                params: WACI_CONTEXT_PARAMS,
            });
            setContent({
                ...defaultContent,
                ...(res.data?.content || {}),
            });
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
            const [overviewRes, programsRes, storiesRes, resourcesRes, subscribersRes, volunteersRes, partnerRes, donorsRes, attributionRes, payoutRes] = await Promise.all([
                API.get('/api/waci/admin/overview'),
                API.get('/api/waci/admin/programs'),
                API.get('/api/waci/admin/stories'),
                API.get('/api/waci/admin/resources'),
                API.get('/api/waci/admin/newsletter'),
                API.get('/api/waci/admin/volunteers'),
                API.get('/api/waci/admin/partners'),
                API.get('/api/waci/admin/donors'),
                API.get('/api/waci/admin/story-attribution'),
                API.get('/api/waci/admin/payout-requests'),
            ]);

            setOverview(overviewRes.data?.overview || null);
            setPrograms(Array.isArray(programsRes.data?.items) ? programsRes.data.items : []);
            setStories(Array.isArray(storiesRes.data?.items) ? storiesRes.data.items : []);
            setResources(Array.isArray(resourcesRes.data?.items) ? resourcesRes.data.items : []);
            setNewsletterSubscribers(Array.isArray(subscribersRes.data?.items) ? subscribersRes.data.items : (Array.isArray(subscribersRes.data) ? subscribersRes.data : []));
            setVolunteers(Array.isArray(volunteersRes.data?.items) ? volunteersRes.data.items : (Array.isArray(volunteersRes.data) ? volunteersRes.data : []));
            setPartnerRequests(Array.isArray(partnerRes.data?.items) ? partnerRes.data.items : (Array.isArray(partnerRes.data) ? partnerRes.data : []));
            setDonorRequests(Array.isArray(donorsRes.data?.items) ? donorsRes.data.items : (Array.isArray(donorsRes.data) ? donorsRes.data : []));
            setAuthorAttribution(Array.isArray(attributionRes.data?.items) ? attributionRes.data.items : []);
            setPayoutRequests(Array.isArray(payoutRes.data?.items) ? payoutRes.data.items : []);
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

    useEffect(() => {
        const updateActiveSection = () => {
            if (typeof window === 'undefined') {
                return;
            }

            let nextActiveId = WACI_SECTION_LINKS[0]?.id || 'overview';

            WACI_SECTION_LINKS.forEach((section) => {
                const element = document.getElementById(section.id);
                if (!element) {
                    return;
                }

                const { top } = element.getBoundingClientRect();
                if (top <= 180) {
                    nextActiveId = section.id;
                }
            });

            setActiveSectionId(nextActiveId);
        };

        updateActiveSection();
        window.addEventListener('scroll', updateActiveSection, { passive: true });
        window.addEventListener('hashchange', updateActiveSection);

        return () => {
            window.removeEventListener('scroll', updateActiveSection);
            window.removeEventListener('hashchange', updateActiveSection);
        };
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

    const updateWhoWeAreItem = (index, field, value) => {
        setContent((current) => ({
            ...current,
            whoWeAreItems: (Array.isArray(current.whoWeAreItems) ? current.whoWeAreItems : []).map((item, itemIndex) => (
                itemIndex === index ? { ...item, [field]: value } : item
            )),
        }));
    };

    const addWhoWeAreItem = () => {
        setContent((current) => ({
            ...current,
            whoWeAreItems: [
                ...(Array.isArray(current.whoWeAreItems) ? current.whoWeAreItems : []),
                {
                    id: createDraftId('who-we-are'),
                    title: '',
                    text: '',
                    icon: 'users',
                },
            ],
        }));
    };

    const removeWhoWeAreItem = (index) => {
        setContent((current) => ({
            ...current,
            whoWeAreItems: (Array.isArray(current.whoWeAreItems) ? current.whoWeAreItems : []).filter((_, itemIndex) => itemIndex !== index),
        }));
    };

    const updateProgramField = (index, field, value) => {
        setPrograms((current) => current.map((program, programIndex) => (
            programIndex === index ? { ...program, [field]: value } : program
        )));
    };

    const addProgram = () => {
        setPrograms((current) => ([
            ...current,
            {
                id: createDraftId('program'),
                title: '',
                text: '',
                status: 'active',
                region: '',
                image: '',
                ctaLabel: '',
                ctaLink: '',
                sortOrder: current.length,
            },
        ]));
    };

    const saveProgram = async (program, index) => {
        const recordKey = `program:${program.id || index}`;
        setSavingRecordKey(recordKey);
        setMessage('');
        setError('');

        try {
            const payload = {
                title: program.title,
                text: program.text,
                status: program.status,
                region: program.region,
                image: program.image,
                ctaLabel: program.ctaLabel,
                ctaLink: program.ctaLink,
                sortOrder: Number(program.sortOrder || 0),
            };

            const res = isDraftRecord(program.id)
                ? await API.post('/api/waci/admin/programs', payload)
                : await API.put(`/api/waci/admin/programs/${program.id}`, payload);

            const savedItem = res.data?.item || payload;
            setPrograms((current) => current.map((item, itemIndex) => (
                item.id === program.id || itemIndex === index ? savedItem : item
            )));
            setMessage('WACI program saved successfully.');
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.message || err?.response?.data || 'Unable to save WACI program.');
        } finally {
            setSavingRecordKey('');
        }
    };

    const deleteProgram = async (program, index) => {
        const recordKey = `program:${program.id || index}`;

        if (isDraftRecord(program.id)) {
            setPrograms((current) => current.filter((item) => item.id !== program.id));
            setMessage('Draft WACI program removed.');
            return;
        }

        if (!window.confirm(`Delete "${program.title || 'this program'}"?`)) {
            return;
        }

        setDeletingRecordKey(recordKey);
        setMessage('');
        setError('');

        try {
            await API.delete(`/api/waci/admin/programs/${program.id}`);
            setPrograms((current) => current.filter((item) => item.id !== program.id));
            setMessage('WACI program deleted successfully.');
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.message || err?.response?.data || 'Unable to delete WACI program.');
        } finally {
            setDeletingRecordKey('');
        }
    };

    const updateStoryField = (index, field, value) => {
        setStories((current) => current.map((story, storyIndex) => (
            storyIndex === index ? { ...story, [field]: value } : story
        )));
    };

    const addStory = () => {
        setStories((current) => ([
            ...current,
            {
                id: createDraftId('story'),
                title: '',
                summary: '',
                location: '',
                status: 'pending',
                publishedAt: '',
                reviewNotes: '',
                image: '',
                link: '',
                authorName: '',
                authorEmail: '',
                externalStoryId: '',
                source: 'admin',
                viewCount: 0,
                likeCount: 0,
                shareCount: 0,
                featured: false,
                sortOrder: current.length,
            },
        ]));
    };

    const saveStory = async (story, index) => {
        const recordKey = `story:${story.id || index}`;
        setSavingRecordKey(recordKey);
        setMessage('');
        setError('');

        try {
            const payload = {
                title: story.title,
                summary: story.summary,
                location: story.location,
                status: story.status || (story.publishedAt ? 'published' : 'pending'),
                publishedAt: story.publishedAt,
                reviewNotes: story.reviewNotes,
                image: story.image,
                link: story.link,
                authorName: story.authorName,
                authorEmail: story.authorEmail,
                externalStoryId: story.externalStoryId,
                source: story.source,
                viewCount: Number(story.viewCount || 0),
                likeCount: Number(story.likeCount || 0),
                shareCount: Number(story.shareCount || 0),
                featured: Boolean(story.featured),
                sortOrder: Number(story.sortOrder || 0),
            };

            const res = isDraftRecord(story.id)
                ? await API.post('/api/waci/admin/stories', payload)
                : await API.put(`/api/waci/admin/stories/${story.id}`, payload);

            const savedItem = res.data?.item || payload;
            setStories((current) => current.map((item, itemIndex) => (
                item.id === story.id || itemIndex === index ? savedItem : item
            )));
            setMessage('WACI story saved successfully.');
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.message || err?.response?.data || 'Unable to save WACI story.');
        } finally {
            setSavingRecordKey('');
        }
    };

    const deleteStory = async (story, index) => {
        const recordKey = `story:${story.id || index}`;

        if (isDraftRecord(story.id)) {
            setStories((current) => current.filter((item) => item.id !== story.id));
            setMessage('Draft WACI story removed.');
            return;
        }

        if (!window.confirm(`Delete "${story.title || 'this story'}"?`)) {
            return;
        }

        setDeletingRecordKey(recordKey);
        setMessage('');
        setError('');

        try {
            await API.delete(`/api/waci/admin/stories/${story.id}`);
            setStories((current) => current.filter((item) => item.id !== story.id));
            setMessage('WACI story deleted successfully.');
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.message || err?.response?.data || 'Unable to delete WACI story.');
        } finally {
            setDeletingRecordKey('');
        }
    };

    const updateResourceField = (index, field, value) => {
        setResources((current) => current.map((resource, resourceIndex) => (
            resourceIndex === index
                ? {
                    ...resource,
                    [field]: value,
                    ...(field === 'media_type' ? { mediaType: value } : {}),
                    ...(field === 'file_url' ? { fileUrl: value } : {}),
                    ...(field === 'alt_text' ? { altText: value } : {}),
                }
                : resource
        )));
    };

    const addResource = () => {
        setResources((current) => ([
            ...current,
            {
                id: createDraftId('resource'),
                title: '',
                media_type: 'image',
                file_url: '',
                alt_text: '',
                caption: '',
                sort_order: current.length,
            },
        ]));
    };

    const saveResource = async (resource, index) => {
        const recordKey = `resource:${resource.id || index}`;
        setSavingRecordKey(recordKey);
        setMessage('');
        setError('');

        try {
            const payload = {
                title: resource.title,
                media_type: resource.media_type || resource.mediaType || 'image',
                file_url: resource.file_url || resource.fileUrl || '',
                alt_text: resource.alt_text || resource.altText || '',
                caption: resource.caption,
                sortOrder: Number(resource.sort_order ?? resource.sortOrder ?? 0),
            };

            const res = isDraftRecord(resource.id)
                ? await API.post('/api/waci/admin/resources', payload)
                : await API.put(`/api/waci/admin/resources/${resource.id}`, payload);

            const savedItem = res.data?.item || payload;
            setResources((current) => current.map((item, itemIndex) => (
                item.id === resource.id || itemIndex === index ? savedItem : item
            )));
            setMessage('WACI resource saved successfully.');
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.message || err?.response?.data || 'Unable to save WACI resource.');
        } finally {
            setSavingRecordKey('');
        }
    };

    const deleteResource = async (resource, index) => {
        const recordKey = `resource:${resource.id || index}`;

        if (isDraftRecord(resource.id)) {
            setResources((current) => current.filter((item) => item.id !== resource.id));
            setMessage('Draft WACI resource removed.');
            return;
        }

        if (!window.confirm(`Delete "${resource.title || 'this resource'}"?`)) {
            return;
        }

        setDeletingRecordKey(recordKey);
        setMessage('');
        setError('');

        try {
            await API.delete(`/api/waci/admin/resources/${resource.id}`);
            setResources((current) => current.filter((item) => item.id !== resource.id));
            setMessage('WACI resource deleted successfully.');
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.message || err?.response?.data || 'Unable to delete WACI resource.');
        } finally {
            setDeletingRecordKey('');
        }
    };

    const updatePayoutRequestStatus = async (requestId, status) => {
        setUpdatingPayoutRequestId(requestId);
        setMessage('');
        setError('');

        try {
            const res = await API.patch(`/api/waci/admin/payout-requests/${requestId}`, { status });
            const updatedItem = res.data?.item;

            setPayoutRequests((current) => current.map((item) => (
                item.id === requestId ? { ...item, ...(updatedItem || {}), status: updatedItem?.status || status } : item
            )));
            setMessage('WACI payout request updated successfully.');
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.message || err?.response?.data || 'Unable to update WACI payout request.');
        } finally {
            setUpdatingPayoutRequestId('');
        }
    };

    const recalculateRewards = async () => {
        setLoadingResources(true);
        setMessage('');
        setError('');

        try {
            const res = await API.post('/api/waci/admin/rewards/recalculate');
            setAuthorAttribution(Array.isArray(res.data?.items) ? res.data.items : []);
            setMessage('WACI author rewards recalculated successfully.');
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.message || err?.response?.data || 'Unable to recalculate WACI author rewards.');
        } finally {
            setLoadingResources(false);
        }
    };

    const handleImageUpload = async (field, file, scope = 'content') => {
        if (!file) {
            return;
        }

        const target = `${scope}:${field}`;
        setUploadingImageTarget(target);
        setMessage('');
        setError('');

        try {
            const formData = new FormData();
            formData.append('image', file);

            const res = await API.post('/products/upload-image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const uploadedUrl = res.data?.imageUrl || res.data?.secureUrl || res.data?.url || '';

            if (!uploadedUrl) {
                throw new Error('Image upload did not return a usable image URL.');
            }

            updateField(field, uploadedUrl);
            setMessage('WACI image uploaded successfully. Save WACI to publish the change.');
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.message || err?.response?.data || err.message || 'Unable to upload WACI image.');
        } finally {
            setUploadingImageTarget('');
        }
    };

    const handleServiceImageUpload = async (index, file) => {
        if (!file) {
            return;
        }

        const target = `service:${index}`;
        setUploadingImageTarget(target);
        setMessage('');
        setError('');

        try {
            const formData = new FormData();
            formData.append('image', file);

            const res = await API.post('/products/upload-image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const uploadedUrl = res.data?.imageUrl || res.data?.secureUrl || res.data?.url || '';

            if (!uploadedUrl) {
                throw new Error('Image upload did not return a usable image URL.');
            }

            updateService(index, 'image', uploadedUrl);
            setMessage('WACI service image uploaded successfully. Save WACI to publish the change.');
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.message || err?.response?.data || err.message || 'Unable to upload WACI service image.');
        } finally {
            setUploadingImageTarget('');
        }
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

    const jumpToSection = (direction) => {
        const currentIndex = Math.max(WACI_SECTION_LINKS.findIndex((section) => section.id === activeSectionId), 0);
        const nextIndex = Math.min(Math.max(currentIndex + direction, 0), WACI_SECTION_LINKS.length - 1);
        const nextSection = WACI_SECTION_LINKS[nextIndex];
        const target = nextSection ? document.getElementById(nextSection.id) : null;

        if (!target) {
            return;
        }

        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setActiveSectionId(nextSection.id);
        if (typeof window !== 'undefined') {
            window.history.replaceState(null, '', `#${nextSection.id}`);
        }
    };

    const activeSectionIndex = Math.max(WACI_SECTION_LINKS.findIndex((section) => section.id === activeSectionId), 0);
    const activeSectionLabel = WACI_SECTION_LINKS[activeSectionIndex]?.label || 'Overview';

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
                    <a
                        key={section.id}
                        href={`#${section.id}`}
                        className={`tab-button preview-link${activeSectionId === section.id ? ' active' : ''}`}
                        onClick={() => setActiveSectionId(section.id)}
                    >
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
                    <div id="homepage-content" className="list-card">
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
                            <div className="image-upload-block">
                                <label>
                                    <span>Site logo URL</span>
                                    <input value={content.headerLogoUrl || ''} onChange={(event) => updateField('headerLogoUrl', event.target.value)} />
                                </label>
                                <div className="product-actions">
                                    <label className="secondary-button" style={{ cursor: 'pointer' }}>
                                        {uploadingImageTarget === 'content:headerLogoUrl' ? 'Uploading…' : 'Upload logo'}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            onChange={(event) => handleImageUpload('headerLogoUrl', event.target.files?.[0])}
                                        />
                                    </label>
                                    <span className="muted">Used in the top navbar and site icon.</span>
                                </div>
                                {resolveImageUrl(content.headerLogoUrl) ? (
                                    <div className="image-preview-wrapper">
                                        <img className="product-image-preview" src={resolveImageUrl(content.headerLogoUrl)} alt="WACI logo preview" />
                                    </div>
                                ) : null}
                            </div>
                            {[
                                { field: 'heroImageOne', label: 'Hero image 1 URL' },
                                { field: 'heroImageTwo', label: 'Hero image 2 URL' },
                                { field: 'heroImageThree', label: 'Hero image 3 URL' },
                                { field: 'heroImageFour', label: 'Hero image 4 URL' },
                            ].map(({ field, label }) => {
                                const previewUrl = resolveImageUrl(content[field]);

                                return (
                                    <div key={field} className="image-upload-block">
                                        <label>
                                            <span>{label}</span>
                                            <input value={content[field] || ''} onChange={(event) => updateField(field, event.target.value)} />
                                        </label>
                                        <div className="product-actions">
                                            <label className="secondary-button" style={{ cursor: 'pointer' }}>
                                                {uploadingImageTarget === `content:${field}` ? 'Uploading…' : 'Upload image'}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    style={{ display: 'none' }}
                                                    onChange={(event) => handleImageUpload(field, event.target.files?.[0])}
                                                />
                                            </label>
                                            <span className="muted">Use upload for the WACI homepage carousel.</span>
                                        </div>
                                        {previewUrl ? (
                                            <div className="image-preview-wrapper">
                                                <img className="product-image-preview" src={previewUrl} alt={label} />
                                            </div>
                                        ) : null}
                                    </div>
                                );
                            })}
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
                                <span>Stories & Media eyebrow</span>
                                <input value={content.storiesEyebrow || ''} onChange={(event) => updateField('storiesEyebrow', event.target.value)} />
                            </label>
                            <label>
                                <span>Stories & Media title</span>
                                <input value={content.storiesTitle || ''} onChange={(event) => updateField('storiesTitle', event.target.value)} />
                            </label>
                            <label>
                                <span>Stories & Media intro</span>
                                <textarea rows="3" value={content.storiesText || ''} onChange={(event) => updateField('storiesText', event.target.value)} />
                            </label>
                            {[
                                { field: 'featuredStoryImage', label: 'Featured story image 1 URL' },
                                { field: 'featuredStoryImageTwo', label: 'Featured story image 2 URL' },
                                { field: 'featuredStoryImageThree', label: 'Featured story image 3 URL' },
                                { field: 'featuredStoryImageFour', label: 'Featured story image 4 URL' },
                            ].map(({ field, label }, index) => {
                                const previewUrl = resolveImageUrl(content[field]);

                                return (
                                    <div key={field} className="image-upload-block">
                                        <label>
                                            <span>{label}</span>
                                            <input value={content[field] || ''} onChange={(event) => updateField(field, event.target.value)} />
                                        </label>
                                        <div className="product-actions">
                                            <label className="secondary-button" style={{ cursor: 'pointer' }}>
                                                {uploadingImageTarget === `content:${field}` ? 'Uploading…' : `Upload image ${index + 1}`}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    style={{ display: 'none' }}
                                                    onChange={(event) => handleImageUpload(field, event.target.files?.[0])}
                                                />
                                            </label>
                                            <span className="muted">Add up to 4 images here — they will auto-rotate on the public Stories & Media block.</span>
                                        </div>
                                        {previewUrl ? (
                                            <div className="image-preview-wrapper">
                                                <img className="product-image-preview" src={previewUrl} alt={`${label} preview`} />
                                            </div>
                                        ) : null}
                                    </div>
                                );
                            })}
                            <label>
                                <span>Featured story label</span>
                                <input value={content.featuredStoryEyebrow || ''} onChange={(event) => updateField('featuredStoryEyebrow', event.target.value)} />
                            </label>
                            <label>
                                <span>Featured story title</span>
                                <input value={content.featuredStoryTitle || ''} onChange={(event) => updateField('featuredStoryTitle', event.target.value)} />
                            </label>
                            <label>
                                <span>Featured story text</span>
                                <textarea rows="4" value={content.featuredStoryText || ''} onChange={(event) => updateField('featuredStoryText', event.target.value)} />
                            </label>
                            <label>
                                <span>Featured story image alt text</span>
                                <input value={content.featuredStoryAlt || ''} onChange={(event) => updateField('featuredStoryAlt', event.target.value)} />
                            </label>
                            <label>
                                <span>Featured story CTA label</span>
                                <input value={content.featuredStoryCtaLabel || ''} onChange={(event) => updateField('featuredStoryCtaLabel', event.target.value)} />
                            </label>
                            <label>
                                <span>Featured story CTA link</span>
                                <input value={content.featuredStoryCtaLink || ''} onChange={(event) => updateField('featuredStoryCtaLink', event.target.value)} />
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

                    <div id="who-we-are-editor" className="record-card">
                        <div className="record-header">
                            <div>
                                <h3>Who We Are section</h3>
                                <p className="muted">This controls the public “Who We Are” block, and you can add more cards here.</p>
                            </div>
                            <button type="button" className="secondary-button" onClick={addWhoWeAreItem}>
                                Add card
                            </button>
                        </div>

                        <div className="edit-form">
                            <label>
                                <span>Who We Are eyebrow</span>
                                <input value={content.whoWeAreEyebrow || ''} onChange={(event) => updateField('whoWeAreEyebrow', event.target.value)} />
                            </label>
                            <label>
                                <span>Who We Are title</span>
                                <input value={content.whoWeAreTitle || ''} onChange={(event) => updateField('whoWeAreTitle', event.target.value)} />
                            </label>
                            <label>
                                <span>Who We Are intro</span>
                                <textarea rows="4" value={content.whoWeAreText || ''} onChange={(event) => updateField('whoWeAreText', event.target.value)} />
                            </label>

                            {(Array.isArray(content.whoWeAreItems) ? content.whoWeAreItems : []).map((item, index) => (
                                <div key={item.id || index} className="product-card">
                                    <div className="record-header" style={{ marginBottom: '12px' }}>
                                        <strong>Card {index + 1}</strong>
                                        <button type="button" className="secondary-button" onClick={() => removeWhoWeAreItem(index)}>
                                            Remove
                                        </button>
                                    </div>
                                    <label>
                                        <span>Title</span>
                                        <input value={item.title || ''} onChange={(event) => updateWhoWeAreItem(index, 'title', event.target.value)} />
                                    </label>
                                    <label>
                                        <span>Description</span>
                                        <textarea rows="3" value={item.text || ''} onChange={(event) => updateWhoWeAreItem(index, 'text', event.target.value)} />
                                    </label>
                                    <label>
                                        <span>Icon</span>
                                        <select value={item.icon || 'users'} onChange={(event) => updateWhoWeAreItem(index, 'icon', event.target.value)}>
                                            {WHO_WE_ARE_ICON_OPTIONS.map((option) => (
                                                <option key={option.value} value={option.value}>{option.label}</option>
                                            ))}
                                        </select>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div id="focus-areas" className="record-card">
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
                                    <div className="image-upload-block">
                                        <label>
                                            <span>Card image URL</span>
                                            <input value={service.image || ''} onChange={(event) => updateService(index, 'image', event.target.value)} />
                                        </label>
                                        <div className="product-actions">
                                            <label className="secondary-button" style={{ cursor: 'pointer' }}>
                                                {uploadingImageTarget === `service:${index}` ? 'Uploading…' : 'Upload card image'}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    style={{ display: 'none' }}
                                                    onChange={(event) => handleServiceImageUpload(index, event.target.files?.[0])}
                                                />
                                            </label>
                                        </div>
                                        {resolveImageUrl(service.image) ? (
                                            <div className="image-preview-wrapper">
                                                <img className="product-image-preview" src={resolveImageUrl(service.image)} alt={service.title || `Service ${index + 1}`} />
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <section id="programs" className="record-card">
                    <div className="record-header">
                        <div>
                            <h3>Programs</h3>
                            <p className="muted">These records now feed the public WACI Programs section and the internal team view.</p>
                        </div>
                        <button type="button" className="secondary-button" onClick={addProgram}>
                            Add Program
                        </button>
                    </div>

                    {loadingResources ? (
                        <p className="muted">Loading programs…</p>
                    ) : programs.length ? (
                        <div className="record-list">
                            {programs.map((program, index) => {
                                const previewUrl = resolveImageUrl(program.image);
                                const recordKey = `program:${program.id || index}`;

                                return (
                                    <div key={program.id || index} className="product-card">
                                        <div className="edit-form">
                                            <label>
                                                <span>Title</span>
                                                <input value={program.title || ''} onChange={(event) => updateProgramField(index, 'title', event.target.value)} />
                                            </label>
                                            <label>
                                                <span>Region</span>
                                                <input value={program.region || ''} onChange={(event) => updateProgramField(index, 'region', event.target.value)} />
                                            </label>
                                            <label>
                                                <span>Status</span>
                                                <select value={program.status || 'active'} onChange={(event) => updateProgramField(index, 'status', event.target.value)}>
                                                    {PROGRAM_STATUS_OPTIONS.map((option) => (
                                                        <option key={option.value} value={option.value}>{option.label}</option>
                                                    ))}
                                                </select>
                                            </label>
                                            <label>
                                                <span>Sort order</span>
                                                <input type="number" value={program.sortOrder ?? index} onChange={(event) => updateProgramField(index, 'sortOrder', event.target.value)} />
                                            </label>
                                            <label>
                                                <span>Description</span>
                                                <textarea rows="4" value={program.text || ''} onChange={(event) => updateProgramField(index, 'text', event.target.value)} />
                                            </label>
                                            <label>
                                                <span>Image URL</span>
                                                <input value={program.image || ''} onChange={(event) => updateProgramField(index, 'image', event.target.value)} />
                                            </label>
                                            <label>
                                                <span>CTA label</span>
                                                <input value={program.ctaLabel || ''} onChange={(event) => updateProgramField(index, 'ctaLabel', event.target.value)} />
                                            </label>
                                            <label>
                                                <span>CTA link</span>
                                                <input value={program.ctaLink || ''} onChange={(event) => updateProgramField(index, 'ctaLink', event.target.value)} />
                                            </label>
                                        </div>

                                        {previewUrl ? (
                                            <div className="image-preview-wrapper" style={{ marginTop: '12px' }}>
                                                <img className="product-image-preview" src={previewUrl} alt={program.title || `Program ${index + 1}`} />
                                            </div>
                                        ) : null}

                                        <div className="product-actions" style={{ marginTop: '12px' }}>
                                            <button type="button" className="edit-button" onClick={() => saveProgram(program, index)} disabled={savingRecordKey === recordKey}>
                                                {savingRecordKey === recordKey ? 'Saving…' : 'Save program'}
                                            </button>
                                            <button type="button" className="secondary-button" onClick={() => deleteProgram(program, index)} disabled={deletingRecordKey === recordKey}>
                                                {deletingRecordKey === recordKey ? 'Removing…' : 'Delete program'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="muted">No WACI programs yet. Click “Add Program” to create one.</p>
                    )}
                </section>

                <section id="stories" className="record-card">
                    <div className="record-header">
                        <div>
                            <h3>Stories</h3>
                            <p className="muted">Submissions now land as pending, then move to published, rejected, or featured from this workflow.</p>
                        </div>
                        <div className="product-actions" style={{ gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            {[
                                { value: 'all', label: `All (${storyCountsByStatus.all || 0})` },
                                { value: 'pending', label: `Pending (${storyCountsByStatus.pending || 0})` },
                                { value: 'published', label: `Published (${storyCountsByStatus.published || 0})` },
                                { value: 'rejected', label: `Rejected (${storyCountsByStatus.rejected || 0})` },
                                { value: 'featured', label: `Featured (${storyCountsByStatus.featured || 0})` },
                            ].map((filter) => (
                                <button
                                    key={filter.value}
                                    type="button"
                                    className={storyStatusFilter === filter.value ? 'edit-button' : 'secondary-button'}
                                    onClick={() => setStoryStatusFilter(filter.value)}
                                >
                                    {filter.label}
                                </button>
                            ))}
                            <button type="button" className="secondary-button" onClick={addStory}>
                                Add Story
                            </button>
                        </div>
                    </div>

                    {loadingResources ? (
                        <p className="muted">Loading stories…</p>
                    ) : visibleStories.length ? (
                        <div className="record-list">
                            {visibleStories.map((story) => {
                                const index = story._listIndex ?? 0;
                                const previewUrl = resolveImageUrl(story.image);
                                const recordKey = `story:${story.id || index}`;

                                return (
                                    <div key={story.id || index} className="product-card">
                                        <div className="edit-form">
                                            <label>
                                                <span>Title</span>
                                                <input value={story.title || ''} onChange={(event) => updateStoryField(index, 'title', event.target.value)} />
                                            </label>
                                            <label>
                                                <span>Author name</span>
                                                <input value={story.authorName || ''} onChange={(event) => updateStoryField(index, 'authorName', event.target.value)} />
                                            </label>
                                            <label>
                                                <span>Author email</span>
                                                <input value={story.authorEmail || ''} onChange={(event) => updateStoryField(index, 'authorEmail', event.target.value)} />
                                            </label>
                                            <label>
                                                <span>Location</span>
                                                <input value={story.location || ''} onChange={(event) => updateStoryField(index, 'location', event.target.value)} />
                                            </label>
                                            <label>
                                                <span>Status</span>
                                                <select value={story.status || (story.publishedAt ? 'published' : 'pending')} onChange={(event) => updateStoryField(index, 'status', event.target.value)}>
                                                    {STORY_STATUS_OPTIONS.map((option) => (
                                                        <option key={option.value} value={option.value}>{option.label}</option>
                                                    ))}
                                                </select>
                                            </label>
                                            <label>
                                                <span>Published date</span>
                                                <input type="date" value={story.publishedAt || ''} onChange={(event) => updateStoryField(index, 'publishedAt', event.target.value)} />
                                            </label>
                                            <label>
                                                <span>Source</span>
                                                <input value={story.source || ''} onChange={(event) => updateStoryField(index, 'source', event.target.value)} />
                                            </label>
                                            <label>
                                                <span>External story ID</span>
                                                <input value={story.externalStoryId || ''} onChange={(event) => updateStoryField(index, 'externalStoryId', event.target.value)} />
                                            </label>
                                            <label>
                                                <span>Views</span>
                                                <input type="number" min="0" value={story.viewCount ?? 0} onChange={(event) => updateStoryField(index, 'viewCount', event.target.value)} />
                                            </label>
                                            <label>
                                                <span>Likes</span>
                                                <input type="number" min="0" value={story.likeCount ?? 0} onChange={(event) => updateStoryField(index, 'likeCount', event.target.value)} />
                                            </label>
                                            <label>
                                                <span>Shares</span>
                                                <input type="number" min="0" value={story.shareCount ?? 0} onChange={(event) => updateStoryField(index, 'shareCount', event.target.value)} />
                                            </label>
                                            <label>
                                                <span>Sort order</span>
                                                <input type="number" value={story.sortOrder ?? index} onChange={(event) => updateStoryField(index, 'sortOrder', event.target.value)} />
                                            </label>
                                            <label>
                                                <span>Summary</span>
                                                <textarea rows="4" value={story.summary || ''} onChange={(event) => updateStoryField(index, 'summary', event.target.value)} />
                                            </label>
                                            <label>
                                                <span>Review notes / rejection reason</span>
                                                <textarea rows="3" value={story.reviewNotes || ''} onChange={(event) => updateStoryField(index, 'reviewNotes', event.target.value)} />
                                            </label>
                                            <label>
                                                <span>Image URL</span>
                                                <input value={story.image || ''} onChange={(event) => updateStoryField(index, 'image', event.target.value)} />
                                            </label>
                                            <label>
                                                <span>Story link</span>
                                                <input value={story.link || ''} onChange={(event) => updateStoryField(index, 'link', event.target.value)} />
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <input type="checkbox" checked={Boolean(story.featured ?? true)} onChange={(event) => updateStoryField(index, 'featured', event.target.checked)} />
                                                <span>Featured story</span>
                                            </label>
                                        </div>

                                        {previewUrl ? (
                                            <div className="image-preview-wrapper" style={{ marginTop: '12px' }}>
                                                <img className="product-image-preview" src={previewUrl} alt={story.title || `Story ${index + 1}`} />
                                            </div>
                                        ) : null}

                                        <div className="product-actions" style={{ marginTop: '12px' }}>
                                            <button type="button" className="edit-button" onClick={() => saveStory(story, index)} disabled={savingRecordKey === recordKey}>
                                                {savingRecordKey === recordKey ? 'Saving…' : 'Save story'}
                                            </button>
                                            <button type="button" className="secondary-button" onClick={() => deleteStory(story, index)} disabled={deletingRecordKey === recordKey}>
                                                {deletingRecordKey === recordKey ? 'Removing…' : 'Delete story'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="muted">No WACI stories in this view yet. Switch filters or click “Add Story” to create one.</p>
                    )}
                </section>

                <section id="story-attribution" className="record-card">
                    <div className="record-header">
                        <div>
                            <h3>Story Attribution</h3>
                            <p className="muted">Author rewards are stored hourly and also refreshed instantly when moderation or engagement changes happen.</p>
                        </div>
                        <button type="button" className="secondary-button" onClick={recalculateRewards}>
                            Recalculate now
                        </button>
                    </div>

                    {loadingResources ? (
                        <p className="muted">Loading attribution data…</p>
                    ) : authorAttribution.length ? (
                        <div className="table-card">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Author</th>
                                        <th>Stories</th>
                                        <th>Views</th>
                                        <th>Likes</th>
                                        <th>Shares</th>
                                        <th>Points</th>
                                        <th>Tier</th>
                                        <th>Available</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {authorAttribution.map((author) => (
                                        <tr key={author.authorEmail}>
                                            <td>
                                                <strong>{author.authorName || 'Unnamed author'}</strong>
                                                <div className="muted">{author.authorEmail}</div>
                                            </td>
                                            <td>{author.totalStories}</td>
                                            <td>{Number(author.totalViews || 0).toLocaleString()}</td>
                                            <td>{Number(author.totalLikes || 0).toLocaleString()}</td>
                                            <td>{Number(author.totalShares || 0).toLocaleString()}</td>
                                            <td>
                                                {Number(author.totalPoints || 0).toLocaleString()}
                                                <div className="muted">weekly {Number(author.weeklyPoints || author.weeklyPointsEstimate || 0).toLocaleString()} · monthly {Number(author.monthlyPoints || author.monthlyPointsEstimate || 0).toLocaleString()}</div>
                                            </td>
                                            <td>{author.tier || 'Bronze'}</td>
                                            <td>{formatCurrency(author.availableEarningsUsd || 0)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="muted">No author attribution records yet. Story author emails and engagement stats will appear here once stories are submitted or synced.</p>
                    )}
                </section>

                <section id="payout-requests" className="record-card">
                    <div className="record-header">
                        <div>
                            <h3>Payout Requests</h3>
                            <p className="muted">Track payout requests from authors and update the status when a payout is completed or fails.</p>
                        </div>
                    </div>

                    {loadingResources ? (
                        <p className="muted">Loading payout requests…</p>
                    ) : payoutRequests.length ? (
                        <div className="table-card">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Author</th>
                                        <th>Method</th>
                                        <th>Requested</th>
                                        <th>Fee</th>
                                        <th>Net</th>
                                        <th>Status</th>
                                        <th>Created</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payoutRequests.map((request) => (
                                        <tr key={request.id}>
                                            <td>
                                                <strong>{request.authorName || 'Unnamed author'}</strong>
                                                <div className="muted">{request.authorEmail}</div>
                                            </td>
                                            <td>{request.payoutMethodLabel || request.payoutMethod}</td>
                                            <td>{formatCurrency(request.requestedAmountUsd || 0)}</td>
                                            <td>{formatCurrency(request.feeAmountUsd || 0)}</td>
                                            <td>{formatCurrency(request.netAmountUsd || 0)}</td>
                                            <td>
                                                <select
                                                    value={request.status || 'created'}
                                                    onChange={(event) => updatePayoutRequestStatus(request.id, event.target.value)}
                                                    disabled={updatingPayoutRequestId === request.id}
                                                >
                                                    {['created', 'processing', 'completed', 'failed', 'cancelled'].map((status) => (
                                                        <option key={status} value={status}>{status}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td>{formatDateTime(request.createdAt || request.created_at)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="muted">No payout requests yet.</p>
                    )}
                </section>

                <section id="resources" className="record-card">
                    <div className="record-header">
                        <div>
                            <h3>Resources</h3>
                            <p className="muted">These resources now feed the public WACI learn/resources area and the admin team view.</p>
                        </div>
                        <button type="button" className="secondary-button" onClick={addResource}>
                            Add Resource
                        </button>
                    </div>

                    {loadingResources ? (
                        <p className="muted">Loading resources…</p>
                    ) : resources.length ? (
                        <div className="record-list">
                            {resources.map((resource, index) => {
                                const previewUrl = resolveImageUrl(resource.file_url || resource.fileUrl);
                                const recordKey = `resource:${resource.id || index}`;

                                return (
                                    <div key={resource.id || index} className="product-card">
                                        <div className="edit-form">
                                            <label>
                                                <span>Title</span>
                                                <input value={resource.title || ''} onChange={(event) => updateResourceField(index, 'title', event.target.value)} />
                                            </label>
                                            <label>
                                                <span>Media type</span>
                                                <select value={resource.media_type || resource.mediaType || 'image'} onChange={(event) => updateResourceField(index, 'media_type', event.target.value)}>
                                                    {RESOURCE_TYPE_OPTIONS.map((option) => (
                                                        <option key={option.value} value={option.value}>{option.label}</option>
                                                    ))}
                                                </select>
                                            </label>
                                            <label>
                                                <span>Sort order</span>
                                                <input type="number" value={resource.sort_order ?? resource.sortOrder ?? index} onChange={(event) => updateResourceField(index, 'sort_order', event.target.value)} />
                                            </label>
                                            <label>
                                                <span>File or media URL</span>
                                                <input value={resource.file_url || resource.fileUrl || ''} onChange={(event) => updateResourceField(index, 'file_url', event.target.value)} />
                                            </label>
                                            <label>
                                                <span>Alt text</span>
                                                <input value={resource.alt_text || resource.altText || ''} onChange={(event) => updateResourceField(index, 'alt_text', event.target.value)} />
                                            </label>
                                            <label>
                                                <span>Caption / summary</span>
                                                <textarea rows="4" value={resource.caption || ''} onChange={(event) => updateResourceField(index, 'caption', event.target.value)} />
                                            </label>
                                        </div>

                                        {previewUrl ? (
                                            <div className="image-preview-wrapper" style={{ marginTop: '12px' }}>
                                                <img className="product-image-preview" src={previewUrl} alt={resource.title || `Resource ${index + 1}`} />
                                            </div>
                                        ) : null}

                                        <div className="product-actions" style={{ marginTop: '12px' }}>
                                            <button type="button" className="edit-button" onClick={() => saveResource(resource, index)} disabled={savingRecordKey === recordKey}>
                                                {savingRecordKey === recordKey ? 'Saving…' : 'Save resource'}
                                            </button>
                                            <button type="button" className="secondary-button" onClick={() => deleteResource(resource, index)} disabled={deletingRecordKey === recordKey}>
                                                {deletingRecordKey === recordKey ? 'Removing…' : 'Delete resource'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="muted">No WACI resources yet. Click “Add Resource” to create one.</p>
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

                <section id="general-inquiries" className="record-card">
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

            <div className="quick-jump-panel" aria-label="Quick section navigation">
                <div className="quick-jump-status">{activeSectionLabel}</div>
                <button
                    type="button"
                    className="quick-jump-button"
                    onClick={() => jumpToSection(-1)}
                    disabled={activeSectionIndex <= 0}
                    aria-label="Jump to previous section"
                    title="Previous section"
                >
                    ↑
                </button>
                <button
                    type="button"
                    className="quick-jump-button"
                    onClick={() => jumpToSection(1)}
                    disabled={activeSectionIndex >= WACI_SECTION_LINKS.length - 1}
                    aria-label="Jump to next section"
                    title="Next section"
                >
                    ↓
                </button>
            </div>
        </div>
    );
}

export default WACI;
