// ai.js — Anthropic API integration

export async function askAI({ apiKey, systemPrompt, messages, onChunk }) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: 'claude-opus-4-5',
      max_tokens: 2048,
      system: systemPrompt,
      messages
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `خطأ في الاتصال (${response.status})`);
  }

  const data = await response.json();
  return data.content?.map(b => b.text || '').join('') || '';
}

// ---- PROMPTS ----

export function buildExplainPrompt(subject, files) {
  const filesText = files.map(f => `[ملف: ${f.name}]\n${f.extractedText || '(محتوى مرفوع)'}`).join('\n\n');
  return `أنت مساعد دراسي ذكي ومتخصص. مهمتك مساعدة الطالب على فهم مادة "${subject}".

المحتوى الدراسي المتاح:
${filesText}

تعليمات مهمة:
- أجب دائماً بالعربية الفصحى البسيطة الواضحة
- استند فقط على المحتوى الدراسي المقدم
- إذا سأل الطالب عن شيء غير موجود في المحتوى، قل له ذلك بلطف
- اشرح بأمثلة عملية عند الإمكان
- كن مشجعاً وإيجابياً
- الشرح يكون منظماً ومرتباً بنقاط عند الحاجة`;
}

export function buildReviewPrompt(subject, files) {
  const filesText = files.map(f => `[ملف: ${f.name}]\n${f.extractedText || '(محتوى مرفوع)'}`).join('\n\n');
  return `أنت مساعد دراسي تقوم بمراجعة الطالب على مادة "${subject}".

المحتوى الدراسي:
${filesText}

تعليمات:
- اطرح أسئلة مراجعة متنوعة من المحتوى
- صحح إجابات الطالب بلطف وتشجيع
- إذا أخطأ، اشرح له الإجابة الصحيحة
- بعد كل إجابة صحيحة، تابع بسؤال جديد
- تنوع بين الأسئلة المقالية والاختيار المتعدد
- استخدم العربية البسيطة الواضحة`;
}

export function buildTestPrompt(subject, files, numQuestions) {
  const filesText = files.map(f => `[ملف: ${f.name}]\n${f.extractedText || '(محتوى مرفوع)'}`).join('\n\n');
  return `أنت مساعد دراسي تدير اختباراً رسمياً لمادة "${subject}".

المحتوى الدراسي:
${filesText}

تعليمات الاختبار:
- عدد الأسئلة: ${numQuestions}
- ابدأ بتقديم نفسك وأخبر الطالب بعدد الأسئلة
- اطرح سؤالاً واحداً في كل مرة وانتظر الإجابة
- بعد كل إجابة: أخبر الطالب إذا كان صح أم خطأ، واشرح الإجابة الصحيحة إذا أخطأ
- في نهاية الاختبار: أعطِ تقييماً شاملاً، النتيجة، ونقاط الضعف
- في آخر رسالة، أضف هذا بالضبط على سطر منفصل:
  RESULT: النتيجة_العددية/الإجمالي | المواضيع_الضعيفة_مفصولة_بفاصلة
  مثال: RESULT: 7/10 | القوانين الحركية,الكميات المتجهة
- استخدم العربية البسيطة وكن مشجعاً`;
}

export function buildWeaknessPrompt(subject, weakTopics, files) {
  const filesText = files.map(f => `[ملف: ${f.name}]\n${f.extractedText || ''}`).join('\n\n');
  return `أنت مساعد دراسي متخصص في علاج نقاط الضعف.

المادة: ${subject}
نقاط الضعف المحددة: ${weakTopics.join('، ')}

المحتوى الدراسي:
${filesText}

مهمتك:
- ركّز على شرح نقاط الضعف هذه تحديداً
- اشرح بطريقة مبسطة مختلفة عن الطريقة الاعتيادية
- أعطِ أمثلة وتمارين على كل نقطة ضعف
- تأكد أن الطالب فهم قبل الانتقال للنقطة التالية
- كن صبوراً ومشجعاً`;
}

// ---- PDF TEXT EXTRACTION ----
export async function extractTextFromPDF(file, apiKey) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const base64 = e.target.result.split(',')[1];
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true'
          },
          body: JSON.stringify({
            model: 'claude-opus-4-5',
            max_tokens: 4096,
            messages: [{
              role: 'user',
              content: [
                {
                  type: 'document',
                  source: { type: 'base64', media_type: 'application/pdf', data: base64 }
                },
                {
                  type: 'text',
                  text: 'استخرج كل النص من هذا الملف بدقة. إذا كان فيه صور تحتوي نصاً أو معادلات، اكتبها. احتفظ بالتنسيق والترقيم قدر الإمكان. لا تضف أي تعليق أو مقدمة، فقط النص المستخرج.'
                }
              ]
            }]
          })
        });
        const data = await response.json();
        const text = data.content?.map(b => b.text || '').join('') || '';
        resolve(text);
      } catch (err) {
        console.error('PDF extraction error:', err);
        resolve('');
      }
    };
    reader.readAsDataURL(file);
  });
}

export function parseTestResult(message) {
  const match = message.match(/RESULT:\s*(\d+)\/(\d+)\s*\|\s*(.+)/);
  if (!match) return null;
  const score = parseInt(match[1]);
  const total = parseInt(match[2]);
  const weakTopics = match[3].split(',').map(t => t.trim()).filter(Boolean);
  return { score, total, weakTopics };
}
