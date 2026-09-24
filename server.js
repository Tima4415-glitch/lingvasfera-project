const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Получаем строку подключения из переменных окружения Vercel / Supabase
const connString = process.env.DATABASE_POSTGRES_URL || 
                   process.env.DATABASE_URL || 
                   process.env.POSTGRES_URL || 
                   'postgresql://postgres:postgres@localhost:5432/language_school';

// Разбираем параметры подключения
const dbUrl = new URL(connString.replace('postgresql://', 'http://').replace('postgres://', 'http://'));

const isLocal = dbUrl.hostname === 'localhost' || dbUrl.hostname === '127.0.0.1';

const pool = new Pool({
    user: decodeURIComponent(dbUrl.username),
    password: decodeURIComponent(dbUrl.password),
    host: dbUrl.hostname,
    port: dbUrl.port ? parseInt(dbUrl.port, 10) : 5432,
    database: dbUrl.pathname.replace('/', ''),
    ssl: isLocal ? false : {
        rejectUnauthorized: false
    }
});

// Роут создания новой заявки (принимает любые названия полей с формы)
app.post('/api/requests', async (req, res) => {
    try {
        const body = req.body || {};
        
        // Всеядный поиск переданных полей (camelCase, snake_case, кириллица)
        const fullName = body.fullName || body.name || body.Full_Name || body['Ваше имя'] || body['fullNameInput'];
        const contact = body.contact || body.phone || body.Contact || body['Телефон или Telegram'] || body['contactInput'];
        const languageId = body.languageId || body.language || body.ID_Language || 1;
        const preferredDate = body.preferredDate || body.date || body.Preferred_Date || new Date().toISOString().split('T')[0];

        const finalFullName = fullName ? String(fullName).trim() : 'Анонимный пользователь';
        const finalContact = contact ? String(contact).trim() : 'Не указан';
        const langId = parseInt(languageId, 10) || 1;
        const targetDate = preferredDate;

        const query = `
            INSERT INTO "Lesson_Request" 
            ("Full_Name", "Contact", "ID_Language", "Preferred_Date", "ID_Status") 
            VALUES ($1, $2, $3, $4, 1) 
            RETURNING *;
        `;
        const values = [finalFullName, finalContact, langId, targetDate];
        const result = await pool.query(query, values);

        res.status(201).json({ success: true, request: result.rows[0] });
    } catch (err) {
        console.error('Database insertion error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Роут получения списка заявок (для панели CRM)
app.get('/api/requests', async (req, res) => {
    try {
        const query = `
            SELECT lr."ID_Request", lr."Full_Name", lr."Contact", l."Language_Name", 
                   lr."Preferred_Date", rs."Status_Name", lr."Created_At"
            FROM "Lesson_Request" lr
            LEFT JOIN "Language" l ON lr."ID_Language" = l."ID_Language"
            LEFT JOIN "Request_Status" rs ON lr."ID_Status" = rs."ID_Status"
            ORDER BY lr."Created_At" DESC;
        `;
        const result = await pool.query(query);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Database fetch error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Запуск сервера для локальной разработки
if (process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

// Экспорт для бессерверных функций Vercel
module.exports = app;
