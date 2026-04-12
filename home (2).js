// admin/students.js

import { getApprovedStudents, getPendingUsers, saveUser, deleteUser, getTestStats, getTestsByUser, formatDate, gradeLabel, generateId } from '../../lib/db.js';
import { showToast, navigate } from '../../lib/app.js';

export function renderAdminStudents(container, { user, params }) {
  let activeTab = params?.tab || 'approved';
  let selectedStudent = params?.selected || null;

  function render() {
    const approved = getApprovedStudents();
    const pending = getPendingUsers();

    container.innerHTML = `
      <div class="page-header">
        <div class="page-title">إدارة الطلاب</div>
        <div class="page-sub">متابعة ومراقبة الطلاب المسجلين</div>
      </div>

      <div class="tabs" style="margin:0 24px 20px;">
        <div class="tab-item ${activeTab==='approved'?'active':''}" data-tab="approved">
          الطلاب (${approved.length})
        </div>
        <div class="tab-item ${activeTab==='pending'?'active':''}" data-tab="pending">
          طلبات التسجيل ${pending.length ? `<span class="pill pill-pink" style="margin-right:6px;">${pending.length}</span>` : `(${pending.length})`}
        </div>
      </div>

      <div style="padding:0 24px;" id="students-content">
        ${activeTab === 'approved' ? renderApproved(approved) : renderPending(pending)}
      </div>
    `;

    container.querySelectorAll('[data-tab]').forEach(el => {
      el.addEventListener('click', () => { activeTab = el.dataset.tab; render(); });
    });

    // Pending actions
    container.querySelectorAll('.approve-btn').forEach(el => {
      el.addEventListener('click', () => approveUser(el.dataset.userId));
    });
    container.querySelectorAll('.reject-btn').forEach(el => {
      el.addEventListener('click', () => rejectUser(el.dataset.userId));
    });

    // Student settings
    container.querySelectorAll('.student-settings-btn').forEach(el => {
      el.addEventListener('click', () => showStudentModal(el.dataset.userId));
    });
    container.querySelectorAll('.delete-student-btn').forEach(el => {
      el.addEventListener('click', () => {
        if (confirm('هل تريد حذف هذا الطالب نهائياً؟')) {
          deleteUser(el.dataset.userId);
          showToast('تم حذف الطالب');
          render();
        }
      });
    });
  }

  function renderApproved(students) {
    if (!students.length) return `<div class="empty-state"><div class="empty-icon">👨‍🎓</div><div class="empty-title">لا يوجد طلاب مسجلون</div><div class="empty-sub">انتظر تسجيل الطلاب والموافقة عليهم</div></div>`;
    return students.map(s => {
      const stats = getTestStats(s.id);
      const avatarColors = ['av-purple','av-pink','av-teal','av-amber','av-blue'];
      const av = avatarColors[s.name.charCodeAt(0) % avatarColors.length];
      return `
        <div class="card" style="margin-bottom:12px;">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
            <div class="avatar avatar-md ${av}">${s.name.charAt(0)}</div>
            <div style="flex:1;">
              <div style="font-size:15px;font-weight:700;color:var(--text);">${s.name}</div>
              <div style="font-size:12px;color:var(--text3);">${gradeLabel(s.grade)} • ${s.email}</div>
              <div style="display:flex;gap:6px;margin-top:5px;flex-wrap:wrap;">
                <span class="pill ${s.limitOpen?'pill-teal':'pill-purple'}">${s.limitOpen ? 'بدون حد' : (s.dailyLimit || 20) + ' سؤال/يوم'}</span>
                <span class="pill ${s.allowedHours?.open?'pill-teal':'pill-amber'}">${s.allowedHours?.open ? 'متاح دائماً' : (s.allowedHours?.from || '??') + ' - ' + (s.allowedHours?.to || '??')}</span>
              </div>
            </div>
            <div style="text-align:center;">
              <div style="font-size:22px;font-weight:700;color:var(--purple);">${stats.avg}%</div>
              <div style="font-size:10px;color:var(--text3);">${stats.total} اختبار</div>
            </div>
          </div>
          ${stats.weakTopics.length ? `
            <div style="margin-bottom:10px;">
              <div style="font-size:11px;color:var(--text3);margin-bottom:5px;">نقاط الضعف:</div>
              <div style="display:flex;flex-wrap:wrap;gap:4px;">
                ${stats.weakTopics.map(t => `<span class="pill pill-amber">${t}</span>`).join('')}
              </div>
            </div>
          ` : ''}
          <div style="display:flex;gap:8px;">
            <button class="btn btn-sm btn-secondary student-settings-btn" data-user-id="${s.id}">⚙️ الإعدادات</button>
            <button class="btn btn-sm btn-ghost" data-user-id="${s.id}" onclick="document.querySelector('[data-student-tests]')?.remove(); navigate('reports', {studentId: '${s.id}'})">📊 التقارير</button>
            <button class="btn btn-sm btn-danger delete-student-btn" data-user-id="${s.id}">حذف</button>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderPending(pending) {
    if (!pending.length) return `<div class="empty-state"><div class="empty-icon">✅</div><div class="empty-title">لا توجد طلبات جديدة</div><div class="empty-sub">جميع الطلبات تمت معالجتها</div></div>`;
    return pending.map(u => `
      <div class="card" style="margin-bottom:12px;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
          <div class="avatar avatar-md av-purple">${u.name.charAt(0)}</div>
          <div style="flex:1;">
            <div style="font-size:15px;font-weight:700;color:var(--text);">${u.name}</div>
            <div style="font-size:12px;color:var(--text3);">${u.email} • ${gradeLabel(u.grade)}</div>
            <div style="font-size:11px;color:var(--text3);margin-top:2px;">سجّل ${formatDate(u.createdAt)}</div>
          </div>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-primary btn-sm approve-btn" data-user-id="${u.id}">✓ قبول</button>
          <button class="btn btn-danger btn-sm reject-btn" data-user-id="${u.id}">✕ رفض</button>
        </div>
      </div>
    `).join('');
  }

  function approveUser(userId) {
    const users = getApprovedStudents().concat(getPendingUsers());
    const u = getPendingUsers().find(u => u.id === userId);
    if (!u) return;
    u.approved = true;
    u.dailyLimit = 20;
    u.limitOpen = false;
    u.allowedHours = { open: true, from: '14:00', to: '22:00' };
    saveUser(u);
    showToast(`تم قبول ${u.name}`, 'success');
    render();
  }

  function rejectUser(userId) {
    const u = getPendingUsers().find(u => u.id === userId);
    if (!u) return;
    deleteUser(userId);
    showToast('تم رفض الطلب');
    render();
  }

  function showStudentModal(userId) {
    const allStudents = getApprovedStudents();
    const student = allStudents.find(s => s.id === userId);
    if (!student) return;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">إعدادات — ${student.name}</div>
          <button class="btn btn-icon btn-ghost" id="close-sm">✕</button>
        </div>

        <div class="input-group">
          <label class="input-label">الصف الدراسي</label>
          <select id="sm-grade">
            ${Array.from({length:12},(_,i)=>i+1).map(g=>`<option value="${g}" ${student.grade==g?'selected':''}>الصف ${g}</option>`).join('')}
          </select>
        </div>

        <div style="margin-bottom:16px;">
          <label class="input-label" style="display:block;margin-bottom:8px;">حد الأسئلة اليومية</label>
          <div style="display:flex;align-items:center;gap:10px;">
            <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text2);cursor:pointer;">
              <input type="checkbox" id="sm-limit-open" ${student.limitOpen?'checked':''} />
              مفتوح بدون حد
            </label>
          </div>
          <div style="display:flex;align-items:center;gap:10px;margin-top:8px;" id="sm-limit-row">
            <input type="number" id="sm-limit" value="${student.dailyLimit || 20}" min="1" max="999" style="width:100px;" />
            <span style="font-size:13px;color:var(--text2);">سؤال في اليوم</span>
          </div>
        </div>

        <div style="margin-bottom:16px;">
          <label class="input-label" style="display:block;margin-bottom:8px;">أوقات الاستخدام المسموحة</label>
          <div style="display:flex;align-items:center;gap:10px;">
            <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text2);cursor:pointer;">
              <input type="checkbox" id="sm-hours-open" ${student.allowedHours?.open?'checked':''} />
              متاح في أي وقت
            </label>
          </div>
          <div style="display:flex;align-items:center;gap:10px;margin-top:8px;" id="sm-hours-row">
            <span style="font-size:13px;color:var(--text2);">من</span>
            <input type="time" id="sm-from" value="${student.allowedHours?.from || '14:00'}" style="width:100px;" />
            <span style="font-size:13px;color:var(--text2);">إلى</span>
            <input type="time" id="sm-to" value="${student.allowedHours?.to || '22:00'}" style="width:100px;" />
          </div>
        </div>

        <button class="btn btn-primary btn-full" id="sm-save">حفظ الإعدادات</button>
      </div>
    `;
    document.body.appendChild(overlay);

    const limitOpenEl = document.getElementById('sm-limit-open');
    const limitRow = document.getElementById('sm-limit-row');
    const hoursOpenEl = document.getElementById('sm-hours-open');
    const hoursRow = document.getElementById('sm-hours-row');

    function updateVisibility() {
      limitRow.style.opacity = limitOpenEl.checked ? '0.4' : '1';
      limitRow.style.pointerEvents = limitOpenEl.checked ? 'none' : 'auto';
      hoursRow.style.opacity = hoursOpenEl.checked ? '0.4' : '1';
      hoursRow.style.pointerEvents = hoursOpenEl.checked ? 'none' : 'auto';
    }
    updateVisibility();
    limitOpenEl.addEventListener('change', updateVisibility);
    hoursOpenEl.addEventListener('change', updateVisibility);

    document.getElementById('close-sm').onclick = () => overlay.remove();
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

    document.getElementById('sm-save').onclick = () => {
      student.grade = parseInt(document.getElementById('sm-grade').value);
      student.limitOpen = limitOpenEl.checked;
      student.dailyLimit = parseInt(document.getElementById('sm-limit').value) || 20;
      student.allowedHours = {
        open: hoursOpenEl.checked,
        from: document.getElementById('sm-from').value,
        to: document.getElementById('sm-to').value
      };
      saveUser(student);
      overlay.remove();
      showToast('تم حفظ الإعدادات', 'success');
      render();
    };
  }

  render();
}
