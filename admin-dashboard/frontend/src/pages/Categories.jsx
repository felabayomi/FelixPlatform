import { useEffect, useState } from 'react';
import API from '../services/api';

function Categories() {
    const [categories, setCategories] = useState([]);
    const [name, setName] = useState('');
    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const [editName, setEditName] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const loadCategories = () => {
        API.get('/categories').then((res) => {
            setCategories(res.data);
        });
    };

    useEffect(() => {
        loadCategories();
    }, []);

    const addCategory = async () => {
        if (!name.trim()) {
            setError('Category name is required.');
            setMessage('');
            return;
        }

        setSubmitting(true);
        setError('');
        setMessage('');

        try {
            await API.post('/categories', { name });
            setName('');
            setMessage('Category added successfully.');
            loadCategories();
        } catch (err) {
            console.error(err);
            setError(err.response?.data || 'Error adding category.');
        } finally {
            setSubmitting(false);
        }
    };

    const startEditCategory = (category) => {
        setEditingCategoryId(category.id);
        setEditName(category.name || '');
        setError('');
        setMessage('');
    };

    const saveCategoryEdit = async (id) => {
        if (!editName.trim()) {
            setError('Category name is required.');
            return;
        }

        try {
            await API.put(`/categories/${id}`, { name: editName });
            setEditingCategoryId(null);
            setMessage('Category updated successfully.');
            loadCategories();
        } catch (err) {
            console.error(err);
            setError(err.response?.data || 'Error updating category.');
        }
    };

    const deleteCategory = async (id, categoryName) => {
        setError('');
        setMessage('');

        try {
            await API.delete(`/categories/${id}`);
            setMessage(`${categoryName} deleted successfully.`);
            loadCategories();
        } catch (err) {
            console.error(err);
            setError(err.response?.data || 'Error deleting category.');
        }
    };

    return (
        <div className="page-section">
            <div className="page-header">
                <h1>Categories</h1>
                <p className="muted">Create categories first, then assign them when adding products.</p>
            </div>

            <div className="login-form">
                <input
                    placeholder="Category Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <button type="button" onClick={addCategory} disabled={submitting}>
                    {submitting ? 'Adding...' : 'Add Category'}
                </button>
            </div>

            {message ? <p className="message-success">{message}</p> : null}
            {error ? <p className="message-error">{error}</p> : null}

            <hr />

            {categories.length === 0 ? (
                <p className="empty-state">No categories found yet.</p>
            ) : (
                <div className="product-grid">
                    {categories.map((category) => (
                        <div key={category.id} className="product-card">
                            {editingCategoryId === category.id ? (
                                <div className="edit-form">
                                    <input value={editName} onChange={(e) => setEditName(e.target.value)} />
                                    <div className="product-actions">
                                        <button type="button" className="edit-button" onClick={() => saveCategoryEdit(category.id)}>
                                            Save
                                        </button>
                                        <button type="button" className="cancel-button" onClick={() => setEditingCategoryId(null)}>
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <h3>{category.name}</h3>
                                    <p className="muted">ID: {category.id}</p>
                                    <div className="product-actions">
                                        <button
                                            type="button"
                                            className="edit-button"
                                            title="Edit category"
                                            onClick={() => startEditCategory(category)}
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            type="button"
                                            className="delete-button"
                                            onClick={() => deleteCategory(category.id, category.name)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Categories;
