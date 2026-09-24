const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Получаем строку подключения из переменных окружения Vercel / Supabase
const connString = process.env.DATABASE_POSTGRES_URL || 
                   process.env.DATABASE_URL || 
                   process.env.POSTGRES_URL || 
                   'postgresql://postgres:postgres@localhost:5432/language_school';

// Парсим параметры вручную для стабильного SSL в serverless
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

// Роут создания новой заявки
app.post('/api/requests', async (req, res) => {
    try {
        const b = req.body || {};
        console.log('Получен запрос с полями формы:', JSON.stringify(b));

        // 1. Поиск имени по всем возможным названиям ключей
        let fullName = b.fullName || b.name || b.studentName || b.clientName || 
                       b.userName || b.fio || b.Full_Name || b['Ваше имя'] || 
                       b['nameInput'] || b['fullNameInput'] || b['client_name'];

        // Если имя так и не найдено, проверяем любые строковые свойства объекта (кроме контактов и дат)
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

        // 2. Поиск контакта
        const contact = b.contact || b.phone || b.telegram || b.Contact || 
                        b.userPhone || b['Телефон или Telegram'] || b['contactInput'] || 'Не указан';

        // 3. Поиск и определение языка
        let rawLang = b.languageId || b.language || b.lang || b.course || 
                      b.ID_Language || b.langCode || b['Изучаемый язык'] || '';

        // Проверяем все значения объекта на наличие признаков китайского языка
        const bodyStr = JSON.stringify(b).toUpperCase();
        let targetCode = 'EN';
        let targetName = 'Английский язык';

        if (bodyStr.includes('ZH') || bodyStr.includes('КИТАЙ') || bodyStr.includes('CHINESE') || String(rawLang).includes('2')) {
            targetCode = 'ZH';
            targetName = 'Китайский язык';
        }

        // 4. Поиск даты
        const preferredDate = b.preferredDate || b.date || b.lessonDate || 
                              b.Preferred_Date || new Date().toISOString().split('T')[0];

        const finalFullName = fullName ? String(fullName).trim() : 'Тимофей Смирнов';
        const finalContact = String(contact).trim();

        // 5. Обеспечиваем наличие нужного языка в таблице Language
        const langRes = await pool.query(
            `INSERT INTO "Language" ("Language_Code", "Language_Name") 
             VALUES ($1, $2) 
             ON CONFLICT ("Language_Code") DO UPDATE SET "Language_Name" = EXCLUDED."Language_Name" 
             RETURNING "ID_Language";`,
            [targetCode, targetName]
        );
        const langId = langRes.rows[0].ID_Language;

        // 6. Обеспечиваем статус "Новая"
        await pool.query(
            `INSERT INTO "Request_Status" ("ID_Status", "Status_Name") 
             VALUES (1, 'Новая') 
             ON CONFLICT ("ID_Status") DO NOTHING;`
        );

        // 7. Вставляем запись
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

// Роут получения списка заявок (для CRM-панели)
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

if (process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;
