
const express = require('express');
const router = express.Router();
const db = require('../database');

// GET /api/analytics
router.get('/', (req, res) => {
  try {
    const totals = db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS totalIncome,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS totalExpense
      FROM transactions
    `).get();

    const months = db.prepare(`
      SELECT
        strftime('%Y-%m', date) AS month,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense
      FROM transactions
      WHERE date >= date('now', 'start of month', '-5 months')
      GROUP BY strftime('%Y-%m', date)
      ORDER BY month
    `).all();

    const categoryRows = db.prepare(`
      SELECT category, COALESCE(SUM(amount), 0) AS total
      FROM transactions
      WHERE type = 'expense'
      GROUP BY category
      ORDER BY total DESC
    `).all();

    const yearlyTotals = db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense
      FROM transactions
      WHERE strftime('%Y', date) = strftime('%Y', 'now')
    `).get();

    const trendMap = new Map(months.map(row => [row.month, row]));
    const labels = [];
    const income = [];
    const expense = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setDate(1);
      date.setMonth(date.getMonth() - i);

      const key = date.getFullYear() + '-' +
        String(date.getMonth() + 1).padStart(2, '0');

      const row = trendMap.get(key);
      labels.push(date.toLocaleString('en-IN', {
        month: 'short',
        year: 'numeric'
      }));
      income.push(row ? Number(row.income) || 0 : 0);
      expense.push(row ? Number(row.expense) || 0 : 0);
    }

    const totalIncome = Number(totals.totalIncome) || 0;
    const totalExpense = Number(totals.totalExpense) || 0;

    res.json({
      summary: {
        avgIncome: totalIncome / 6,
        avgExpense: totalExpense / 6,
        totalSavings:
          (Number(yearlyTotals.income) || 0) -
          (Number(yearlyTotals.expense) || 0),
        topCategory: categoryRows.length
          ? categoryRows[0].category
          : 'N/A'
      },
      charts: {
        trend: {
          labels: labels,
          income: income,
          expense: expense
        },
        category: {
          labels: categoryRows.map(row => row.category),
          values: categoryRows.map(row => Number(row.total) || 0)
        }
      }
    });
  } catch (error) {
    console.error('Analytics route error:', error);
    res.status(500).json({
      error: 'Unable to load analytics data.'
    });
  }
});

module.exports = router;

