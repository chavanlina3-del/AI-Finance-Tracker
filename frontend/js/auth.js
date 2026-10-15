
const API_BASE = 'https://ai-finance-tracker-backend-s1g2.onrender.com/api';

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
        headers['Authorization'] = 'Bearer ' + token;
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

async function apiRequest(endpoint, options) {
    options = options || {};

    var url = API_BASE + endpoint;
    var headers = getAuthHeaders();

    if (options.headers) {
        Object.assign(headers, options.headers);
    }

    var response;

    try {
        response = await fetch(url, Object.assign({}, options, {
            headers: headers
        }));
    } catch (error) {
        console.error('API connection failed:', error);

        throw new Error(
            'Cannot connect to the backend. Make sure it is running on port 5000.'
        );
    }

    var data = await response.json().catch(function () {
        return {};
    });

    if (!response.ok) {
        throw new Error(
            data.error || data.message || ('Request failed (' + response.status + ')')
        );
    }

    return data;
}

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

document.addEventListener('DOMContentLoaded', function () {
    var mobileToggle = document.getElementById('mobileToggle');
    var sidebar = document.getElementById('sidebar');

    if (mobileToggle && sidebar) {
        mobileToggle.addEventListener('click', function () {
            sidebar.classList.toggle('show');
        });
    }
});