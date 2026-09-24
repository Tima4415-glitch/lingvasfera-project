const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Строка подключения к Supabase PostgreSQL
const connString = process.env.DATABASE_POSTGRES_URL || 
                   process.env.DATABASE_URL || 
                   'postgresql://postgres:postgres@localhost:5432/language_school';

const dbUrl = new URL(connString.replace('postgresql://', 'http://').replace('postgres://', 'http://'));
const isLocal = dbUrl.hostname === 'localhost' || dbUrl.hostname === '127.0.0.1';

const pool = new Pool({
  user: decodeURIComponent(dbUrl.username),
  password: decodeURIComponent(dbUrl.password),
  host: dbUrl.hostname,
  port: dbUrl.port ? parseInt(dbUrl.port, 10) : 5432,
  database: dbUrl.pathname.replace('/', ''),
  ssl: isLocal ? false : { rejectUnauthorized: false }
});

// Инициализация структуры таблиц при первом старте
async function initDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "Role" (
        "ID_Role" SERIAL PRIMARY KEY,
        "Role_Name" VARCHAR(50) NOT NULL UNIQUE
      );
      CREATE TABLE IF NOT EXISTS "Language" (
        "ID_Language" SERIAL PRIMARY KEY,
        "Language_Code" VARCHAR(5) NOT NULL UNIQUE,
        "Language_Name" VARCHAR(100) NOT NULL
      );
      CREATE TABLE IF NOT EXISTS "Request_Status" (
        "ID_Status" SERIAL PRIMARY KEY,
        "Status_Name" VARCHAR(50) NOT NULL UNIQUE
      );
      CREATE TABLE IF NOT EXISTS "Lesson_Request" (
        "ID_Request" SERIAL PRIMARY KEY,
        "Full_Name" VARCHAR(150) NOT NULL,
        "Contact" VARCHAR(100) NOT NULL,
        "ID_Language" INT NOT NULL REFERENCES "Language"("ID_Language"),
        "Preferred_Date" DATE NOT NULL,
        "ID_Status" INT NOT NULL DEFAULT 1 REFERENCES "Request_Status"("ID_Status"),
        "Created_At" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      INSERT INTO "Request_Status" ("ID_Status", "Status_Name") VALUES (1, 'Новая'), (2, 'Подтверждена') ON CONFLICT DO NOTHING;
      INSERT INTO "Language" ("ID_Language", "Language_Code", "Language_Name") VALUES (1, 'EN', 'Английский язык'), (2, 'ZH', 'Китайский язык') ON CONFLICT DO NOTHING;
    `);
  } catch (err) {
    console.error('Ошибка инициализации таблиц:', err.message);
  }
}
initDb();

// Роут создания новой заявки
app.post('/api/requests', async (req, res) => {
  try {
    const b = req.body || {};
    const fullName = b.fullName || b.name || 'Тимофей Смирнов';
    const contact = b.contact || b.phone || 'Не указан';
    const rawLang = b.languageId || b.languageCode || 'EN';
    const preferredDate = b.preferredDate || new Date().toISOString().split('T')[0];

    const isZh = String(rawLang).toUpperCase().includes('ZH') || String(rawLang) === '2';
    const targetCode = isZh ? 'ZH' : 'EN';
    const targetName = isZh ? 'Китайский язык' : 'Английский язык';

    const langRes = await pool.query(
      `INSERT INTO "Language" ("Language_Code", "Language_Name") 
       VALUES ($1, $2) 
       ON CONFLICT ("Language_Code") DO UPDATE SET "Language_Name" = EXCLUDED."Language_Name" 
       RETURNING "ID_Language";`,
      [targetCode, targetName]
    );
    const langId = langRes.rows[0].ID_Language;

    const query = `
      INSERT INTO "Lesson_Request" ("Full_Name", "Contact", "ID_Language", "Preferred_Date", "ID_Status") 
      VALUES ($1, $2, $3, $4, 1) RETURNING *;
    `;
    const result = await pool.query(query, [fullName, contact, langId, preferredDate]);
    res.status(201).json({ success: true, request: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Роут выгрузки реестра заявок в CRM
app.get('/api/requests', async (req, res) => {
  try {
    const query = `
      SELECT lr."ID_Request", lr."Full_Name", lr."Contact", l."Language_Name", 
             lr."Preferred_Date", rs."Status_Name", lr."ID_Status",
             CASE 
                 WHEN l."Language_Name" ILIKE '%Китай%' OR l."Language_Code" = 'ZH' THEN 'Ван Ли (王丽)'
                 ELSE 'Анна Смирнова'
             END as "Teacher_Name"
      FROM "Lesson_Request" lr
      LEFT JOIN "Language" l ON lr."ID_Language" = l."ID_Language"
      LEFT JOIN "Request_Status" rs ON lr."ID_Status" = rs."ID_Status"
      ORDER BY lr."ID_Request" DESC;
    `;
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Роут подтверждения заявки
app.post('/api/requests/:id/approve', async (req, res) => {
  try {
    const reqId = parseInt(req.params.id, 10);
    await pool.query(`UPDATE "Lesson_Request" SET "ID_Status" = 2 WHERE "ID_Request" = $1;`, [reqId]);
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Локальный запуск (если не в Serverless на Vercel)
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => console.log(`Сервер успешно запущен на порту ${PORT}`));
}

module.exports = app;
