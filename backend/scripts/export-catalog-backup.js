const fs = require('fs');
const path = require('path');
const pool = require('../db');

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupDir = path.resolve(__dirname, '../../database/backups');
const backupFile = path.join(backupDir, `catalog-backup-${timestamp}.json`);

async function exportCatalogBackup() {
    try {
        const [categoriesResult, productsResult, productCategoriesResult, productImagesResult] = await Promise.all([
            pool.query('SELECT * FROM categories ORDER BY created_at ASC, name ASC'),
            pool.query('SELECT * FROM products ORDER BY created_at ASC, name ASC'),
            pool.query('SELECT * FROM product_categories ORDER BY created_at ASC, product_id ASC, category_id ASC'),
            pool.query('SELECT * FROM product_images ORDER BY product_id ASC, id ASC'),
        ]);

        const payload = {
            generatedAt: new Date().toISOString(),
            source: 'Felix Platform catalog backup',
            counts: {
                categories: categoriesResult.rowCount,
                products: productsResult.rowCount,
                productCategoryLinks: productCategoriesResult.rowCount,
                productImages: productImagesResult.rowCount,
            },
            categories: categoriesResult.rows,
            products: productsResult.rows,
            product_categories: productCategoriesResult.rows,
            product_images: productImagesResult.rows,
        };

        fs.mkdirSync(backupDir, { recursive: true });
        fs.writeFileSync(backupFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

        console.log(`Catalog backup written to ${backupFile}`);
        console.log(`Categories: ${payload.counts.categories}`);
        console.log(`Products: ${payload.counts.products}`);
        console.log(`Product category links: ${payload.counts.productCategoryLinks}`);
        console.log(`Product images: ${payload.counts.productImages}`);
    } catch (error) {
        console.error('Unable to export catalog backup.');
        console.error(error);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

void exportCatalogBackup();
