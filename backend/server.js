require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const pool = require('./db');
const productsRoutes = require('./routes/products');
const bookingsRoutes = require('./routes/bookings');
const ordersRoutes = require('./routes/orders');
const quoteRequestsRoutes = require('./routes/quoteRequests');
const supportRequestsRoutes = require('./routes/supportRequests');
const authRoutes = require('./routes/auth');
const categoriesRoutes = require('./routes/categories');
const documentFormatterRoutes = require('./routes/documentFormatter');
const afLaundryAppointmentsRoutes = require('./routes/afLaundryAppointments');

const PORT = Number(process.env.PORT) || 5000;
const envAllowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
const defaultAllowedOrigins = [
    'http://localhost:8081',
    'http://127.0.0.1:8081',
    'http://localhost:8084',
    'http://127.0.0.1:8084',
    'http://localhost:19006',
    'http://127.0.0.1:19006',
];
const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...envAllowedOrigins])];
const isLocalDevOrigin = (origin = '') => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);

const app = express();
app.use(
    cors({
        origin(origin, callback) {
            if (!origin || !allowedOrigins.length || allowedOrigins.includes(origin) || isLocalDevOrigin(origin)) {
                return callback(null, true);
            }

            console.warn(`Blocked CORS origin: ${origin}`);
            return callback(null, false);
        },
        credentials: true,
    })
);
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (_req, res) => {
    res.json({
        message: 'Felix Platform Backend Running',
        environment: process.env.NODE_ENV || 'development',
        port: PORT,
    });
});

app.get('/health', async (_req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'ok', database: 'connected' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', database: 'disconnected' });
    }
});

app.get('/test-db', async (_req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).send('Database connection test failed');
    }
});

app.use('/products', productsRoutes);
app.use('/bookings', bookingsRoutes);
app.use('/orders', ordersRoutes);
app.use('/quote-requests', quoteRequestsRoutes);
app.use('/support-requests', supportRequestsRoutes);
app.use('/auth', authRoutes);
app.use('/categories', categoriesRoutes);
app.use('/api', documentFormatterRoutes);
app.use('/api/admin/aflaundry/appointments', afLaundryAppointmentsRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
