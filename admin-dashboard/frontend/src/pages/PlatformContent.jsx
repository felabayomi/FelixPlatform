import { useEffect, useState } from 'react';
import API from '../services/api';

const emptyContent = {
    heroTitle: '',
    heroText: '',
    sectionTitle: '',
    sectionText: '',
    cards: [],
};

function PlatformContent() {
    const [content, setContent] = useState(emptyContent);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [updatedAt, setUpdatedAt] = useState('');
    const [updatedByEmail, setUpdatedByEmail] = useState('');

    const loadContent = async () => {
        setLoading(true);
        setError('');

        try {
            const res = await API.get('/api/admin/platform-content/felix-homepage');
            setContent(res.data?.content || emptyContent);
            setUpdatedAt(res.data?.updatedAt || '');
            setUpdatedByEmail(res.data?.updatedByEmail || '');
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.message || err?.response?.data || 'Unable to load Felix Platforms homepage settings.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadContent();
    }, []);

    const updateField = (field, value) => {
        setContent((current) => ({
            ...current,
            [field]: value,
        }));
    };

    const updateCard = (index, field, value) => {
        setContent((current) => ({
            ...current,
            cards: current.cards.map((card, cardIndex) => (
                cardIndex === index
                    ? { ...card, [field]: value }
                    : card
            )),
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        setMessage('');

        try {
            const res = await API.put('/api/admin/platform-content/felix-homepage', content);
            setContent(res.data?.content || content);
            setUpdatedAt(res.data?.updatedAt || '');
            setUpdatedByEmail(res.data?.updatedByEmail || '');
            setMessage(res.data?.message || 'Homepage settings saved successfully.');
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.message || err?.response?.data || 'Unable to save homepage settings.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="page-section">
            <div className="section-actions">
                <div>
                    <h1>Platform Content</h1>
                    <p className="muted">Update the live `felixplatforms.com` cards, titles, images, and text from the admin dashboard.</p>
                </div>
                <div className="toolbar-actions">
                    <button type="button" className="secondary-button refresh-button" onClick={loadContent} disabled={loading || saving}>
                        {loading ? 'Refreshing…' : 'Refresh'}
                    </button>
                    <button type="button" className="edit-button refresh-button" onClick={handleSave} disabled={loading || saving}>
                        {saving ? 'Saving…' : 'Save Homepage'}
                    </button>
                </div>
            </div>

            {message ? <p className="message-success">{message}</p> : null}
            {error ? <p className="message-error">{error}</p> : null}

            <div className="content-editor-grid">
                <div className="list-card">
                    <h3>Hero Section</h3>
                    <div className="edit-form">
                        <label>
                            <span>Hero title</span>
                            <input value={content.heroTitle || ''} onChange={(event) => updateField('heroTitle', event.target.value)} />
                        </label>
                        <label>
                            <span>Hero text</span>
                            <textarea rows="4" value={content.heroText || ''} onChange={(event) => updateField('heroText', event.target.value)} />
                        </label>
                        <label>
                            <span>Section title</span>
                            <input value={content.sectionTitle || ''} onChange={(event) => updateField('sectionTitle', event.target.value)} />
                        </label>
                        <label>
                            <span>Section text</span>
                            <textarea rows="4" value={content.sectionText || ''} onChange={(event) => updateField('sectionText', event.target.value)} />
                        </label>
                    </div>
                    {(updatedAt || updatedByEmail) ? (
                        <p className="muted" style={{ marginTop: '12px' }}>
                            Last saved {updatedAt ? new Date(updatedAt).toLocaleString() : 'recently'}
                            {updatedByEmail ? ` by ${updatedByEmail}` : ''}
                        </p>
                    ) : null}
                </div>

                <div className="record-list">
                    {content.cards.map((card, index) => (
                        <div key={card.id || index} className="record-card content-card-editor">
                            <div className="record-header">
                                <div>
                                    <h3>{card.title || `Card ${index + 1}`}</h3>
                                    <p className="muted">Edit the image, title, copy, button label, and destination.</p>
                                </div>
                            </div>

                            <div className="edit-form">
                                <label>
                                    <span>Image URL</span>
                                    <input value={card.imageUrl || ''} onChange={(event) => updateCard(index, 'imageUrl', event.target.value)} />
                                </label>
                                {card.imageUrl ? <img className="product-image-preview" src={card.imageUrl} alt={card.title || `Preview ${index + 1}`} /> : null}

                                <label>
                                    <span>Card title</span>
                                    <input value={card.title || ''} onChange={(event) => updateCard(index, 'title', event.target.value)} />
                                </label>
                                <label>
                                    <span>Description</span>
                                    <textarea rows="4" value={card.description || ''} onChange={(event) => updateCard(index, 'description', event.target.value)} />
                                </label>
                                <label>
                                    <span>Button label</span>
                                    <input value={card.buttonLabel || ''} onChange={(event) => updateCard(index, 'buttonLabel', event.target.value)} />
                                </label>
                                <label>
                                    <span>Button link</span>
                                    <input value={card.buttonLink || ''} onChange={(event) => updateCard(index, 'buttonLink', event.target.value)} />
                                </label>
                                <label>
                                    <span>Small note</span>
                                    <textarea rows="3" value={card.note || ''} onChange={(event) => updateCard(index, 'note', event.target.value)} />
                                </label>
                                <div className="inline-checkboxes">
                                    <label className="category-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(card.comingSoon)}
                                            onChange={(event) => updateCard(index, 'comingSoon', event.target.checked)}
                                        />
                                        <span>Show as coming soon</span>
                                    </label>
                                    <label className="category-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(card.appleBadge)}
                                            onChange={(event) => updateCard(index, 'appleBadge', event.target.checked)}
                                        />
                                        <span>Show Apple badge</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default PlatformContent;
