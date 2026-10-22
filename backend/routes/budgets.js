
const express = require('express');
const router = express.Router();
const db = require('../database');
const { v4: uuidv4 } = require('uuid');

// Get the logged-in user's ID
function getUserId(req) {
  return req.user?.id || 'usr_demo_1001';
}

// Convert month inputs into YYYY-MM format
function getMonthKey(month, year) {
  const now = new Date();

  if (month && /^\d{4}-\d{2}$/.test(String(month))) {
    const value = String(month);
    const [y, m] = value.split('-').map(Number);

    if (y < 1000 || m < 1 || m > 12) {
      throw new Error('Invalid month. Use YYYY-MM format.');
    }

    return value;
  }

  const m = month ? Number(month) : now.getMonth() + 1;
  const y = year ? Number(year) : now.getFullYear();

  if (
    !Number.isInteger(m) ||
    m < 1 ||
    m > 12 ||
    !Number.isInteger(y) ||
    y < 1000 ||
    y > 9999
  ) {
    throw new Error('Invalid month or year.');
  }

  return `${y}-${String(m).padStart(2, '0')}`;
}

// GET /api/budgets?month=10&year=2026
// GET /api/budgets?month=2026-10
router.get('/', (req, res) => {
  try {
    const userId = getUserId(req);
    const monthKey = getMonthKey(req.query.month, req.query.year);

    const budgets = db.prepare(`
      SELECT id, user_id, category, amount, month
      FROM budgets
      WHERE month = ? AND user_id = ?
      ORDER BY category
    `).all(monthKey, userId);

    // Keep the simple array response for existing frontend pages.
    if (req.query.detailed !== 'true' && !req.query.year) {
      return res.json(budgets);
    }

    const totalBudget = budgets.find(
      b => b.category === '__TOTAL__'
    );

    const categories = {};
    const categorySpent = {};

    budgets.forEach(b => {
      if (b.category !== '__TOTAL__') {
        categories[b.category] = Number(b.amount);
        categorySpent[b.category] = 0;
      }
    });

    const expenseRows = db.prepare(`
      SELECT category, COALESCE(SUM(amount), 0) AS spent
      FROM transactions
      WHERE user_id = ?
        AND type = 'expense'
        AND strftime('%Y-%m', date) = ?
      GROUP BY category
    `).all(userId, monthKey);

    let totalSpent = 0;

    expenseRows.forEach(expense => {
      const spent = Number(expense.spent) || 0;
      totalSpent += spent;

      if (Object.prototype.hasOwnProperty.call(
        categorySpent, expense.category
      )) {
        categorySpent[expense.category] = spent;
      }
    });

    return res.json({
      id: totalBudget?.id || null,
      month: monthKey,
      total_budget: Number(totalBudget?.amount) || 0,
      total_spent: totalSpent,
      categories,
      category_spent: categorySpent,
      budgets
    });
  } catch (error) {
    console.error('Error fetching budgets:', error);
    return res.status(400).json({ error: error.message });
  }
});

// POST /api/budgets
// Save the total budget and category limits.
router.post('/', (req, res) => {
  try {
    const userId = getUserId(req);
    const {
      category,
      amount,
      month,
      year,
      total_budget,
      categories
    } = req.body || {};

    const monthKey = getMonthKey(month, year);

    const saveBudget = db.prepare(`
      INSERT INTO budgets (id, user_id, category, amount, month)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(category, month, user_id)
      DO UPDATE SET amount = excluded.amount
    `);

    // Save multiple category limits and the total budget.
    if (
      categories !== undefined &&
      categories !== null &&
      typeof categories === 'object' &&
      !Array.isArray(categories)
    ) {
      const entries = Object.entries(categories);

      if (entries.some(([cat, limit]) =>
        !cat.trim() ||
        cat === '__TOTAL__' ||
        String(cat).length > 100 ||
        String(limit).trim() === '' ||
        !Number.isFinite(Number(limit)) ||
        Number(limit) <= 0
      )) {
        return res.status(400).json({
          error: 'Every category must have a valid name and positive budget.'
        });
      }

      if (
        total_budget !== undefined &&
        (
          String(total_budget).trim() === '' ||
          !Number.isFinite(Number(total_budget)) ||
          Number(total_budget) <= 0
        )
      ) {
        return res.status(400).json({
          error: 'Total budget must be a positive number.'
        });
      }

      const saveAll = db.transaction(() => {
        if (total_budget !== undefined) {
          saveBudget.run(
            uuidv4(),
            userId,
            '__TOTAL__',
            Number(total_budget),
            monthKey
          );
        }

        for (const [cat, limit] of entries) {
          saveBudget.run(
            uuidv4(),
            userId,
            cat.trim(),
            Number(limit),
            monthKey
          );
        }
      });

      saveAll();

      return res.status(201).json({
        success: true,
        message: 'Budget saved successfully.',
        month: monthKey,
        total_budget: total_budget === undefined
          ? null
          : Number(total_budget),
        categories
      });
    }

    // Save one category budget.
    if (
      typeof category !== 'string' ||
      !category.trim() ||
      category.trim() === '__TOTAL__' ||
      category.length > 100 ||
      amount === undefined ||
      amount === null ||
      String(amount).trim() === '' ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) <= 0
    ) {
      return res.status(400).json({
        error: 'A valid category and positive amount are required.'
      });
    }

    saveBudget.run(
      uuidv4(),
      userId,
      category.trim(),
      Number(amount),
      monthKey
    );

    return res.status(201).json({
      success: true,
      message: 'Category budget saved successfully.',
      category: category.trim(),
      amount: Number(amount),
      month: monthKey
    });
  } catch (error) {
    console.error('Error saving budget:', error);

    return res.status(400).json({
      error: error.message
    });
  }
});

// GET /api/budgets/status?month=2026-10
// Returns category spending and remaining budgets.
router.get('/status', (req, res) => {
  try {
    const userId = getUserId(req);
    const monthKey = getMonthKey(req.query.month, req.query.year);

    const budgets = db.prepare(`
      SELECT id, user_id, category, amount, month
      FROM budgets
      WHERE user_id = ? AND month = ?
      ORDER BY category
    `).all(userId, monthKey);

    const expenses = db.prepare(`
      SELECT category, COALESCE(SUM(amount), 0) AS spent
      FROM transactions
      WHERE user_id = ?
        AND type = 'expense'
        AND strftime('%Y-%m', date) = ?
      GROUP BY category
    `).all(userId, monthKey);

    const expenseMap = {};

    expenses.forEach(expense => {
      expenseMap[expense.category] = Number(expense.spent) || 0;
    });

    const totalSpent = expenses.reduce(
      (sum, expense) => sum + (Number(expense.spent) || 0),
      0
    );

    const totalBudget = budgets.find(
      b => b.category === '__TOTAL__'
    );

    const categoryBudgets = budgets
      .filter(b => b.category !== '__TOTAL__')
      .map(b => {
        const budgetAmount = Number(b.amount) || 0;
        const spent = expenseMap[b.category] || 0;

        return {
          ...b,
          amount: budgetAmount,
          spent,
          remaining: budgetAmount - spent,
          exceeded: spent > budgetAmount
        };
      });

    return res.json({
      month: monthKey,
      total_budget: Number(totalBudget?.amount) || 0,
      total_spent: totalSpent,
      total_remaining:
        (Number(totalBudget?.amount) || 0) - totalSpent,
      categories: categoryBudgets
    });
  } catch (error) {
    console.error('Error fetching budget status:', error);

    return res.status(400).json({
      error: error.message
    });
  }
});

module.exports = router;
