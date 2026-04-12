// setup.js — first-time setup

import { saveSettings, generateId, saveUser } from '../lib/db.js';
import { showToast } from '../lib/app.js';

export function renderSetup(container, { onComplete }) {
  container.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:var(--bg);">
      <div style="width:100%;max-width:460px;">
        <div style="text-align:center;margin-bottom:32px;">
          <div style="font-size:36px;font-weight:800;color:var(--text);margin-bottom:8px;">يا <span style="color:var(--purple)">ذكي</span></div>
          <div style="font-size:14px;color:var(--text3);">إعداد الحساب الأول — مرحباً بك</div>
        </div>

        <div class="card card-lg">
          <div style="font-size:16px;font-weight:700;color:var(--text);margin-bottom:4px;">إعداد حساب المشرف</div>
          <div style="font-size:13px;color:var(--text3);margin-bottom:20px;">هذا الحساب خاص بك كولي أمر للتحكم في البرنامج</div>

          <div class="input-group">
            <label class="input-label">اسمك</label>
            <input type="text" id="s-name" placeholder="مثال: أبو محمد" />
          </div>
          <div class="input-group">
            <label class="input-label">البريد الإلكتروني</label>
            <input type="email" id="s-email" placeholder="example@mail.com" />
          </div>
          <div class="input-group">
            <label class="input-label">كلمة المرور</label>
            <input type="password" id="s-pass" placeholder="8 أحرف على الأقل" />
          </div>
          <div class="input-group">
            <label class="input-label">مفتاح الذكاء الاصطناعي (Anthropic API Key)</label>
            <input type="password" id="s-key" placeholder="sk-ant-..." />
            <div style="font-size:11px;color:var(--text3);margin-top:5px;">احصل عليه من platform.anthropic.com</div>
          </div>

          <button class="btn btn-primary btn-full btn-lg" id="s-submit" style="margin-top:8px;">
            إنشاء الحساب والبدء
          </button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('s-submit').onclick = () => {
    const name = document.getElementById('s-name').value.trim();
    const email = document.getElementById('s-email').value.trim();
    const pass = document.getElementById('s-pass').value;
    const key = document.getElementById('s-key').value.trim();

    if (!name || !email || !pass || !key) { showToast('يرجى تعبئة جميع الحقول', 'error'); return; }
    if (pass.length < 8) { showToast('كلمة المرور يجب أن تكون 8 أحرف على الأقل', 'error'); return; }
    if (!key.startsWith('sk-ant-')) { showToast('مفتاح الذكاء الاصطناعي غير صحيح', 'error'); return; }

    const adminId = generateId();
    saveSettings({ adminEmail: email, adminName: name, apiKey: key });
    saveUser({ id: adminId, name, email, password: pass, isAdmin: true, approved: true, createdAt: new Date().toISOString() });
    showToast('تم إنشاء الحساب بنجاح', 'success');
    onComplete();
  };
}
