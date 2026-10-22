const express = require('express');
const router = express.Router();
const db = require('../database');
const { v4: uuidv4 } = require('uuid');

function getUserId(req) {
  return req.user?.id || 'usr_demo_1001';
}

// GET /api/transactions
router.get('/', (req, res) => {
  try {
    const userId = getUserId(req);
    const { type, category, startDate, endDate } = req.query;

    let query = `
      SELECT * FROM transactions
      WHERE user_id = @userId
    `;
    const params = { userId };

    if (type) {
      query += ' AND type = @type';
      params.type = type;
    }

    if (category) {
      query += ' AND category = @category';
      params.category = category;
    }

    if (startDate) {
      query += ' AND date >= @startDate';
      params.startDate = startDate;
    }

    if (endDate) {
      query += ' AND date <= @endDate';
      params.endDate = endDate;
    }

    query += ' ORDER BY date DESC';

    res.json(db.prepare(query).all(params));
  } catch (error) {
    console.error('Fetch transactions error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/transactions/summary
router.get('/summary', (req, res) => {
  try {
    const userId = getUserId(req);
    const { month } = req.query;

    let query = `
      SELECT
        COALESCE(SUM(
          CASE WHEN type = 'income' THEN amount ELSE 0 END
        ), 0) AS totalIncome,
        COALESCE(SUM(
          CASE WHEN type = 'expense' THEN amount ELSE 0 END
        ), 0) AS totalExpense
      FROM transactions
      WHERE user_id = @userId
    `;

    const params = { userId };

    if (month) {
      query += " AND strftime('%Y-%m', date) = @month";
      params.month = month;
    }

    const summary = db.prepare(query).get(params);

    res.json({
      totalIncome: Number(summary.totalIncome) || 0,
      totalExpense: Number(summary.totalExpense) || 0,
      balance:
        (Number(summary.totalIncome) || 0) -
        (Number(summary.totalExpense) || 0)
    });
  } catch (error) {
    console.error('Transaction summary error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/transactions
router.post('/', (req, res) => {
  try {
    const userId = getUserId(req);
    const { type, amount, category, description, date } = req.body || {};

    if (
      !['income', 'expense'].includes(type) ||
      amount === undefined ||
      amount === null ||
      String(amount).trim() === '' ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) <= 0 ||
      typeof category !== 'string' ||
      !category.trim()
    ) {
      return res.status(400).json({
        error: 'Valid type, positive amount, and category are required.'
      });
    }

    const transaction = {
      id: uuidv4(),
      user_id: userId,
      type,
      amount: Number(amount),
      category: category.trim(),
      description: description || '',
      date: date || new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    db.prepare(`
      INSERT INTO transactions
        (id, user_id, type, amount, category, description, date, created_at)
      VALUES
        (@id, @user_id, @type, @amount, @category, @description, @date, @created_at)
    `).run(transaction);

    res.status(201).json({
      success: true,
      message: 'Transaction added successfully.',
      transaction
    });
  } catch (error) {
    console.error('Add transaction error:', error);
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/transactions/:id
router.put('/:id', (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { type, amount, category, description, date } = req.body || {};

    const existing = db.prepare(`
      SELECT * FROM transactions
      WHERE id = ? AND user_id = ?
    `).get(id, userId);

    if (!existing) {
      return res.status(404).json({
        error: 'Transaction not found.'
      });
    }

    const updated = {
      type: type ?? existing.type,
      amount: amount === undefined ? Number(existing.amount) : Number(amount),
      category: category ?? existing.category,
      description: description ?? existing.description ?? '',
      date: date ?? existing.date
    };

    if (
      !['income', 'expense'].includes(updated.type) ||
      !Number.isFinite(updated.amount) ||
      updated.amount <= 0 ||
      typeof updated.category !== 'string' ||
      !updated.category.trim()
    ) {
      return res.status(400).json({
        error: 'Valid type, positive amount, and category are required.'
      });
    }

    db.prepare(`
      UPDATE transactions
      SET type = @type,
          amount = @amount,
          category = @category,
          description = @description,
          date = @date
      WHERE id = @id AND user_id = @user_id
    `).run({
      id,
      user_id: userId,
      ...updated,
      category: updated.category.trim()
    });

    res.json({
      success: true,
      message: 'Transaction updated successfully.'
    });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/transactions/:id
router.delete('/:id', (req, res) => {
  try {
    const userId = getUserId(req);

    const result = db.prepare(`
      DELETE FROM transactions
      WHERE id = ? AND user_id = ?
    `).run(req.params.id, userId);

    if (result.changes === 0) {
      return res.status(404).json({
        error: 'Transaction not found.'
      });
    }

    res.json({
      success: true,
      message: 'Transaction deleted successfully.'
    });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
