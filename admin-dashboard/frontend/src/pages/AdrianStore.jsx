import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import API from '../services/api';

const defaultContent = {
    heroEyebrow: 'Adrian Store',
    heroTitle: 'Elegant kaftans for effortless statement style.',
    heroText: 'Discover bold, flowing silhouettes curated by Adrian — perfect for dinners, travel, special occasions, and everyday confidence.',
    heroPrimaryLabel: 'Shop the collection',
    heroPrimaryLink: '/shop',
    heroSecondaryLabel: 'Explore services',
    heroSecondaryLink: '/services',
    heroImageOne: '/products/chic-green-kaftan.svg',
    heroImageTwo: '/products/wild-elegance-leopard-kaftan.svg',
    featuredEyebrow: 'Featured pieces',
    featuredTitle: 'Fresh arrivals from Adrian Store',
    featuredText: 'Curated looks designed for comfort, movement, and standout style.',
    servicesEyebrow: 'Services',
    servicesTitle: 'Boutique styling support',
    servicesText: 'Adrian’s Styled Collection is more than a storefront — it is a curated fashion experience centered on effortless elegance.',
    services: [
        { id: 'style-curation', title: 'Style Curation', text: 'Get help selecting standout pieces and coordinated looks that match your event, mood, or travel plans.' },
        { id: 'wardrobe-refresh', title: 'Wardrobe Refresh', text: 'Build a fresh capsule of bold, confidence-first outfits with Adrian’s boutique eye and flowing silhouettes.' },
        { id: 'special-occasion-styling', title: 'Special Occasion Styling', text: 'Choose elegant kaftans and elevated statement looks for celebrations, dinners, gatherings, and getaways.' },
    ],
    successEyebrow: 'Thank you',
    successTitle: 'Your Adrian order is on its way',
    successText: 'Your checkout has been submitted successfully. We will send updates to the email address you used at checkout.',
    footerTitle: "Adrian's Styled Collection",
    footerText: 'Curated statement pieces, flowing silhouettes, and confidence-first style.',
    footerSubtext: "Powered by Felix Platform's shared storefront, checkout, and support tools.",
    supportEmail: 'order@shopwithadrian.com',
};

const emptyProductForm = {
    name: '',
    slug: '',
    short_description: '',
    long_description: '',
    price: '40',
    compare_at_price: '',
    image_url: '',
    inventory_count: '10',
    featured: true,
    active: true,
    categoryIds: [],
};

const ADRIAN_PARAMS = {
    app_name: 'Adrian Store',
    storefront_key: 'adrian-store',
};

const ORDER_STATUS_OPTIONS = [
    { label: 'Pending', status: 'pending' },
    { label: 'Processing', status: 'processing' },
    { label: 'Shipped', status: 'shipped' },
    { label: 'Completed', status: 'completed' },
    { label: 'Cancelled', status: 'cancelled' },
];

const SUPPORT_STATUS_OPTIONS = [
    { label: 'New', status: 'new' },
    { label: 'In Progress', status: 'in_progress' },
    { label: 'Resolved', status: 'resolved' },
    { label: 'Closed', status: 'closed' },
];

const formatMoney = (value) => {
    if (value === null || value === undefined || value === '') {
        return '—';
    }

    const normalized = Number(value);
    return Number.isNaN(normalized) ? '—' : `$${normalized.toFixed(2)}`;
};

const formatStatusLabel = (value) => String(value || 'pending')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

function AdrianStore() {
    const location = useLocation();
    const requestedTab = ['content', 'products', 'orders', 'support'].includes(location.state?.adrianTab)
        ? location.state.adrianTab
        : 'content';
    const [activeTab, setActiveTab] = useState(requestedTab);
    const [content, setContent] = useState(defaultContent);
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [supportRequests, setSupportRequests] = useState([]);
    const [productForm, setProductForm] = useState(emptyProductForm);
    const [editingProductId, setEditingProductId] = useState(null);
    const [loadingContent, setLoadingContent] = useState(true);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [loadingSupport, setLoadingSupport] = useState(true);
    const [savingContent, setSavingContent] = useState(false);
    const [savingProduct, setSavingProduct] = useState(false);
    const [updatingOrderId, setUpdatingOrderId] = useState(null);
    const [updatingSupportId, setUpdatingSupportId] = useState(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [updatedAt, setUpdatedAt] = useState('');
    const [updatedByEmail, setUpdatedByEmail] = useState('');

    const featuredCount = useMemo(
        () => products.filter((product) => Boolean(product.featured)).length,
        [products],
    );

    const openSupportCount = useMemo(
        () => supportRequests.filter((request) => !['resolved', 'closed'].includes(String(request.status || 'new').toLowerCase())).length,
        [supportRequests],
    );

    const paidOrdersCount = useMemo(
        () => orders.filter((order) => String(order.payment_status || '').toLowerCase() === 'paid').length,
        [orders],
    );

    const loadContent = async () => {
        setLoadingContent(true);
        setError('');

        try {
            const res = await API.get('/api/admin/adrian-store/content');
            setContent(res.data?.content || defaultContent);
            setUpdatedAt(res.data?.updatedAt || '');
            setUpdatedByEmail(res.data?.updatedByEmail || '');
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.message || err?.response?.data || 'Unable to load Adrian Store content.');
        } finally {
            setLoadingContent(false);
        }
    };

    const loadProducts = async () => {
        setLoadingProducts(true);
        setError('');

        try {
            const res = await API.get('/products', {
                params: ADRIAN_PARAMS,
            });
            setProducts(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.message || err?.response?.data || 'Unable to load Adrian Store products.');
        } finally {
            setLoadingProducts(false);
        }
    };

    const loadOrders = async () => {
        setLoadingOrders(true);
        setError('');

        try {
            const res = await API.get('/orders', {
                params: ADRIAN_PARAMS,
            });
            setOrders(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.message || err?.response?.data || 'Unable to load Adrian Store orders.');
        } finally {
            setLoadingOrders(false);
        }
    };

    const loadSupportRequests = async () => {
        setLoadingSupport(true);
        setError('');

        try {
            const res = await API.get('/support-requests', {
                params: ADRIAN_PARAMS,
            });
            setSupportRequests(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.message || err?.response?.data || 'Unable to load Adrian support requests.');
        } finally {
            setLoadingSupport(false);
        }
    };

    const loadCategories = async () => {
        try {
            const res = await API.get('/categories');
            setCategories(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        loadContent();
        loadProducts();
        loadOrders();
        loadSupportRequests();
        loadCategories();
    }, []);

    useEffect(() => {
        if (['content', 'products', 'orders', 'support'].includes(location.state?.adrianTab)) {
            setActiveTab(location.state.adrianTab);
        }
    }, [location.state?.adrianTab]);

    const updateContentField = (field, value) => {
        setContent((current) => ({
            ...current,
            [field]: value,
        }));
    };

    const updateService = (index, field, value) => {
        setContent((current) => ({
            ...current,
            services: (current.services || []).map((service, serviceIndex) => (
                serviceIndex === index
                    ? { ...service, [field]: value }
                    : service
            )),
        }));
    };

    const handleSaveContent = async () => {
        setSavingContent(true);
        setMessage('');
        setError('');

        try {
            const res = await API.put('/api/admin/adrian-store/content', content);
            setContent(res.data?.content || content);
            setUpdatedAt(res.data?.updatedAt || '');
            setUpdatedByEmail(res.data?.updatedByEmail || '');
            setMessage(res.data?.message || 'Adrian Store content saved successfully.');
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.message || err?.response?.data || 'Unable to save Adrian Store content.');
        } finally {
            setSavingContent(false);
        }
    };

    const updateProductField = (field, value) => {
        setProductForm((current) => ({
            ...current,
            [field]: value,
        }));
    };

    const toggleCategory = (categoryId) => {
        setProductForm((current) => {
            const alreadySelected = current.categoryIds.includes(categoryId);

            return {
                ...current,
                categoryIds: alreadySelected
                    ? current.categoryIds.filter((id) => id !== categoryId)
                    : [...current.categoryIds, categoryId],
            };
        });
    };

    const resetProductForm = () => {
        setEditingProductId(null);
        setProductForm(emptyProductForm);
    };

    const startEditProduct = (product) => {
        setActiveTab('products');
        setEditingProductId(product.id);
        setProductForm({
            name: product.name || product.title || '',
            slug: product.slug || '',
            short_description: product.short_description || product.description || '',
            long_description: product.long_description || product.description || '',
            price: String(product.price ?? ''),
            compare_at_price: product.compare_at_price ? String(product.compare_at_price) : '',
            image_url: product.image_url || product.image || '',
            inventory_count: String(product.inventory_count ?? product.stock ?? 0),
            featured: Boolean(product.featured),
            active: product.active !== false,
            categoryIds: Array.isArray(product.category_ids)
                ? product.category_ids
                : (product.category_id ? [product.category_id] : []),
        });
    };

    const handleSaveProduct = async () => {
        if (!productForm.name.trim()) {
            setError('Product name is required.');
            return;
        }

        if (!productForm.categoryIds.length) {
            setError('Select at least one category for this Adrian product.');
            return;
        }

        setSavingProduct(true);
        setMessage('');
        setError('');

        const payload = {
            name: productForm.name,
            description: productForm.short_description,
            short_description: productForm.short_description,
            long_description: productForm.long_description,
            slug: productForm.slug,
            price: productForm.price,
            compare_at_price: productForm.compare_at_price || null,
            category_id: productForm.categoryIds[0],
            category_ids: productForm.categoryIds,
            type: 'physical',
            price_type: 'fixed',
            action_label: 'Buy Now',
            image_url: productForm.image_url,
            images: productForm.image_url ? [productForm.image_url] : [],
            featured: productForm.featured,
            active: productForm.active,
            inventory_count: productForm.inventory_count,
            stock: productForm.inventory_count,
            app_name: 'Adrian Store',
            storefront_key: 'adrian-store',
        };

        try {
            if (editingProductId) {
                await API.put(`/products/${editingProductId}`, payload);
                setMessage('Adrian product updated successfully.');
            } else {
                await API.post('/products', payload);
                setMessage('Adrian product created successfully.');
            }

            resetProductForm();
            loadProducts();
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.message || err?.response?.data || 'Unable to save Adrian product.');
        } finally {
            setSavingProduct(false);
        }
    };

    const handleDeleteProduct = async (productId) => {
        const confirmed = window.confirm('Delete this Adrian Store product?');
        if (!confirmed) {
            return;
        }

        setMessage('');
        setError('');

        try {
            await API.delete(`/products/${productId}`);
            setMessage('Adrian product deleted successfully.');
            if (editingProductId === productId) {
                resetProductForm();
            }
            loadProducts();
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.message || err?.response?.data || 'Unable to delete Adrian product.');
        }
    };

    const handleOrderStatusUpdate = async (orderId, payload, successText) => {
        setUpdatingOrderId(orderId);
        setMessage('');
        setError('');

        try {
            const res = await API.patch(`/orders/${orderId}/status`, payload);
            setOrders((current) => current.map((order) => (order.id === orderId ? { ...order, ...res.data } : order)));
            setMessage(successText || 'Adrian order updated successfully.');
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.message || err?.response?.data || 'Unable to update Adrian order.');
        } finally {
            setUpdatingOrderId(null);
        }
    };

    const handleSupportStatusUpdate = async (request, status) => {
        let adminNotes = request.admin_notes || '';

        if (typeof window !== 'undefined') {
            const notesInput = window.prompt(
                `Update admin notes for ${request.contact_name || 'this request'} (optional).`,
                request.admin_notes || '',
            );

            if (notesInput === null) {
                return;
            }

            adminNotes = notesInput;
        }

        setUpdatingSupportId(request.id);
        setMessage('');
        setError('');

        try {
            const res = await API.patch(`/support-requests/${request.id}`, {
                status,
                admin_notes: adminNotes,
            });
            setSupportRequests((current) => current.map((item) => (item.id === request.id ? { ...item, ...res.data } : item)));
            setMessage(`Support request updated to ${formatStatusLabel(status)}.`);
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.message || err?.response?.data || 'Unable to update Adrian support request.');
        } finally {
            setUpdatingSupportId(null);
        }
    };

    return (
        <div className="page-section">
            <div className="section-actions">
                <div>
                    <h1>Adrian Store</h1>
                    <p className="muted">Manage Adrian&apos;s Styled Collection content, products, orders, and support from the shared Felix admin dashboard.</p>
                </div>
                <div className="toolbar-actions">
                    <a className="secondary-button preview-link" href="https://shopwithadrian.com" target="_blank" rel="noreferrer">Live site</a>
                    <button
                        type="button"
                        className="edit-button refresh-button"
                        onClick={() => {
                            loadContent();
                            loadProducts();
                            loadOrders();
                            loadSupportRequests();
                        }}
                        disabled={loadingContent || loadingProducts || loadingOrders || loadingSupport || savingContent || savingProduct || updatingOrderId || updatingSupportId}
                    >
                        Refresh Adrian Store
                    </button>
                </div>
            </div>

            {message ? <p className="message-success">{message}</p> : null}
            {error ? <p className="message-error">{error}</p> : null}

            <div className="stats-grid" style={{ marginTop: '16px' }}>
                <div className="stat-card">
                    <span className="muted">Products</span>
                    <strong>{loadingProducts ? '…' : products.length}</strong>
                </div>
                <div className="stat-card">
                    <span className="muted">Featured items</span>
                    <strong>{loadingProducts ? '…' : featuredCount}</strong>
                </div>
                <div className="stat-card">
                    <span className="muted">Orders</span>
                    <strong>{loadingOrders ? '…' : orders.length}</strong>
                    <span className="muted">{loadingOrders ? 'Loading…' : `${paidOrdersCount} marked paid`}</span>
                </div>
                <div className="stat-card">
                    <span className="muted">Support inbox</span>
                    <strong>{loadingSupport ? '…' : supportRequests.length}</strong>
                    <span className="muted">{loadingSupport ? 'Loading…' : `${openSupportCount} still open`}</span>
                </div>
                <div className="stat-card">
                    <span className="muted">Content sync</span>
                    <strong>{updatedAt ? 'Ready' : 'Default'}</strong>
                    <span className="muted">{updatedByEmail ? `Last updated by ${updatedByEmail}` : 'Using Adrian defaults'}</span>
                </div>
            </div>

            <div className="tab-row">
                <button type="button" className={`tab-button${activeTab === 'content' ? ' active' : ''}`} onClick={() => setActiveTab('content')}>
                    Storefront Content
                </button>
                <button type="button" className={`tab-button${activeTab === 'products' ? ' active' : ''}`} onClick={() => setActiveTab('products')}>
                    Products
                </button>
                <button type="button" className={`tab-button${activeTab === 'orders' ? ' active' : ''}`} onClick={() => setActiveTab('orders')}>
                    Orders
                </button>
                <button type="button" className={`tab-button${activeTab === 'support' ? ' active' : ''}`} onClick={() => setActiveTab('support')}>
                    Support
                </button>
            </div>

            {activeTab === 'content' ? (
                <div className="content-editor-grid">
                    <div className="list-card">
                        <h3>Homepage hero</h3>
                        <div className="edit-form">
                            <label>
                                <span>Eyebrow</span>
                                <input value={content.heroEyebrow || ''} onChange={(event) => updateContentField('heroEyebrow', event.target.value)} />
                            </label>
                            <label>
                                <span>Hero title</span>
                                <input value={content.heroTitle || ''} onChange={(event) => updateContentField('heroTitle', event.target.value)} />
                            </label>
                            <label>
                                <span>Hero text</span>
                                <textarea rows="4" value={content.heroText || ''} onChange={(event) => updateContentField('heroText', event.target.value)} />
                            </label>
                            <div className="two-column-grid">
                                <label>
                                    <span>Primary button label</span>
                                    <input value={content.heroPrimaryLabel || ''} onChange={(event) => updateContentField('heroPrimaryLabel', event.target.value)} />
                                </label>
                                <label>
                                    <span>Primary button link</span>
                                    <input value={content.heroPrimaryLink || ''} onChange={(event) => updateContentField('heroPrimaryLink', event.target.value)} />
                                </label>
                                <label>
                                    <span>Secondary button label</span>
                                    <input value={content.heroSecondaryLabel || ''} onChange={(event) => updateContentField('heroSecondaryLabel', event.target.value)} />
                                </label>
                                <label>
                                    <span>Secondary button link</span>
                                    <input value={content.heroSecondaryLink || ''} onChange={(event) => updateContentField('heroSecondaryLink', event.target.value)} />
                                </label>
                            </div>
                            <div className="two-column-grid">
                                <label>
                                    <span>Hero image 1</span>
                                    <input value={content.heroImageOne || ''} onChange={(event) => updateContentField('heroImageOne', event.target.value)} />
                                </label>
                                <label>
                                    <span>Hero image 2</span>
                                    <input value={content.heroImageTwo || ''} onChange={(event) => updateContentField('heroImageTwo', event.target.value)} />
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="list-card">
                        <h3>Featured section</h3>
                        <div className="edit-form">
                            <label>
                                <span>Eyebrow</span>
                                <input value={content.featuredEyebrow || ''} onChange={(event) => updateContentField('featuredEyebrow', event.target.value)} />
                            </label>
                            <label>
                                <span>Title</span>
                                <input value={content.featuredTitle || ''} onChange={(event) => updateContentField('featuredTitle', event.target.value)} />
                            </label>
                            <label>
                                <span>Description</span>
                                <textarea rows="4" value={content.featuredText || ''} onChange={(event) => updateContentField('featuredText', event.target.value)} />
                            </label>
                        </div>
                    </div>

                    <div className="record-list">
                        <div className="record-card content-card-editor">
                            <div className="record-header">
                                <div>
                                    <h3>Services page</h3>
                                    <p className="muted">Edit the services headline and cards shown on `/services`.</p>
                                </div>
                            </div>

                            <div className="edit-form">
                                <label>
                                    <span>Services eyebrow</span>
                                    <input value={content.servicesEyebrow || ''} onChange={(event) => updateContentField('servicesEyebrow', event.target.value)} />
                                </label>
                                <label>
                                    <span>Services title</span>
                                    <input value={content.servicesTitle || ''} onChange={(event) => updateContentField('servicesTitle', event.target.value)} />
                                </label>
                                <label>
                                    <span>Services intro text</span>
                                    <textarea rows="4" value={content.servicesText || ''} onChange={(event) => updateContentField('servicesText', event.target.value)} />
                                </label>

                                {(content.services || []).map((service, index) => (
                                    <div key={service.id || index} className="helper-card">
                                        <div className="edit-form">
                                            <label>
                                                <span>Service title</span>
                                                <input value={service.title || ''} onChange={(event) => updateService(index, 'title', event.target.value)} />
                                            </label>
                                            <label>
                                                <span>Service text</span>
                                                <textarea rows="3" value={service.text || ''} onChange={(event) => updateService(index, 'text', event.target.value)} />
                                            </label>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="record-card content-card-editor">
                            <div className="record-header">
                                <div>
                                    <h3>Success and footer</h3>
                                    <p className="muted">Control the order confirmation page and footer support details.</p>
                                </div>
                            </div>

                            <div className="edit-form">
                                <label>
                                    <span>Success eyebrow</span>
                                    <input value={content.successEyebrow || ''} onChange={(event) => updateContentField('successEyebrow', event.target.value)} />
                                </label>
                                <label>
                                    <span>Success title</span>
                                    <input value={content.successTitle || ''} onChange={(event) => updateContentField('successTitle', event.target.value)} />
                                </label>
                                <label>
                                    <span>Success text</span>
                                    <textarea rows="4" value={content.successText || ''} onChange={(event) => updateContentField('successText', event.target.value)} />
                                </label>
                                <label>
                                    <span>Footer title</span>
                                    <input value={content.footerTitle || ''} onChange={(event) => updateContentField('footerTitle', event.target.value)} />
                                </label>
                                <label>
                                    <span>Footer text</span>
                                    <textarea rows="3" value={content.footerText || ''} onChange={(event) => updateContentField('footerText', event.target.value)} />
                                </label>
                                <label>
                                    <span>Footer subtext</span>
                                    <textarea rows="3" value={content.footerSubtext || ''} onChange={(event) => updateContentField('footerSubtext', event.target.value)} />
                                </label>
                                <label>
                                    <span>Support email</span>
                                    <input value={content.supportEmail || ''} onChange={(event) => updateContentField('supportEmail', event.target.value)} />
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="toolbar-actions">
                        <button type="button" className="secondary-button" onClick={loadContent} disabled={loadingContent || savingContent}>
                            {loadingContent ? 'Refreshing…' : 'Reload content'}
                        </button>
                        <button type="button" className="edit-button" onClick={handleSaveContent} disabled={loadingContent || savingContent}>
                            {savingContent ? 'Saving…' : 'Save Adrian content'}
                        </button>
                    </div>

                    {(updatedAt || updatedByEmail) ? (
                        <p className="muted">
                            Last saved {updatedAt ? new Date(updatedAt).toLocaleString() : 'recently'}
                            {updatedByEmail ? ` by ${updatedByEmail}` : ''}
                        </p>
                    ) : null}
                </div>
            ) : activeTab === 'products' ? (
                <div className="content-editor-grid">
                    <div className="list-card">
                        <div className="record-header">
                            <div>
                                <h3>{editingProductId ? 'Edit Adrian product' : 'Add Adrian product'}</h3>
                                <p className="muted">Products saved here appear on the Adrian storefront and checkout flow.</p>
                            </div>
                            {editingProductId ? (
                                <button type="button" className="cancel-button" onClick={resetProductForm}>
                                    Cancel edit
                                </button>
                            ) : null}
                        </div>

                        <div className="edit-form">
                            <label>
                                <span>Product name</span>
                                <input value={productForm.name} onChange={(event) => updateProductField('name', event.target.value)} />
                            </label>
                            <label>
                                <span>Slug</span>
                                <input value={productForm.slug} onChange={(event) => updateProductField('slug', event.target.value)} placeholder="wild-elegance-leopard-print-kaftan" />
                            </label>
                            <label>
                                <span>Short description</span>
                                <textarea rows="3" value={productForm.short_description} onChange={(event) => updateProductField('short_description', event.target.value)} />
                            </label>
                            <label>
                                <span>Long description</span>
                                <textarea rows="5" value={productForm.long_description} onChange={(event) => updateProductField('long_description', event.target.value)} />
                            </label>
                            <div className="two-column-grid">
                                <label>
                                    <span>Price</span>
                                    <input value={productForm.price} onChange={(event) => updateProductField('price', event.target.value)} />
                                </label>
                                <label>
                                    <span>Compare-at price</span>
                                    <input value={productForm.compare_at_price} onChange={(event) => updateProductField('compare_at_price', event.target.value)} />
                                </label>
                                <label>
                                    <span>Inventory count</span>
                                    <input value={productForm.inventory_count} onChange={(event) => updateProductField('inventory_count', event.target.value)} />
                                </label>
                                <label>
                                    <span>Image URL</span>
                                    <input value={productForm.image_url} onChange={(event) => updateProductField('image_url', event.target.value)} placeholder="/products/chic-green-kaftan.svg" />
                                </label>
                            </div>

                            <div className="inline-checkboxes">
                                <label className="category-checkbox">
                                    <input type="checkbox" checked={productForm.featured} onChange={(event) => updateProductField('featured', event.target.checked)} />
                                    <span>Featured on homepage</span>
                                </label>
                                <label className="category-checkbox">
                                    <input type="checkbox" checked={productForm.active} onChange={(event) => updateProductField('active', event.target.checked)} />
                                    <span>Active product</span>
                                </label>
                            </div>

                            <label>
                                <span>Categories</span>
                                <div className="category-checkbox-grid">
                                    {categories.length ? categories.map((category) => (
                                        <label key={category.id} className="category-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={productForm.categoryIds.includes(category.id)}
                                                onChange={() => toggleCategory(category.id)}
                                            />
                                            <span>{category.name}</span>
                                        </label>
                                    )) : <span className="muted">No categories available yet. Add one in the Categories tab first.</span>}
                                </div>
                            </label>
                        </div>

                        <div className="product-actions">
                            <button type="button" className="edit-button" onClick={handleSaveProduct} disabled={savingProduct}>
                                {savingProduct ? 'Saving…' : editingProductId ? 'Update product' : 'Create product'}
                            </button>
                            <button type="button" className="secondary-button" onClick={loadProducts} disabled={loadingProducts || savingProduct}>
                                {loadingProducts ? 'Refreshing…' : 'Reload products'}
                            </button>
                        </div>
                    </div>

                    <div className="record-list">
                        {loadingProducts ? (
                            <div className="empty-state">Loading Adrian Store products…</div>
                        ) : products.length ? products.map((product) => (
                            <div key={product.id} className="record-card">
                                <div className="record-header">
                                    <div>
                                        <h3>{product.name || product.title}</h3>
                                        <p className="muted">/{product.slug || 'no-slug'} • {product.category_names?.join(', ') || 'No category name'}</p>
                                    </div>
                                    <div className="record-meta">
                                        <span className="meta-badge">${Number(product.price || 0).toFixed(2)}</span>
                                        <span className={`status-badge ${product.active === false ? 'status-cancelled' : 'status-completed'}`}>
                                            {product.active === false ? 'Inactive' : 'Active'}
                                        </span>
                                        {product.featured ? <span className="meta-badge">Featured</span> : null}
                                    </div>
                                </div>

                                {product.image_url || product.image ? (
                                    <img className="product-image-preview" src={product.image_url || product.image} alt={product.name || product.title} />
                                ) : null}

                                <p className="muted" style={{ marginTop: '12px' }}>
                                    {product.short_description || product.description || 'No description yet.'}
                                </p>

                                <div className="product-actions">
                                    <button type="button" className="edit-button" onClick={() => startEditProduct(product)}>
                                        Edit
                                    </button>
                                    <button type="button" className="delete-button" onClick={() => handleDeleteProduct(product.id)}>
                                        Delete
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <div className="empty-state">No Adrian Store products yet. Use the form to create the first one.</div>
                        )}
                    </div>
                </div>
            ) : activeTab === 'orders' ? (
                <div className="content-editor-grid">
                    <div className="list-card">
                        <div className="record-header">
                            <div>
                                <h3>Adrian order management</h3>
                                <p className="muted">These are checkout orders created from `shopwithadrian.com` and the Adrian storefront.</p>
                            </div>
                            <button type="button" className="secondary-button" onClick={loadOrders} disabled={loadingOrders || updatingOrderId}>
                                {loadingOrders ? 'Refreshing…' : 'Reload orders'}
                            </button>
                        </div>
                    </div>

                    <div className="record-list">
                        {loadingOrders ? (
                            <div className="empty-state">Loading Adrian orders…</div>
                        ) : orders.length ? orders.map((order) => (
                            <div key={order.id} className="record-card">
                                <div className="record-header">
                                    <div>
                                        <h3>{order.customer_name || 'Adrian customer order'}</h3>
                                        <p className="muted">Order ID: {order.id}</p>
                                    </div>
                                    <div className="record-meta">
                                        <span className={`status-badge status-${String(order.status || 'pending').toLowerCase().replace(/[\s_]+/g, '-')}`}>
                                            {formatStatusLabel(order.status)}
                                        </span>
                                        <span className="meta-badge">{formatMoney(order.final_total ?? order.total)}</span>
                                    </div>
                                </div>

                                <div className="details-grid">
                                    <div>
                                        <span className="muted">Customer email</span>
                                        <strong>{order.customer_email || '—'}</strong>
                                    </div>
                                    <div>
                                        <span className="muted">Phone</span>
                                        <strong>{order.customer_phone || '—'}</strong>
                                    </div>
                                    <div>
                                        <span className="muted">Payment</span>
                                        <strong>{formatStatusLabel(order.payment_status || 'pending')}</strong>
                                    </div>
                                    <div>
                                        <span className="muted">Created</span>
                                        <strong>{order.created_at ? new Date(order.created_at).toLocaleString() : '—'}</strong>
                                    </div>
                                </div>

                                {Array.isArray(order.items) && order.items.length ? (
                                    <p className="muted" style={{ marginTop: '12px' }}>
                                        <strong>Items:</strong> {order.items.map((item) => `${item.product_name_snapshot || 'Item'} × ${item.quantity || 1}`).join(', ')}
                                    </p>
                                ) : null}

                                <div className="status-action-row">
                                    {ORDER_STATUS_OPTIONS.map((option) => (
                                        <button
                                            key={`${order.id}-${option.status}`}
                                            type="button"
                                            className={`status-action-button${String(order.status || 'pending') === option.status ? ' active' : ''}`}
                                            disabled={updatingOrderId === order.id}
                                            onClick={() => handleOrderStatusUpdate(order.id, { status: option.status }, `Order moved to ${formatStatusLabel(option.status)}.`)}
                                        >
                                            {updatingOrderId === order.id ? 'Updating…' : option.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="status-action-row" style={{ marginTop: '10px' }}>
                                    <button
                                        type="button"
                                        className={`status-action-button${String(order.payment_status || 'pending') === 'paid' ? ' active' : ''}`}
                                        disabled={updatingOrderId === order.id}
                                        onClick={() => handleOrderStatusUpdate(order.id, { payment_status: 'paid' }, 'Order payment marked as paid.')}
                                    >
                                        Mark Paid
                                    </button>
                                    <button
                                        type="button"
                                        className={`status-action-button${String(order.payment_status || 'pending') === 'pending' ? ' active' : ''}`}
                                        disabled={updatingOrderId === order.id}
                                        onClick={() => handleOrderStatusUpdate(order.id, { payment_status: 'pending' }, 'Order payment moved back to pending.')}
                                    >
                                        Mark Pending
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <div className="empty-state">No Adrian checkout orders yet. New purchases will appear here automatically.</div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="content-editor-grid">
                    <div className="list-card">
                        <div className="record-header">
                            <div>
                                <h3>Adrian support inbox</h3>
                                <p className="muted">Manage customer support requests submitted for Adrian&apos;s Styled Collection.</p>
                            </div>
                            <button type="button" className="secondary-button" onClick={loadSupportRequests} disabled={loadingSupport || updatingSupportId}>
                                {loadingSupport ? 'Refreshing…' : 'Reload support'}
                            </button>
                        </div>
                    </div>

                    <div className="record-list">
                        {loadingSupport ? (
                            <div className="empty-state">Loading Adrian support requests…</div>
                        ) : supportRequests.length ? supportRequests.map((request) => (
                            <div key={request.id} className="record-card">
                                <div className="record-header">
                                    <div>
                                        <h3>{request.subject || 'Support request'}</h3>
                                        <p className="muted">{request.contact_name || 'Unknown contact'} • {request.contact_email || 'No email'}</p>
                                    </div>
                                    <div className="record-meta">
                                        <span className={`status-badge status-${String(request.status || 'new').toLowerCase().replace(/[\s_]+/g, '-')}`}>
                                            {formatStatusLabel(request.status || 'new')}
                                        </span>
                                        <span className="meta-badge">{request.app_name || 'Adrian Store'}</span>
                                    </div>
                                </div>

                                <div className="details-grid">
                                    <div>
                                        <span className="muted">Phone</span>
                                        <strong>{request.contact_phone || '—'}</strong>
                                    </div>
                                    <div>
                                        <span className="muted">Created</span>
                                        <strong>{request.created_at ? new Date(request.created_at).toLocaleString() : '—'}</strong>
                                    </div>
                                    <div>
                                        <span className="muted">Admin notes</span>
                                        <strong>{request.admin_notes || '—'}</strong>
                                    </div>
                                </div>

                                <p className="muted" style={{ marginTop: '12px' }}>
                                    <strong>Message:</strong> {request.message || 'No message provided.'}
                                </p>

                                <div className="status-action-row">
                                    {SUPPORT_STATUS_OPTIONS.map((option) => (
                                        <button
                                            key={`${request.id}-${option.status}`}
                                            type="button"
                                            className={`status-action-button${String(request.status || 'new') === option.status ? ' active' : ''}`}
                                            disabled={updatingSupportId === request.id}
                                            onClick={() => handleSupportStatusUpdate(request, option.status)}
                                        >
                                            {updatingSupportId === request.id ? 'Updating…' : option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )) : (
                            <div className="empty-state">No Adrian support requests yet. Customer messages will appear here.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdrianStore;
