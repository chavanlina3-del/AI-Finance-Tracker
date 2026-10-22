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
    const userId = req.user ? req.user.id : 'usr_demo_1001';
    const { category, amount, month, year, total_budget, categories } = req.body;

    // Convert month and year into YYYY-MM format
    const monthKey = (month && year)
      ? `${year}-${String(month).padStart(2, '0')}`
      : (month && String(month).includes('-'))
        ? String(month).slice(0, 7)
        : (() => {
            const now = new Date();
            return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
          })();

    const saveBudget = db.prepare(`
      INSERT INTO budgets (id, user_id, category, amount, month)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(category, month, user_id)
      DO UPDATE SET amount = excluded.amount
    `);

    // Save total budget and category limits from budget.html
    if (categories && typeof categories === 'object' && !Array.isArray(categories)) {
      const saveAll = db.transaction(() => {
        if (Number.isFinite(Number(total_budget)) && Number(total_budget) > 0) {
          saveBudget.run(
            uuidv4(), userId, '__TOTAL__', Number(total_budget), monthKey
          );
        }

        for (const [cat, limit] of Object.entries(categories)) {
          const value = Number(limit);

          if (cat && Number.isFinite(value) && value > 0) {
            saveBudget.run(uuidv4(), userId, cat, value, monthKey);
          }
        }
      });

      saveAll();

      return res.status(201).json({
        success: true,
        month: monthKey,
        message: 'Budget saved successfully'
      });
    }

    // Save one category budget for other pages
    if (!category || amount === undefined || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({
        error: 'A valid category and positive amount are required'
      });
    }

    saveBudget.run(uuidv4(), userId, category, Number(amount), monthKey);

    return res.status(201).json({
      success: true,
      category,
      amount: Number(amount),
      month: monthKey
    });

  } catch (error) {
    console.error('Error saving budget:', error);
    return res.status(400).json({ error: error.message });
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
