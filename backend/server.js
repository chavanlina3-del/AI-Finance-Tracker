
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// CORS - GITHUB PAGES + LOCAL DEVELOPMENT
// ==========================================
const allowedOrigins = [
    'https://chavanlina3-del.github.io',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error('Origin not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// ==========================================
// DATABASE
// ==========================================
const db = require('./database');

// ==========================================
// EXISTING ROUTES
// ==========================================
const transactionsRouter = require('./routes/transactions');
const categoriesRouter = require('./routes/categories');
const insightsRouter = require('./routes/insights');
const budgetsRouter = require('./routes/budgets');
const analyticsRouter = require('./routes/analytics');

app.use('/api/transactions', transactionsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/insights', insightsRouter);
app.use('/api/budgets', budgetsRouter);
app.use('/api/analytics', analyticsRouter);

// ==========================================
// HEALTH CHECK
// ==========================================
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'AI Finance Tracker Backend is running',
        port: PORT
    });
});

app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'AI Finance Tracker Backend is running',
        port: PORT
    });
});

// ==========================================
// REGISTER
// ==========================================
app.post('/api/register', (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Name, email and password are required'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = db
            .prepare('SELECT id FROM users WHERE email = ?')
            .get(normalizedEmail);

        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: 'Email already registered. Please log in.'
            });
        }

        const id = uuidv4();

        // Retains compatibility with the current database schema.
        // Password hashing should be added before real-world use.
        db.prepare(
            'INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)'
        ).run(id, name.trim(), normalizedEmail, password);

        const token = Buffer
            .from(id + ':' + normalizedEmail)
            .toString('base64');

        return res.status(201).json({
            success: true,
            token,
            user: {
                id,
                name: name.trim(),
                email: normalizedEmail
            }
        });
    } catch (error) {
        console.error('Register error:', error);

        return res.status(500).json({
            success: false,
            error: 'Server error during registration'
        });
    }
});

// ==========================================
// LOGIN
// ==========================================
app.post('/api/login', (req, res) => {
    try {
        const { email, password } = req.body || {};

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = db
            .prepare('SELECT * FROM users WHERE email = ?')
            .get(normalizedEmail);

        if (!user || user.password !== password) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        const token = Buffer
            .from(user.id + ':' + user.email)
            .toString('base64');

        return res.status(200).json({
            success: true,
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);

        return res.status(500).json({
            success: false,
            error: 'Server error during login'
        });
    }
});

// ==========================================
// NOT FOUND
// ==========================================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'API route not found',
        path: req.originalUrl
    });
});

// ==========================================
// ERROR HANDLER
// ==========================================
app.use((err, req, res, next) => {
    console.error('Server error:', err.message);

    if (err.message === 'Origin not allowed by CORS') {
        return res.status(403).json({
            success: false,
            error: 'This website is not allowed to access the API'
        });
    }

    return res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// ==========================================
// START SERVER
// ==========================================
app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Finance Tracker backend running on port ${PORT}`);
});
