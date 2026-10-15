/**
 * FinAI - Core Application Logic & State Controller
 * Manages transactions, budgets, savings goals, currency formatting, views, and data persistence
 */

// Application State
const state = {
  currentUser: null,
  currency: 'USD',
  theme: 'dark',
  transactions: [],
  budgets: [],
  goals: [],
  activeView: 'dashboard',
  filterSearch: '',
  filterType: 'ALL',
  filterCategory: 'ALL',
  filterSort: 'date-desc'
};

// Currency metadata
const CURRENCY_CONFIG = {
  USD: { symbol: '$', locale: 'en-US' },
  EUR: { symbol: '€', locale: 'de-DE' },
  GBP: { symbol: '£', locale: 'en-GB' },
  INR: { symbol: '₹', locale: 'en-IN' },
  CAD: { symbol: 'CA$', locale: 'en-CA' },
  AUD: { symbol: 'A$', locale: 'en-AU' },
  JPY: { symbol: '¥', locale: 'ja-JP' }
};

// Default Categories with Icons
const CATEGORIES = {
  INCOME: [
    { name: 'Salary', icon: 'fa-briefcase' },
    { name: 'Investment', icon: 'fa-arrow-trend-up' },
    { name: 'Freelance', icon: 'fa-laptop-code' },
    { name: 'Other', icon: 'fa-wallet' }
  ],
  EXPENSE: [
    { name: 'Food & Dining', icon: 'fa-utensils' },
    { name: 'Housing', icon: 'fa-house' },
    { name: 'Transportation', icon: 'fa-car' },
    { name: 'Utilities', icon: 'fa-bolt' },
    { name: 'Entertainment', icon: 'fa-film' },
    { name: 'Healthcare', icon: 'fa-heart-pulse' },
    { name: 'Shopping', icon: 'fa-bag-shopping' },
    { name: 'Other', icon: 'fa-tag' }
  ]
};

// Default Starter Dataset for instantaneous out-of-the-box delight
function getStarterData() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');

  return {
    transactions: [
      { id: 'tx_1', title: 'Senior Software Engineer Salary', amount: 5200, type: 'INCOME', category: 'Salary', date: `${y}-${m}-01`, notes: 'Direct deposit bi-weekly' },
      { id: 'tx_2', title: 'Apartment Rental Lease', amount: 1650, type: 'EXPENSE', category: 'Housing', date: `${y}-${m}-02`, notes: 'Monthly rent transfer' },
      { id: 'tx_3', title: 'Whole Foods Market', amount: 142.50, type: 'EXPENSE', category: 'Food & Dining', date: `${y}-${m}-04`, notes: 'Organic groceries & produce' },
      { id: 'tx_4', title: 'High-Speed Fiber Internet', amount: 79.99, type: 'EXPENSE', category: 'Utilities', date: `${y}-${m}-06`, notes: 'Gigabit fiber connection' },
      { id: 'tx_5', title: 'Freelance UI/UX Consulting', amount: 850, type: 'INCOME', category: 'Freelance', date: `${y}-${m}-08`, notes: 'SaaS design audit sprint' },
      { id: 'tx_6', title: 'Artisan Coffee & Lunch', amount: 26.80, type: 'EXPENSE', category: 'Food & Dining', date: `${y}-${m}-09`, notes: 'Team meetup' },
      { id: 'tx_7', title: 'Subway & Transit Pass', amount: 95.00, type: 'EXPENSE', category: 'Transportation', date: `${y}-${m}-11`, notes: 'Monthly metro pass' },
      { id: 'tx_8', title: 'Netflix & Spotify Premium', amount: 32.98, type: 'EXPENSE', category: 'Entertainment', date: `${y}-${m}-12`, notes: 'Digital entertainment subs' },
      { id: 'tx_9', title: 'Index ETF Dividend', amount: 120.00, type: 'INCOME', category: 'Investment', date: `${y}-${m}-13`, notes: 'Quarterly reinvestment' },
      { id: 'tx_10', title: 'Fitness Gym Membership', amount: 65.00, type: 'EXPENSE', category: 'Healthcare', date: `${y}-${m}-14`, notes: 'Monthly athletic club' }
    ],
    budgets: [
      { id: 'bg_1', category: 'Food & Dining', limit: 600 },
      { id: 'bg_2', category: 'Housing', limit: 1700 },
      { id: 'bg_3', category: 'Transportation', limit: 250 },
      { id: 'bg_4', category: 'Entertainment', limit: 200 },
      { id: 'bg_5', category: 'Utilities', limit: 220 },
      { id: 'bg_6', category: 'Shopping', limit: 300 }
    ],
    goals: [
      { id: 'gl_1', name: 'Emergency Safety Cushion', target: 10000, current: 6800, deadline: `${y}-12-31` },
      { id: 'gl_2', name: 'Tokyo Autumn Vacation', target: 3500, current: 2100, deadline: `${y}-10-15` },
      { id: 'gl_3', name: 'Apple MacBook Pro M3', target: 2400, current: 1850, deadline: `${y}-08-20` }
    ]
  };
}

// Format Currency Utility
function formatCurrency(amount) {
  const cfg = CURRENCY_CONFIG[state.currency] || CURRENCY_CONFIG.USD;
  const num = Number(amount) || 0;
  return num.toLocaleString(cfg.locale, {
    style: 'currency',
    currency: state.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatCurrencyShort(amount) {
  const cfg = CURRENCY_CONFIG[state.currency] || CURRENCY_CONFIG.USD;
  const num = Number(amount) || 0;
  if (Math.abs(num) >= 1000) {
    return `${cfg.symbol}${(num / 1000).toFixed(1)}k`;
  }
  return `${cfg.symbol}${num.toFixed(0)}`;
}

// Toast notification helper
function showToast(message, isError = false) {
  const toast = document.getElementById('dashboard-toast');
  const text = document.getElementById('toast-message');
  if (!toast || !text) return;

  text.textContent = message;
  toast.className = 'toast-notification ' + (isError ? 'text-danger' : 'text-success');
  toast.classList.remove('d-none');

  setTimeout(() => {
    toast.classList.add('d-none');
  }, 3200);
}

// Load user data from localStorage
function loadUserData() {
  state.currentUser = getCurrentUser();
  if (!state.currentUser) return;

  // Set currency from user profile
  state.currency = state.currentUser.currency || 'USD';
  const currencySelect = document.getElementById('currency-select');
  if (currencySelect) currencySelect.value = state.currency;

  const userKey = STORAGE_KEYS.DATA_PREFIX + state.currentUser.email;
  const savedData = localStorage.getItem(userKey);

  if (savedData) {
    try {
      const parsed = JSON.parse(savedData);
      state.transactions = parsed.transactions || [];
      state.budgets = parsed.budgets || [];
      state.goals = parsed.goals || [];
    } catch (e) {
      console.warn('Could not parse user data, loading starter set:', e);
      loadStarterDataset();
    }
  } else {
    loadStarterDataset();
  }

  updateProfileHeader();
  renderApp();
}

function loadStarterDataset() {
  const starter = getStarterData();
  state.transactions = starter.transactions;
  state.budgets = starter.budgets;
  state.goals = starter.goals;
  persistUserData();
}

function persistUserData() {
  if (!state.currentUser) return;
  const userKey = STORAGE_KEYS.DATA_PREFIX + state.currentUser.email;
  const payload = {
    transactions: state.transactions,
    budgets: state.budgets,
    goals: state.goals,
    updatedAt: new Date().toISOString()
  };
  localStorage.setItem(userKey, JSON.stringify(payload));
}

// Update profile labels in top header
function updateProfileHeader() {
  if (!state.currentUser) return;
  const name = state.currentUser.name || 'User';
  const email = state.currentUser.email || '';

  const headerName = document.getElementById('header-user-name');
  const headerEmail = document.getElementById('header-user-email');
  const dropdownName = document.getElementById('dropdown-user-name');
  const dropdownEmail = document.getElementById('dropdown-user-email');
  const welcomeName = document.getElementById('welcome-username');
  const headerAvatar = document.getElementById('header-avatar');

  if (headerName) headerName.textContent = name;
  if (headerEmail) headerEmail.textContent = email;
  if (dropdownName) dropdownName.textContent = name;
  if (dropdownEmail) dropdownEmail.textContent = email;
  if (welcomeName) welcomeName.textContent = name.split(' ')[0];

  const initials = name
    .split(' ')
    .map(p => p[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
  if (headerAvatar) headerAvatar.textContent = initials || 'U';

  // Settings form population
  const settingsName = document.getElementById('settings-name');
  const settingsEmail = document.getElementById('settings-email');
  const settingsCurrency = document.getElementById('settings-currency');
  if (settingsName) settingsName.value = name;
  if (settingsEmail) settingsEmail.value = email;
  if (settingsCurrency) settingsCurrency.value = state.currency;
}

// Calculate Financial Aggregates
function getFinancialTotals() {
  let income = 0;
  let expense = 0;

  state.transactions.forEach(t => {
    const amt = Number(t.amount) || 0;
    if (t.type === 'INCOME') income += amt;
    else if (t.type === 'EXPENSE') expense += amt;
  });

  const netBalance = income - expense;
  const savingsRate = income > 0 ? Math.max(0, ((income - expense) / income) * 100) : 0;

  return { income, expense, netBalance, savingsRate };
}

// Render Core Application View
function renderApp() {
  const totals = getFinancialTotals();

  // 1. Update KPI Values
  const kpiBalance = document.getElementById('kpi-total-balance');
  const kpiIncome = document.getElementById('kpi-monthly-income');
  const kpiExpense = document.getElementById('kpi-monthly-expense');
  const kpiSavings = document.getElementById('kpi-savings-rate');
  const kpiProgress = document.getElementById('kpi-savings-progress');
  const txCountPill = document.getElementById('sidebar-tx-count');

  if (kpiBalance) kpiBalance.textContent = formatCurrency(totals.netBalance);
  if (kpiIncome) kpiIncome.textContent = formatCurrency(totals.income);
  if (kpiExpense) kpiExpense.textContent = formatCurrency(totals.expense);
  if (kpiSavings) kpiSavings.textContent = `${totals.savingsRate.toFixed(1)}%`;
  if (kpiProgress) kpiProgress.style.width = `${Math.min(100, totals.savingsRate)}%`;
  if (txCountPill) txCountPill.textContent = state.transactions.length;

  // Currency symbols in labels
  document.querySelectorAll('.currency-symbol-label').forEach(el => {
    const cfg = CURRENCY_CONFIG[state.currency] || CURRENCY_CONFIG.USD;
    el.textContent = cfg.symbol;
  });

  // 2. Render Tables & Lists
  renderRecentTransactions();
  renderFullTransactionsTable();
  renderBudgetsUI();
  renderGoalsUI();

  // 3. AI Insights
  if (typeof renderAIInsightsUI === 'function') {
    renderAIInsightsUI(state.transactions, state.budgets, totals.income, totals.expense);
  }

  // 4. Update Charts
  if (typeof refreshAllCharts === 'function') {
    refreshAllCharts(state.transactions, totals.income, totals.expense);
  }
}

// Render Recent Transactions on Dashboard
function renderRecentTransactions() {
  const tbody = document.getElementById('recent-transactions-tbody');
  if (!tbody) return;

  const sorted = [...state.transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);

  if (sorted.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center" style="padding: 24px; color: var(--text-muted);">No transactions recorded yet. Click "Add Transaction" to begin.</td></tr>`;
    return;
  }

  tbody.innerHTML = sorted.map(tx => {
    const isIncome = tx.type === 'INCOME';
    const catIcon = getCategoryIcon(tx.category, tx.type);
    return `
      <tr>
        <td>
          <div class="tx-item-cell">
            <div class="tx-cat-icon"><i class="fa-solid ${catIcon}"></i></div>
            <div>
              <span class="tx-title-bold">${escapeHtml(tx.title)}</span>
              ${tx.notes ? `<span class="tx-sub-note">${escapeHtml(tx.notes)}</span>` : ''}
            </div>
          </div>
        </td>
        <td><span class="cat-pill">${escapeHtml(tx.category)}</span></td>
        <td>${tx.date}</td>
        <td class="text-right ${isIncome ? 'text-success' : 'text-danger'}" style="font-weight: 700;">
          ${isIncome ? '+' : '-'}${formatCurrency(tx.amount)}
        </td>
        <td class="text-center">
          <div class="action-btns">
            <button class="btn-icon-action" onclick="openTransactionModal('${tx.id}')" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
            <button class="btn-icon-action delete-action" onclick="deleteTransaction('${tx.id}')" title="Delete"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Render Full Transactions Table in Transactions View
function renderFullTransactionsTable() {
  const tbody = document.getElementById('full-transactions-tbody');
  const countLabel = document.getElementById('tx-count-label');
  if (!tbody) return;

  let filtered = [...state.transactions];

  // Search filter
  if (state.filterSearch) {
    const term = state.filterSearch.toLowerCase();
    filtered = filtered.filter(t => 
      t.title.toLowerCase().includes(term) ||
      (t.notes && t.notes.toLowerCase().includes(term)) ||
      t.category.toLowerCase().includes(term)
    );
  }

  // Type filter
  if (state.filterType !== 'ALL') {
    filtered = filtered.filter(t => t.type === state.filterType);
  }

  // Category filter
  if (state.filterCategory !== 'ALL') {
    filtered = filtered.filter(t => t.category === state.filterCategory);
  }

  // Sort
  if (state.filterSort === 'date-desc') {
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  } else if (state.filterSort === 'date-asc') {
    filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
  } else if (state.filterSort === 'amount-desc') {
    filtered.sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0));
  } else if (state.filterSort === 'amount-asc') {
    filtered.sort((a, b) => (Number(a.amount) || 0) - (Number(b.amount) || 0));
  }

  if (countLabel) {
    countLabel.textContent = `Showing ${filtered.length} of ${state.transactions.length} total transactions`;
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding: 32px; color: var(--text-muted);">No matching transactions found. Try adjusting your search or filters.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(tx => {
    const isIncome = tx.type === 'INCOME';
    const catIcon = getCategoryIcon(tx.category, tx.type);
    return `
      <tr>
        <td>
          <div class="tx-item-cell">
            <div class="tx-cat-icon"><i class="fa-solid ${catIcon}"></i></div>
            <span class="tx-title-bold">${escapeHtml(tx.title)}</span>
          </div>
        </td>
        <td><span class="cat-pill">${escapeHtml(tx.category)}</span></td>
        <td>${tx.date}</td>
        <td><span style="color: var(--text-muted); font-size: 12px;">${escapeHtml(tx.notes || '-')}</span></td>
        <td class="text-right ${isIncome ? 'text-success' : 'text-danger'}" style="font-weight: 700;">
          ${isIncome ? '+' : '-'}${formatCurrency(tx.amount)}
        </td>
        <td class="text-center">
          <div class="action-btns">
            <button class="btn-icon-action" onclick="openTransactionModal('${tx.id}')" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
            <button class="btn-icon-action delete-action" onclick="deleteTransaction('${tx.id}')" title="Delete"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Render Budgets in Dashboard & Budgets View
function renderBudgetsUI() {
  const dashList = document.getElementById('dashboard-budget-list');
  const fullGrid = document.getElementById('budget-cards-container');

  // Compute spent amount per budget category
  const expenseMap = {};
  state.transactions.filter(t => t.type === 'EXPENSE').forEach(t => {
    expenseMap[t.category] = (expenseMap[t.category] || 0) + (Number(t.amount) || 0);
  });

  const budgetItems = state.budgets.map(b => {
    const spent = expenseMap[b.category] || 0;
    const ratio = b.limit > 0 ? (spent / b.limit) : 0;
    const pct = Math.min(100, Math.round(ratio * 100));

    let statusClass = 'progress-safe';
    if (ratio >= 1.0) statusClass = 'progress-danger';
    else if (ratio >= 0.8) statusClass = 'progress-warning';

    return { ...b, spent, pct, ratio, statusClass };
  });

  // 1. Dashboard summary widget (top 4)
  if (dashList) {
    if (budgetItems.length === 0) {
      dashList.innerHTML = `<p style="color: var(--text-muted); font-size: 13px;">No category limits configured yet.</p>`;
    } else {
      dashList.innerHTML = budgetItems.slice(0, 4).map(b => `
        <div class="budget-widget-item">
          <div class="budget-item-header">
            <span>${escapeHtml(b.category)}</span>
            <span>${formatCurrency(b.spent)} / ${formatCurrency(b.limit)}</span>
          </div>
          <div class="budget-progress-track">
            <div class="budget-progress-bar ${b.statusClass}" style="width: ${b.pct}%"></div>
          </div>
        </div>
      `).join('');
    }
  }

  // 2. Full Budgets View Cards
  if (fullGrid) {
    if (budgetItems.length === 0) {
      fullGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">No budgets set. Click "Set Category Budget" to track monthly limits.</div>`;
    } else {
      fullGrid.innerHTML = budgetItems.map(b => `
        <div class="budget-card">
          <div class="budget-card-top">
            <strong>${escapeHtml(b.category)}</strong>
            <button class="btn-icon-action delete-action" onclick="deleteBudget('${b.id}')" title="Delete Budget"><i class="fa-solid fa-trash"></i></button>
          </div>
          <div class="budget-card-amounts">
            <strong>${formatCurrency(b.spent)}</strong>
            <span>Limit: ${formatCurrency(b.limit)}</span>
          </div>
          <div class="budget-progress-track">
            <div class="budget-progress-bar ${b.statusClass}" style="width: ${b.pct}%"></div>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-secondary);">
            <span>${b.pct}% utilized</span>
            <span>${b.limit > b.spent ? `${formatCurrency(b.limit - b.spent)} left` : '<span class="text-danger">Over budget!</span>'}</span>
          </div>
        </div>
      `).join('');
    }
  }
}

// Render Savings Goals
function renderGoalsUI() {
  const container = document.getElementById('goals-container');
  if (!container) return;

  if (state.goals.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">No savings goals yet. Create one to visualize your target milestones!</div>`;
    return;
  }

  container.innerHTML = state.goals.map(g => {
    const ratio = g.target > 0 ? (g.current / g.target) : 0;
    const pct = Math.min(100, Math.round(ratio * 100));

    return `
      <div class="goal-card">
        <div class="goal-header">
          <h4>${escapeHtml(g.name)}</h4>
          <button class="btn-icon-action delete-action" onclick="deleteGoal('${g.id}')" title="Delete Goal"><i class="fa-solid fa-trash"></i></button>
        </div>
        <div class="goal-numbers">
          <strong>${formatCurrency(g.current)}</strong>
          <span style="color: var(--text-secondary);">Target: ${formatCurrency(g.target)}</span>
        </div>
        <div class="budget-progress-track">
          <div class="budget-progress-bar progress-safe" style="width: ${pct}%"></div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-secondary);">
          <span>${pct}% achieved</span>
          <span>${g.deadline ? `Due: ${g.deadline}` : 'Open milestone'}</span>
        </div>
        <div class="goal-actions">
          <button class="btn btn-secondary btn-sm" onclick="depositToGoal('${g.id}')">
            <i class="fa-solid fa-plus"></i> Add $100 Funds
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Helper: Get Icon for category
function getCategoryIcon(catName, type) {
  const list = type === 'INCOME' ? CATEGORIES.INCOME : CATEGORIES.EXPENSE;
  const match = list.find(c => c.name.toLowerCase() === (catName || '').toLowerCase());
  return match ? match.icon : (type === 'INCOME' ? 'fa-arrow-up' : 'fa-receipt');
}

// Populate Category options inside Transaction Modal
function populateCategorySelect(type, selectedCategory = '') {
  const catSelect = document.getElementById('tx-category');
  if (!catSelect) return;

  const cats = type === 'INCOME' ? CATEGORIES.INCOME : CATEGORIES.EXPENSE;
  catSelect.innerHTML = cats.map(c => `
    <option value="${c.name}" ${c.name === selectedCategory ? 'selected' : ''}>${c.name}</option>
  `).join('');
}

// Transaction Modal Controls
function openTransactionModal(editId = null) {
  const modal = document.getElementById('modal-transaction');
  const title = document.getElementById('tx-modal-title');
  const form = document.getElementById('transaction-form');
  const idInput = document.getElementById('tx-form-id');
  const amountInput = document.getElementById('tx-amount');
  const titleInput = document.getElementById('tx-title');
  const dateInput = document.getElementById('tx-date');
  const notesInput = document.getElementById('tx-notes');

  form.reset();
  idInput.value = '';

  if (editId) {
    const tx = state.transactions.find(t => t.id === editId);
    if (tx) {
      title.textContent = 'Edit Transaction';
      idInput.value = tx.id;
      amountInput.value = tx.amount;
      titleInput.value = tx.title;
      dateInput.value = tx.date;
      notesInput.value = tx.notes || '';
      setTxType(tx.type);
      populateCategorySelect(tx.type, tx.category);
    }
  } else {
    title.textContent = 'Add Transaction';
    setTxType('EXPENSE');
    populateCategorySelect('EXPENSE');
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  modal.classList.remove('d-none');
}

function closeTransactionModal() {
  document.getElementById('modal-transaction')?.classList.add('d-none');
}

function setTxType(type) {
  const expenseBtn = document.getElementById('type-btn-expense');
  const incomeBtn = document.getElementById('type-btn-income');
  const hiddenType = document.getElementById('tx-type');

  hiddenType.value = type;
  if (type === 'EXPENSE') {
    expenseBtn?.classList.add('active');
    incomeBtn?.classList.remove('active');
  } else {
    incomeBtn?.classList.add('active');
    expenseBtn?.classList.remove('active');
  }
  populateCategorySelect(type);
}

// Save Transaction Form
function saveTransactionForm(event) {
  event.preventDefault();
  const id = document.getElementById('tx-form-id').value;
  const type = document.getElementById('tx-type').value;
  const amount = parseFloat(document.getElementById('tx-amount').value);
  const title = document.getElementById('tx-title').value.trim();
  const category = document.getElementById('tx-category').value;
  const date = document.getElementById('tx-date').value;
  const notes = document.getElementById('tx-notes').value.trim();

  if (!amount || amount <= 0 || !title || !date) {
    showToast('Please enter valid amount, description, and date', true);
    return;
  }

  if (id) {
    // Edit existing
    const idx = state.transactions.findIndex(t => t.id === id);
    if (idx !== -1) {
      state.transactions[idx] = { id, type, amount, title, category, date, notes };
      showToast('Transaction successfully updated!');
    }
  } else {
    // New transaction
    const newTx = {
      id: 'tx_' + Date.now().toString(36),
      type,
      amount,
      title,
      category,
      date,
      notes
    };
    state.transactions.unshift(newTx);
    showToast('New transaction added!');
  }

  persistUserData();
  closeTransactionModal();
  renderApp();
}

// Delete Transaction
function deleteTransaction(id) {
  if (confirm('Are you sure you want to delete this transaction record?')) {
    state.transactions = state.transactions.filter(t => t.id !== id);
    persistUserData();
    renderApp();
    showToast('Transaction removed');
  }
}

// Budget Modal Controls
function openBudgetModal() {
  document.getElementById('modal-budget')?.classList.remove('d-none');
}

function closeBudgetModal() {
  document.getElementById('modal-budget')?.classList.add('d-none');
}

function saveBudgetForm(event) {
  event.preventDefault();
  const category = document.getElementById('budget-category').value;
  const limit = parseFloat(document.getElementById('budget-limit').value);

  if (!limit || limit <= 0) return;

  const existingIdx = state.budgets.findIndex(b => b.category === category);
  if (existingIdx !== -1) {
    state.budgets[existingIdx].limit = limit;
  } else {
    state.budgets.push({
      id: 'bg_' + Date.now().toString(36),
      category,
      limit
    });
  }

  persistUserData();
  closeBudgetModal();
  renderApp();
  showToast(`Budget for ${category} saved!`);
}

function deleteBudget(id) {
  state.budgets = state.budgets.filter(b => b.id !== id);
  persistUserData();
  renderApp();
  showToast('Budget limit deleted');
}

// Goal Modal Controls
function openGoalModal() {
  document.getElementById('modal-goal')?.classList.remove('d-none');
}

function closeGoalModal() {
  document.getElementById('modal-goal')?.classList.add('d-none');
}

function saveGoalForm(event) {
  event.preventDefault();
  const name = document.getElementById('goal-name').value.trim();
  const target = parseFloat(document.getElementById('goal-target').value);
  const current = parseFloat(document.getElementById('goal-current').value) || 0;
  const deadline = document.getElementById('goal-deadline').value;

  if (!name || !target || target <= 0) return;

  state.goals.push({
    id: 'gl_' + Date.now().toString(36),
    name,
    target,
    current,
    deadline
  });

  persistUserData();
  closeGoalModal();
  renderApp();
  showToast(`Goal "${name}" created!`);
}

function depositToGoal(id) {
  const goal = state.goals.find(g => g.id === id);
  if (!goal) return;
  goal.current += 100;
  persistUserData();
  renderApp();
  showToast(`Deposited $100 to "${goal.name}"`);
}

function deleteGoal(id) {
  state.goals = state.goals.filter(g => g.id !== id);
  persistUserData();
  renderApp();
  showToast('Savings goal removed');
}

// Export Transactions to CSV
function exportTransactionsCSV() {
  if (state.transactions.length === 0) {
    showToast('No transactions to export', true);
    return;
  }

  const headers = ['ID', 'Type', 'Title', 'Category', 'Amount', 'Date', 'Notes'];
  const rows = state.transactions.map(t => [
    `"${t.id}"`,
    `"${t.type}"`,
    `"${(t.title || '').replace(/"/g, '""')}"`,
    `"${t.category}"`,
    t.amount,
    `"${t.date}"`,
    `"${(t.notes || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `FinAI_Transactions_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Transactions exported to CSV!');
}

// Backup all data as JSON
function exportFullJSONBackup() {
  const payload = {
    user: state.currentUser,
    currency: state.currency,
    transactions: state.transactions,
    budgets: state.budgets,
    goals: state.goals,
    exportedAt: new Date().toISOString()
  };

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
  const link = document.createElement('a');
  link.setAttribute('href', dataStr);
  link.setAttribute('download', `FinAI_Backup_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Complete financial backup downloaded');
}

// Reset data to starter dataset
function resetToSampleData() {
  if (confirm('This will restore the sample demonstration dataset. Continue?')) {
    loadStarterDataset();
    renderApp();
    showToast('Demo dataset restored!');
  }
}

// Clear all user data
function clearAllUserData() {
  if (confirm('CAUTION: This will delete all your transactions, budgets, and goals permanently. Proceed?')) {
    state.transactions = [];
    state.budgets = [];
    state.goals = [];
    persistUserData();
    renderApp();
    showToast('All records cleared', true);
  }
}

// Save Profile in Settings View
function saveProfileSettings(event) {
  event.preventDefault();
  const name = document.getElementById('settings-name').value.trim();
  const email = document.getElementById('settings-email').value.trim();

  if (!name || !email) return;

  state.currentUser.name = name;
  state.currentUser.email = email;
  setCurrentUser(state.currentUser, true);
  updateProfileHeader();
  showToast('Profile settings saved successfully');
}

// Currency Selector
function changeCurrency(newCurrency) {
  state.currency = newCurrency;
  if (state.currentUser) {
    state.currentUser.currency = newCurrency;
    setCurrentUser(state.currentUser, true);
  }
  const currSelect = document.getElementById('currency-select');
  if (currSelect) currSelect.value = newCurrency;
  const setCurr = document.getElementById('settings-currency');
  if (setCurr) setCurr.value = newCurrency;

  renderApp();
  showToast(`Currency changed to ${newCurrency}`);
}

// Theme Controls
function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
  setTheme(saved);
}

function setTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_KEYS.THEME, theme);

  const icon = document.getElementById('theme-icon');
  if (icon) {
    icon.className = theme === 'light' ? 'fa-regular fa-moon' : 'fa-regular fa-sun';
  }

  // Refresh charts with updated theme palette
  const totals = getFinancialTotals();
  if (typeof refreshAllCharts === 'function') {
    refreshAllCharts(state.transactions, totals.income, totals.expense);
  }
}

function toggleTheme() {
  setTheme(state.theme === 'light' ? 'dark' : 'light');
}

// Switch Active View (Dashboard, Transactions, Budgets, Goals, AI Coach, Analytics, Settings)
function switchView(viewName) {
  state.activeView = viewName;

  // Toggle nav buttons
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-view') === viewName);
  });

  // Toggle view containers
  document.querySelectorAll('.content-view').forEach(view => {
    const isTarget = view.id === `view-${viewName}`;
    view.classList.toggle('active', isTarget);
    view.classList.toggle('d-none', !isTarget);
  });

  // Close mobile sidebar if open
  document.getElementById('app-sidebar')?.classList.remove('show-sidebar');
  // Close user dropdown if open
  document.getElementById('user-dropdown-menu')?.classList.add('d-none');

  // Trigger charts resize when switching to charts views
  if (viewName === 'dashboard' || viewName === 'analytics') {
    const totals = getFinancialTotals();
    setTimeout(() => {
      if (typeof refreshAllCharts === 'function') {
        refreshAllCharts(state.transactions, totals.income, totals.expense);
      }
    }, 50);
  }
}

// Navigation sidebar toggle for mobile
function toggleSidebar() {
  document.getElementById('app-sidebar')?.classList.toggle('show-sidebar');
}

// User dropdown toggle
function toggleUserDropdown() {
  document.getElementById('user-dropdown-menu')?.classList.toggle('d-none');
}

// Close dropdown when clicking outside
window.addEventListener('click', (e) => {
  if (!e.target.closest('.user-dropdown-container')) {
    document.getElementById('user-dropdown-menu')?.classList.add('d-none');
  }
});

// Transaction Filter Handlers
function applyTransactionFilters() {
  state.filterSearch = document.getElementById('tx-filter-search')?.value.trim() || '';
  state.filterType = document.getElementById('tx-filter-type')?.value || 'ALL';
  state.filterCategory = document.getElementById('tx-filter-category')?.value || 'ALL';
  state.filterSort = document.getElementById('tx-filter-sort')?.value || 'date-desc';
  renderFullTransactionsTable();
}

function resetTransactionFilters() {
  const search = document.getElementById('tx-filter-search');
  const type = document.getElementById('tx-filter-type');
  const cat = document.getElementById('tx-filter-category');
  const sort = document.getElementById('tx-filter-sort');

  if (search) search.value = '';
  if (type) type.value = 'ALL';
  if (cat) cat.value = 'ALL';
  if (sort) sort.value = 'date-desc';

  applyTransactionFilters();
}

function handleGlobalSearch(event) {
  const query = event.target.value.trim();
  if (query.length > 0) {
    if (state.activeView !== 'transactions') {
      switchView('transactions');
    }
    const searchInput = document.getElementById('tx-filter-search');
    if (searchInput) searchInput.value = query;
    applyTransactionFilters();
  }
}

// ==================== AI COACH CHAT CONTROLS ====================
function handleChatSubmit(event) {
  event.preventDefault();
  const input = document.getElementById('ai-chat-input');
  if (!input) return;
  const prompt = input.value.trim();
  if (!prompt) return;

  input.value = '';
  askAICoach(prompt);
}

function askAICoach(prompt) {
  const container = document.getElementById('chat-messages-container');
  if (!container) return;

  // Append user message
  const userHtml = `
    <div class="chat-msg user-msg">
      <div class="msg-bubble">
        <p>${escapeHtml(prompt)}</p>
      </div>
    </div>
  `;
  container.insertAdjacentHTML('beforeend', userHtml);
  container.scrollTop = container.scrollHeight;

  // Append temporary thinking indicator
  const thinkingId = 'thinking_' + Date.now();
  const thinkingHtml = `
    <div class="chat-msg ai-msg" id="${thinkingId}">
      <div class="msg-avatar"><i class="fa-solid fa-robot"></i></div>
      <div class="msg-bubble">
        <p><em>FinAI is analyzing your balance sheet...</em></p>
      </div>
    </div>
  `;
  container.insertAdjacentHTML('beforeend', thinkingHtml);
  container.scrollTop = container.scrollHeight;

  setTimeout(() => {
    document.getElementById(thinkingId)?.remove();

    const totals = getFinancialTotals();
    const reply = generateAIChatReply(prompt, {
      totalIncome: totals.income,
      totalExpense: totals.expense,
      transactions: state.transactions,
      budgets: state.budgets,
      goals: state.goals
    });

    const aiHtml = `
      <div class="chat-msg ai-msg">
        <div class="msg-avatar"><i class="fa-solid fa-robot"></i></div>
        <div class="msg-bubble">
          ${formatMarkdownReply(reply)}
        </div>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', aiHtml);
    container.scrollTop = container.scrollHeight;
  }, 450);
}

function clearAIChat() {
  const container = document.getElementById('chat-messages-container');
  if (!container) return;
  container.innerHTML = `
    <div class="chat-msg ai-msg">
      <div class="msg-avatar"><i class="fa-solid fa-robot"></i></div>
      <div class="msg-bubble">
        <p>Chat memory refreshed. Ask me anything about your current expenses, savings opportunities, or budget targets!</p>
      </div>
    </div>
  `;
}

function formatMarkdownReply(text) {
  // Simple clean markdown parser for bold, lists, and linebreaks
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}

function generateFreshAIInsights() {
  const totals = getFinancialTotals();
  renderAIInsightsUI(state.transactions, state.budgets, totals.income, totals.expense);
  showToast('Financial insights recalculated!');
}

// Utility: Escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Application Initialization
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadUserData();
});
