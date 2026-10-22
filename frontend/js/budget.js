const CATEGORIES = ['Food', 'Shopping', 'Transportation', 'Education', 'Bills', 'Entertainment', 'Healthcare', 'Travel', 'Rent', 'Other'];

document.addEventListener('DOMContentLoaded', () => {
    redirectIfNotAuth();
    
    // Set current month and year
    const now = new Date();
    document.getElementById('monthSelect').value = now.getMonth() + 1;
    document.getElementById('yearSelect').value = now.getFullYear();

    loadBudget();

    document.getElementById('monthSelect').addEventListener('change', loadBudget);
    document.getElementById('yearSelect').addEventListener('change', loadBudget);
    document.getElementById('budgetForm').addEventListener('submit', saveBudget);
});

async function loadBudget() {
    showLoading();
    const month = document.getElementById('monthSelect').value;
    const year = document.getElementById('yearSelect').value;
    
    try {
        const data = await apiRequest(`/budgets?month=${month}&year=${year}`);
        renderBudget(data);
    } catch (error) {
        console.error('Error loading budget:', error);
    } finally {
        hideLoading();
    }
}

function renderBudget(data) {
    const container = document.getElementById('budgetContent');
    
    if (!data || !data.total_budget) {
        container.innerHTML = `
            <div class="empty-state card">
                <i class="bi bi-wallet2"></i>
                <h5>No budget set for this month</h5>
                <p>Create a budget to track your spending effectively.</p>
                <button class="btn btn-primary mt-2" onclick="openBudgetModal()">Create Budget</button>
            </div>
        `;
        return;
    }

    const totalSpent = data.total_spent || 0;
    const totalBudget = data.total_budget;
    const totalPct = Math.min(100, Math.round((totalSpent / totalBudget) * 100));
    const totalColorClass = totalPct > 90 ? 'bg-danger' : (totalPct > 75 ? 'bg-warning' : 'bg-success');

    let html = `
        <div class="card mb-4 border-primary">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-end mb-3">
                    <div>
                        <h6 class="text-muted text-uppercase mb-1">Total Monthly Budget</h6>
                        <h2 class="mb-0">${formatCurrency(totalSpent)} <span class="fs-5 text-muted fw-normal">/ ${formatCurrency(totalBudget)}</span></h2>
                    </div>
                    <div class="text-end">
                        <button class="btn btn-sm btn-outline-primary" onclick='openBudgetModal(${JSON.stringify(data)})'>
                            <i class="bi bi-pencil"></i> Edit Budget
                        </button>
                    </div>
                </div>
                <div class="progress" style="height: 12px;">
                    <div class="progress-bar ${totalColorClass}" role="progressbar" style="width: ${totalPct}%"></div>
                </div>
                <div class="mt-2 text-end small text-muted">${totalPct}% Used</div>
            </div>
        </div>
        
        <h5 class="mb-3">Category Budgets</h5>
        <div class="row g-3">
    `;

    const catBudgets = data.categories || {};
    const catSpent = data.category_spent || {};

    CATEGORIES.forEach(cat => {
        if (catBudgets[cat]) {
            const budget = catBudgets[cat];
            const spent = catSpent[cat] || 0;
            const pct = Math.min(100, Math.round((spent / budget) * 100));
            const colorClass = pct > 90 ? 'bg-danger' : (pct > 75 ? 'bg-warning' : 'bg-success');
            
            html += `
                <div class="col-md-6 col-lg-4">
                    <div class="card h-100">
                        <div class="card-body">
                            <div class="d-flex justify-content-between mb-2">
                                <strong class="text-dark">${cat}</strong>
                                <span class="fw-bold">${formatCurrency(spent)} <small class="text-muted fw-normal">/ ${formatCurrency(budget)}</small></span>
                            </div>
                            <div class="progress mb-2" style="height: 8px;">
                                <div class="progress-bar ${colorClass}" style="width: ${pct}%"></div>
                            </div>
                            <div class="d-flex justify-content-between small">
                                <span class="${pct > 100 ? 'text-danger fw-bold' : 'text-muted'}">
                                    ${pct > 100 ? 'Over budget by ' + formatCurrency(spent - budget) : formatCurrency(budget - spent) + ' left'}
                                </span>
                                <span class="text-muted">${pct}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    });

    html += '</div>';
    container.innerHTML = html;
}

function openBudgetModal(data = null) {
    const inputsContainer = document.getElementById('categoryInputs');
    inputsContainer.innerHTML = '';
    
    CATEGORIES.forEach(cat => {
        const value = data && data.categories && data.categories[cat] ? data.categories[cat] : '';
        inputsContainer.innerHTML += `
            <div class="col-md-6">
                <label class="form-label small text-muted">${cat}</label>
                <div class="input-group input-group-sm">
                    <span class="input-group-text">$</span>
                    <input type="number" class="form-control cat-budget-input" data-category="${cat}" value="${value}" step="0.01" min="0">
                </div>
            </div>
        `;
    });

    document.getElementById('budgetId').value = data ? data.id : '';
    document.getElementById('totalBudget').value = data ? data.total_budget : '';

    const modal = new bootstrap.Modal(document.getElementById('budgetModal'));
    modal.show();
}


async function saveBudget(e) {
    e.preventDefault();

    const id = document.getElementById('budgetId').value;
    const total_budget = parseFloat(
        document.getElementById('totalBudget').value
    );

    const categories = {};

    document.querySelectorAll('.cat-budget-input').forEach(input => {
        const val = parseFloat(input.value);

        if (Number.isFinite(val) && val > 0) {
            categories[input.dataset.category] = val;
        }
    });

    const payload = {
        month: parseInt(document.getElementById('monthSelect').value),
        year: parseInt(document.getElementById('yearSelect').value),
        total_budget,
        categories
    };

    if (!Number.isFinite(total_budget) || total_budget <= 0) {
        showToast('Please enter a valid total budget.', 'error');
        return;
    }

    try {
        const url = id ? `/budgets/${encodeURIComponent(id)}` : '/budgets';
        const method = id ? 'PUT' : 'POST';

        const result = await apiRequest(url, {
            method,
            body: JSON.stringify(payload)
        });

        showToast('Budget saved successfully!', 'success');

        const modalElement = document.getElementById('budgetModal');
        const modal = bootstrap.Modal.getInstance(modalElement);

        if (modal) {
            modal.hide();
        }

        await loadBudget();

    } catch (error) {
        console.error('Save budget error:', error);
        showToast(
            error.message || 'Could not save budget. Please try again.',
            'error'
        );
    }
}
