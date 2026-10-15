/**
 * FinAI - Authentication & Session Management Module
 * Handles login, registration, session checks, and demo accounts
 */

const STORAGE_KEYS = {
  USERS: 'finai_users',
  CURRENT_USER: 'finai_active_user',
  THEME: 'finai_theme_mode',
  DATA_PREFIX: 'finai_data_'
};

// Default pre-seeded demo user
const DEMO_USER = {
  id: 'usr_demo_1001',
  name: 'Alex Morgan',
  email: 'demo@finance.ai',
  password: 'password123',
  currency: 'USD',
  createdAt: '2026-01-01T00:00:00.000Z'
};

// Seed demo user into localStorage if empty
function initializeUsersStorage() {
  try {
    let users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS));
    if (!Array.isArray(users) || users.length === 0) {
      users = [DEMO_USER];
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
    return users;
  } catch (err) {
    console.warn('Failed to access localStorage for users, resetting fallback:', err);
    const users = [DEMO_USER];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return users;
  }
}

// Retrieve currently authenticated user session
function getCurrentUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || sessionStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading current user session:', err);
    return null;
  }
}

// Set active user session
function setCurrentUser(user, remember = true) {
  const userJson = JSON.stringify(user);
  if (remember) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, userJson);
    sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  } else {
    sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, userJson);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
}

// Check session on page load
function enforcePageAuthentication() {
  const isLoginPage = window.location.pathname.endsWith('login.html');
  const user = getCurrentUser();

  if (isLoginPage) {
    // If already logged in, redirect straight to dashboard
    if (user) {
      window.location.href = 'index.html';
    }
  } else {
    // On dashboard pages, redirect to login if session missing
    if (!user) {
      // Auto-login demo user on first ever visit to prevent friction if user opens index.html directly
      const users = initializeUsersStorage();
      const defaultUser = users[0] || DEMO_USER;
      setCurrentUser(defaultUser, true);
      console.log('Initialized default demo session for instant testing.');
    }
  }
}

// Switch between Login and Register tabs on login.html
function switchAuthTab(tab) {
  const loginTab = document.getElementById('tab-login');
  const regTab = document.getElementById('tab-register');
  const loginForm = document.getElementById('login-form');
  const regForm = document.getElementById('register-form');
  const alertBox = document.getElementById('auth-alert');

  if (alertBox) alertBox.classList.add('d-none');

  if (tab === 'login') {
    loginTab?.classList.add('active');
    regTab?.classList.remove('active');
    loginForm?.classList.remove('d-none');
    regForm?.classList.add('d-none');
  } else {
    regTab?.classList.add('active');
    loginTab?.classList.remove('active');
    regForm?.classList.remove('d-none');
    loginForm?.classList.add('d-none');
  }
}

// Show alert message in login page
function showAuthAlert(message, isSuccess = false) {
  const alertBox = document.getElementById('auth-alert');
  const alertText = document.getElementById('auth-alert-text');
  const alertIcon = document.getElementById('auth-alert-icon');
  if (!alertBox || !alertText) return;

  alertText.textContent = message;
  alertBox.className = 'alert-box ' + (isSuccess ? 'alert-success' : 'alert-error');

  if (alertIcon) {
    alertIcon.className = isSuccess ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-exclamation';
  }
  alertBox.classList.remove('d-none');
}

// Toggle password visibility
function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const icon = btn.querySelector('i');
  if (input.type === 'password') {
    input.type = 'text';
    if (icon) {
      icon.classList.remove('fa-eye');
      icon.classList.add('fa-eye-slash');
    }
  } else {
    input.type = 'password';
    if (icon) {
      icon.classList.remove('fa-eye-slash');
      icon.classList.add('fa-eye');
    }
  }
}

// Handle Login Form Submission
function handleLoginSubmit(event) {
  event.preventDefault();
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const rememberCheckbox = document.getElementById('remember-me');

  const email = emailInput?.value.trim().toLowerCase();
  const password = passwordInput?.value;
  const remember = rememberCheckbox ? rememberCheckbox.checked : true;

  if (!email || !password) {
    showAuthAlert('Please enter both your email address and password.');
    return;
  }

  const users = initializeUsersStorage();
  const match = users.find(u => u.email.toLowerCase() === email && u.password === password);

  if (!match) {
    showAuthAlert('Invalid email or password. You can use the 1-Click Demo button below to sign in instantly.');
    return;
  }

  // Success
  showAuthAlert('Login successful! Redirecting to dashboard...', true);
  setCurrentUser(match, remember);

  setTimeout(() => {
    window.location.href = 'index.html';
  }, 600);
}

// Quick 1-Click Demo Login
function quickDemoLogin() {
  const users = initializeUsersStorage();
  const demoUser = users.find(u => u.email === DEMO_USER.email) || DEMO_USER;
  setCurrentUser(demoUser, true);
  showAuthAlert('Demo authorized! Launching dashboard...', true);
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 400);
}

// Handle User Registration
function handleRegisterSubmit(event) {
  event.preventDefault();
  const nameInput = document.getElementById('register-name');
  const emailInput = document.getElementById('register-email');
  const currencySelect = document.getElementById('register-currency');
  const passwordInput = document.getElementById('register-password');
  const confirmPasswordInput = document.getElementById('register-confirm-password');

  const name = nameInput?.value.trim();
  const email = emailInput?.value.trim().toLowerCase();
  const currency = currencySelect?.value || 'USD';
  const password = passwordInput?.value;
  const confirmPassword = confirmPasswordInput?.value;

  if (!name || !email || !password) {
    showAuthAlert('Please fill in all required registration fields.');
    return;
  }

  if (password.length < 6) {
    showAuthAlert('Password must be at least 6 characters long.');
    return;
  }

  if (password !== confirmPassword) {
    showAuthAlert('Passwords do not match. Please verify your password.');
    return;
  }

  const users = initializeUsersStorage();
  const existing = users.find(u => u.email.toLowerCase() === email);

  if (existing) {
    showAuthAlert('An account with this email already exists. Please Sign In.');
    return;
  }

  const newUser = {
    id: 'usr_' + Date.now().toString(36),
    name: name,
    email: email,
    password: password,
    currency: currency,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

  setCurrentUser(newUser, true);
  showAuthAlert('Account created successfully! Preparing your workspace...', true);

  setTimeout(() => {
    window.location.href = 'index.html';
  }, 700);
}

// Forgot password helper
function handleForgotPassword(e) {
  e.preventDefault();
  showAuthAlert('Demo account password is: "password123" (Email: demo@finance.ai)', true);
}

// Logout
function handleLogout() {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  window.location.href = 'login.html';
}

// Run auth check on script load
document.addEventListener('DOMContentLoaded', () => {
  initializeUsersStorage();
  enforcePageAuthentication();
});
