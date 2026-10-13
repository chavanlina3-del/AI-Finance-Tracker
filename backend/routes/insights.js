const express = require('express');
const router = express.Router();
const db = require('../database');
const { startOfMonth, endOfMonth, subMonths, format, differenceInDays } = require('date-fns');

router.get('/', (req, res) => {
  try {
    const today = new Date();
    const currentMonthStr = format(today, 'yyyy-MM');
    const lastMonth = subMonths(today, 1);
    const lastMonthStr = format(lastMonth, 'yyyy-MM');
    
    // Total income/expense for current month
    const currentMonthTotals = db.prepare(`
      SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
      FROM transactions
      WHERE strftime('%Y-%m', date) = ?
    `).get(currentMonthStr);
    
    const currentIncome = currentMonthTotals.income || 0;
    const currentExpense = currentMonthTotals.expense || 0;

    // Total income/expense for last month
    const lastMonthTotals = db.prepare(`
      SELECT SUM(amount) as expense
      FROM transactions
      WHERE type = 'expense' AND strftime('%Y-%m', date) = ?
    `).get(lastMonthStr);
    
    const lastExpense = lastMonthTotals.expense || 0;

    // Top spending category
    const topCategory = db.prepare(`
      SELECT category, SUM(amount) as spent
      FROM transactions
      WHERE type = 'expense' AND strftime('%Y-%m', date) = ?
      GROUP BY category
      ORDER BY spent DESC
      LIMIT 1
    `).get(currentMonthStr);

    // Spending trend (up/down vs last month with percentage)
    let trend = 0;
    if (lastExpense > 0) {
      trend = ((currentExpense - lastExpense) / lastExpense) * 100;
    } else if (currentExpense > 0) {
      trend = 100;
    }

    // Average daily spending
    const daysInMonth = today.getDate(); // Up to today
    const avgDailySpending = currentExpense / (daysInMonth || 1);

    // Predicted month-end total
    const totalDaysInCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const predictedTotal = avgDailySpending * totalDaysInCurrentMonth;

    // Saving rate percentage
    let savingRate = 0;
    if (currentIncome > 0) {
      savingRate = ((currentIncome - currentExpense) / currentIncome) * 100;
    }

    // Personalized tips
    const tips = [];
    if (savingRate < 20) {
      tips.push("Your saving rate is below 20%. Try identifying non-essential expenses to cut back on.");
    } else {
      tips.push("Great job! Your saving rate is looking healthy.");
    }
    
    if (trend > 10) {
      tips.push(`Your spending is up ${trend.toFixed(1)}% compared to last month. Keep an eye on your budget!`);
    } else if (trend < 0) {
      tips.push("Nice work! You're spending less than last month.");
    }

    if (topCategory) {
      tips.push(`You spend the most on ${topCategory.category}. Check if you can reduce costs in this area.`);
    }

    if (avgDailySpending > (currentIncome / totalDaysInCurrentMonth)) {
       tips.push("Your daily spending is outpacing your daily income average.");
    }

    res.json({
      currentMonth: {
        income: currentIncome,
        expense: currentExpense
      },
      topCategory: topCategory ? topCategory.category : null,
      topCategorySpent: topCategory ? topCategory.spent : 0,
      spendingTrendPercent: trend,
      avgDailySpending,
      predictedMonthEndTotal: predictedTotal,
      savingRatePercent: savingRate,
      tips
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
