const pool = require('../db');

exports.getCategories = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM categories ORDER BY name');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching categories');
    }
};

exports.addCategory = async (req, res) => {
    const { name } = req.body;

    try {
        const result = await pool.query(
            'INSERT INTO categories (name) VALUES ($1) RETURNING *',
            [name]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error adding category');
    }
};

exports.updateCategory = async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).send('Category name is required');
    }

    try {
        const result = await pool.query(
            'UPDATE categories SET name=$1 WHERE id=$2 RETURNING *',
            [name.trim(), id]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating category');
    }
};

exports.deleteCategory = async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query('DELETE FROM categories WHERE id=$1', [id]);
        res.send('Category deleted');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error deleting category');
    }
};
