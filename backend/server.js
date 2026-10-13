const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// CORS - DEVELOPMENT CONFIGURATION
// ==========================================
app.use(cors());

app.use(express.json());

// ==========================================
// DATABASE
// ==========================================
const db = require('./database');
const { v4: uuidv4 } = require('uuid');

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
app.use('/api/budgets', budgetsRouter);app.use('/api/analytics', analyticsRouter);

// ==========================================
// AUTHENTICATION
// ==========================================
app.post('/api/register', (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, error: 'Name, email and password are required' });
        }
        
        const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existingUser) {
            return res.status(400).json({ success: false, error: 'Email already registered' });
        }

        const id = uuidv4();
        // In a real app, hash the password!
        db.prepare('INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)').run(id, name, email, password);

        // Generate a simple token
        const token = Buffer.from(id + ':' + email).toString('base64');
        return res.status(200).json({ success: true, token, user: { id, name, email } });
    } catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({ success: false, error: 'Server error during registration' });
    }
});

app.post('/api/login', (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email and password are required' });
        }

        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        
        if (!user || user.password !== password) {
            return res.status(401).json({ success: false, error: 'Invalid email or password' });
        }

        const token = Buffer.from(user.id + ':' + user.email).toString('base64');

        return res.status(200).json({
            success: true,
            token,
            user: { id: user.id, name: user.name, email: user.email }
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ success: false, error: 'Server error during login' });
    }
});

// ==========================================
// HEALTH CHECK
// ==========================================
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'AI Finance Tracker Backend is running',
        port: PORT
    });
});

// ==========================================
// ERROR HANDLER
// ==========================================
app.use((err, req, res, next) => {
    console.error('Server Error:', err);

    res.status(500).json({
        success: false,
        error: err.message || 'Something went wrong!'
    });
});

// ==========================================
// START SERVER
// ==========================================
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});