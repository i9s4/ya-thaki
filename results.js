// admin/settings.js

import { getSettings, saveSettings } from '../../lib/db.js';
import { showToast, applyTheme } from '../../lib/app.js';

export function renderAdminSettings(container, { user }) {
  function render() {
    const s = getSettings();
    container.innerHTML = `
      <div class="page-header">
        <div class="page-title">الإعدادات</div>
        <div class="page-sub">إعدادات الحساب والبرنامج</div>
      </div>

      <div style="padding:0 24px;max-width:560px;">

        <div class="card" style="margin-bottom:16px;">
          <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:16px;">معلومات الحساب</div>
          <div class="input-group">
            <label class="input-label">الاسم</label>
            <input type="text" id="st-name" value="${s.adminName || ''}" />
          </div>
          <div class="input-group">
            <label class="input-label">البريد الإلكتروني</label>
            <input type="email" id="st-email" value="${s.adminEmail || ''}" />
          </div>
          <div class="input-group">
            <label class="input-label">كلمة المرور الجديدة (اتركها فارغة إذا لا تريد التغيير)</label>
            <input type="password" id="st-pass" placeholder="كلمة مرور جديدة" />
          </div>
          <button class="btn btn-primary" id="save-account">حفظ</button>
        </div>

        <div class="card" style="margin-bottom:16px;">
          <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:16px;">مفتاح الذكاء الاصطناعي</div>
          <div class="input-group">
            <label class="input-label">Anthropic API Key</label>
            <input type="password" id="st-key" value="${s.apiKey || ''}" placeholder="sk-ant-..." />
            <div style="font-size:11px;color:var(--text3);margin-top:5px;">يُخزن محلياً على جهازك فقط</div>
          </div>
          <button class="btn btn-primary" id="save-key">حفظ المفتاح</button>
        </div>

        <div class="card" style="margin-bottom:16px;">
          <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:16px;">مظهر البرنامج</div>
          <div style="display:flex;gap:10px;">
            <button class="btn ${window._state.theme==='dark'?'btn-primary':'btn-ghost'}" id="theme-dark">🌙 داكن</button>
            <button class="btn ${window._state.theme==='light'?'btn-primary':'btn-ghost'}" id="theme-light">☀️ فاتح</button>
          </div>
        </div>

        <div class="card" style="border-color:#FF5C5C33;">
          <div style="font-size:14px;font-weight:700;color:var(--red);margin-bottom:8px;">منطقة الخطر</div>
          <div style="font-size:13px;color:var(--text3);margin-bottom:12px;">مسح جميع البيانات — لا يمكن التراجع</div>
          <button class="btn btn-danger" id="clear-data">مسح جميع البيانات</button>
        </div>
      </div>
    `;

    document.getElementById('save-account').onclick = () => {
      const name = document.getElementById('st-name').value.trim();
      const email = document.getElementById('st-email').value.trim();
      const pass = document.getElementById('st-pass').value;
      if (!name || !email) { showToast('أدخل الاسم والبريد', 'error'); return; }
      const update = { adminName: name, adminEmail: email };
      if (pass) { if (pass.length < 8) { showToast('كلمة المرور يجب أن تكون 8 أحرف', 'error'); return; } update.adminPassword = pass; }
      saveSettings(update);
      showToast('تم حفظ البيانات', 'success');
    };

    document.getElementById('save-key').onclick = () => {
      const key = document.getElementById('st-key').value.trim();
      if (!key.startsWith('sk-ant-')) { showToast('المفتاح غير صحيح', 'error'); return; }
      saveSettings({ apiKey: key });
      showToast('تم حفظ المفتاح', 'success');
    };

    document.getElementById('theme-dark').onclick = () => { applyTheme('dark'); render(); };
    document.getElementById('theme-light').onclick = () => { applyTheme('light'); render(); };

    document.getElementById('clear-data').onclick = () => {
      if (confirm('هذا الإجراء سيمسح جميع البيانات نهائياً. هل أنت متأكد؟')) {
        if (confirm('تأكيد أخير: هل تريد حقاً مسح كل شيء؟')) {
          localStorage.removeItem('ya_thaki_db');
          location.reload();
        }
      }
    };
  }

  render();
}
