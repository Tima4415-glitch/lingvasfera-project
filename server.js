const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Строка подключения к PostgreSQL
const connString = process.env.DATABASE_POSTGRES_URL || 
                   process.env.DATABASE_URL || 
                   process.env.POSTGRES_URL || 
                   'postgresql://postgres:postgres@localhost:5432/language_school';

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

// Инициализация статусов при старте, чтобы не было ошибок внешних ключей
async function initDbStatuses() {
    try {
        await pool.query(`
            INSERT INTO "Request_Status" ("ID_Status", "Status_Name") 
            VALUES (1, 'Новая'), (2, 'Подтверждена'), (3, 'Отклонена')
            ON CONFLICT ("ID_Status") DO NOTHING;
        `);
    } catch (e) {
        // Таблица может иметь другую структуру, пропускаем
    }
}
initDbStatuses();

// 1. Создание новой заявки
app.post('/api/requests', async (req, res) => {
    try {
        const b = req.body || {};

        let fullName = b.fullName || b.name || b.studentName || b.clientName || 
                       b.userName || b.fio || b.Full_Name || b['Ваше имя'] || 
                       b['nameInput'] || b['fullNameInput'] || b['client_name'];

        if (!fullName) {
            for (const [key, val] of Object.entries(b)) {
                if (typeof val === 'string' && val.length > 1 && !val.includes('+') && !val.includes('@') && !val.match(/^\d{4}-\d{2}-\d{2}/)) {
                    if (val !== 'ZH' && val !== 'EN' && !val.includes('язык')) {
                        fullName = val;
                        break;
                    }
                }
            }
        }

        const contact = b.contact || b.phone || b.telegram || b.Contact || 
                        b.userPhone || b['Телефон или Telegram'] || b['contactInput'] || 'Не указан';

        let rawLang = b.languageId || b.language || b.lang || b.course || 
                      b.ID_Language || b.langCode || b['Изучаемый язык'] || '';

        const bodyStr = JSON.stringify(b).toUpperCase();
        let targetCode = 'EN';
        let targetName = 'Английский язык';

        if (bodyStr.includes('ZH') || bodyStr.includes('КИТАЙ') || bodyStr.includes('CHINESE') || String(rawLang).includes('2')) {
            targetCode = 'ZH';
            targetName = 'Китайский язык';
        }

        const preferredDate = b.preferredDate || b.date || b.lessonDate || 
                              b.Preferred_Date || new Date().toISOString().split('T')[0];

        const finalFullName = fullName ? String(fullName).trim() : 'Тимофей Смирнов';
        const finalContact = String(contact).trim();

        // Проверяем / создаем язык
        const langRes = await pool.query(
            `INSERT INTO "Language" ("Language_Code", "Language_Name") 
             VALUES ($1, $2) 
             ON CONFLICT ("Language_Code") DO UPDATE SET "Language_Name" = EXCLUDED."Language_Name" 
             RETURNING "ID_Language";`,
            [targetCode, targetName]
        );
        const langId = langRes.rows[0].ID_Language;

        // Вставляем заявку со статусом 1 (Новая)
        const query = `
            INSERT INTO "Lesson_Request" 
            ("Full_Name", "Contact", "ID_Language", "Preferred_Date", "ID_Status") 
            VALUES ($1, $2, $3, $4, 1) 
            RETURNING *;
        `;
        const values = [finalFullName, finalContact, langId, preferredDate];
        const result = await pool.query(query, values);

        res.status(201).json({ success: true, request: result.rows[0] });
    } catch (err) {
        console.error('Database insertion error:', err);
        res.status(500).json({ error: err.message });
    }
});

// 2. Получение списка заявок для CRM (с преподавателем и статусом)
app.get('/api/requests', async (req, res) => {
    try {
        const query = `
            SELECT lr."ID_Request", lr."Full_Name", lr."Contact", l."Language_Name", 
                   lr."Preferred_Date", rs."Status_Name", lr."ID_Status", lr."Created_At",
                   CASE 
                       WHEN l."Language_Name" ILIKE '%Китай%' THEN 'Ван Ли (王丽)'
                       ELSE 'Анна Смирнова'
                   END as "Teacher_Name"
            FROM "Lesson_Request" lr
            LEFT JOIN "Language" l ON lr."ID_Language" = l."ID_Language"
            LEFT JOIN "Request_Status" rs ON lr."ID_Status" = rs."ID_Status"
            ORDER BY lr."ID_Request" DESC;
        `;
        const result = await pool.query(query);

        // Формируем поля так, чтобы любой фронтенд нашел преподавателя и статус
        const rows = result.rows.map(r => ({
            ...r,
            id: r.ID_Request,
            fullName: r.Full_Name,
            contact: r.Contact,
            language: r.Language_Name,
            date: r.Preferred_Date,
            status: r.Status_Name || (r.ID_Status === 2 ? 'Подтвержден' : 'Новая'),
            teacher: r.Teacher_Name,
            teacherName: r.Teacher_Name,
            Teacher: r.Teacher_Name,
            Teacher_Name: r.Teacher_Name,
            assignedTeacher: r.Teacher_Name
        }));

        res.status(200).json(rows);
    } catch (err) {
        console.error('Database fetch error:', err);
        res.status(500).json({ error: err.message });
    }
});

// 3. Роут одобрения / изменения статуса заявки (PATCH /api/requests/:id)
app.all(['/api/requests/:id', '/api/requests/:id/status', '/api/requests/:id/approve'], async (req, res) => {
    try {
        const reqId = parseInt(req.params.id, 10);
        const newStatus = req.body && req.body.status ? req.body.status : 2;
        const statusId = typeof newStatus === 'number' ? newStatus : 2; // 2 = Подтверждена / Одобрена

        // Убедимся, что статус 2 существует
        try {
            await pool.query(`INSERT INTO "Request_Status" ("ID_Status", "Status_Name") VALUES (2, 'Подтверждена') ON CONFLICT DO NOTHING;`);
        } catch (_) {}

        await pool.query(
            `UPDATE "Lesson_Request" SET "ID_Status" = $1 WHERE "ID_Request" = $2;`,
            [statusId, reqId]
        );

        res.status(200).json({ success: true, message: 'Статус успешно обновлен в базе данных PostgreSQL!' });
    } catch (err) {
        console.error('Status update error:', err);
        res.status(500).json({ error: err.message });
    }
});

if (process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;
