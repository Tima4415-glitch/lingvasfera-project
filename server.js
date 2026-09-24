const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Получаем строку подключения к базе данных Supabase / PostgreSQL
const connString = process.env.DATABASE_POSTGRES_URL || process.env.DATABASE_URL;

let pool = null;

function getPool() {
  if (!pool) {
    if (connString) {
      try {
        const dbUrl = new URL(connString.replace('postgresql://', 'http://').replace('postgres://', 'http://'));
        const isLocal = dbUrl.hostname === 'localhost' || dbUrl.hostname === '127.0.0.1';

        pool = new Pool({
          user: decodeURIComponent(dbUrl.username),
          password: decodeURIComponent(dbUrl.password),
          host: dbUrl.hostname,
          port: dbUrl.port ? parseInt(dbUrl.port, 10) : 5432,
          database: dbUrl.pathname.replace('/', ''),
          ssl: isLocal ? false : { rejectUnauthorized: false },
          max: 2,
          connectionTimeoutMillis: 5000,
          idleTimeoutMillis: 10000
        });
      } catch (e) {
        pool = new Pool({
          connectionString: connString,
          ssl: { rejectUnauthorized: false },
          max: 2,
          connectionTimeoutMillis: 5000
        });
      }
    } else {
      pool = new Pool({
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'language_school',
        password: process.env.DB_PASSWORD || 'root',
        port: process.env.DB_PORT || 5432,
        connectionTimeoutMillis: 3000
      });
    }
  }
  return pool;
}

// Проверка и добавление колонки Notes при старте
async function ensureNotesColumn() {
  try {
    const db = getPool();
    await db.query(`ALTER TABLE "Lesson_Request" ADD COLUMN IF NOT EXISTS "Notes" TEXT;`);
  } catch (err) {
    // Игнорируем, если прав нет или колонка уже существует
  }
}
ensureNotesColumn();

// 1. Получение списка языков
app.get('/api/languages', async (req, res) => {
  try {
    const db = getPool();
    const result = await db.query('SELECT * FROM "Language" ORDER BY "ID_Language" ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Ошибка языков:', err.message);
    res.status(500).json({ error: 'Ошибка сервера при получении языков' });
  }
});

// 2. Отправка новой заявки с сохранением пожеланий (Notes) и преподавателя
app.post('/api/requests', async (req, res) => {
  const { full_name, contact, language_id, preferred_date, notes, teacher_name } = req.body;
  if (!full_name || !contact || !language_id || !preferred_date) {
    return res.status(400).json({ error: 'Все обязательные поля должны быть заполнены' });
  }

  try {
    const db = getPool();
    const isZh = String(language_id).includes('2') || String(language_id).toUpperCase().includes('ZH');
    const targetCode = isZh ? 'ZH' : 'EN';
    const targetName = isZh ? 'Китайский язык' : 'Английский язык';

    let langRes = await db.query(
      `SELECT "ID_Language" FROM "Language" WHERE "Language_Code" = $1 OR "Language_Name" ILIKE $2 LIMIT 1;`,
      [targetCode, `%${targetName.split(' ')[0]}%`]
    );

    let actualLangId;
    if (langRes.rows.length > 0) {
      actualLangId = langRes.rows[0].ID_Language;
    } else {
      const insertLang = await db.query(
        `INSERT INTO "Language" ("Language_Code", "Language_Name") VALUES ($1, $2) RETURNING "ID_Language";`,
        [targetCode, targetName]
      );
      actualLangId = insertLang.rows[0].ID_Language;
    }

    await db.query(
      `INSERT INTO "Request_Status" ("ID_Status", "Status_Name") VALUES (1, 'Новая') ON CONFLICT DO NOTHING;`
    );

    // Определение преподавателя (если указан явно в форме или выбран из карточки)
    let assignedTeacher = teacher_name || null;
    if (!assignedTeacher) {
      if (notes && notes.includes('Марк Ковалёв')) assignedTeacher = 'Марк Ковалёв';
      else if (notes && notes.includes('Ван Ли')) assignedTeacher = 'Ван Ли (王丽)';
      else if (notes && notes.includes('Анна Смирнова')) assignedTeacher = 'Анна Смирнова';
    }

    // Сохранение в Lesson_Request с пожеланиями (Notes)
    const query = `
      INSERT INTO "Lesson_Request" 
        ("Full_Name", "Contact", "ID_Language", "Preferred_Date", "ID_Status", "Notes") 
      VALUES ($1, $2, $3, $4, 1, $5) RETURNING *;
    `;
    const values = [full_name, contact, actualLangId, preferred_date, notes || null];
    const result = await db.query(query, values);

    res.status(201).json({ success: true, request: result.rows[0] });
  } catch (err) {
    console.error('Ошибка сохранения заявки:', err.message);
    res.status(500).json({ error: err.message || 'Ошибка сервера при сохранении заявки' });
  }
});

// 3. Выгрузка заявок для CRM с автоопределением педагога (Анна, Ван Ли, Марк Ковалев) и показом Notes
app.get('/api/requests', async (req, res) => {
  try {
    const db = getPool();
    const query = `
      SELECT 
        r."ID_Request", 
        r."Full_Name", 
        r."Contact", 
        r."Notes",
        l."Language_Name", 
        l."Language_Code",
        TO_CHAR(r."Preferred_Date", 'YYYY-MM-DD') AS "Preferred_Date", 
        s."Status_Name",
        COALESCE(
          u."Full_Name",
          CASE 
            WHEN r."Notes" ILIKE '%Марк%' THEN 'Марк Ковалёв'
            WHEN r."Notes" ILIKE '%Ван Ли%' THEN 'Ван Ли (王丽)'
            WHEN r."Notes" ILIKE '%Смирнов%' THEN 'Анна Смирнова'
            WHEN l."Language_Code" = 'ZH' OR l."Language_Name" ILIKE '%Китай%' THEN 'Ван Ли (王丽)'
            ELSE 'Анна Смирнова'
          END
        ) AS "Teacher_Name"
      FROM "Lesson_Request" r
      JOIN "Language" l ON r."ID_Language" = l."ID_Language"
      JOIN "Request_Status" s ON r."ID_Status" = s."ID_Status"
      LEFT JOIN "User" u ON r."Assigned_Teacher_ID" = u."ID_User"
      ORDER BY r."ID_Request" DESC;
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Ошибка CRM:', err.message);
    res.status(500).json({ error: 'Ошибка сервера при получении заявок' });
  }
});

// 4. Смена статуса заявки
app.patch('/api/requests/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status_id } = req.body;
  try {
    const db = getPool();
    const result = await db.query(
      'UPDATE "Lesson_Request" SET "ID_Status" = $1 WHERE "ID_Request" = $2 RETURNING *',
      [status_id, id]
    );
    res.json({ success: true, updated: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Отдача главной страницы
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Локальный запуск
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Сервер языковой школы «ЛингваСфера» запущен на http://localhost:${PORT}`);
  });
}

module.exports = app;
