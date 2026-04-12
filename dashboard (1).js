// admin/subjects.js

import { getSubjects, saveSubject, deleteSubject, addFileToSubject, removeFileFromSubject, generateId, getSettings, formatDate, gradeLabel } from '../../lib/db.js';
import { showToast } from '../../lib/app.js';
import { extractTextFromPDF } from '../../lib/ai.js';

export function renderAdminSubjects(container, { user, params }) {
  let selectedGrade = params?.grade || 1;
  const grades = Array.from({length:12},(_,i)=>i+1);

  const icons = ['📐','🔬','⚗️','🧬','📖','🌍','💻','🎨','🏛️','📝','🔢','🔭'];
  const colors = ['var(--purple-glow)','var(--teal-glow)','#FF6B9D18','#FFB34720','#4A9EFF18','#00D4AA18'];

  function render() {
    const subjects = getSubjects(selectedGrade);
    container.innerHTML = `
      <div class="page-header">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div>
            <div class="page-title">المواد الدراسية</div>
            <div class="page-sub">إدارة مصادر كل صف</div>
          </div>
          <button class="btn btn-primary" id="add-subject-btn">+ إضافة مادة</button>
        </div>
      </div>

      <!-- GRADE TABS -->
      <div style="padding:0 24px;margin-bottom:16px;overflow-x:auto;">
        <div style="display:flex;gap:8px;min-width:max-content;">
          ${grades.map(g => `
            <button class="btn btn-sm ${selectedGrade==g?'btn-primary':'btn-ghost'}" data-grade="${g}">
              ص${g}
            </button>
          `).join('')}
        </div>
      </div>

      <div style="padding:0 24px;" id="subjects-content">
        ${subjects.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">📚</div>
            <div class="empty-title">لا توجد مواد للصف ${selectedGrade}</div>
            <div class="empty-sub">أضف مادة وارفع ملفاتها الدراسية</div>
            <button class="btn btn-primary" id="add-subject-btn-2">+ إضافة أول مادة</button>
          </div>
        ` : subjects.map(s => renderSubjectCard(s)).join('')}
      </div>
    `;

    // Grade tabs
    container.querySelectorAll('[data-grade]').forEach(el => {
      el.addEventListener('click', () => { selectedGrade = parseInt(el.dataset.grade); render(); });
    });

    document.getElementById('add-subject-btn')?.addEventListener('click', () => showAddSubjectModal());
    document.getElementById('add-subject-btn-2')?.addEventListener('click', () => showAddSubjectModal());

    // Subject actions
    container.querySelectorAll('.upload-file-btn').forEach(el => {
      el.addEventListener('click', () => showUploadModal(el.dataset.subjectId));
    });
    container.querySelectorAll('.delete-subject-btn').forEach(el => {
      el.addEventListener('click', () => {
        if (confirm('هل تريد حذف هذه المادة وجميع ملفاتها؟')) {
          deleteSubject(selectedGrade, el.dataset.subjectId);
          showToast('تم حذف المادة', 'success');
          render();
        }
      });
    });
    container.querySelectorAll('.delete-file-btn').forEach(el => {
      el.addEventListener('click', () => {
        removeFileFromSubject(selectedGrade, el.dataset.subjectId, el.dataset.fileId);
        showToast('تم حذف الملف');
        render();
      });
    });
  }

  function renderSubjectCard(s) {
    const files = s.files || [];
    return `
      <div class="card" style="margin-bottom:16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:44px;height:44px;border-radius:12px;background:${s.color || colors[0]};display:flex;align-items:center;justify-content:center;font-size:22px;">${s.icon || '📚'}</div>
            <div>
              <div style="font-size:15px;font-weight:700;color:var(--text);">${s.name}</div>
              <div style="font-size:12px;color:var(--text3);">${gradeLabel(selectedGrade)} • ${files.length} ملف</div>
            </div>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-sm btn-secondary upload-file-btn" data-subject-id="${s.id}">+ رفع ملف</button>
            <button class="btn btn-sm btn-danger delete-subject-btn" data-subject-id="${s.id}">حذف</button>
          </div>
        </div>

        ${files.length === 0 ? `
          <div class="upload-zone upload-file-btn" data-subject-id="${s.id}" style="cursor:pointer;">
            <div class="upload-zone-icon">📂</div>
            <div class="upload-zone-title">اسحب الملف هنا أو اضغط للرفع</div>
            <div class="upload-zone-sub">PDF — حتى 50MB</div>
          </div>
        ` : `
          <div style="display:flex;flex-direction:column;gap:8px;">
            ${files.map(f => `
              <div class="file-card">
                <div class="file-icon-wrap">📄</div>
                <div class="file-info">
                  <div class="file-name">${f.name}</div>
                  <div class="file-meta">${(f.size/1024/1024).toFixed(1)} MB • ${formatDate(f.uploadedAt)}</div>
                  <span class="pill ${f.extracted ? 'pill-teal' : 'pill-amber'}" style="margin-top:4px;">
                    ${f.extracted ? '✓ جاهز للاستخدام' : '⏳ قيد المعالجة...'}
                  </span>
                </div>
                <button class="btn btn-icon btn-danger delete-file-btn" data-subject-id="${s.id}" data-file-id="${f.id}">🗑</button>
              </div>
            `).join('')}
            <button class="btn btn-ghost btn-sm upload-file-btn" data-subject-id="${s.id}" style="margin-top:4px;">+ إضافة ملف آخر</button>
          </div>
        `}
      </div>
    `;
  }

  function showAddSubjectModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">إضافة مادة جديدة</div>
          <button class="btn btn-icon btn-ghost" id="close-modal">✕</button>
        </div>
        <div class="input-group">
          <label class="input-label">اسم المادة</label>
          <input type="text" id="m-name" placeholder="مثال: رياضيات، فيزياء..." />
        </div>
        <div class="input-group">
          <label class="input-label">أيقونة المادة</label>
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px;">
            ${icons.map((ic,i) => `<div class="icon-opt" data-icon="${ic}" style="width:40px;height:40px;border-radius:10px;background:var(--bg3);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:20px;cursor:pointer;">${ic}</div>`).join('')}
          </div>
        </div>
        <input type="hidden" id="m-icon" value="${icons[0]}" />
        <button class="btn btn-primary btn-full" id="m-save" style="margin-top:8px;">إضافة المادة</button>
      </div>
    `;
    document.body.appendChild(overlay);

    let selectedIcon = icons[0];
    overlay.querySelectorAll('.icon-opt').forEach(el => {
      el.addEventListener('click', () => {
        overlay.querySelectorAll('.icon-opt').forEach(o => o.style.background = 'var(--bg3)');
        el.style.background = 'var(--purple-glow)';
        selectedIcon = el.dataset.icon;
      });
    });

    document.getElementById('close-modal').onclick = () => overlay.remove();
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    document.getElementById('m-save').onclick = () => {
      const name = document.getElementById('m-name').value.trim();
      if (!name) { showToast('أدخل اسم المادة', 'error'); return; }
      const colorIdx = Math.floor(Math.random() * colors.length);
      saveSubject(selectedGrade, { id: generateId(), name, icon: selectedIcon, color: colors[colorIdx], files: [] });
      overlay.remove();
      showToast('تمت إضافة المادة', 'success');
      render();
    };
  }

  function showUploadModal(subjectId) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">رفع ملف PDF</div>
          <button class="btn btn-icon btn-ghost" id="close-upload">✕</button>
        </div>
        <div class="upload-zone" id="drop-zone">
          <div class="upload-zone-icon">📂</div>
          <div class="upload-zone-title">اسحب الملف هنا أو اضغط للاختيار</div>
          <div class="upload-zone-sub">PDF فقط — حتى 50MB</div>
          <input type="file" id="file-input" accept=".pdf" style="display:none;" />
          <button class="btn btn-secondary" style="margin-top:12px;" onclick="document.getElementById('file-input').click()">اختر ملف</button>
        </div>
        <div id="upload-status" style="margin-top:12px;display:none;">
          <div style="display:flex;align-items:center;gap:10px;">
            <div class="spinner"></div>
            <div style="font-size:13px;color:var(--text2);" id="upload-msg">جاري رفع الملف...</div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('close-upload').onclick = () => overlay.remove();
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');

    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', e => { e.preventDefault(); dropZone.classList.remove('drag-over'); handleFile(e.dataTransfer.files[0]); });
    fileInput.addEventListener('change', () => handleFile(fileInput.files[0]));

    async function handleFile(file) {
      if (!file) return;
      if (file.type !== 'application/pdf') { showToast('يرجى اختيار ملف PDF', 'error'); return; }
      if (file.size > 50 * 1024 * 1024) { showToast('حجم الملف يجب أن يكون أقل من 50MB', 'error'); return; }

      const statusEl = document.getElementById('upload-status');
      const msgEl = document.getElementById('upload-msg');
      statusEl.style.display = 'block';
      dropZone.style.opacity = '0.5';
      dropZone.style.pointerEvents = 'none';

      const fileRecord = { id: generateId(), name: file.name, size: file.size, uploadedAt: new Date().toISOString(), extracted: false, extractedText: '' };
      addFileToSubject(selectedGrade, subjectId, fileRecord);

      msgEl.textContent = 'جاري استخراج النص من الملف...';
      try {
        const { apiKey } = getSettings();
        const text = await extractTextFromPDF(file, apiKey);
        const subjects = getSubjects(selectedGrade);
        const subj = subjects.find(s => s.id === subjectId);
        if (subj) {
          const f = subj.files.find(f => f.id === fileRecord.id);
          if (f) { f.extracted = true; f.extractedText = text; saveSubject(selectedGrade, subj); }
        }
        showToast('تم رفع الملف وتجهيزه', 'success');
      } catch (err) {
        showToast('تم رفع الملف (تعذر استخراج النص تلقائياً)', 'error');
      }
      overlay.remove();
      render();
    }
  }

  render();
}
