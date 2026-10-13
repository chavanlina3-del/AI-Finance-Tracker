'use strict';

/*
 * AI Finance Tracker — Dashboard
 * Uses the existing backend API and Chart.js.
 * Charts are created once and updated without animation.
 */

let incomeExpenseChartInstance = null;
let categoryChartInstance = null;
let dashboardLoadInProgress = false;

document.addEventListener('DOMContentLoaded', function () {
    if (typeof redirectIfNotAuth === 'function') {
        redirectIfNotAuth();
    }

    loadDashboard();
});

function dashboardCurrency(value) {
    if (typeof formatCurrency === 'function') {
        return formatCurrency(Number(value) || 0);
    }

    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(Number(value) || 0);
}

function dashboardEscape(value) {
    const replacements = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    };

    return String(value == null ? '' : value).replace(
        /[&<>"']/g,
        function (character) {
            return replacements[character];
        }
    );
}

function dashboardMonthKey(dateValue) {
    if (!dateValue) return '';

    const value = String(dateValue);
    const match = value.match(/^(\d{4}-\d{2})/);

    if (match) return match[1];

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return '';

    return date.getFullYear() + '-' +
        String(date.getMonth() + 1).padStart(2, '0');
}

function dashboardCurrentMonth() {
    const now = new Date();

    return now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0');
}

function dashboardDate(dateValue) {
    if (!dateValue) return '—';

    const date = new Date(String(dateValue).slice(0, 10) + 'T00:00:00');

    if (Number.isNaN(date.getTime())) {
        return String(dateValue);
    }

    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

async function dashboardFetch(endpoint) {
    if (typeof apiRequest !== 'function') {
        throw new Error('API helper not found. Check js/auth.js.');
    }

    return apiRequest(endpoint);
}

async function loadDashboard() {
    if (dashboardLoadInProgress) return;

    dashboardLoadInProgress = true;

    const month = dashboardCurrentMonth();

    try {
        const results = await Promise.allSettled([
            dashboardFetch('/transactions'),
            dashboardFetch('/transactions/summary?month=' + month),
            dashboardFetch('/budgets?month=' + month),
            dashboardFetch('/insights')
        ]);

        const transactionsResult = results[0];
        const summaryResult = results[1];
        const budgetsResult = results[2];
        const insightsResult = results[3];

        const transactions =
            transactionsResult.status === 'fulfilled' &&
            Array.isArray(transactionsResult.value)
                ? transactionsResult.value
                : [];

        const summary =
            summaryResult.status === 'fulfilled'
                ? summaryResult.value
                : {};

        const budgets =
            budgetsResult.status === 'fulfilled' &&
            Array.isArray(budgetsResult.value)
                ? budgetsResult.value
                : [];

        const insights =
            insightsResult.status === 'fulfilled'
                ? insightsResult.value
                : null;

        if (transactionsResult.status === 'rejected') {
            console.error(
                'Could not load transactions:',
                transactionsResult.reason
            );
        }

        if (summaryResult.status === 'rejected') {
            console.error(
                'Could not load transaction summary:',
                summaryResult.reason
            );
        }

        if (budgetsResult.status === 'rejected') {
            console.error(
                'Could not load budgets:',
                budgetsResult.reason
            );
        }

        if (insightsResult.status === 'rejected') {
            console.error(
                'Could not load insights:',
                insightsResult.reason
            );
        }

        updateDashboardCards(transactions, summary, budgets, month);
        renderIncomeExpenseChart(transactions);
        renderCategoryChart(transactions, month);
        renderRecentTransactions(transactions);
        renderDashboardInsights(insights);
    } catch (error) {
        console.error('Dashboard loading failed:', error);
        showDashboardError(
            'Unable to load dashboard data. Check that the backend is running.'
        );
    } finally {
        dashboardLoadInProgress = false;
    }
}

function showDashboardError(message) {
    console.error(message);

    let notice = document.getElementById('dashboardLoadError');

    if (!notice) {
        notice = document.createElement('div');
        notice.id = 'dashboardLoadError';
        notice.className = 'alert alert-warning';
        notice.setAttribute('role', 'alert');

        const main = document.querySelector('main') ||
            document.querySelector('.container-fluid') ||
            document.body;

        main.prepend(notice);
    }

    notice.textContent = message;
}

function updateDashboardCards(transactions, summary, budgets, month) {
    let income = 0;
    let expenses = 0;
    let monthIncome = 0;
    let monthExpenses = 0;

    transactions.forEach(function (transaction) {
        const amount = Number(transaction.amount) || 0;
        const type = String(transaction.type || '').toLowerCase();
        const transactionMonth = dashboardMonthKey(transaction.date);

        if (type === 'income') {
            income += amount;

            if (transactionMonth === month) {
                monthIncome += amount;
            }
        } else if (type === 'expense') {
            expenses += amount;

            if (transactionMonth === month) {
                monthExpenses += amount;
            }
        }
    });

    // Use the verified backend summary for the current month when available.
    if (summary && Number.isFinite(Number(summary.totalIncome))) {
        monthIncome = Number(summary.totalIncome);
    }

    if (summary && Number.isFinite(Number(summary.totalExpense))) {
        monthExpenses = Number(summary.totalExpense);
    }

    const balance = income - expenses;

    const budget = budgets.reduce(function (total, item) {
        return total + (Number(item.amount) || 0);
    }, 0);

    const remainingBudget = budget - monthExpenses;
    const savingsRate = monthIncome > 0
        ? ((monthIncome - monthExpenses) / monthIncome) * 100
        : 0;

    setDashboardText('totalBalance', dashboardCurrency(balance));
    setDashboardText('totalIncome', dashboardCurrency(income));
    setDashboardText('totalExpenses', dashboardCurrency(expenses));
    setDashboardText('monthlyBudget', dashboardCurrency(budget));
    setDashboardText('remainingBudget', dashboardCurrency(remainingBudget));
    setDashboardText('savingsRate', savingsRate.toFixed(1) + '%');
}

function setDashboardText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}

function renderIncomeExpenseChart(transactions) {
    const canvas = document.getElementById('incomeExpenseChart');

    if (!canvas || typeof Chart === 'undefined') {
        console.error('Income/expense chart canvas or Chart.js is missing.');
        return;
    }

    const monthLabels = [];
    const incomeData = [];
    const expenseData = [];
    const now = new Date();

    // Display the latest six months in chronological order.
    for (let offset = 5; offset >= 0; offset--) {
        const date = new Date(
            now.getFullYear(),
            now.getMonth() - offset,
            1
        );

        const key = date.getFullYear() + '-' +
            String(date.getMonth() + 1).padStart(2, '0');

        monthLabels.push(date.toLocaleDateString('en-IN', {
            month: 'short',
            year: '2-digit'
        }));

        let monthIncome = 0;
        let monthExpenses = 0;

        transactions.forEach(function (transaction) {
            if (dashboardMonthKey(transaction.date) !== key) return;

            const amount = Number(transaction.amount) || 0;
            const type = String(transaction.type || '').toLowerCase();

            if (type === 'income') {
                monthIncome += amount;
            } else if (type === 'expense') {
                monthExpenses += amount;
            }
        });

        incomeData.push(monthIncome);
        expenseData.push(monthExpenses);
    }

    const chartData = {
        labels: monthLabels,
        datasets: [
            {
                label: 'Income',
                data: incomeData,
                backgroundColor: 'rgba(25, 135, 84, 0.75)',
                borderColor: '#198754',
                borderWidth: 1,
                borderRadius: 4
            },
            {
                label: 'Expenses',
                data: expenseData,
                backgroundColor: 'rgba(220, 53, 69, 0.75)',
                borderColor: '#dc3545',
                borderWidth: 1,
                borderRadius: 4
            }
        ]
    };

    if (incomeExpenseChartInstance) {
        incomeExpenseChartInstance.data = chartData;
        incomeExpenseChartInstance.update('none');
        return;
    }

    const existingChart = Chart.getChart(canvas);

    if (existingChart) {
        existingChart.destroy();
    }

    incomeExpenseChartInstance = new Chart(canvas, {
        type: 'bar',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            resizeDelay: 150,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return context.dataset.label + ': ' +
                                dashboardCurrency(context.raw);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return '₹' +
                                Number(value).toLocaleString('en-IN');
                        }
                    }
                }
            }
        }
    });
}

function renderCategoryChart(transactions, month) {
    const canvas = document.getElementById('categoryChart');

    if (!canvas || typeof Chart === 'undefined') {
        console.error('Category chart canvas or Chart.js is missing.');
        return;
    }

    const categoryTotals = {};

    transactions.forEach(function (transaction) {
        if (
            dashboardMonthKey(transaction.date) !== month ||
            String(transaction.type || '').toLowerCase() !== 'expense'
        ) {
            return;
        }

        const category = transaction.category || 'Uncategorized';
        categoryTotals[category] =
            (categoryTotals[category] || 0) +
            (Number(transaction.amount) || 0);
    });

    const labels = Object.keys(categoryTotals);
    const values = labels.map(function (category) {
        return categoryTotals[category];
    });

    const colors = [
        '#0d6efd', '#198754', '#ffc107', '#dc3545',
        '#6f42c1', '#0dcaf0', '#fd7e14', '#20c997',
        '#d63384', '#6c757d'
    ];

    const chartData = {
        labels: labels.length ? labels : ['No expenses this month'],
        datasets: [{
            data: labels.length ? values : [1],
            backgroundColor: labels.length
                ? labels.map(function (_, index) {
                    return colors[index % colors.length];
                })
                : ['#dee2e6'],
            borderWidth: 2,
            borderColor: '#ffffff'
        }]
    };

    if (categoryChartInstance) {
        categoryChartInstance.data = chartData;
        categoryChartInstance.update('none');
        return;
    }

    const existingChart = Chart.getChart(canvas);

    if (existingChart) {
        existingChart.destroy();
    }

    categoryChartInstance = new Chart(canvas, {
        type: 'doughnut',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            resizeDelay: 150,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            if (!labels.length) {
                                return 'No expenses this month';
                            }

                            return context.label + ': ' +
                                dashboardCurrency(context.raw);
                        }
                    }
                }
            }
        }
    });
}

function renderRecentTransactions(transactions) {
const table = document.getElementById('recentTransactionsTable');
if (!table) return;

const rows = [...transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

if (rows.length === 0) {
    table.innerHTML = '<tr><td colspan="5" class="text-center">No transactions found</td></tr>';
    return;
}

table.innerHTML = rows.map(function (item) {
    const type = String(item.type || '').toLowerCase();
    const amount = Number(item.amount) || 0;
    const badgeClass = type === 'income' ? 'success' : 'danger';

    return '<tr>' +
        '<td>' + dashboardEscape(dashboardDate(item.date)) + '</td>' +
        '<td>' + dashboardEscape(item.description || item.category || 'Transaction') + '</td>' +
        '<td>' + dashboardEscape(item.category || 'Other') + '</td>' +
        '<td><span class="badge bg-' + badgeClass + '">' + dashboardEscape(type || 'expense') + '</span></td>' +
        '<td>' + dashboardCurrency(amount) + '</td>' +
        '</tr>';
}).join('');

}

function renderDashboardInsights(insights) {
const container = document.getElementById('aiInsightsList');
if (!container) return;

const tips = insights && Array.isArray(insights.tips) ? insights.tips : [];

if (tips.length === 0) {
    container.innerHTML = '<p class="text-muted">No new insights available yet.</p>';
    return;
}

container.innerHTML = tips.map(function (tip) {
    const message = typeof tip === 'string'
        ? tip
        : (tip.message || tip.description || tip.title || JSON.stringify(tip));

    return '<div class="mb-2"><i class="bi bi-lightbulb text-warning me-2"></i>' +
        dashboardEscape(message) + '</div>';
}).join('');

}
