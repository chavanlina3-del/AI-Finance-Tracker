document.addEventListener('DOMContentLoaded', () => {
    redirectIfNotAuth();
    loadGoals();

    document.getElementById('goalForm').addEventListener('submit', saveGoal);
    document.getElementById('progressForm').addEventListener('submit', updateProgress);
});

async function loadGoals() {
    showLoading();
    try {
        const data = await apiRequest('/goals');
        renderGoals(data);
    } catch (error) {
        console.error('Error loading goals:', error);
    } finally {
        hideLoading();
    }
}

function renderGoals(goals) {
    const container = document.getElementById('goalsContainer');
    
    if (!goals || goals.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="empty-state card">
                    <i class="bi bi-trophy"></i>
                    <h5>No goals set yet</h5>
                    <p>Set a financial goal to start saving for your future.</p>
                    <button class="btn btn-primary mt-2" onclick="openGoalModal()">Add Goal</button>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = goals.map(goal => {
        const pct = Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100));
        let badgeColor = 'bg-primary';
        if (goal.status === 'Completed') badgeColor = 'bg-success';
        if (goal.status === 'Cancelled') badgeColor = 'bg-secondary';
        
        let progressColor = 'bg-primary';
        if (pct >= 100) progressColor = 'bg-success';

        return `
            <div class="col-md-6 col-lg-4">
                <div class="card h-100">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <h5 class="card-title mb-0">${goal.name}</h5>
                            <span class="badge ${badgeColor}">${goal.status}</span>
                        </div>
                        
                        <div class="mb-4">
                            <div class="d-flex justify-content-between text-muted small mb-1">
                                <span>Progress</span>
                                <span>${pct}%</span>
                            </div>
                            <div class="progress" style="height: 10px;">
                                <div class="progress-bar ${progressColor}" style="width: ${pct}%"></div>
                            </div>
                        </div>
                        
                        <div class="row text-center g-2 mb-3">
                            <div class="col-6">
                                <div class="bg-light rounded p-2">
                                    <div class="small text-muted">Current</div>
                                    <div class="fw-bold">${formatCurrency(goal.current_amount)}</div>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="bg-light rounded p-2">
                                    <div class="small text-muted">Target</div>
                                    <div class="fw-bold">${formatCurrency(goal.target_amount)}</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                            <div class="small text-muted"><i class="bi bi-calendar3 me-1"></i> ${formatDate(goal.target_date)}</div>
                            <div class="btn-group">
                                <button class="btn btn-sm btn-outline-primary" onclick='openProgressModal(${JSON.stringify(goal)})'>Update</button>
                                <button class="btn btn-sm btn-outline-secondary" onclick='openGoalModal(${JSON.stringify(goal)})'><i class="bi bi-pencil"></i></button>
                                <button class="btn btn-sm btn-outline-danger" onclick="deleteGoal('${goal.id}')"><i class="bi bi-trash"></i></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function openGoalModal(goal = null) {
    document.getElementById('modalTitle').textContent = goal ? 'Edit Goal' : 'Add Goal';
    
    document.getElementById('goalId').value = goal ? goal.id : '';
    document.getElementById('goalName').value = goal ? goal.name : '';
    document.getElementById('targetAmount').value = goal ? goal.target_amount : '';
    document.getElementById('currentAmount').value = goal ? goal.current_amount : 0;
    
    if (goal && goal.target_date) {
        document.getElementById('targetDate').value = goal.target_date.split('T')[0];
    } else {
        document.getElementById('targetDate').value = '';
    }
    
    document.getElementById('goalStatus').value = goal ? goal.status : 'Active';

    new bootstrap.Modal(document.getElementById('goalModal')).show();
}

async function saveGoal(e) {
    e.preventDefault();
    
    const id = document.getElementById('goalId').value;
    const isEdit = !!id;
    
    const payload = {
        name: document.getElementById('goalName').value,
        target_amount: parseFloat(document.getElementById('targetAmount').value),
        current_amount: parseFloat(document.getElementById('currentAmount').value),
        target_date: document.getElementById('targetDate').value,
        status: document.getElementById('goalStatus').value
    };

    try {
        const url = isEdit ? `/goals/${id}` : '/goals';
        const method = isEdit ? 'PUT' : 'POST';
        
        await apiRequest(url, {
            method: method,
            body: JSON.stringify(payload)
        });
        
        showToast(`Goal ${isEdit ? 'updated' : 'added'} successfully`, 'success');
        bootstrap.Modal.getInstance(document.getElementById('goalModal')).hide();
        loadGoals();
    } catch (error) {}
}

function openProgressModal(goal) {
    document.getElementById('progGoalId').value = goal.id;
    document.getElementById('progCurrentAmount').value = goal.current_amount;
    new bootstrap.Modal(document.getElementById('progressModal')).show();
}

async function updateProgress(e) {
    e.preventDefault();
    const id = document.getElementById('progGoalId').value;
    const current_amount = parseFloat(document.getElementById('progCurrentAmount').value);
    
    try {
        await apiRequest(`/goals/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ current_amount })
        });
        
        showToast('Progress updated', 'success');
        bootstrap.Modal.getInstance(document.getElementById('progressModal')).hide();
        loadGoals();
    } catch (error) {}
}

async function deleteGoal(id) {
    if (!confirm('Are you sure you want to delete this goal?')) return;
    try {
        await apiRequest(`/goals/${id}`, { method: 'DELETE' });
        showToast('Goal deleted', 'success');
        loadGoals();
    } catch (error) {}
}
