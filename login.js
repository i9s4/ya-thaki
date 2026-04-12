// admin/home.js

import { getApprovedStudents, getPendingUsers, getAllTests, getAllSubjects, getTestStats, formatDate, gradeLabel } from '../../lib/db.js';
import { navigate } from '../../lib/app.js';

export function renderAdminHome(container, { user }) {
  const students = getApprovedStudents();
  const pending = getPendingUsers();
  const tests = getAllTests();
  const subjects = getAllSubjects();
  const totalSubjects = Object.values(subjects).reduce((s, arr) => s + arr.length, 0);

  // Weekly activity (last 7 days)
  const days = ['أحد','اثن','ثلا','أرب','خمي','جمع','سبت'];
  const today = new Date();
  const weekData = Array.from({length:7}, (_,i) => {
    const d = new Date(today); d.setDate(today.getDate() - (6-i));
    const dateStr = d.toDateString();
    return { day: days[d.getDay()], count: tests.filter(t => new Date(t.date).toDateString() === dateStr).length, isToday: i===6 };
  });
  const maxCount = Math.max(...weekData.map(d => d.count), 1);

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title">مرحباً، ${user.name} 👋</div>
      <div class="page-sub">${new Date().toLocaleDateString('ar-KW', {weekday:'long', year:'numeric', month:'long', day:'numeric'})}</div>
    </div>

    ${pending.length ? `
      <div style="margin:0 24px 16px;background:#FFB34718;border:1px solid #FFB34740;border-radius:var(--radius);padding:12px 16px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;" id="pending-banner">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:20px;">🔔</span>
          <div>
            <div style="font-size:14px;font-weight:600;color:var(--amber);">${pending.length} طلب تسجيل جديد</div>
            <div style="font-size:12px;color:var(--text3);">بانتظار موافقتك</div>
          </div>
        </div>
        <div style="font-size:13px;color:var(--amber);font-weight:600;">عرض ←</div>
      </div>
    ` : ''}

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-val" style="color:var(--purple);">${students.length}</div>
        <div class="stat-lbl">طالب مسجل</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" style="color:var(--teal);">${totalSubjects}</div>
        <div class="stat-lbl">مادة دراسية</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" style="color:var(--pink);">${tests.length}</div>
        <div class="stat-lbl">اختبار منجز</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" style="color:var(--amber);">${tests.filter(t => new Date(t.date).toDateString() === today.toDateString()).length}</div>
        <div class="stat-lbl">اختبار اليوم</div>
      </div>
    </div>

    <div style="padding:0 24px;margin-bottom:24px;">
      <div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
          <div style="font-size:14px;font-weight:600;color:var(--text);">نشاط الأسبوع</div>
          <div style="font-size:12px;color:var(--text3);">عدد الاختبارات</div>
        </div>
        <div class="week-chart">
          ${weekData.map(d => `
            <div class="week-bar-wrap">
              <div class="week-bar ${d.isToday?'today':''}" style="height:${Math.max(8, (d.count/maxCount)*48)}px;"></div>
              <div class="week-day">${d.day}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <div style="padding:0 24px;margin-bottom:24px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
        <div style="font-size:14px;font-weight:600;color:var(--text);">متابعة الطلاب</div>
        <div style="font-size:12px;color:var(--purple);cursor:pointer;" id="view-all-students">عرض الكل</div>
      </div>
      ${students.length === 0 ? `
        <div class="empty-state">
          <div class="empty-icon">👨‍🎓</div>
          <div class="empty-title">لا يوجد طلاب بعد</div>
          <div class="empty-sub">انتظر تسجيل الطلاب والموافقة عليهم</div>
        </div>
      ` : students.slice(0,5).map(s => {
        const stats = getTestStats(s.id);
        const avatarColors = ['av-purple','av-pink','av-teal','av-amber','av-blue'];
        const av = avatarColors[s.name.charCodeAt(0) % avatarColors.length];
        return `
          <div class="card" style="display:flex;align-items:center;gap:12px;margin-bottom:10px;cursor:pointer;" data-student="${s.id}">
            <div class="avatar avatar-md ${av}">${s.name.charAt(0)}</div>
            <div style="flex:1;min-width:0;">
              <div style="font-size:14px;font-weight:600;color:var(--text);">${s.name}</div>
              <div style="font-size:12px;color:var(--text3);margin-top:2px;">${gradeLabel(s.grade)} • ${stats.total} اختبار</div>
              <div class="progress-bar" style="margin-top:6px;">
                <div class="progress-fill" style="width:${stats.avg}%;background:var(--purple);"></div>
              </div>
            </div>
            <div style="font-size:20px;font-weight:700;color:var(--purple);flex-shrink:0;">${stats.avg}%</div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  document.getElementById('pending-banner')?.addEventListener('click', () => navigate('students', { tab: 'pending' }));
  document.getElementById('view-all-students')?.addEventListener('click', () => navigate('students'));
  container.querySelectorAll('[data-student]').forEach(el => {
    el.addEventListener('click', () => navigate('students', { selected: el.dataset.student }));
  });
}
