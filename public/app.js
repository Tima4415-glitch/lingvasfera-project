let currentFilter = 'all';
let allRequestsData = [];

// ==================== ТЕМА ====================
function initTheme() {
  const saved = localStorage.getItem('lingva_theme');
  if (saved === 'dark') {
    document.body.classList.add('dark-theme');
    updateThemeUi(true);
  } else {
    document.body.classList.remove('dark-theme');
    updateThemeUi(false);
  }
}

function toggleTheme() {
  const isDark = document.body.classList.toggle('dark-theme');
  localStorage.setItem('lingva_theme', isDark ? 'dark' : 'light');
  updateThemeUi(isDark);
}

function updateThemeUi(isDark) {
  const icon = document.getElementById('theme-icon');
  const text = document.getElementById('theme-text');
  if (icon) icon.innerText = isDark ? '☀️' : '🌙';
  if (text) text.innerText = isDark ? 'Светлая' : 'Тёмная';
}

// ==================== РОЛИ ====================
function setRole(role) {
  document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.role-tab').forEach(t => t.classList.remove('active'));

  if (role === 'user') {
    document.getElementById('view-user').classList.add('active');
    document.getElementById('tab-user').classList.add('active');
  } else if (role === 'student') {
    document.getElementById('view-student').classList.add('active');
    document.getElementById('tab-student').classList.add('active');
  } else if (role === 'admin') {
    document.getElementById('view-admin').classList.add('active');
    document.getElementById('tab-admin').classList.add('active');
    loadCrmTable();
  }
}

// ==================== ЯЗЫК ====================
function switchLang(lang) {
  document.getElementById('btn-lang-ru').classList.toggle('active', lang === 'RU');
  document.getElementById('btn-lang-en').classList.toggle('active', lang === 'EN');
  showToast(`Язык переключен: ${lang}`);
}

function chooseLanguage(id) {
  const sel = document.getElementById('lead-lang');
  if (sel) sel.value = id;
  const bookingEl = document.getElementById('booking');
  if (bookingEl) bookingEl.scrollIntoView({ behavior: 'smooth' });
}

// ==================== ОТПРАВКА ЗАЯВКИ ====================
async function handleFormSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();

  const name = document.getElementById('lead-name').value.trim();
  const contact = document.getElementById('lead-contact').value.trim();
  const langVal = document.getElementById('lead-lang').value;
  const dateVal = document.getElementById('lead-date').value;

  const payload = {
    fullName: name,
    contact: contact,
    languageId: parseInt(langVal, 10),
    languageCode: langVal === '2' ? 'ZH' : 'EN',
    preferredDate: dateVal || new Date().toISOString().split('T')[0]
  };

  try {
    const res = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      showToast('✓ Заявка успешно сохранена в базе данных PostgreSQL!');
      document.getElementById('lead-form').reset();
      setDefaultDate();
    } else {
      const err = await res.json();
      showToast(`Ошибка сохранения: ${err.error || 'Ошибка'}`);
    }
  } catch (err) {
    showToast('Ошибка соединения с базой данных');
  }
}

// ==================== ВЫГРУЗКА И ФИЛЬТР CRM ====================
async function loadCrmTable() {
  const tbody = document.getElementById('crm-table-body');
  try {
    const res = await fetch('/api/requests');
    if (!res.ok) throw new Error('Ошибка');
    allRequestsData = await res.json();

    document.getElementById('crm-badge-count').innerText = allRequestsData.length;
    renderCrmRows();
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #ef4444; padding: 20px;">Ошибка загрузки заявок из PostgreSQL</td></tr>';
  }
}

function filterCrm(lang) {
  currentFilter = lang;
  document.querySelectorAll('.crm-filter-btn').forEach(btn => {
    const txt = btn.innerText.toLowerCase();
    btn.classList.toggle('active', (lang === 'all' && txt.includes('все')) || (lang === 'en' && txt.includes('en')) || (lang === 'zh' && txt.includes('zh')));
  });
  renderCrmRows();
}

function renderCrmRows() {
  const tbody = document.getElementById('crm-table-body');
  let list = allRequestsData;

  if (currentFilter === 'en') {
    list = list.filter(r => (r.Language_Name && r.Language_Name.includes('Англ')) || r.Language_Code === 'EN');
  } else if (currentFilter === 'zh') {
    list = list.filter(r => (r.Language_Name && r.Language_Name.includes('Китай')) || r.Language_Code === 'ZH');
  }

  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 25px;">Заявок не найдено</td></tr>';
    return;
  }

  tbody.innerHTML = list.map(row => {
    const isConfirmed = row.ID_Status === 2 || (row.Status_Name && row.Status_Name.includes('Подтвержд'));
    const statusHtml = isConfirmed
      ? '<span class="status-pill status-confirmed">Подтверждена</span>'
      : '<span class="status-pill status-new">Новая</span>';

    const actionHtml = isConfirmed
      ? '<span style="color: #15803d; font-weight: 600;">✓ Одобрено</span>'
      : `<button class="btn-approve-action" onclick="quickConfirm(${row.ID_Request})">Одобрить ✓</button>`;

    const isZh = (row.Language_Name && row.Language_Name.includes('Китай')) || row.Language_Code === 'ZH';
    const langColor = isZh ? '#dc2626' : '#0066cc';

    return `
      <tr>
        <td><strong>#${row.ID_Request}</strong></td>
        <td><strong>${escapeHtml(row.Full_Name)}</strong><br><small style="color:#6b7280;">${escapeHtml(row.Contact)}</small></td>
        <td style="color: ${langColor}; font-weight: 600;">${escapeHtml(row.Language_Name || 'Английский')}</td>
        <td>${row.Preferred_Date ? row.Preferred_Date.split('T')[0] : '—'}</td>
        <td>${statusHtml}</td>
        <td>${escapeHtml(row.Teacher_Name || 'Анна Смирнова')}</td>
        <td>${actionHtml}</td>
      </tr>
    `;
  }).join('');
}

async function quickConfirm(id) {
  try {
    const res = await fetch(`/api/requests/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (res.ok) {
      showToast(`Заявка #${id} подтверждена в базе данных!`);
      await loadCrmTable();
    }
  } catch (err) {
    showToast('Сбой при обновлении статуса');
  }
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.innerText = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function setDefaultDate() {
  const d = document.getElementById('lead-date');
  if (d && !d.value) {
    d.value = new Date().toISOString().split('T')[0];
  }
}

function escapeHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

window.toggleTheme = toggleTheme;
window.setRole = setRole;
window.switchLang = switchLang;
window.chooseLanguage = chooseLanguage;
window.handleFormSubmit = handleFormSubmit;
window.filterCrm = filterCrm;
window.quickConfirm = quickConfirm;

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setDefaultDate();
});
