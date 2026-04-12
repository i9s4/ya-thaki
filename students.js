// admin/reports.js

import { getApprovedStudents, getTestsByUser, getTestStats, formatDate, gradeLabel } from '../../lib/db.js';

export function renderAdminReports(container, { user, params }) {
  const students = getApprovedStudents();
  let selectedId = params?.studentId || (students[0]?.id || null);

  function render() {
    const student = students.find(s => s.id === selectedId);
    const tests = selectedId ? getTestsByUser(selectedId) : [];
    const stats = selectedId ? getTestStats(selectedId) : { total: 0, avg: 0, weakTopics: [] };

    container.innerHTML = `
      <div class="page-header">
        <div class="page-title">التقارير</div>
        <div class="page-sub">متابعة أداء الطلاب وتحديد نقاط الضعف</div>
      </div>

      ${students.length === 0 ? `
        <div class="empty-state" style="padding:48px 24px;">
          <div class="empty-icon">📊</div>
          <div class="empty-title">لا يوجد طلاب بعد</div>
        </div>
      ` : `
        <!-- STUDENT SELECTOR -->
        <div style="padding:0 24px;margin-bottom:20px;overflow-x:auto;">
          <div style="display:flex;gap:8px;min-width:max-content;">
            ${students.map(s => `
              <div class="student-chip ${selectedId===s.id?'active':''}" data-id="${s.id}" style="display:inline-flex;align-items:center;gap:8px;padding:8px 14px;border-radius:99px;border:1px solid ${selectedId===s.id?'var(--purple)':'var(--border)'};background:${selectedId===s.id?'var(--purple-glow)':'transparent'};cursor:pointer;white-space:nowrap;">
                <div style="width:24px;height:24px;border-radius:50%;background:var(--purple);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;">${s.name.charAt(0)}</div>
                <span style="font-size:13px;font-weight:500;color:${selectedId===s.id?'var(--purple)':'var(--text2)'};">${s.name}</span>
              </div>
            `).join('')}
          </div>
        </div>

        ${!student ? '' : `
          <!-- STATS -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-val" style="color:var(--purple);">${stats.total}</div>
              <div class="stat-lbl">اختبار منجز</div>
            </div>
            <div class="stat-card">
              <div class="stat-val" style="color:${stats.avg>=80?'var(--teal)':stats.avg>=60?'var(--amber)':'var(--red)'};">${stats.avg}%</div>
              <div class="stat-lbl">متوسط النتائج</div>
            </div>
            <div class="stat-card">
              <div class="stat-val" style="color:var(--pink);">${tests.filter(t=>new Date(t.date).toDateString()===new Date().toDateString()).length}</div>
              <div class="stat-lbl">اختبار اليوم</div>
            </div>
          </div>

          ${stats.weakTopics.length ? `
            <div style="padding:0 24px;margin-bottom:20px;">
              <div class="card">
                <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:12px;">⚠️ نقاط الضعف المتكررة</div>
                <div style="display:flex;flex-wrap:wrap;gap:8px;">
                  ${stats.weakTopics.map(t => `<span class="pill pill-amber" style="font-size:13px;padding:5px 12px;">${t}</span>`).join('')}
                </div>
              </div>
            </div>
          ` : ''}

          <!-- TESTS LIST -->
          <div style="padding:0 24px;">
            <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:12px;">سجل الاختبارات</div>
            ${tests.length === 0 ? `
              <div class="empty-state">
                <div class="empty-icon">📝</div>
                <div class="empty-title">لا توجد اختبارات بعد</div>
              </div>
            ` : [...tests].reverse().map(t => {
              const pct = Math.round(t.score / t.total * 100);
              return `
                <div class="card" style="margin-bottom:10px;">
                  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                    <div>
                      <div style="font-size:14px;font-weight:600;color:var(--text);">${t.subjectName}</div>
                      <div style="font-size:12px;color:var(--text3);">${formatDate(t.date)} • ${t.total} سؤال</div>
                    </div>
                    <div style="text-align:center;">
                      <div style="font-size:20px;font-weight:700;color:${pct>=80?'var(--teal)':pct>=60?'var(--amber)':'var(--red)'};">${t.score}/${t.total}</div>
                      <div style="font-size:11px;color:var(--text3);">${pct}%</div>
                    </div>
                  </div>
                  <div class="progress-bar">
                    <div class="progress-fill" style="width:${pct}%;background:${pct>=80?'var(--teal)':pct>=60?'var(--amber)':'var(--red)'};"></div>
                  </div>
                  ${t.wrongTopics?.length ? `
                    <div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:4px;">
                      ${t.wrongTopics.map(w => `<span class="pill pill-amber" style="font-size:10px;">${w}</span>`).join('')}
                    </div>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>
        `}
      `}
    `;

    container.querySelectorAll('.student-chip').forEach(el => {
      el.addEventListener('click', () => { selectedId = el.dataset.id; render(); });
    });
  }

  render();
}
