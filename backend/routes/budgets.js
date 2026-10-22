
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

// GET /api/budgets
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

      if (
        Object.prototype.hasOwnProperty.call(
          categorySpent, expense.category
        )
      ) {
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
// Save total budget and category limits.
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

    if (
      categories !== undefined &&
      categories !== null &&
      typeof categories === 'object' &&
      !Array.isArray(categories)
    ) {
      const entries = Object.entries(categories);

      if (entries.some(([cat, limit]) =>
        typeof cat !== 'string' ||
        !cat.trim() ||
        cat.trim() === '__TOTAL__' ||
        cat.length > 100 ||
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

// PUT /api/budgets/:id
// Edit an existing budget.

router.put('/:id', (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const {
      category,
      amount,
      month,
      year,
      total_budget,
      categories
    } = req.body || {};

    const existing = db.prepare(`
      SELECT id, user_id, category, amount, month
      FROM budgets
      WHERE id = ? AND user_id = ?
    `).get(id, userId);

    if (!existing) {
      return res.status(404).json({
        error: 'Budget not found. Refresh the budget list and try again.'
      });
    }

    const monthKey = getMonthKey(
      month === undefined ? existing.month : month,
      year
    );

    const saveBudget = db.prepare(`
      INSERT INTO budgets (id, user_id, category, amount, month)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(category, month, user_id)
      DO UPDATE SET amount = excluded.amount
    `);

    // Save total and category budgets together.
    if (
      categories !== undefined &&
      categories !== null &&
      typeof categories === 'object' &&
      !Array.isArray(categories)
    ) {
      const entries = Object.entries(categories);

      if (
        total_budget !== undefined &&
        (!Number.isFinite(Number(total_budget)) ||
          Number(total_budget) <= 0)
      ) {
        return res.status(400).json({
          error: 'Total budget must be a positive number.'
        });
      }

      if (entries.some(([cat, limit]) =>
        typeof cat !== 'string' ||
        !cat.trim() ||
        cat.trim() === '__TOTAL__' ||
        cat.length > 100 ||
        String(limit).trim() === '' ||
        !Number.isFinite(Number(limit)) ||
        Number(limit) <= 0
      )) {
        return res.status(400).json({
          error: 'Every category must have a valid name and positive budget.'
        });
      }

      const saveAll = db.transaction(() => {
        if (total_budget !== undefined) {
          saveBudget.run(
            id,
            userId,
            '__TOTAL__',
            Number(total_budget),
            monthKey
          );
        }

        for (const [cat, limit] of entries) {
          saveBudget.run(
            require('uuid').v4(),
            userId,
            cat.trim(),
            Number(limit),
            monthKey
          );
        }
      });

      saveAll();

      return res.json({
        success: true,
        message: 'Budget updated successfully.',
        month: monthKey,
        total_budget: total_budget === undefined
          ? null
          : Number(total_budget),
        categories
      });
    }

    // Preserve support for editing a single category budget.
    const newCategory = category === undefined
      ? existing.category
      : typeof category === 'string'
        ? category.trim()
        : '';

    const newAmount = amount === undefined
      ? Number(existing.amount)
      : String(amount).trim() === ''
        ? NaN
        : Number(amount);

    if (
      !newCategory ||
      newCategory.length > 100 ||
      !Number.isFinite(newAmount) ||
      newAmount <= 0
    ) {
      return res.status(400).json({
        error: 'A valid category and positive amount are required.'
      });
    }

    db.prepare(`
      UPDATE budgets
      SET category = ?, amount = ?, month = ?
      WHERE id = ? AND user_id = ?
    `).run(newCategory, newAmount, monthKey, id, userId);

    return res.json({
      success: true,
      message: 'Budget updated successfully.'
    });
  } catch (error) {
    console.error('Error updating budget:', error);

    return res.status(400).json({
      error: error.message || 'Failed to update budget.'
    });
  }
});

// GET /api/budgets/status
// Return category spending and remaining budgets.
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
