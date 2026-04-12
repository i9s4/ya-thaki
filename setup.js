// admin/dashboard.js

import { logout, navigate, applyTheme, showToast } from '../../lib/app.js';
import { getApprovedStudents, getPendingUsers, getAllTests, getAllSubjects, getSettings } from '../../lib/db.js';
import { renderAdminHome } from './home.js';
import { renderAdminSubjects } from './subjects.js';
import { renderAdminStudents } from './students.js';
import { renderAdminReports } from './reports.js';
import { renderAdminSettings } from './settings.js';

export function renderAdminDashboard(container, { user, page, params }) {
  const currentPage = page || 'home';

  container.innerHTML = `
    <div class="layout">
      <!-- SIDEBAR (desktop) -->
      <div class="sidebar" id="sidebar">
        <div class="sidebar-logo">يا <span>ذكي</span></div>
        <div class="sidebar-item ${currentPage==='home'?'active':''}" data-page="home">
          <span class="sidebar-icon">🏠</span> الرئيسية
        </div>
        <div class="sidebar-item ${currentPage==='subjects'?'active':''}" data-page="subjects">
          <span class="sidebar-icon">📚</span> المواد الدراسية
        </div>
        <div class="sidebar-item ${currentPage==='students'?'active':''}" data-page="students">
          <span class="sidebar-icon">👨‍🎓</span>
          الطلاب
          ${getPendingUsers().length ? `<span class="pill pill-pink" style="margin-right:auto;font-size:10px;">${getPendingUsers().length}</span>` : ''}
        </div>
        <div class="sidebar-item ${currentPage==='reports'?'active':''}" data-page="reports">
          <span class="sidebar-icon">📊</span> التقارير
        </div>
        <div class="sidebar-bottom">
          <div class="sidebar-item" style="display:flex;align-items:center;justify-content:space-between;">
            <span style="font-size:13px;color:var(--text3);">الوضع الليلي</span>
            <div class="theme-switch" id="theme-sw">
              <div class="theme-switch-track ${window._state.theme==='dark'?'on':''}">
                <div class="theme-switch-thumb"></div>
              </div>
            </div>
          </div>
          <div class="sidebar-item ${currentPage==='settings'?'active':''}" data-page="settings">
            <span class="sidebar-icon">⚙️</span> الإعدادات
          </div>
          <div class="sidebar-item" id="logout-btn" style="color:var(--pink);">
            <span class="sidebar-icon">🚪</span> تسجيل الخروج
          </div>
        </div>
      </div>

      <!-- MAIN -->
      <div class="main-content" id="main-content">
        <!-- MOBILE TOPBAR -->
        <div class="topbar" style="display:none;" id="mobile-topbar">
          <div class="topbar-logo">يا <span>ذكي</span></div>
          <div style="display:flex;align-items:center;gap:12px;">
            <div class="theme-switch" id="theme-sw-mobile">
              <div class="theme-switch-track ${window._state.theme==='dark'?'on':''}">
                <div class="theme-switch-thumb"></div>
              </div>
            </div>
            <div id="logout-mobile" style="font-size:13px;color:var(--pink);cursor:pointer;">خروج</div>
          </div>
        </div>
        <div id="page-content"></div>
      </div>
    </div>

    <!-- MOBILE BOTTOM NAV -->
    <div class="bottom-nav">
      <div class="bottom-nav-items">
        <div class="bottom-nav-item ${currentPage==='home'?'active':''}" data-page="home">
          <span class="bottom-nav-icon">🏠</span>الرئيسية
        </div>
        <div class="bottom-nav-item ${currentPage==='subjects'?'active':''}" data-page="subjects">
          <span class="bottom-nav-icon">📚</span>المواد
        </div>
        <div class="bottom-nav-item ${currentPage==='students'?'active':''}" data-page="students">
          <span class="bottom-nav-icon">👨‍🎓</span>الطلاب
        </div>
        <div class="bottom-nav-item ${currentPage==='reports'?'active':''}" data-page="reports">
          <span class="bottom-nav-icon">📊</span>التقارير
        </div>
        <div class="bottom-nav-item ${currentPage==='settings'?'active':''}" data-page="settings">
          <span class="bottom-nav-icon">⚙️</span>الإعدادات
        </div>
      </div>
    </div>
  `;

  // Show mobile topbar on small screens
  if (window.innerWidth <= 768) {
    document.getElementById('mobile-topbar').style.display = 'flex';
  }

  // Sidebar navigation
  container.querySelectorAll('[data-page]').forEach(el => {
    el.addEventListener('click', () => navigate(el.dataset.page));
  });

  // Logout
  document.getElementById('logout-btn')?.addEventListener('click', logout);
  document.getElementById('logout-mobile')?.addEventListener('click', logout);

  // Theme toggle
  function toggleTheme(el) {
    const newTheme = window._state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    el.classList.toggle('on', newTheme === 'dark');
  }
  document.getElementById('theme-sw')?.addEventListener('click', (e) => {
    toggleTheme(e.currentTarget.querySelector('.theme-switch-track'));
  });
  document.getElementById('theme-sw-mobile')?.addEventListener('click', (e) => {
    toggleTheme(e.currentTarget.querySelector('.theme-switch-track'));
  });

  // Render current page
  const pageContent = document.getElementById('page-content');
  switch (currentPage) {
    case 'home': renderAdminHome(pageContent, { user }); break;
    case 'subjects': renderAdminSubjects(pageContent, { user, params }); break;
    case 'students': renderAdminStudents(pageContent, { user, params }); break;
    case 'reports': renderAdminReports(pageContent, { user, params }); break;
    case 'settings': renderAdminSettings(pageContent, { user }); break;
    default: renderAdminHome(pageContent, { user });
  }
}
