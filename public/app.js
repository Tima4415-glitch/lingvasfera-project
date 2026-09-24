// Логика клиентской части приложения «ЛингваСфера»
var activeLang = 'RU';
var allCrmData = [];
var calcState = { lang: 'en', format: 'indiv', lessons: 12 };

// Текущий авторизованный пользователь (сессия в памяти)
var currentUser = null;

// База данных профилей преподавателей
var teacherProfiles = {
  anastasia: {
    name: 'Анастасия Четверикова',
    role: 'Ведущий методист • CELTA, IELTS Academic 8.5',
    langBadge: 'Английский язык (EN)',
    langId: 1,
    photo: 'anastasia.jpg',
    exp: '9 лет',
    students: '380+',
    rating: '★ 4.98 (240+ проведённых уроков)',
    bio: 'Окончила лингвистический факультет с отличием. Автор сертифицированной программы скоростного погружения в языковую среду без зубрёжки. Специализируется на академическом письме, подготовке к международным экзаменам IELTS/TOEFL и снятии языкового барьера у взрослых и подростков за 6 недель.',
    chips: ['General English', 'IELTS Academic', 'Разговорный интенсив', 'C1 Proficiency', 'Грамматический тренажёр'],
    slots: [
      'Понедельник, 15:00 — Свободно',
      'Среда, 18:30 — Свободно',
      'Пятница, 17:00 — Свободно'
    ],
    review: {
      title: '«Сдала IELTS на 8.0 с первой попытки!»',
      text: 'Анастасия объясняет сложнейшие грамматические конструкции так, что они сразу закрепляются в речи. Уроки проходят динамично и очень интересно.',
      author: '— Ксения Л., поступила в University of London'
    }
  },
  jackie: {
    name: 'Джеки Чан (成龙)',
    role: 'Носитель языка • Международный сертификат HSK 6',
    langBadge: 'Китайский язык (ZH)',
    langId: 2,
    photo: 'jackie.jpg',
    exp: '15 лет',
    students: '850+',
    rating: '★ 5.0 (500+ восторженных отзывов)',
    bio: 'Легендарный педагог и мастер китайской лингвистики. Обучает тональной артикуляции, скорописи иероглифов, правилам дипломатического и бизнес-этикета в Поднебесной. Превращает освоение одного из сложнейших языков мира в увлекательное приключение без страха сделать ошибку.',
    chips: ['HSK 1-6', 'Бизнес-Китайский', 'Постановка тонов', 'Каллиграфия', 'Разговорный диалект'],
    slots: [
      'Вторник, 14:00 — Свободно',
      'Четверг, 19:00 — Свободно',
      'Суббота, 12:00 — Свободно'
    ],
    review: {
      title: '«Тоны перестали быть кошмаром за три урока!»',
      text: 'Джеки Чан ставит правильное произношение с первого занятия. За полгода я сдал HSK 3 и начал вести переговоры с партнерами из Гуанчжоу.',
      author: '— Михаил Р., предприниматель'
    }
  },
  mark: {
    name: 'Марк Ковалёв',
    role: 'Синхронный переводчик • TOEFL 115, С2 Expert',
    langBadge: 'Английский язык (EN)',
    langId: 1,
    photo: 'mark.jpg',
    exp: '7 лет',
    students: '290+',
    rating: '★ 4.95 (180+ успешных сдач TOEFL)',
    bio: 'Практикующий конференц-переводчик международных IT-саммитов. Разработчик ассоциативной методики запоминания до 1000 лексических единиц в месяц. Готовит IT-специалистов, разработчиков и руководителей к техническим собеседованиям в компании FAANG.',
    chips: ['IT English', 'TOEFL iBT', 'Деловая переписка', 'Public Speaking', 'Mock Interview'],
    slots: [
      'Понедельник, 19:30 — Свободно',
      'Среда, 20:00 — Свободно',
      'Пятница, 18:00 — Свободно'
    ],
    review: {
      title: '«Прошел собеседование в зарубежный стартап!»',
      text: 'Марк прокачал мой английский под специфику разработки и продуктового менеджмента всего за два месяца. Результат — оффер на руках!',
      author: '— Дмитрий К., Senior Frontend Developer'
    }
  }
};

// ==================== СИСТЕМА АВТОРИЗАЦИИ И ДОСТУПА ====================
function openLoginModal() {
  var modal = document.getElementById('login-modal');
  if (modal) modal.classList.add('show');
}

function closeLoginModal(e) {
  var modal = document.getElementById('login-modal');
  if (modal) modal.classList.remove('show');
}

function fillDemoLogin(role) {
  var u = document.getElementById('login-username');
  var p = document.getElementById('login-password');
  if (role === 'admin') {
    if (u) u.value = 'admin';
    if (p) p.value = 'admin123';
  } else if (role === 'student') {
    if (u) u.value = 'student';
    if (p) p.value = 'student123';
  } else if (role === 'teacher') {
    if (u) u.value = 'teacher';
    if (p) p.value = 'teacher123';
  }
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  var u = document.getElementById('login-username').value.trim();
  var p = document.getElementById('login-password').value.trim();

  try {
    var res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u, password: p })
    });
    var data = await res.json();

    if (res.ok && data.success) {
      currentUser = data.user;
      closeLoginModal();
      applyUserSession();
      showToast(`✓ Успешный вход: ${currentUser.name} (${currentUser.roleName})`);
    } else {
      showToast('Ошибка входа: ' + (data.error || 'Неверный логин или пароль'));
    }
  } catch (err) {
    // Демо-fallback для оффлайн работы
    if (u === 'admin' && p === 'admin123') {
      currentUser = { id: 1, name: 'Администратор системы', role: 'admin', roleName: 'Администратор' };
    } else if (u === 'student' && p === 'student123') {
      currentUser = { id: 2, name: 'Алексей Смирнов', role: 'student', roleName: 'Ученик' };
    } else if (u === 'teacher' && p === 'teacher123') {
      currentUser = { id: 3, name: 'Джеки Чан (成龙)', role: 'teacher', roleName: 'Преподаватель' };
    } else {
      showToast('Неверный логин или пароль');
      return;
    }
    closeLoginModal();
    applyUserSession();
    showToast(`✓ Вход выполнен: ${currentUser.name}`);
  }
}

function applyUserSession() {
  var area = document.getElementById('auth-btn-area');
  var roleBadge = document.getElementById('current-role-badge');
  var crmNav = document.getElementById('nav-crm-link');

  if (currentUser) {
    // Обновляем бейдж роли сверху
    if (roleBadge) roleBadge.innerText = `${currentUser.name} (${currentUser.roleName})`;

    // Кнопка в шапке
    if (area) {
      area.innerHTML = `
        <div class="user-logged-badge">
          <span>👤 ${currentUser.name}</span>
          <button class="btn-logout" onclick="logoutUser()">Выйти</button>
        </div>
      `;
    }

    // Показываем ссылку CRM только администратору
    if (crmNav) {
      crmNav.style.display = (currentUser.role === 'admin') ? 'inline-block' : 'none';
    }

    // Переключаем экран в соответствии с ролью
    if (currentUser.role === 'admin') {
      switchRole('admin');
    } else if (currentUser.role === 'student') {
      switchRole('student');
    } else if (currentUser.role === 'teacher') {
      switchRole('teacher');
    }
  } else {
    // Режим гостя
    if (roleBadge) roleBadge.innerText = 'Гость (Витрина)';
    if (area) {
      area.innerHTML = `<button class="btn-quick-login" onclick="openLoginModal()" id="btn-login-trigger">Войти в кабинет</button>`;
    }
    if (crmNav) crmNav.style.display = 'none';
    switchRole('guest');
  }
}

function logoutUser() {
  currentUser = null;
  applyUserSession();
  showToast('Вы вышли из учетной записи');
}

function openAdminCrm() {
  if (currentUser && currentUser.role === 'admin') {
    switchRole('admin');
  } else {
    showToast('Доступ в CRM разрешён только администратору');
    openLoginModal();
  }
}

// ==================== ПЕРЕКЛЮЧЕНИЕ РОЛЕВЫХ ВИДОВ ====================
function switchRole(roleKey) {
  var panes = document.querySelectorAll('.view-pane');
  for (var j = 0; j < panes.length; j++) {
    panes[j].classList.remove('active');
    panes[j].style.removeProperty('display');
  }

  var roleBtns = document.querySelectorAll('.role-btn');
  for (var i = 0; i < roleBtns.length; i++) {
    roleBtns[i].classList.remove('active');
  }

  var activeBtn = document.getElementById('btn-role-' + roleKey);
  if (activeBtn) activeBtn.classList.add('active');

  var activePane = document.getElementById('view-' + roleKey);
  if (activePane) {
    activePane.classList.add('active');
  }

  if (roleKey === 'admin') {
    loadCrmTable();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==================== ПЕРЕХОД НА ПРОФИЛЬ ПРЕПОДАВАТЕЛЯ ====================
function openTeacherPage(key) {
  var t = teacherProfiles[key];
  if (!t) return;

  var panes = document.querySelectorAll('.view-pane');
  for (var j = 0; j < panes.length; j++) {
    panes[j].classList.remove('active');
    panes[j].style.removeProperty('display');
  }

  var profileView = document.getElementById('view-teacher-profile');
  if (profileView) profileView.classList.add('active');

  document.getElementById('p-photo').src = t.photo;
  document.getElementById('p-lang').innerText = t.langBadge;
  document.getElementById('p-name').innerText = t.name;
  document.getElementById('p-role').innerText = t.role;
  document.getElementById('p-rating').innerText = t.rating;
  document.getElementById('p-bio').innerText = t.bio;
  document.getElementById('p-exp').innerText = t.exp;
  document.getElementById('p-students').innerText = t.students;

  var chipsBox = document.getElementById('p-chips');
  if (chipsBox) {
    chipsBox.innerHTML = t.chips.map(function(c) {
      return '<span class="chip">' + c + '</span>';
    }).join('');
  }

  var slotsList = document.getElementById('p-slots');
  if (slotsList) {
    slotsList.innerHTML = t.slots.map(function(s) {
      return '<li>' + s + '</li>';
    }).join('');
  }

  var revBox = document.getElementById('p-review');
  if (revBox && t.review) {
    revBox.innerHTML = '<strong>' + t.review.title + '</strong><p>' + t.review.text + '</p><small style="color:var(--text-muted);">' + t.review.author + '</small>';
  }

  var bookBtn = document.getElementById('p-book-btn');
  if (bookBtn) {
    bookBtn.onclick = function() {
      backToMain();
      pickTeacher(t.name, t.langId);
    };
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function backToMain() {
  switchRole('guest');
}

// ==================== УПРАВЛЕНИЕ ТЕМОЙ ====================
function initTheme() {
  var saved = localStorage.getItem('ls_theme');
  if (saved === 'dark') {
    document.body.classList.add('dark-theme');
    updateThemeUi(true);
  } else {
    document.body.classList.remove('dark-theme');
    updateThemeUi(false);
  }
}

function toggleTheme() {
  var isDark = document.body.classList.toggle('dark-theme');
  localStorage.setItem('ls_theme', isDark ? 'dark' : 'light');
  updateThemeUi(isDark);
}

function updateThemeUi(isDark) {
  var icon = document.getElementById('theme-icon');
  var text = document.getElementById('theme-text');
  if (icon) icon.innerText = isDark ? '☀️' : '🌙';
  if (text) text.innerText = isDark ? 'Светлая' : 'Тёмная';
}

// ==================== МУЛЬТИЯЗЫЧНЫЙ СЛОВАРЬ ====================
var dict = {
  RU: {
    heroBadge: '★ Аккредитованный центр HSK & IELTS 2026',
    heroTitle: 'Изучайте <span>английский и китайский</span><br>с персональным графиком',
    heroDesc: 'Преодолейте языковой барьер с сертифицированными преподавателями и носителями языка. Подготовка к академическому переезду, работе и экзаменам.',
    heroCtaBtn: 'Записаться на пробный урок →',
    heroTestBtn: 'Пройти экспресс-тест (2 мин)',
    statGraduates: 'Успешных выпускников',
    statExam: 'Сдали HSK и IELTS на отлично',
    statTeachers: 'Носителей и методистов',
    statSpeed: 'Средний срок одного уровня',
    testTitle: 'Интерактивный тест на уровень знаний',
    testDesc: 'Ответьте на вопросы, чтобы система автоматически определила вашу отправную точку',
    calcTitle: 'Калькулятор индивидуальной программы',
    calcDesc: 'Рассчитайте персональную стоимость занятий со скидкой за пакет',
    calcLblLang: 'Языковое направление:',
    calcLblFormat: 'Формат обучения:',
    calcApplyBtn: 'Зафиксировать цену в заявке',
    tSectionTitle: 'Педагогический состав школы',
    tSectionDesc: 'Кликните по преподавателю, чтобы открыть его личный профиль и подробное портфолио',
    fMainTitle: 'Электронная запись на вводный урок',
    fMainDesc: 'После отправки заявка мгновенно попадает в базу данных PostgreSQL',
    fSubmitBtn: 'Отправить заявку в базу данных PostgreSQL',
    toastSaved: '✓ Заявка успешно записана в базу данных PostgreSQL!'
  },
  EN: {
    heroBadge: '★ Accredited HSK & IELTS Center 2026',
    heroTitle: 'Master <span>English & Chinese</span><br>with Flexible Online Tutoring',
    heroDesc: 'Overcome language barriers with verified native speakers and expert tutors. Tailored for study abroad, career growth and exams.',
    heroCtaBtn: 'Book a Free Trial Lesson →',
    heroTestBtn: 'Take 2-min Placement Test',
    statGraduates: 'Successful Graduates',
    statExam: 'Passed IELTS & HSK with honors',
    statTeachers: 'Native tutors and linguists',
    statSpeed: 'Average pace per CEFR level',
    testTitle: 'Interactive Language Placement Test',
    testDesc: 'Answer quick questions to immediately determine your target study level',
    calcTitle: 'Tuition Fee Calculator',
    calcDesc: 'Calculate your personalized package price with bundle discounts',
    calcLblLang: 'Language Program:',
    calcLblFormat: 'Learning Format:',
    calcApplyBtn: 'Lock Price in Application',
    tSectionTitle: 'Our Certified Faculty',
    tSectionDesc: 'Click on any instructor card to view full professional profile',
    fMainTitle: 'Online Registration for Trial Lesson',
    fMainDesc: 'Application data is stored directly in PostgreSQL database',
    fSubmitBtn: 'Submit Application to PostgreSQL Database',
    toastSaved: '✓ Application successfully stored in PostgreSQL database!'
  },
  ZH: {
    heroBadge: '★ 2026官方认证HSK与雅思教学中心',
    heroTitle: '在线一对一及小班<br><span>专业英语与中文课程</span>',
    heroDesc: '名校名师与母语外教小班授课，全面消除语言交流障碍，助力考级、升学与海外商务。',
    heroCtaBtn: '立即预约试听课 →',
    heroTestBtn: '2分钟语言水平测评',
    statGraduates: '毕业优秀学员',
    statExam: '国际考试高分通过率',
    statTeachers: '专业外教及骨干讲师',
    statSpeed: '单级别平均提升周期',
    testTitle: '在线语言能力水平智能测试',
    testDesc: '回答测评题目，系统将为您精准匹配起点课程',
    calcTitle: '学费个性化在线计算器',
    calcDesc: '自选课时包及授课模式，享受专属课时优惠',
    calcLblLang: '培训语种：',
    calcLblFormat: '授课模式：',
    calcApplyBtn: '将测算优惠写入预约单',
    tSectionTitle: '精英师资团队',
    tSectionDesc: '点击名师卡片查看专属独立履历与授课档案',
    fMainTitle: '免费试听课在线预约',
    fMainDesc: '提交后数据实时录入PostgreSQL核心数据库',
    fSubmitBtn: '提交申请至PostgreSQL数据库',
    toastSaved: '✓ 预约申请已成功保存至PostgreSQL数据库！'
  }
};

function safeSet(id, text, isHtml) {
  var el = document.getElementById(id);
  if (el) {
    if (isHtml) el.innerHTML = text;
    else el.innerText = text;
  }
}

function changeLang(lang) {
  activeLang = lang;
  var buttons = document.querySelectorAll('.lang-item');
  for (var i = 0; i < buttons.length; i++) {
    if (buttons[i].innerText.trim() === lang) {
      buttons[i].classList.add('active');
    } else {
      buttons[i].classList.remove('active');
    }
  }

  var t = dict[lang];
  if (!t) return;

  safeSet('hero-badge', t.heroBadge, false);
  safeSet('hero-title', t.heroTitle, true);
  safeSet('hero-desc', t.heroDesc, false);
  safeSet('hero-cta-btn', t.heroCtaBtn, false);
  safeSet('hero-test-btn', t.heroTestBtn, false);

  safeSet('stat-graduates', t.statGraduates, false);
  safeSet('stat-exam', t.statExam, false);
  safeSet('stat-teachers', t.statTeachers, false);
  safeSet('stat-speed', t.statSpeed, false);

  safeSet('test-title', t.testTitle, false);
  safeSet('test-desc', t.testDesc, false);

  safeSet('calc-title', t.calcTitle, false);
  safeSet('calc-desc', t.calcDesc, false);
  safeSet('calc-lbl-lang', t.calcLblLang, false);
  safeSet('calc-lbl-format', t.calcLblFormat, false);
  safeSet('calc-apply-btn', t.calcApplyBtn, false);

  safeSet('t-section-title', t.tSectionTitle, false);
  safeSet('t-section-desc', t.tSectionDesc, false);

  safeSet('f-main-title', t.fMainTitle, false);
  safeSet('f-main-desc', t.fMainDesc, false);
  safeSet('f-submit-btn', t.fSubmitBtn, false);
}

function scrollToSection(id) {
  backToMain();
  var el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

// ==================== ИНТЕРАКТИВНЫЙ ОПРОСНИК ====================
var quizQuestions = [
  {
    q: '1. Choose the correct sentence: "If I _____ harder, I would have passed the exam."',
    options: ['had studied', 'studied', 'would study', 'have studied'],
    correct: 0
  },
  {
    q: '2. Which word best completes: "She has been living in Shanghai _____ three years."',
    options: ['since', 'for', 'during', 'from'],
    correct: 1
  },
  {
    q: '3. Select the correct passive voice: "The contract _____ signed tomorrow."',
    options: ['will be', 'was', 'is been', 'has'],
    correct: 0
  }
];

var currentQuizIndex = 0;
var quizScore = 0;

function renderQuizQuestion() {
  var container = document.getElementById('quiz-options-container');
  var qText = document.getElementById('quiz-question-text');
  var indicator = document.getElementById('quiz-step-indicator');
  var resultBox = document.getElementById('quiz-box-result');
  var quizBody = document.getElementById('quiz-container');

  if (!container || !qText) return;

  if (currentQuizIndex >= quizQuestions.length) {
    if (quizBody) quizBody.style.display = 'none';
    if (indicator) indicator.innerText = 'Тест завершен';
    if (resultBox) {
      resultBox.style.display = 'block';
      var title = document.getElementById('quiz-result-title');
      var desc = document.getElementById('quiz-result-desc');

      if (quizScore === 3) {
        if (title) title.innerText = '✓ Ваш рекомендуемый уровень: Advanced (C1) — 3 из 3';
        if (desc) desc.innerText = 'Великолепный результат! Вы уверенно владеете сложными конструкциями. Рекомендуем курс подготовки к экзаменам или разговорный бизнес-интенсив.';
      } else if (quizScore === 2) {
        if (title) title.innerText = '✓ Ваш рекомендуемый уровень: Intermediate (B1–B2) — 2 из 3';
        if (desc) desc.innerText = 'Хороший базис! Рекомендуем интенсивный разговорный практикум для закрепления грамматики и снятия языкового барьера.';
      } else {
        if (title) title.innerText = '✓ Ваш рекомендуемый уровень: Elementary (A2) — ' + quizScore + ' из 3';
        if (desc) desc.innerText = 'Рекомендуем базовый курс с нуля или повторение ключевых временных форм с нашими преподавателями.';
      }
    }
    return;
  }

  if (quizBody) quizBody.style.display = 'block';
  if (resultBox) resultBox.style.display = 'none';
  if (indicator) indicator.innerText = 'Вопрос ' + (currentQuizIndex + 1) + ' из ' + quizQuestions.length;

  var current = quizQuestions[currentQuizIndex];
  qText.innerText = current.q;

  container.innerHTML = current.options.map(function(opt, idx) {
    return '<button class="quiz-opt" onclick="selectQuizAnswer(' + idx + ', this)">' + opt + '</button>';
  }).join('');
}

function selectQuizAnswer(optIndex, btn) {
  var opts = document.querySelectorAll('.quiz-opt');
  for (var i = 0; i < opts.length; i++) {
    opts[i].classList.remove('selected');
  }
  btn.classList.add('selected');

  if (optIndex === quizQuestions[currentQuizIndex].correct) {
    quizScore++;
  }

  setTimeout(function() {
    currentQuizIndex++;
    renderQuizQuestion();
  }, 400);
}

function resetQuiz() {
  currentQuizIndex = 0;
  quizScore = 0;
  renderQuizQuestion();
}

// ==================== КАЛЬКУЛЯТОР ====================
function setCalcLang(lang, btn) {
  calcState.lang = lang;
  var items = btn.parentElement.querySelectorAll('.pill-opt');
  for (var i = 0; i < items.length; i++) {
    items[i].classList.remove('active');
  }
  btn.classList.add('active');
  recalcPrice();
}

function setCalcFormat(fmt, btn) {
  calcState.format = fmt;
  var items = btn.parentElement.querySelectorAll('.pill-opt');
  for (var i = 0; i < items.length; i++) {
    items[i].classList.remove('active');
  }
  btn.classList.add('active');
  recalcPrice();
}

function updateCalcSlider(val) {
  calcState.lessons = parseInt(val, 10);
  var lbl = document.getElementById('calc-lessons-val');
  if (lbl) lbl.innerText = val + ' уроков';
  recalcPrice();
}

function recalcPrice() {
  var baseRate = (calcState.format === 'indiv') ? 1600 : 900;
  if (calcState.lang === 'zh') baseRate += 200;
  var total = baseRate * calcState.lessons;
  if (calcState.lessons >= 12) total = Math.round(total * 0.85);

  var priceEl = document.getElementById('calc-total-val');
  if (priceEl) priceEl.innerText = total.toLocaleString('ru-RU') + ' ₽';
}

function applyCalcToForm() {
  scrollToSection('booking-section');
  var langSel = document.getElementById('lead-lang');
  if (langSel) {
    langSel.value = (calcState.lang === 'zh') ? '2' : '1';
    syncTeacherSelect();
  }
  showToast('Параметры курса зафиксированы!');
}

function pickTeacher(name, langId) {
  scrollToSection('booking-section');
  var langSel = document.getElementById('lead-lang');
  var teacherSel = document.getElementById('lead-teacher');

  if (langSel) {
    langSel.value = langId;
    syncTeacherSelect();
  }
  if (teacherSel) {
    teacherSel.value = name;
  }
  showToast('Выбран преподаватель: ' + name);
}

function syncTeacherSelect() {
  var langSel = document.getElementById('lead-lang');
  var teacherSel = document.getElementById('lead-teacher');
  if (!langSel || !teacherSel) return;

  if (langSel.value === '2') {
    teacherSel.value = 'Джеки Чан (成龙)';
  } else {
    if (teacherSel.value === 'Джеки Чан (成龙)') {
      teacherSel.value = 'Анастасия Четверикова';
    }
  }
}

// ==================== ОТПРАВКА ЗАЯВКИ В POSTGRESQL ====================
async function handleFormSubmit(e) {
  e.preventDefault();
  var name = document.getElementById('lead-name').value;
  var contact = document.getElementById('lead-contact').value;
  var langId = parseInt(document.getElementById('lead-lang').value, 10);
  var date = document.getElementById('lead-date').value;
  var teacherName = document.getElementById('lead-teacher') ? document.getElementById('lead-teacher').value : '';
  var notes = document.getElementById('lead-notes').value;

  var payload = {
    full_name: name,
    contact: contact,
    language_id: langId,
    preferred_date: date,
    teacher_name: teacherName,
    notes: notes
  };

  try {
    var res = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    var data = await res.json();
    if (res.ok) {
      showToast(dict[activeLang].toastSaved);
      document.getElementById('lead-name').value = '';
      document.getElementById('lead-contact').value = '';
      document.getElementById('lead-notes').value = '';
    } else {
      showToast('Ошибка: ' + (data.error || 'Server error'));
    }
  } catch (err) {
    showToast('Ошибка сети при отправке в PostgreSQL');
  }
}

// ==================== CRM И СИНХРОНИЗАЦИЯ С БД ====================
async function loadCrmTable() {
  var tbody = document.getElementById('crm-tbody');
  try {
    var res = await fetch('/api/requests');
    var data = await res.json();
    allCrmData = data;
    renderCrmRows(data);
  } catch (err) {
    allCrmData = [
      { ID_Request: 101, Full_Name: 'Тимофей Смирнов', Contact: '+7 (915) 926-82-08', Notes: 'Подготовка к IELTS', Language_Name: 'Английский язык', Preferred_Date: '2026-09-24', Status_Name: 'Новая', Teacher_Name: 'Марк Ковалёв' },
      { ID_Request: 102, Full_Name: 'Елена Васильева', Contact: 'elena@example.com', Notes: 'Китайский с нуля', Language_Name: 'Китайский язык', Preferred_Date: '2026-10-19', Status_Name: 'Подтверждена', Teacher_Name: 'Джеки Чан (成龙)' }
    ];
    renderCrmRows(allCrmData);
  }
}

function renderCrmRows(items) {
  var tbody = document.getElementById('crm-tbody');
  if (!tbody) return;
  if (!items || items.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px;">Заявок не обнаружено</td></tr>';
    return;
  }

  tbody.innerHTML = items.map(function(item) {
    var isConfirmed = item.ID_Status === 2 || item.Status_Name === 'Подтверждена';
    var stClass = isConfirmed ? 'st-ok' : (item.Status_Name === 'В обработке' ? 'st-proc' : 'st-new');
    var stName = isConfirmed ? 'Подтверждена' : (item.Status_Name || 'Новая');

    var teacher = item.Teacher_Name;
    if (!teacher || teacher === 'Не назначен') {
      var isZh = (item.Language_Name && item.Language_Name.indexOf('Китай') !== -1) || item.Language_Code === 'ZH';
      teacher = isZh ? 'Джеки Чан (成龙)' : 'Анастасия Четверикова';
    }

    var actionBtn = isConfirmed 
      ? '<span style="color:#10B981; font-weight:700;">✓ Одобрено</span>' 
      : '<button class="btn-action-small" onclick="quickConfirm(' + item.ID_Request + ')">Одобрить ✓</button>';

    var notesHtml = item.Notes 
      ? '<div style="margin-top:4px; font-size:11px; color:#475569; background:rgba(0,0,0,0.04); padding:3px 6px; border-radius:4px;">💬 ' + item.Notes + '</div>' 
      : '';

    return '<tr>' +
      '<td><strong>#' + item.ID_Request + '</strong></td>' +
      '<td><strong>' + item.Full_Name + '</strong><br><small style="color:#64748B;">' + item.Contact + '</small>' + notesHtml + '</td>' +
      '<td><span class="chip">' + (item.Language_Name || 'Английский язык') + '</span></td>' +
      '<td>' + (item.Preferred_Date || '—') + '</td>' +
      '<td><span class="badge-status ' + stClass + '">● ' + stName + '</span></td>' +
      '<td><strong>' + teacher + '</strong></td>' +
      '<td>' + actionBtn + '</td>' +
    '</tr>';
  }).join('');

  var tEl = document.getElementById('crm-stat-total');
  var nEl = document.getElementById('crm-stat-new');
  var cEl = document.getElementById('crm-stat-confirmed');
  var convEl = document.getElementById('crm-stat-conversion');

  var total = items.length;
  var confirmed = items.filter(function(x) { return x.ID_Status === 2 || x.Status_Name === 'Подтверждена'; }).length;
  var newCount = total - confirmed;

  if (tEl) tEl.innerText = total;
  if (nEl) nEl.innerText = newCount;
  if (cEl) cEl.innerText = confirmed;
  if (convEl) convEl.innerText = total > 0 ? Math.round((confirmed / total) * 100) + '%' : '0%';
}

function filterCrmTable(query) {
  var q = query.toLowerCase();
  var filtered = allCrmData.filter(function(i) {
    return i.Full_Name.toLowerCase().indexOf(q) !== -1 || 
           i.Contact.toLowerCase().indexOf(q) !== -1 ||
           (i.Notes && i.Notes.toLowerCase().indexOf(q) !== -1);
  });
  renderCrmRows(filtered);
}

function filterByLang(langKey) {
  if (langKey === 'all') {
    renderCrmRows(allCrmData);
  } else {
    renderCrmRows(allCrmData.filter(function(x) { return x.Language_Name.indexOf(langKey) !== -1; }));
  }
}

async function quickConfirm(id) {
  try {
    var res = await fetch('/api/requests/' + id + '/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status_id: 2 })
    });
    if (res.ok) {
      showToast('Заявка #' + id + ' подтверждена в базе данных PostgreSQL!');
      await loadCrmTable();
      return;
    }
  } catch (e) {}

  var item = allCrmData.find(function(x) { return x.ID_Request === id; });
  if (item) {
    item.ID_Status = 2;
    item.Status_Name = 'Подтверждена';
    renderCrmRows(allCrmData);
    showToast('Заявка #' + id + ' переведена в статус «Подтверждена»');
  }
}

function checkHomework() {
  var ans = document.getElementById('hw-ans-1');
  if (!ans) return;
  var val = ans.value.trim().toLowerCase();
  if (val === 'had known') {
    showToast('✓ Верно! Домашнее задание принято преподавателем (100/100)');
  } else {
    showToast('Проверьте ответ: используйте Past Perfect в Conditional III');
  }
}

function sendChatMessage() {
  var input = document.getElementById('chat-input');
  if (!input) return;
  var txt = input.value.trim();
  if (!txt) return;

  var body = document.getElementById('chat-messages');
  var myMsg = document.createElement('div');
  myMsg.className = 'msg me';
  myMsg.innerText = txt;
  body.appendChild(myMsg);
  input.value = '';

  setTimeout(function() {
    var reply = document.createElement('div');
    reply.className = 'msg teacher';
    reply.innerText = 'Отлично! Увидимся сегодня на онлайн-занятии.';
    body.appendChild(reply);
    body.scrollTop = body.scrollHeight;
  }, 1000);
  body.scrollTop = body.scrollHeight;
}

function showToast(msg) {
  var toast = document.getElementById('toast');
  var txt = document.getElementById('toast-text');
  if (toast && txt) {
    txt.innerText = msg;
    toast.classList.add('show');
    setTimeout(function() { toast.classList.remove('show'); }, 3500);
  }
}

// Экспорт в window
window.openLoginModal = openLoginModal;
window.closeLoginModal = closeLoginModal;
window.fillDemoLogin = fillDemoLogin;
window.handleLoginSubmit = handleLoginSubmit;
window.logoutUser = logoutUser;
window.openAdminCrm = openAdminCrm;
window.openTeacherPage = openTeacherPage;
window.backToMain = backToMain;
window.toggleTheme = toggleTheme;
window.changeLang = changeLang;
window.switchRole = switchRole;
window.scrollToSection = scrollToSection;
window.renderQuizQuestion = renderQuizQuestion;
window.selectQuizAnswer = selectQuizAnswer;
window.resetQuiz = resetQuiz;
window.setCalcLang = setCalcLang;
window.setCalcFormat = setCalcFormat;
window.updateCalcSlider = updateCalcSlider;
window.applyCalcToForm = applyCalcToForm;
window.pickTeacher = pickTeacher;
window.syncTeacherSelect = syncTeacherSelect;
window.handleFormSubmit = handleFormSubmit;
window.loadCrmTable = loadCrmTable;
window.filterCrmTable = filterCrmTable;
window.filterByLang = filterByLang;
window.quickConfirm = quickConfirm;
window.checkHomework = checkHomework;
window.sendChatMessage = sendChatMessage;
window.showToast = showToast;

document.addEventListener('DOMContentLoaded', function() {
  initTheme();
  renderQuizQuestion();
  syncTeacherSelect();
  var d = document.getElementById('lead-date');
  if (d) d.valueAsDate = new Date();
});
