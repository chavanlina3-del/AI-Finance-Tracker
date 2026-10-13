document.addEventListener('DOMContentLoaded', () => {
redirectIfNotAuth();
loadAnalytics();
});

// Keep chart instances so they can be updated instead of recreated.
let trendChartInstance = null;
let categoryChartInstance = null;

async function loadAnalytics() {
showLoading();


try {
    const data = await apiRequest('/analytics');

    if (!data || !data.summary || !data.charts) {
        throw new Error('Invalid analytics response');
    }

    document.getElementById('avgIncome').textContent =
        formatCurrency(data.summary.avgIncome || 0);

    document.getElementById('avgExpense').textContent =
        formatCurrency(data.summary.avgExpense || 0);

    document.getElementById('totalSavings').textContent =
        formatCurrency(data.summary.totalSavings || 0);

    document.getElementById('topCategory').textContent =
        data.summary.topCategory || 'N/A';

    renderTrendChart(data.charts.trend);
    renderCategoryPieChart(data.charts.category);

} catch (error) {
    console.error('Error loading analytics:', error);
} finally {
    hideLoading();
}


}

function renderTrendChart(chartData) {
const canvas = document.getElementById('trendChart');


if (!canvas || !chartData || typeof Chart === 'undefined') {
    console.error('Trend chart canvas or Chart.js is unavailable.');
    return;
}

const chartConfig = {
    labels: chartData.labels || [],
    datasets: [
        {
            label: 'Income',
            data: chartData.income || [],
            borderColor: '#06d6a0',
            backgroundColor: 'rgba(6, 214, 160, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.25,
            pointRadius: 3,
            pointHoverRadius: 5
        },
        {
            label: 'Expense',
            data: chartData.expense || [],
            borderColor: '#ef476f',
            backgroundColor: 'rgba(239, 71, 111, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.25,
            pointRadius: 3,
            pointHoverRadius: 5
        }
    ]
};

if (trendChartInstance) {
    trendChartInstance.data = chartConfig;
    trendChartInstance.update('none');
    return;
}

trendChartInstance = new Chart(canvas, {
    type: 'line',
    data: chartConfig,
    options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: {
            mode: 'index',
            intersect: false
        },
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});


}

function renderCategoryPieChart(chartData) {
const canvas = document.getElementById('categoryPieChart');


if (!canvas || !chartData || typeof Chart === 'undefined') {
    console.error('Category chart canvas or Chart.js is unavailable.');
    return;
}

const chartConfig = {
    labels: chartData.labels || [],
    datasets: [{
        data: chartData.values || [],
        backgroundColor: [
            '#4361ee',
            '#06d6a0',
            '#ffd166',
            '#ef476f',
            '#4cc9f0',
            '#9d4edd',
            '#f72585',
            '#7209b7'
        ],
        borderWidth: 1,
        borderColor: '#fff'
    }]
};

if (categoryChartInstance) {
    categoryChartInstance.data = chartConfig;
    categoryChartInstance.update('none');
    return;
}

categoryChartInstance = new Chart(canvas, {
    type: 'pie',
    data: chartConfig,
    options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
            legend: {
                position: 'right'
            }
        }
    }
});


}
