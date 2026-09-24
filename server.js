const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Безопасное подключение к БД
const connString = process.env.DATABASE_POSTGRES_URL || process.env.DATABASE_URL;

let pool = null;
if (connString) {
  pool = new Pool({
    connectionString: connString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000 // 5 сек таймаут, чтобы не вешать Vercel
  });
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

// 1. Получение языков
app.get('/api/languages', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM "Language" ORDER BY "ID_Language" ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Ошибка языков:', err.message);
    res.status(500).json({ error: 'Ошибка сервера при получении языков' });
  }
});

// 2. Отправка новой заявки
app.post('/api/requests', async (req, res) => {
  const { full_name, contact, language_id, preferred_date } = req.body;
  if (!full_name || !contact || !language_id || !preferred_date) {
    return res.status(400).json({ error: 'Все поля обязательны для заполнения' });
  }
  try {
    const query = `
      INSERT INTO "Lesson_Request" 
        ("Full_Name", "Contact", "ID_Language", "Preferred_Date", "ID_Status") 
      VALUES ($1, $2, $3, $4, 1) RETURNING *;
    `;
    const values = [full_name, contact, language_id, preferred_date];
    const result = await pool.query(query, values);
    res.status(201).json({ success: true, request: result.rows[0] });
  } catch (err) {
    console.error('Ошибка сохранения:', err.message);
    res.status(500).json({ error: err.message || 'Ошибка при сохранении заявки' });
  }
});

// 3. Выгрузка для CRM
app.get('/api/requests', async (req, res) => {
  try {
    const query = `
      SELECT 
        r."ID_Request", 
        r."Full_Name", 
        r."Contact", 
        l."Language_Name", 
        TO_CHAR(r."Preferred_Date", 'YYYY-MM-DD') AS "Preferred_Date", 
        s."Status_Name",
        COALESCE(u."Full_Name", 'Не назначен') AS "Teacher_Name"
      FROM "Lesson_Request" r
      JOIN "Language" l ON r."ID_Language" = l."ID_Language"
      JOIN "Request_Status" s ON r."ID_Status" = s."ID_Status"
      LEFT JOIN "User" u ON r."Assigned_Teacher_ID" = u."ID_User"
      ORDER BY r."ID_Request" DESC;
    `;
    const result = await pool.query(query);
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
    const result = await pool.query(
      'UPDATE "Lesson_Request" SET "ID_Status" = $1 WHERE "ID_Request" = $2 RETURNING *',
      [status_id, id]
    );
    res.json({ success: true, updated: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Роут для отдачи главной страницы
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Запуск listen только локально! В Vercel экспорт модуля
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Сервер запущен локально: http://localhost:${PORT}`);
  });
}

module.exports = app;
