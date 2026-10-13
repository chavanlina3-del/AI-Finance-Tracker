const express = require('express');
const router = express.Router();
const db = require('../database');
const { v4: uuidv4 } = require('uuid');

router.get('/', (req, res) => {
  try {
    let { month } = req.query; // YYYY-MM
    if (!month) {
      const now = new Date();
      month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
    const budgets = db.prepare('SELECT * FROM budgets WHERE month = ?').all(month);
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { category, amount, month } = req.body;
    
    // Check if exists
    const existing = db.prepare('SELECT id FROM budgets WHERE category = ? AND month = ?').get(category, month);
    
    if (existing) {
      const stmt = db.prepare('UPDATE budgets SET amount = ? WHERE id = ?');
      stmt.run(amount, existing.id);
      res.json({ id: existing.id, category, amount, month });
    } else {
      const id = uuidv4();
      const stmt = db.prepare('INSERT INTO budgets (id, category, amount, month) VALUES (?, ?, ?, ?)');
      stmt.run(id, category, amount, month);
      res.status(201).json({ id, category, amount, month });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/status', (req, res) => {
  try {
    let { month } = req.query;
    if (!month) {
      const now = new Date();
      month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }

    const budgets = db.prepare('SELECT * FROM budgets WHERE month = ?').all(month);
    const expenses = db.prepare(`
      SELECT category, SUM(amount) as spent
      FROM transactions 
      WHERE type = 'expense' AND strftime('%Y-%m', date) = ?
      GROUP BY category
    `).all(month);
    
    const expenseMap = {};
    expenses.forEach(e => { expenseMap[e.category] = e.spent; });

    const status = budgets.map(b => ({
      ...b,
      spent: expenseMap[b.category] || 0,
      remaining: b.amount - (expenseMap[b.category] || 0)
    }));

    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
