// ==================== УПРАВЛЕНИЕ ТЕМОЙ (LIGHT / DARK) ====================
function initTheme() {
  const savedTheme = localStorage.getItem('lingva_theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
    updateThemeButton(true);
  } else {
    document.body.classList.remove('dark-theme');
    updateThemeButton(false);
  }
}

function toggleTheme() {
  const isDark = document.body.classList.toggle('dark-theme');
  localStorage.setItem('lingva_theme', isDark ? 'dark' : 'light');
  updateThemeButton(isDark);
}

function updateThemeButton(isDark) {
  const icon = document.getElementById('theme-icon');
  const text = document.getElementById('theme-text');
  if (icon) icon.innerText = isDark ? '☀️' : '🌙';
  if (text) text.innerText = isDark ? 'Светлая' : 'Тёмная';
}

window.toggleTheme = toggleTheme;

// ==================== ВЫБОР РОЛИ И КУРСА ====================
function setRole(role) {
  const userView = document.getElementById('view-user');
  const crmView = document.getElementById('view-crm');
  const buttons = document.querySelectorAll('.btn-role');

  buttons.forEach(btn => btn.classList.remove('active'));

  if (role === 'crm') {
    userView.style.display = 'none';
    crmView.classList.add('active');
    buttons[1].classList.add('active');
    loadCrmTable();
  } else {
    userView.style.display = 'block';
    crmView.classList.remove('active');
    buttons[0].classList.add('active');
  }
}

function selectCourse(langId) {
  const select = document.getElementById('lead-lang');
  if (select) select.value = langId;
}

function switchLang(lang) {
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.innerText === lang);
  });
  showToast(`Локализация интерфейса: ${lang}`);
}

// ==================== РАБОТА С ФОРМОЙ И API ====================
async function handleFormSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();

  const name = document.getElementById('lead-name').value.trim();
  const contact = document.getElementById('lead-contact').value.trim();
  const langEl = document.getElementById('lead-lang');
  const isChinese = langEl.value === '2' || langEl.options[langEl.selectedIndex].text.includes('Китай');
  const dateVal = document.getElementById('lead-date').value;

  const payload = {
    fullName: name,
    contact: contact,
    languageId: isChinese ? 2 : 1,
    languageCode: isChinese ? 'ZH' : 'EN',
    preferredDate: dateVal || new Date().toISOString().split('T')[0]
  };

  try {
    const res = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      showToast('✓ Заявка успешно записана в базу данных PostgreSQL!');
      document.getElementById('lead-form').reset();
      setDefaultDate();
    } else {
      const err = await res.json();
      showToast(`Ошибка сохранения: ${err.error || 'Сбой запроса'}`);
    }
  } catch (err) {
    showToast('Ошибка сети при отправке в PostgreSQL');
  }
}

// ==================== ВЫГРУЗКА И ОДОБРЕНИЕ В CRM ====================
async function loadCrmTable() {
  const tbody = document.getElementById('crm-table-body');
  try {
    const res = await fetch('/api/requests');
    if (!res.ok) throw new Error('Сбой сети');
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:30px;">В базе данных пока нет заявок</td></tr>';
      updateStats([]);
      return;
    }

    updateStats(data);

    tbody.innerHTML = data.map(row => {
      const isConfirmed = row.ID_Status === 2 || (row.Status_Name && row.Status_Name.includes('Подтвержд'));
      const statusHtml = isConfirmed
        ? '<span class="status-badge status-confirmed">● Подтверждена</span>'
        : '<span class="status-badge status-new">● Новая</span>';

      const actionHtml = isConfirmed
        ? '<span class="btn-approved-disabled">✓ Одобрено</span>'
        : `<button class="btn-approve" onclick="quickConfirm(${row.ID_Request})">Одобрить ✓</button>`;

      const formattedDate = row.Preferred_Date ? row.Preferred_Date.split('T')[0] : '—';

      return `
        <tr>
          <td><strong>#${row.ID_Request}</strong></td>
          <td><strong>${escapeHtml(row.Full_Name || 'Аноним')}</strong></td>
          <td>${escapeHtml(row.Contact || '—')}</td>
          <td>${escapeHtml(row.Language_Name || 'Английский язык')}</td>
          <td>${formattedDate}</td>
          <td>${statusHtml}</td>
          <td>${escapeHtml(row.Teacher_Name || 'Анна Смирнова')}</td>
          <td>${actionHtml}</td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:#ef4444; padding:30px;">Ошибка подключения к PostgreSQL</td></tr>';
  }
}

async function quickConfirm(id) {
  try {
    const res = await fetch(`/api/requests/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (res.ok) {
      showToast(`Заявка #${id} подтверждена в базе данных PostgreSQL!`);
      await loadCrmTable();
    } else {
      showToast('Ошибка при изменении статуса в БД');
    }
  } catch (err) {
    showToast('Сбой соединения с сервером');
  }
}

function updateStats(data) {
  const total = data.length;
  const confirmed = data.filter(r => r.ID_Status === 2 || (r.Status_Name && r.Status_Name.includes('Подтвержд'))).length;
  const newReqs = total - confirmed;
  const conv = total > 0 ? Math.round((confirmed / total) * 100) : 0;

  document.getElementById('stat-total').innerText = total;
  document.getElementById('stat-new').innerText = newReqs;
  document.getElementById('stat-confirmed').innerText = confirmed;
  document.getElementById('stat-conversion').innerText = `${conv}%`;
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.innerText = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

function setDefaultDate() {
  const dateInput = document.getElementById('lead-date');
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

window.handleFormSubmit = handleFormSubmit;
window.setRole = setRole;
window.selectCourse = selectCourse;
window.switchLang = switchLang;
window.loadCrmTable = loadCrmTable;
window.quickConfirm = quickConfirm;

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setDefaultDate();
});
