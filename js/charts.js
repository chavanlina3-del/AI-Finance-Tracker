/**
 * FinAI - Dynamic Chart.js Visualizations
 * Zero-error chart controller with dark/light theme awareness and instance lifecycle management
 */

let cashflowChartInstance = null;
let categoryDonutChartInstance = null;
let spendingTrendChartInstance = null;
let ratioDonutChartInstance = null;

// Get active theme colors
function getThemeChartColors() {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  return {
    textColor: isLight ? '#475569' : '#9ca3af',
    gridColor: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.08)',
    tooltipBg: isLight ? '#1e293b' : '#0f172a',
    tooltipText: '#ffffff'
  };
}

// Render or Update Cash Flow Chart (Income vs Expense)
function renderCashflowChart(transactions) {
  const canvas = document.getElementById('cashflowChart');
  if (!canvas || typeof Chart === 'undefined') return;

  const colors = getThemeChartColors();

  // Aggregate last 6 months
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const labels = [];
  const incomeData = [];
  const expenseData = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mIndex = d.getMonth();
    const y = d.getFullYear();
    labels.push(`${monthNames[mIndex]}`);

    // Filter txs
    let inc = 0;
    let exp = 0;
    transactions.forEach(tx => {
      const txDate = new Date(tx.date);
      if (txDate.getMonth() === mIndex && txDate.getFullYear() === y) {
        if (tx.type === 'INCOME') inc += Number(tx.amount) || 0;
        else if (tx.type === 'EXPENSE') exp += Number(tx.amount) || 0;
      }
    });

    incomeData.push(inc);
    expenseData.push(exp);
  }

  if (cashflowChartInstance) {
    cashflowChartInstance.destroy();
  }

  cashflowChartInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          backgroundColor: '#10b981',
          borderRadius: 6,
          barPercentage: 0.6
        },
        {
          label: 'Expenses',
          data: expenseData,
          backgroundColor: '#ef4444',
          borderRadius: 6,
          barPercentage: 0.6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: { color: colors.textColor, font: { family: 'Plus Jakarta Sans', size: 12, weight: '600' } }
        },
        tooltip: {
          backgroundColor: colors.tooltipBg,
          titleColor: colors.tooltipText,
          bodyColor: colors.tooltipText,
          cornerRadius: 8,
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: colors.textColor, font: { family: 'Plus Jakarta Sans', size: 12 } }
        },
        y: {
          grid: { color: colors.gridColor },
          ticks: {
            color: colors.textColor,
            font: { family: 'Plus Jakarta Sans', size: 11 },
            callback: (val) => formatCurrencyShort(val)
          }
        }
      }
    }
  });
}

// Render or Update Spending by Category Donut Chart
function renderCategoryDonutChart(transactions) {
  const canvas = document.getElementById('categoryDonutChart');
  if (!canvas || typeof Chart === 'undefined') return;

  const colors = getThemeChartColors();

  // Aggregate current month expenses by category
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const catMap = {};
  transactions
    .filter(tx => tx.type === 'EXPENSE')
    .forEach(tx => {
      const d = new Date(tx.date);
      // Group all or current month
      const cat = tx.category || 'Other';
      catMap[cat] = (catMap[cat] || 0) + (Number(tx.amount) || 0);
    });

  const labels = Object.keys(catMap);
  const data = Object.values(catMap);

  const palette = [
    '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#06b6d4',
    '#8b5cf6', '#3b82f6', '#f97316', '#14b8a6', '#64748b'
  ];

  if (categoryDonutChartInstance) {
    categoryDonutChartInstance.destroy();
  }

  if (data.length === 0) {
    // Show placeholder empty donut
    categoryDonutChartInstance = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['No Expenses Logged'],
        datasets: [{ data: [1], backgroundColor: ['#374151'] }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: colors.textColor } }
        }
      }
    });
    return;
  }

  categoryDonutChartInstance = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: palette.slice(0, labels.length),
          borderWidth: 2,
          borderColor: document.documentElement.getAttribute('data-theme') === 'light' ? '#ffffff' : '#111827'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            boxWidth: 12,
            padding: 12,
            color: colors.textColor,
            font: { family: 'Plus Jakarta Sans', size: 12 }
          }
        },
        tooltip: {
          backgroundColor: colors.tooltipBg,
          titleColor: colors.tooltipText,
          bodyColor: colors.tooltipText,
          cornerRadius: 8,
          callbacks: {
            label: (ctx) => ` ${ctx.label}: ${formatCurrency(ctx.parsed)}`
          }
        }
      }
    }
  });
}

// Render Analytics Spending Trend Line Chart
function renderSpendingTrendChart(transactions) {
  const canvas = document.getElementById('spendingTrendChart');
  if (!canvas || typeof Chart === 'undefined') return;

  const colors = getThemeChartColors();

  // Sort expenses by date
  const expenses = transactions
    .filter(t => t.type === 'EXPENSE')
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const dateLabels = [];
  const cumulativeData = [];
  let runningTotal = 0;

  expenses.slice(-15).forEach(tx => {
    dateLabels.push(new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
    runningTotal += Number(tx.amount) || 0;
    cumulativeData.push(runningTotal);
  });

  if (spendingTrendChartInstance) {
    spendingTrendChartInstance.destroy();
  }

  spendingTrendChartInstance = new Chart(canvas, {
    type: 'line',
    data: {
      labels: dateLabels.length ? dateLabels : ['No Data'],
      datasets: [
        {
          label: 'Cumulative Expense Spend',
          data: cumulativeData.length ? cumulativeData : [0],
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.12)',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointBackgroundColor: '#8b5cf6'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: colors.textColor } },
        tooltip: {
          callbacks: {
            label: (ctx) => ` Total Spent: ${formatCurrency(ctx.parsed.y)}`
          }
        }
      },
      scales: {
        x: { ticks: { color: colors.textColor } },
        y: {
          grid: { color: colors.gridColor },
          ticks: { color: colors.textColor, callback: (v) => formatCurrencyShort(v) }
        }
      }
    }
  });
}

// Render Ratio Donut (Income vs Expense)
function renderRatioDonutChart(totalIncome, totalExpense) {
  const canvas = document.getElementById('ratioDonutChart');
  if (!canvas || typeof Chart === 'undefined') return;

  const colors = getThemeChartColors();

  if (ratioDonutChartInstance) {
    ratioDonutChartInstance.destroy();
  }

  ratioDonutChartInstance = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: ['Income Total', 'Expense Total'],
      datasets: [
        {
          data: [totalIncome || 1, totalExpense || 0],
          backgroundColor: ['#10b981', '#ef4444'],
          borderWidth: 2,
          borderColor: document.documentElement.getAttribute('data-theme') === 'light' ? '#ffffff' : '#111827'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: { position: 'bottom', labels: { color: colors.textColor } }
      }
    }
  });
}

// Refresh all charts when data or currency or theme changes
function refreshAllCharts(transactions, totalIncome, totalExpense) {
  renderCashflowChart(transactions);
  renderCategoryDonutChart(transactions);
  renderSpendingTrendChart(transactions);
  renderRatioDonutChart(totalIncome, totalExpense);
}
