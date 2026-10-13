const EXPENSE_CATEGORIES = ['Food', 'Shopping', 'Transportation', 'Education', 'Bills', 'Entertainment', 'Healthcare', 'Travel', 'Rent', 'Other'];
const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Business', 'Scholarship', 'Investment', 'Other'];

let currentPage = 1;
let totalPages = 1;

document.addEventListener('DOMContentLoaded', () => {
    redirectIfNotAuth();
    
    // Set default date to today
    document.getElementById('txnDate').valueAsDate = new Date();
    
    updateCategories();
    loadTransactions();

    document.getElementById('filterForm').addEventListener('submit', (e) => {
        e.preventDefault();
        currentPage = 1;
        loadTransactions();
    });

    document.getElementById('transactionForm').addEventListener('submit', saveTransaction);
});

function updateCategories() {
    const type = document.querySelector('input[name="txnType"]:checked').value;
    const categorySelect = document.getElementById('txnCategory');
    const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    
    categorySelect.innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join('');
}

async function loadTransactions() {
    showLoading();
    try {
        const params = new URLSearchParams({
            page: currentPage,
            search: document.getElementById('searchFilter').value,
            type: document.getElementById('typeFilter').value,
            category: document.getElementById('categoryFilter').value,
            start_date: document.getElementById('startDateFilter').value,
            end_date: document.getElementById('endDateFilter').value
        });

        const data = await apiRequest(`/transactions?${params.toString()}`);
        renderTransactionsTable(data.transactions);
        renderPagination(data.page, data.pages);
    } catch (error) {
        console.error('Error loading transactions:', error);
    } finally {
        hideLoading();
    }
}

function renderTransactionsTable(transactions) {
    const tbody = document.getElementById('transactionsTableBody');
    
    if (!transactions || transactions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <i class="bi bi-receipt"></i>
                    <h5>No transactions found</h5>
                    <p>Try adjusting your filters or add a new transaction.</p>
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = transactions.map(t => {
        const isIncome = t.type === 'income';
        return `
            <tr>
                <td>${formatDate(t.date)}</td>
                <td><strong>${t.description}</strong><br><small class="text-muted">${t.notes || ''}</small></td>
                <td><span class="badge bg-light text-dark border"><i class="bi bi-tag me-1"></i>${t.category}</span></td>
                <td>${t.payment_method || '-'}</td>
                <td><span class="badge ${isIncome ? 'badge-income' : 'badge-expense'}">${t.type}</span></td>
                <td class="text-end fw-bold ${isIncome ? 'text-success' : 'text-danger'}">
                    ${isIncome ? '+' : '-'}${formatCurrency(t.amount)}
                </td>
                <td class="text-center">
                    <button class="btn btn-icon btn-sm btn-light text-primary me-1" onclick='openEditModal(${JSON.stringify(t)})'><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-icon btn-sm btn-light text-danger" onclick="promptDelete('${t.id}')"><i class="bi bi-trash"></i></button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderPagination(current, total) {
    const container = document.getElementById('paginationControls');
    if (total <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = `<div class="text-muted small">Page ${current} of ${total}</div>
                <ul class="pagination pagination-sm mb-0">`;
    
    html += `<li class="page-item ${current === 1 ? 'disabled' : ''}">
                <button class="page-link" onclick="changePage(${current - 1})">Previous</button>
             </li>`;
             
    html += `<li class="page-item ${current === total ? 'disabled' : ''}">
                <button class="page-link" onclick="changePage(${current + 1})">Next</button>
             </li>`;
             
    html += `</ul>`;
    container.innerHTML = html;
}

function changePage(page) {
    currentPage = page;
    loadTransactions();
}

function openAddModal() {
    document.getElementById('modalTitle').textContent = 'Add Transaction';
    document.getElementById('txnId').value = '';
    document.getElementById('transactionForm').reset();
    document.getElementById('txnDate').valueAsDate = new Date();
    document.getElementById('typeExpense').checked = true;
    updateCategories();
}

function openEditModal(txn) {
    document.getElementById('modalTitle').textContent = 'Edit Transaction';
    document.getElementById('txnId').value = txn.id;
    
    if (txn.type === 'income') {
        document.getElementById('typeIncome').checked = true;
    } else {
        document.getElementById('typeExpense').checked = true;
    }
    
    updateCategories();
    
    document.getElementById('txnAmount').value = txn.amount;
    document.getElementById('txnDate').value = txn.date.split('T')[0];
    document.getElementById('txnDesc').value = txn.description;
    document.getElementById('txnCategory').value = txn.category;
    document.getElementById('txnMethod').value = txn.payment_method;
    document.getElementById('txnNotes').value = txn.notes || '';

    const modal = new bootstrap.Modal(document.getElementById('transactionModal'));
    modal.show();
}

async function saveTransaction(e) {
    e.preventDefault();
    
    const id = document.getElementById('txnId').value;
    const isEdit = !!id;
    
    const payload = {
        type: document.querySelector('input[name="txnType"]:checked').value,
        amount: parseFloat(document.getElementById('txnAmount').value),
        date: document.getElementById('txnDate').value,
        description: document.getElementById('txnDesc').value,
        category: document.getElementById('txnCategory').value,
        payment_method: document.getElementById('txnMethod').value,
        notes: document.getElementById('txnNotes').value
    };

    try {
        const url = isEdit ? `/transactions/${id}` : '/transactions';
        const method = isEdit ? 'PUT' : 'POST';
        
        await apiRequest(url, {
            method: method,
            body: JSON.stringify(payload)
        });
        
        showToast(`Transaction ${isEdit ? 'updated' : 'added'} successfully`, 'success');
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('transactionModal'));
        modal.hide();
        
        loadTransactions();
    } catch (error) {
        // Error handled by apiRequest
    }
}

function promptDelete(id) {
    document.getElementById('deleteTxnId').value = id;
    const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
    modal.show();
}

async function confirmDelete() {
    const id = document.getElementById('deleteTxnId').value;
    try {
        await apiRequest(`/transactions/${id}`, { method: 'DELETE' });
        showToast('Transaction deleted', 'success');
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
        modal.hide();
        
        loadTransactions();
    } catch (error) {
        // Handled
    }
}
