// Логика клиентской части приложения «ЛингваСфера»
var activeLang = 'RU';
var allCrmData = [];
var calcState = { lang: 'en', format: 'indiv', lessons: 12 };

var dict = {
  RU: {
    roleLabel: 'Ролевая экосистема (ПМ.08):',
    roleGuest: 'Пользователь',
    roleStudent: 'Ученик',
    roleTeacher: 'Преподаватель',
    roleAdmin: 'Администратор (CRM)',
    dbStatus: 'PostgreSQL 16: подключено',
    navCourses: 'Программы',
    navTest: 'Тест уровня',
    navCalc: 'Калькулятор',
    navTeachers: 'Преподаватели',
    navBooking: 'Онлайн-запись',
    btnAuth: 'Личный кабинет',
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
    testDesc: 'Ответьте на вопрос, чтобы система автоматически определила вашу отправную точку',
    calcTitle: 'Калькулятор индивидуальной программы',
    calcDesc: 'Рассчитайте персональную стоимость занятий со скидкой за пакет',
    calcLblLang: 'Языковое направление:',
    calcLblFormat: 'Формат обучения:',
    calcApplyBtn: 'Зафиксировать цену в заявке',
    tSectionTitle: 'Педагогический состав школы',
    tSectionDesc: 'Сертифицированные эксперты с подтвержденными международными дипломами',
    fMainTitle: 'Электронная запись на вводный урок',
    fMainDesc: 'После отправки заявка мгновенно попадает в базу данных PostgreSQL',
    fSubmitBtn: 'Отправить заявку в базу данных PostgreSQL',
    toastSaved: '✓ Заявка успешно записана в базу данных PostgreSQL!'
  },
  EN: {
    roleLabel: 'Role Ecosystem (PM.08):',
    roleGuest: 'User (Guest)',
    roleStudent: 'Student',
    roleTeacher: 'Teacher',
    roleAdmin: 'Admin CRM',
    dbStatus: 'PostgreSQL 16: Connected',
    navCourses: 'Programs',
    navTest: 'Placement Test',
    navCalc: 'Calculator',
    navTeachers: 'Tutors',
    navBooking: 'Book Class',
    btnAuth: 'Portal Login',
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
    tSectionDesc: 'Experienced linguists with international degrees and proven records',
    fMainTitle: 'Online Registration for Trial Lesson',
    fMainDesc: 'Application data is stored directly in PostgreSQL database',
    fSubmitBtn: 'Submit Application to PostgreSQL Database',
    toastSaved: '✓ Application successfully stored in PostgreSQL database!'
  },
  ZH: {
    roleLabel: '角色生态系统 (PM.08):',
    roleGuest: '普通访客',
    roleStudent: '学员个人中心',
    roleTeacher: '教师授课中心',
    roleAdmin: '管理后台 (CRM)',
    dbStatus: 'PostgreSQL 16 数据库：已连接',
    navCourses: '课程体系',
    navTest: '水平自测',
    navCalc: '费用测算',
    navTeachers: '师资团队',
    navBooking: '预约试听',
    btnAuth: '登录中心',
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
    tSectionDesc: '拥有国际教师资格认证及多年教学经验的骨干名师',
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

// Переключение языка интерфейса
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

  safeSet('txt-role-label', t.roleLabel, false);
  safeSet('btn-role-guest', t.roleGuest, false);
  safeSet('btn-role-student', t.roleStudent, false);
  safeSet('btn-role-teacher', t.roleTeacher, false);
  safeSet('btn-role-admin', t.roleAdmin, false);
  safeSet('txt-db-status', t.dbStatus, false);

  safeSet('nav-courses', t.navCourses, false);
  safeSet('nav-test', t.navTest, false);
  safeSet('nav-calc', t.navCalc, false);
  safeSet('nav-teachers', t.navTeachers, false);
  safeSet('nav-booking', t.navBooking, false);
  safeSet('btn-auth', t.btnAuth, false);

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

// Переключение ролей
function switchRole(roleKey) {
  var roleBtns = document.querySelectorAll('.role-btn');
  for (var i = 0; i < roleBtns.length; i++) {
    roleBtns[i].classList.remove('active');
  }

  var panes = document.querySelectorAll('.view-pane');
  for (var j = 0; j < panes.length; j++) {
    panes[j].classList.remove('active');
  }

  var activeBtn = document.getElementById('btn-role-' + roleKey);
  if (activeBtn) activeBtn.classList.add('active');

  var activePane = document.getElementById('view-' + roleKey);
  if (activePane) activePane.classList.add('active');

  if (roleKey === 'admin') {
    loadCrmTable();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function scrollToSection(id) {
  switchRole('guest');
  var el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

function answerQuiz(isCorrect, btn) {
  var opts = document.querySelectorAll('.quiz-opt');
  for (var i = 0; i < opts.length; i++) {
    opts[i].classList.remove('selected');
  }
  btn.classList.add('selected');
  var res = document.getElementById('quiz-box-result');
  if (res) res.style.display = 'block';
}

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
  var notes = document.getElementById('lead-notes');
  if (langSel) langSel.value = (calcState.lang === 'zh') ? '2' : '1';
  if (notes) notes.value = 'Выбран расчет: ' + calcState.lessons + ' уроков, формат ' + (calcState.format === 'indiv' ? 'Индивидуально' : 'Группа');
  showToast('Параметры калькулятора перенесены в форму!');
}

function pickTeacher(name, langId) {
  scrollToSection('booking-section');
  var langSel = document.getElementById('lead-lang');
  var notes = document.getElementById('lead-notes');
  if (langSel) langSel.value = langId;
  if (notes) notes.value = 'Запись к преподавателю: ' + name;
  showToast('Выбран преподаватель: ' + name);
}

// Отправка заявки в PostgreSQL
async function handleFormSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();
  
  var nameEl = document.getElementById('lead-name');
  var contactEl = document.getElementById('lead-contact');
  var langEl = document.getElementById('lead-lang');
  var dateEl = document.getElementById('lead-date');
  var notesEl = document.getElementById('lead-notes');

  var name = nameEl ? nameEl.value.trim() : '';
  var contact = contactEl ? contactEl.value.trim() : '';
  var langVal = langEl ? langEl.value : '1';
  var selectedText = (langEl && langEl.selectedIndex >= 0) ? langEl.options[langEl.selectedIndex].text : '';
  var date = dateEl ? dateEl.value : '';
  var notes = notesEl ? notesEl.value.trim() : '';

  // Определяем язык строго
  var isChinese = String(langVal) === '2' || 
                  String(langVal).toUpperCase().indexOf('ZH') !== -1 || 
                  selectedText.indexOf('Китай') !== -1 || 
                  selectedText.indexOf('ZH') !== -1;

  var payload = {
    fullName: name,
    contact: contact,
    languageId: isChinese ? 2 : 1,
    languageCode: isChinese ? 'ZH' : 'EN',
    languageName: isChinese ? 'Китайский язык' : 'Английский язык',
    preferredDate: date || new Date().toISOString().split('T')[0],
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
      if (nameEl) nameEl.value = '';
      if (contactEl) contactEl.value = '';
      if (notesEl) notesEl.value = '';
      loadCrmTable();
    } else {
      showToast('Ошибка: ' + (data.error || 'Server error'));
    }
  } catch (err) {
    showToast('Сервер Node.js оффлайн (демо-сохранение)');
  }
}

// CRM: загрузка данных напрямую из PostgreSQL
async function loadCrmTable() {
  var tbody = document.getElementById('crm-tbody');
  try {
    var res = await fetch('/api/requests?t=' + Date.now());
    var data = await res.json();
    if (Array.isArray(data)) {
      allCrmData = data;
      renderCrmRows(data);
    }
  } catch (err) {
    console.error('Ошибка загрузки CRM:', err);
  }
}

function renderCrmRows(items) {
  var tbody = document.getElementById('crm-tbody');
  if (!tbody) return;
  if (!items || items.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px;">Заявок не обнаружено</td></tr>';
    return;
  }
  tbody.innerHTML = items.map(function(item) {
    var isConfirmed = item.Status_Name === 'Подтверждена' || item.Status_Name === 'Подтвержден' || item.ID_Status === 2;
    var stClass = isConfirmed ? 'st-ok' : (item.Status_Name === 'В обработке' ? 'st-proc' : 'st-new');
    var displayStatus = isConfirmed ? 'Подтверждена' : (item.Status_Name || 'Новая');
    var teacher = item.Teacher_Name || (item.Language_Name && item.Language_Name.indexOf('Китай') !== -1 ? 'Ван Ли (王丽)' : 'Анна Смирнова');

    var actionBtn = isConfirmed 
      ? '<span style="color:#10B981; font-weight:600;">✓ Одобрено</span>'
      : '<button class="btn-action-small" onclick="quickConfirm(' + item.ID_Request + ')">Одобрить ✓</button>';

    return '<tr>' +
      '<td><strong>#' + item.ID_Request + '</strong></td>' +
      '<td><strong>' + (item.Full_Name || 'Тимофей Смирнов') + '</strong></td>' +
      '<td><span style="color:#64748B;">' + (item.Contact || '') + '</span></td>' +
      '<td><span class="chip">' + (item.Language_Name || 'Китайский язык') + '</span></td>' +
      '<td>' + (item.Preferred_Date ? String(item.Preferred_Date).split('T')[0] : '') + '</td>' +
      '<td><span class="badge-status ' + stClass + '">● ' + displayStatus + '</span></td>' +
      '<td>' + teacher + '</td>' +
      '<td>' + actionBtn + '</td>' +
    '</tr>';
  }).join('');

  var tEl = document.getElementById('crm-stat-total');
  var nEl = document.getElementById('crm-stat-new');
  var cEl = document.getElementById('crm-stat-confirmed');
  if (tEl) tEl.innerText = items.length;
  if (nEl) nEl.innerText = items.filter(function(x) { return x.Status_Name !== 'Подтверждена' && x.ID_Status !== 2; }).length;
  if (cEl) cEl.innerText = items.filter(function(x) { return x.Status_Name === 'Подтверждена' || x.ID_Status === 2; }).length;
}

function filterCrmTable(query) {
  var q = query.toLowerCase();
  var filtered = allCrmData.filter(function(i) {
    var name = (i.Full_Name || '').toLowerCase();
    var contact = (i.Contact || '').toLowerCase();
    return name.indexOf(q) !== -1 || contact.indexOf(q) !== -1;
  });
  renderCrmRows(filtered);
}

function filterByLang(langKey) {
  if (langKey === 'all') {
    renderCrmRows(allCrmData);
  } else {
    renderCrmRows(allCrmData.filter(function(x) { 
      return (x.Language_Name || '').indexOf(langKey) !== -1; 
    }));
  }
}

// Фиксация одобрения в PostgreSQL
async function quickConfirm(id) {
  try {
    var res = await fetch('/api/requests/' + id + '/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (res.ok) {
      showToast('Заявка #' + id + ' подтверждена в базе данных PostgreSQL!');
      await loadCrmTable();
    } else {
      showToast('Ошибка при обновлении статуса в базе данных');
    }
  } catch (err) {
    console.error('Ошибка сохранения статуса:', err);
    showToast('Ошибка сетевого соединения с сервером');
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

// Экспорт функций в глобальную область видимости
window.changeLang = changeLang;
window.switchRole = switchRole;
window.scrollToSection = scrollToSection;
window.answerQuiz = answerQuiz;
window.setCalcLang = setCalcLang;
window.setCalcFormat = setCalcFormat;
window.updateCalcSlider = updateCalcSlider;
window.applyCalcToForm = applyCalcToForm;
window.pickTeacher = pickTeacher;
window.handleFormSubmit = handleFormSubmit;
window.loadCrmTable = loadCrmTable;
window.filterCrmTable = filterCrmTable;
window.filterByLang = filterByLang;
window.quickConfirm = quickConfirm;
window.checkHomework = checkHomework;
window.sendChatMessage = sendChatMessage;
window.showToast = showToast;

document.addEventListener('DOMContentLoaded', function() {
  var d = document.getElementById('lead-date');
  if (d) d.valueAsDate = new Date();
});
