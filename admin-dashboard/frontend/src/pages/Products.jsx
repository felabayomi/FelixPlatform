import { useEffect, useState } from 'react';
import API from '../services/api';

function Products() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [priceType, setPriceType] = useState('fixed');
    const [unit, setUnit] = useState('');
    const [subscriptionInterval, setSubscriptionInterval] = useState('');
    const [actionLabel, setActionLabel] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [imageUploading, setImageUploading] = useState(false);
    const [editingProductId, setEditingProductId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editPrice, setEditPrice] = useState('');
    const [editCategoryId, setEditCategoryId] = useState('');
    const [editPriceType, setEditPriceType] = useState('fixed');
    const [editUnit, setEditUnit] = useState('');
    const [editSubscriptionInterval, setEditSubscriptionInterval] = useState('');
    const [editActionLabel, setEditActionLabel] = useState('');
    const [editImageUrl, setEditImageUrl] = useState('');
    const [editImageUploading, setEditImageUploading] = useState(false);
    const [editType, setEditType] = useState('service');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const priceTypeOptions = [
        { value: 'fixed', label: 'Fixed' },
        { value: 'per_lb', label: 'Per lb' },
        { value: 'per_item', label: 'Per item' },
        { value: 'per_load', label: 'Per load' },
        { value: 'subscription', label: 'Subscription' }
    ];

    const unitOptions = ['lb', 'item', 'load', 'panel', 'uniform', 'pair'];
    const actionLabelOptions = [
        'Request Quote',
        'Request Service',
        'Request App Build',
        'Request Consultation',
        'Request Travel Plan',
        'Request Digital Product',
        'Schedule Pickup',
        'Request Laundry Service',
        'Subscribe to Weekly Service'
    ];

    const loadProducts = () => {
        API.get('/products').then((res) => {
            setProducts(res.data);
        });
    };

    const loadCategories = () => {
        API.get('/categories').then((res) => {
            setCategories(res.data);
        });
    };

    useEffect(() => {
        loadProducts();
        loadCategories();
    }, []);

    const getCategoryName = (id) => {
        const category = categories.find((c) => c.id === id);
        return category?.name || 'Uncategorized';
    };

    const formatPricingMeta = (product) => {
        const details = [];

        if (product.price_type) {
            details.push(product.price_type.replace(/_/g, ' '));
        }

        if (product.unit) {
            details.push(`unit: ${product.unit}`);
        }

        if (product.subscription_interval) {
            details.push(`interval: ${product.subscription_interval}`);
        }

        return details.length ? details.join(' • ') : 'fixed';
    };

    const uploadProductImage = async (file, mode = 'create') => {
        if (!file) {
            return;
        }

        const formData = new FormData();
        formData.append('image', file);

        if (mode === 'edit') {
            setEditImageUploading(true);
        } else {
            setImageUploading(true);
        }

        setError('');
        setMessage('');

        try {
            const res = await API.post('/products/upload-image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (mode === 'edit') {
                setEditImageUrl(res.data.imageUrl);
            } else {
                setImageUrl(res.data.imageUrl);
            }

            setMessage('Image uploaded successfully.');
        } catch (err) {
            console.error(err);
            setError(err.response?.data || 'Error uploading image.');
        } finally {
            if (mode === 'edit') {
                setEditImageUploading(false);
            } else {
                setImageUploading(false);
            }
        }
    };

    const addProduct = async () => {
        if (!name.trim()) {
            setError('Product name is required.');
            setMessage('');
            return;
        }

        if (!categoryId) {
            setError('Please select a category first.');
            setMessage('');
            return;
        }

        setSubmitting(true);
        setError('');
        setMessage('');

        try {
            const cleanedPrice = price.replace(/[^0-9.-]/g, '');
            const normalizedPriceType = priceType || 'fixed';

            await API.post('/products', {
                name,
                description,
                price: cleanedPrice === '' ? null : Number(cleanedPrice),
                category_id: categoryId,
                type: normalizedPriceType === 'subscription' ? 'subscription' : 'service',
                price_type: normalizedPriceType,
                unit: normalizedPriceType === 'subscription' || normalizedPriceType === 'fixed' ? null : (unit || null),
                subscription_interval: normalizedPriceType === 'subscription' ? (subscriptionInterval || 'monthly') : null,
                action_label: actionLabel || null,
                image_url: imageUrl || null
            });

            setName('');
            setDescription('');
            setPrice('');
            setCategoryId('');
            setPriceType('fixed');
            setUnit('');
            setSubscriptionInterval('');
            setActionLabel('');
            setImageUrl('');
            setMessage('Product added successfully.');
            loadProducts();
        } catch (err) {
            console.error(err);
            setError(err.response?.data || 'Error adding product.');
        } finally {
            setSubmitting(false);
        }
    };

    const startEditProduct = (product) => {
        setEditingProductId(product.id);
        setEditName(product.name || '');
        setEditDescription(product.description || '');
        setEditPrice(product.price ?? '');
        setEditCategoryId(product.category_id || '');
        setEditPriceType(product.price_type || 'fixed');
        setEditUnit(product.unit || '');
        setEditSubscriptionInterval(product.subscription_interval || '');
        setEditActionLabel(product.action_label || '');
        setEditImageUrl(product.image_url || '');
        setEditType(product.type || 'service');
        setError('');
        setMessage('');
    };

    const saveProductEdit = async (id) => {
        if (!editName.trim()) {
            setError('Product name is required.');
            return;
        }

        try {
            const normalizedPriceType = editPriceType || 'fixed';
            const resolvedType = normalizedPriceType === 'subscription'
                ? 'subscription'
                : editType === 'subscription'
                    ? 'service'
                    : (editType || 'service');

            await API.put(`/products/${id}`, {
                name: editName,
                description: editDescription,
                price: editPrice,
                category_id: editCategoryId,
                type: resolvedType,
                price_type: normalizedPriceType,
                unit: normalizedPriceType === 'subscription' || normalizedPriceType === 'fixed' ? null : (editUnit || null),
                subscription_interval: normalizedPriceType === 'subscription' ? (editSubscriptionInterval || 'monthly') : null,
                action_label: editActionLabel || null,
                image_url: editImageUrl || null
            });

            setEditingProductId(null);
            setMessage('Product updated successfully.');
            loadProducts();
        } catch (err) {
            console.error(err);
            setError(err.response?.data || 'Error updating product.');
        }
    };

    const deleteProduct = async (id, productName) => {
        setError('');
        setMessage('');

        try {
            await API.delete(`/products/${id}`);
            setMessage(`${productName} deleted successfully.`);
            loadProducts();
        } catch (err) {
            console.error(err);
            setError(err.response?.data || 'Error deleting product.');
        }
    };

    return (
        <div className="page-section">
            <h1>Products</h1>
            <p className="muted">Create categories first, then assign one when adding a product.</p>

            <div className="login-form">
                <input
                    placeholder="Product Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <input
                    placeholder="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
                <input
                    placeholder="Price (e.g. 0 or 25.99)"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                />
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name}
                        </option>
                    ))}
                </select>
                <select
                    value={priceType}
                    onChange={(e) => {
                        const value = e.target.value;
                        setPriceType(value);
                        if (value === 'subscription') {
                            setUnit('');
                            setSubscriptionInterval((current) => current || 'monthly');
                        } else {
                            setSubscriptionInterval('');
                        }
                    }}
                >
                    {priceTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                {priceType !== 'fixed' && priceType !== 'subscription' ? (
                    <select value={unit} onChange={(e) => setUnit(e.target.value)}>
                        <option value="">Select Unit</option>
                        {unitOptions.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                ) : null}
                {priceType === 'subscription' ? (
                    <select value={subscriptionInterval} onChange={(e) => setSubscriptionInterval(e.target.value)}>
                        <option value="">Select Interval</option>
                        <option value="weekly">weekly</option>
                        <option value="monthly">monthly</option>
                        <option value="yearly">yearly</option>
                    </select>
                ) : null}
                <input
                    list="action-label-options"
                    placeholder="Action Button Label (optional)"
                    value={actionLabel}
                    onChange={(e) => setActionLabel(e.target.value)}
                />
                <datalist id="action-label-options">
                    {actionLabelOptions.map((option) => (
                        <option key={option} value={option} />
                    ))}
                </datalist>
                <div className="image-upload-block">
                    <label className="muted">Product image</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => uploadProductImage(e.target.files?.[0], 'create')}
                    />
                    <input
                        placeholder="Image URL (optional)"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                    />
                    {imageUploading ? <p className="muted">Uploading image...</p> : null}
                    {imageUrl ? (
                        <div className="image-preview-wrapper">
                            <img src={imageUrl} alt="New product preview" className="product-image-preview" />
                        </div>
                    ) : null}
                </div>
                <button type="button" onClick={addProduct} disabled={submitting || imageUploading}>
                    {submitting ? 'Adding...' : 'Add Product'}
                </button>
            </div>

            {message ? <p className="message-success">{message}</p> : null}
            {error ? <p className="message-error">{error}</p> : null}

            <hr />

            <div className="product-grid">
                {products.map((p) => (
                    <div key={p.id} className="product-card">
                        {editingProductId === p.id ? (
                            <div className="edit-form">
                                <input value={editName} onChange={(e) => setEditName(e.target.value)} />
                                <input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
                                <input value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
                                <select value={editCategoryId} onChange={(e) => setEditCategoryId(e.target.value)}>
                                    <option value="">Select Category</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                <select
                                    value={editPriceType}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setEditPriceType(value);
                                        if (value === 'subscription') {
                                            setEditUnit('');
                                            setEditSubscriptionInterval((current) => current || 'monthly');
                                        } else {
                                            setEditSubscriptionInterval('');
                                        }
                                    }}
                                >
                                    {priceTypeOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                {editPriceType !== 'fixed' && editPriceType !== 'subscription' ? (
                                    <select value={editUnit} onChange={(e) => setEditUnit(e.target.value)}>
                                        <option value="">Select Unit</option>
                                        {unitOptions.map((option) => (
                                            <option key={option} value={option}>
                                                {option}
                                            </option>
                                        ))}
                                    </select>
                                ) : null}
                                {editPriceType === 'subscription' ? (
                                    <select value={editSubscriptionInterval} onChange={(e) => setEditSubscriptionInterval(e.target.value)}>
                                        <option value="">Select Interval</option>
                                        <option value="weekly">weekly</option>
                                        <option value="monthly">monthly</option>
                                        <option value="yearly">yearly</option>
                                    </select>
                                ) : null}
                                <input
                                    list="action-label-options"
                                    placeholder="Action Button Label (optional)"
                                    value={editActionLabel}
                                    onChange={(e) => setEditActionLabel(e.target.value)}
                                />
                                <div className="image-upload-block">
                                    <label className="muted">Product image</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => uploadProductImage(e.target.files?.[0], 'edit')}
                                    />
                                    <input
                                        placeholder="Image URL (optional)"
                                        value={editImageUrl}
                                        onChange={(e) => setEditImageUrl(e.target.value)}
                                    />
                                    {editImageUploading ? <p className="muted">Uploading image...</p> : null}
                                    {editImageUrl ? (
                                        <div className="image-preview-wrapper">
                                            <img src={editImageUrl} alt={`${editName || 'Product'} preview`} className="product-image-preview" />
                                        </div>
                                    ) : null}
                                </div>
                                <div className="product-actions">
                                    <button type="button" className="edit-button" onClick={() => saveProductEdit(p.id)} disabled={editImageUploading}>
                                        Save
                                    </button>
                                    <button type="button" className="cancel-button" onClick={() => setEditingProductId(null)}>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {p.image_url ? <img src={p.image_url} alt={p.name} className="product-image" /> : null}
                                <h3>{p.name}</h3>
                                <p>{p.description || 'No description provided.'}</p>
                                <p className="muted">Category: {getCategoryName(p.category_id)}</p>
                                <p className="price">${p.price}</p>
                                <p className="muted">Pricing: {formatPricingMeta(p)}</p>
                                <p className="muted">Button label: {p.action_label || 'Auto / by product type'}</p>
                                <div className="product-actions">
                                    <button
                                        type="button"
                                        className="edit-button"
                                        title="Edit product"
                                        onClick={() => startEditProduct(p)}
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        type="button"
                                        className="delete-button"
                                        onClick={() => deleteProduct(p.id, p.name)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Products;
