// ==================== МУЛЬТИЯЗЫЧНЫЙ СЛОВАРЬ (RU / EN / ZH) ====================
const translations = {
  RU: {
    heroPill: "• 2 профильных языка (EN / ZH)",
    heroTitle: "Изучайте английский и китайский языки онлайн и в группах",
    heroDesc: "Эффективные методики подготовки к международным экзаменам HSK и IELTS. Индивидуальный график с квалифицированными преподавателями.",
    bookBtn: "Записаться на пробный урок",
    coursesBtn: "Выбрать курс",
    coursesTitle: "Направления обучения",
    bookingTitle: "Запись на вводное занятие",
    bookingSub: "Заполните поля, и мы подберем программу под ваш уровень"
  },
  EN: {
    heroPill: "• 2 specialized languages (EN / ZH)",
    heroTitle: "Learn English & Chinese Online and in Groups",
    heroDesc: "Effective preparation for HSK and IELTS exams. Flexible schedules with certified native and bilingual teachers.",
    bookBtn: "Book Free Trial",
    coursesBtn: "Explore Courses",
    coursesTitle: "Study Programs",
    bookingTitle: "Book an Introductory Lesson",
    bookingSub: "Fill in the details, and we will choose the right level for you"
  },
  ZH: {
    heroPill: "• 两个专业语种 (英语 / 中文)",
    heroTitle: "在线及小组学习英语与中文课程",
    heroDesc: "针对HSK与雅思国际考试的高效辅导方案，资深专业教师授课，定制专属学习计划。",
    bookBtn: "预约试听课",
    coursesBtn: "查看课程",
    coursesTitle: "教学方向",
    bookingTitle: "预约入门试听课",
    bookingSub: "填写信息，我们将为您匹配最合适的学习阶段"
  }
};

// ==================== ПЕРЕКЛЮЧЕНИЕ ТЕМЫ ====================
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

// ==================== ПЕРЕКЛЮЧЕНИЕ РОЛЕЙ ====================
function setRole(role) {
  const guestView = document.getElementById('view-guest');
  const studentView = document.getElementById('view-student');
  const crmView = document.getElementById('view-crm');
  const buttons = document.querySelectorAll('.btn-role');

  buttons.forEach(b => b.classList.remove('active'));

  if (role === 'guest') {
    guestView.style.display = 'block';
    studentView.style.display = 'none';
    crmView.classList.remove('active');
    document.getElementById('btn-role-guest').classList.add('active');
  } else if (role === 'student') {
    guestView.style.display = 'none';
    studentView.style.display = 'block';
    crmView.classList.remove('active');
    document.getElementById('btn-role-student').classList.add('active');
  } else if (role === 'crm') {
    guestView.style.display = 'none';
    studentView.style.display = 'none';
    crmView.classList.add('active');
    document.getElementById('btn-role-crm').classList.add('active');
    loadCrmTable();
  }
}

// ==================== ПЕРЕКЛЮЧЕНИЕ ЯЗЫКОВ ====================
function switchLang(lang) {
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.innerText === lang);
  });

  const t = translations[lang] || translations.RU;
  document.getElementById('txt-hero-pill').innerText = t.heroPill;
  document.getElementById('txt-hero-title').innerText = t.heroTitle;
  document.getElementById('txt-hero-desc').innerText = t.heroDesc;
  document.getElementById('btn-hero-book').innerText = t.bookBtn;
  document.getElementById('btn-hero-courses').innerText = t.coursesBtn;
  document.getElementById('txt-courses-title').innerText = t.coursesTitle;
  document.getElementById('txt-booking-title').innerText = t.bookingTitle;
  document.getElementById('txt-booking-sub').innerText = t.bookingSub;

  showToast(`Локализация интерфейса: ${lang}`);
}

// ==================== КАЛЬКУЛЯТОР СТОИМОСТИ ====================
function calculatePrice() {
  const lang = document.getElementById('calc-lang').value;
  const format = document.getElementById('calc-format').value;
  const count = parseInt(document.getElementById('calc-range').value, 10);

  document.getElementById('calc-lessons-count').innerText = count;

  let baseRate = lang === 'zh' ? 1500 : 1200;
  if (format === 'group') {
    baseRate = Math.round(baseRate * 0.7);
  }

  let discount = 0;
  if (count >= 32) discount = 0.20;
  else if (count >= 24) discount = 0.15;
  else if (count >= 16) discount = 0.10;
  else if (count >= 8) discount = 0.05;

  const total = Math.round(count * baseRate * (1 - discount));
  const perLesson = Math.round(total / count);

  document.getElementById('calc-total-price').innerText = `${total.toLocaleString('ru-RU')} ₽`;
  document.getElementById('calc-per-lesson').innerText = `${perLesson.toLocaleString('ru-RU')} ₽ / урок`;

  const badge = document.getElementById('calc-discount-badge');
  if (discount > 0) {
    badge.style.display = 'inline-block';
    badge.innerText = `Скидка ${discount * 100}%`;
  } else {
    badge.style.display = 'none';
  }
}

// ==================== ТЕСТ НА УРОВЕНЬ ====================
function checkQuiz() {
  const selected = document.querySelector('input[name="quiz-opt"]:checked');
  const resEl = document.getElementById('quiz-result');
  resEl.style.display = 'block';

  if (!selected) {
    resEl.style.color = '#f59e0b';
    resEl.innerText = 'Пожалуйста, выберите один из вариантов ответа.';
    return;
  }

  if (selected.value === 'goes') {
    resEl.style.color = '#10b981';
    resEl.innerText = '✓ Верно! Правило Present Simple для 3-го лица единственного числа (she goes). Ваш уровень: Pre-Intermediate (A2) или выше.';
  } else {
    resEl.style.color = '#ef4444';
    resEl.innerText = '✕ Неверно. В Present Simple с местоимением she глагол принимает окончание -es (goes). Рекомендуем начать с уровня Beginner (A1).';
  }
}

// ==================== ФОРМА И СИНХРОНИЗАЦИЯ С POSTGRESQL ====================
function selectCourse(langId) {
  const select = document.getElementById('lead-lang');
  if (select) select.value = langId;
  const bookingSec = document.getElementById('booking');
  if (bookingSec) bookingSec.scrollIntoView({ behavior: 'smooth' });
}

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

window.toggleTheme = toggleTheme;
window.setRole = setRole;
window.switchLang = switchLang;
window.calculatePrice = calculatePrice;
window.checkQuiz = checkQuiz;
window.selectCourse = selectCourse;
window.handleFormSubmit = handleFormSubmit;
window.loadCrmTable = loadCrmTable;
window.quickConfirm = quickConfirm;

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  calculatePrice();
  setDefaultDate();
});
