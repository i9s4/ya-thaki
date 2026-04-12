// db.js — local storage database

const DB_KEY = 'ya_thaki_db';

function getDB() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    return raw ? JSON.parse(raw) : initDB();
  } catch { return initDB(); }
}

function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function initDB() {
  const db = {
    settings: {
      apiKey: '',
      theme: 'dark',
      adminPassword: '',
      adminEmail: '',
      adminName: '',
      createdAt: new Date().toISOString()
    },
    subjects: {},   // { gradeKey: [ { id, name, icon, color, files: [] } ] }
    users: {},      // { userId: { id, name, email, password, grade, approved, createdAt, dailyLimit, limitOpen, allowedHours: {from, to, open}, questionsToday, lastDate } }
    tests: [],      // [ { id, userId, subjectId, subjectName, grade, score, total, questions, wrongTopics, date } ]
    weeklyReports: []
  };
  saveDB(db);
  return db;
}

// ---- SETTINGS ----
export function getSettings() { return getDB().settings; }
export function saveSettings(settings) {
  const db = getDB(); db.settings = { ...db.settings, ...settings }; saveDB(db);
}

// ---- SUBJECTS ----
export function getSubjects(grade) {
  const db = getDB();
  return db.subjects[grade] || [];
}
export function getAllSubjects() { return getDB().subjects; }
export function saveSubject(grade, subject) {
  const db = getDB();
  if (!db.subjects[grade]) db.subjects[grade] = [];
  const idx = db.subjects[grade].findIndex(s => s.id === subject.id);
  if (idx >= 0) db.subjects[grade][idx] = subject;
  else db.subjects[grade].push(subject);
  saveDB(db);
}
export function deleteSubject(grade, subjectId) {
  const db = getDB();
  if (db.subjects[grade]) db.subjects[grade] = db.subjects[grade].filter(s => s.id !== subjectId);
  saveDB(db);
}

// ---- FILES (stored as base64 in subject) ----
export function addFileToSubject(grade, subjectId, file) {
  const db = getDB();
  const subj = db.subjects[grade]?.find(s => s.id === subjectId);
  if (!subj) return;
  if (!subj.files) subj.files = [];
  subj.files.push(file);
  saveDB(db);
}
export function removeFileFromSubject(grade, subjectId, fileId) {
  const db = getDB();
  const subj = db.subjects[grade]?.find(s => s.id === subjectId);
  if (!subj) return;
  subj.files = (subj.files || []).filter(f => f.id !== fileId);
  saveDB(db);
}

// ---- USERS ----
export function getUsers() { return getDB().users; }
export function getUser(userId) { return getDB().users[userId]; }
export function getUserByEmail(email) {
  const users = getDB().users;
  return Object.values(users).find(u => u.email === email);
}
export function saveUser(user) {
  const db = getDB();
  db.users[user.id] = user;
  saveDB(db);
}
export function deleteUser(userId) {
  const db = getDB(); delete db.users[userId]; saveDB(db);
}
export function getPendingUsers() {
  return Object.values(getDB().users).filter(u => !u.approved && !u.isAdmin);
}
export function getApprovedStudents() {
  return Object.values(getDB().users).filter(u => u.approved && !u.isAdmin);
}

// ---- QUESTION LIMITS ----
export function canAskQuestion(userId) {
  const db = getDB();
  const user = db.users[userId];
  if (!user) return false;
  if (user.limitOpen) return true;
  const today = new Date().toDateString();
  if (user.lastDate !== today) {
    user.questionsToday = 0;
    user.lastDate = today;
    saveDB(db);
  }
  return (user.questionsToday || 0) < (user.dailyLimit || 20);
}
export function incrementQuestions(userId) {
  const db = getDB();
  const user = db.users[userId];
  if (!user) return;
  const today = new Date().toDateString();
  if (user.lastDate !== today) { user.questionsToday = 0; user.lastDate = today; }
  user.questionsToday = (user.questionsToday || 0) + 1;
  saveDB(db);
}
export function getRemainingQuestions(userId) {
  const db = getDB();
  const user = db.users[userId];
  if (!user) return 0;
  if (user.limitOpen) return 999;
  const today = new Date().toDateString();
  const used = user.lastDate === today ? (user.questionsToday || 0) : 0;
  return Math.max(0, (user.dailyLimit || 20) - used);
}

// ---- HOURS CHECK ----
export function isWithinAllowedHours(userId) {
  const user = getUser(userId);
  if (!user) return false;
  if (!user.allowedHours || user.allowedHours.open) return true;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [fH, fM] = (user.allowedHours.from || '00:00').split(':').map(Number);
  const [tH, tM] = (user.allowedHours.to || '23:59').split(':').map(Number);
  const fromMin = fH * 60 + fM;
  const toMin = tH * 60 + tM;
  return currentMinutes >= fromMin && currentMinutes <= toMin;
}

// ---- TESTS ----
export function saveTest(test) {
  const db = getDB();
  db.tests.push(test);
  saveDB(db);
}
export function getTestsByUser(userId) {
  return getDB().tests.filter(t => t.userId === userId);
}
export function getAllTests() { return getDB().tests; }
export function getTestStats(userId) {
  const tests = getTestsByUser(userId);
  if (!tests.length) return { total: 0, avg: 0, weakTopics: [] };
  const avg = Math.round(tests.reduce((s, t) => s + (t.score / t.total * 100), 0) / tests.length);
  const wrongMap = {};
  tests.forEach(t => (t.wrongTopics || []).forEach(w => { wrongMap[w] = (wrongMap[w] || 0) + 1; }));
  const weakTopics = Object.entries(wrongMap).sort((a,b) => b[1]-a[1]).slice(0,5).map(([t]) => t);
  return { total: tests.length, avg, weakTopics };
}

// ---- SESSION ----
export function getSession() {
  try { return JSON.parse(sessionStorage.getItem('ya_thaki_session')); } catch { return null; }
}
export function setSession(user) {
  sessionStorage.setItem('ya_thaki_session', JSON.stringify(user));
}
export function clearSession() {
  sessionStorage.removeItem('ya_thaki_session');
}

// ---- HELPERS ----
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
export function formatDate(iso) {
  return new Date(iso).toLocaleDateString('ar-KW', { year: 'numeric', month: 'short', day: 'numeric' });
}
export function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('ar-KW', { hour: '2-digit', minute: '2-digit' });
}
export function gradeLabel(g) {
  const n = parseInt(g);
  const names = { 1:'أول', 2:'ثاني', 3:'ثالث', 4:'رابع', 5:'خامس', 6:'سادس', 7:'سابع', 8:'ثامن', 9:'تاسع', 10:'عاشر', 11:'حادي عشر', 12:'ثاني عشر' };
  return `الصف ${names[n] || g}`;
}
