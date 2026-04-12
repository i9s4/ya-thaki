// app.js — main router

import { getSession, setSession, clearSession, getSettings, saveSettings, generateId, saveUser, getUserByEmail } from './db.js';
import { renderLogin } from '../pages/login.js';
import { renderSetup } from '../pages/setup.js';
import { renderAdminDashboard } from '../pages/admin/dashboard.js';
import { renderStudentDashboard } from '../pages/student/dashboard.js';

const app = document.getElementById('app');

// Global state
window._state = {
  page: null,
  user: null,
  theme: localStorage.getItem('ya_thaki_theme') || 'dark'
};

// Apply theme
export function applyTheme(theme) {
  window._state.theme = theme;
  document.body.className = theme;
  localStorage.setItem('ya_thaki_theme', theme);
}

applyTheme(window._state.theme);

// Toast
export function showToast(msg, type = '') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 3000);
}

// Navigate
export function navigate(page, params = {}) {
  window._state.page = page;
  window._state.params = params;
  render();
}

function render() {
  const settings = getSettings();
  const session = getSession();

  // First time setup
  if (!settings.adminEmail) {
    renderSetup(app, { onComplete: () => render() });
    return;
  }

  // Not logged in
  if (!session) {
    renderLogin(app, { onLogin: (user) => { setSession(user); window._state.user = user; render(); } });
    return;
  }

  window._state.user = session;

  if (session.isAdmin) {
    renderAdminDashboard(app, { user: session, page: window._state.page, params: window._state.params });
  } else {
    renderStudentDashboard(app, { user: session, page: window._state.page, params: window._state.params });
  }
}

// Logout
export function logout() {
  clearSession();
  window._state.user = null;
  window._state.page = null;
  render();
}

// Start
render();
