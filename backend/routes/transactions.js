const express = require('express');
const router = express.Router();
const db = require('../database');
const { v4: uuidv4 } = require('uuid');

router.get('/', (req, res) => {
  try {
    const { type, category, startDate, endDate } = req.query;
    let query = 'SELECT * FROM transactions WHERE 1=1';
    const params = {};

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
    const transactions = db.prepare(query).all(params);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/summary', (req, res) => {
  try {
    const { month } = req.query; // YYYY-MM
    let params = {};
    let whereClause = '';
    
    if (month) {
      whereClause = "WHERE strftime('%Y-%m', date) = @month";
      params.month = month;
    }

    const summary = db.prepare(`
      SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as totalIncome,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as totalExpense
      FROM transactions
      ${whereClause}
    `).get(params);

    res.json({
      totalIncome: summary.totalIncome || 0,
      totalExpense: summary.totalExpense || 0,
      balance: (summary.totalIncome || 0) - (summary.totalExpense || 0)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { type, amount, category, description, date } = req.body;
    const newTransaction = {
      id: uuidv4(),
      type,
      amount,
      category,
      description: description || '',
      date: date || new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    const stmt = db.prepare(`
      INSERT INTO transactions (id, type, amount, category, description, date, created_at)
      VALUES (@id, @type, @amount, @category, @description, @date, @created_at)
    `);
    
    stmt.run(newTransaction);
    res.status(201).json(newTransaction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { type, amount, category, description, date } = req.body;
    
    const stmt = db.prepare(`
      UPDATE transactions 
      SET type = @type, amount = @amount, category = @category, description = @description, date = @date
      WHERE id = @id
    `);
    
    const result = stmt.run({ id, type, amount, category, description, date });
    if (result.changes === 0) return res.status(404).json({ error: 'Transaction not found' });
    
    res.json({ message: 'Transaction updated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM transactions WHERE id = ?');
    const result = stmt.run(id);
    
    if (result.changes === 0) return res.status(404).json({ error: 'Transaction not found' });
    
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
