
/* ==========================================
   AI FINANCE TRACKER - SHARED API CONFIG
   ========================================== */

// Use one shared URL without redeclaring a global const.
window.API_BASE_URL =
    'https://ai-finance-tracker-backend-s1g2.onrender.com';

function getToken() {
    return sessionStorage.getItem('token') ||
           localStorage.getItem('token');
}

function setToken(token, remember) {
    sessionStorage.removeItem('token');
    localStorage.removeItem('token');

    if (remember === true) {
        localStorage.setItem('token', token);
    } else {
        sessionStorage.setItem('token', token);
    }
}

function removeToken() {
    sessionStorage.removeItem('token');
    localStorage.removeItem('token');
}

function getAuthHeaders() {
    var headers = {
        'Content-Type': 'application/json'
    };

    var token = getToken();

    if (token) {
        headers.Authorization = 'Bearer ' + token;
    }

    return headers;
}

function isAuthenticated() {
    return Boolean(getToken());
}

function redirectIfNotAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
    }
}

function redirectIfAuth() {
    if (isAuthenticated()) {
        window.location.href = 'dashboard.html';
    }
}

function logout() {
    removeToken();
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

/* ==========================================
   TOAST NOTIFICATIONS
   ========================================== */

function showToast(message, type) {
    type = type || 'info';

    var container = document.getElementById('toastContainer');

    if (!container) {
        alert(message);
        return;
    }

    var toastEl = document.createElement('div');
    toastEl.className =
        'toast align-items-center text-bg-' + type + ' border-0 mb-2';
    toastEl.setAttribute('role', 'alert');

    var row = document.createElement('div');
    row.className = 'd-flex';

    var body = document.createElement('div');
    body.className = 'toast-body';
    body.textContent = message;

    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'btn-close btn-close-white me-2 m-auto';
    close.setAttribute('data-bs-dismiss', 'toast');
    close.setAttribute('aria-label', 'Close');

    row.appendChild(body);
    row.appendChild(close);
    toastEl.appendChild(row);
    container.appendChild(toastEl);

    if (window.bootstrap && window.bootstrap.Toast) {
        var toast = new window.bootstrap.Toast(toastEl, {
            delay: 4000
        });

        toast.show();

        toastEl.addEventListener('hidden.bs.toast', function () {
            toastEl.remove();
        });
    } else {
        alert(message);
        toastEl.remove();
    }
}

/* ==========================================
   LOADING INDICATOR
   ========================================== */

function showLoading() {
    var overlay = document.getElementById('loading-overlay');

    if (overlay) {
        overlay.style.display = 'flex';
    }
}

function hideLoading() {
    var overlay = document.getElementById('loading-overlay');

    if (overlay) {
        overlay.style.display = 'none';
    }
}

/* ==========================================
   CENTRAL API REQUEST FUNCTION

   Accepts either:
   apiRequest('/login')             -> /api/login
   apiRequest('/register')          -> /api/register
   apiRequest('/api/transactions')  -> /api/transactions
   ========================================== */

async function apiRequest(endpoint, options) {
    options = options || {};

    if (typeof endpoint !== 'string' || !endpoint.trim()) {
        throw new Error('An API endpoint is required.');
    }

    endpoint = endpoint.trim();

    if (endpoint.charAt(0) !== '/') {
        endpoint = '/' + endpoint;
    }

    // Avoid adding /api twice.
    if (endpoint !== '/api' && !endpoint.startsWith('/api/')) {
        endpoint = '/api' + endpoint;
    }

    var url = window.API_BASE_URL + endpoint;
    var headers = getAuthHeaders();

    if (options.headers) {
        Object.assign(headers, options.headers);
    }

    var requestOptions = Object.assign({}, options, {
        headers: headers
    });

    var response;

    try {
        response = await fetch(url, requestOptions);
    } catch (error) {
        console.error('API connection failed:', url, error);

        throw new Error(
            'Cannot connect to the online backend. Check your internet connection.'
        );
    }

    var data = await response.json().catch(function () {
        return {};
    });

    if (!response.ok) {
        var message =
            data.error ||
            data.message ||
            ('API request failed with status ' + response.status);

        console.error('API request failed:', response.status, url, data);
        throw new Error(message);
    }

    return data;
}

/* ==========================================
   FORMATTING HELPERS
   ========================================== */

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(Number(amount) || 0);
}

function formatDate(dateStr) {
    if (!dateStr) {
        return '';
    }

    var date = new Date(dateStr);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/* ==========================================
   MOBILE SIDEBAR
   ========================================== */

document.addEventListener('DOMContentLoaded', function () {
    var mobileToggle = document.getElementById('mobileToggle');
    var sidebar = document.getElementById('sidebar');

    if (mobileToggle && sidebar) {
        mobileToggle.addEventListener('click', function () {
            sidebar.classList.toggle('show');
        });
    }
});
