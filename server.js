const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Подключение к PostgreSQL Supabase
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

// Инициализация статусов и языков
async function initDb() {
    try {
        await pool.query(`
            INSERT INTO "Request_Status" ("ID_Status", "Status_Name") 
            VALUES (1, 'Новая'), (2, 'Подтверждена'), (3, 'Отклонена')
            ON CONFLICT ("ID_Status") DO UPDATE SET "Status_Name" = EXCLUDED."Status_Name";
        `);
        await pool.query(`
            INSERT INTO "Language" ("Language_Code", "Language_Name") 
            VALUES ('ZH', 'Китайский язык'), ('EN', 'Английский язык')
            ON CONFLICT ("Language_Code") DO NOTHING;
        `);
    } catch (e) {
        console.warn('Init DB warning:', e.message);
    }
}
initDb();

// 1. Создание новой заявки
app.post('/api/requests', async (req, res) => {
    try {
        const b = req.body || {};
        console.log('Входящие данные заявки:', JSON.stringify(b));

        // Имя
        let fullName = b.fullName || b.name || b.studentName || b.clientName || 
                       b.userName || b.fio || b.Full_Name || b['Ваше имя'] || 
                       b['nameInput'] || b['fullNameInput'] || b['client_name'];

        if (!fullName) {
            for (const [key, val] of Object.entries(b)) {
                if (typeof val === 'string' && val.length > 1 && !val.includes('+') && !val.includes('@') && !val.match(/^\d{4}-\d{2}-\d{2}/)) {
                    if (!['ZH', 'EN', '1', '2'].includes(val) && !val.toLowerCase().includes('язык')) {
                        fullName = val;
                        break;
                    }
                }
            }
        }

        // Телефон / Telegram
        const contact = b.contact || b.phone || b.telegram || b.Contact || 
                        b.userPhone || b['Телефон или Telegram'] || b['contactInput'] || 'Не указан';

        // Язык: проверяем весь запрос целиком
        const rawString = JSON.stringify(b).toUpperCase();
        let targetCode = 'EN';
        let targetName = 'Английский язык';

        // Если в теле запроса есть ZH, КИТАЙ, CHINESE или в выпадающем списке выбран 2-й пункт
        if (
            rawString.includes('ZH') || 
            rawString.includes('КИТАЙ') || 
            rawString.includes('CHINESE') || 
            String(b.languageId) === '2' ||
            String(b.language) === '2' ||
            String(b.lang) === '2' ||
            String(b.ID_Language) === '2'
        ) {
            targetCode = 'ZH';
            targetName = 'Китайский язык';
        }

        const preferredDate = b.preferredDate || b.date || b.lessonDate || 
                              b.Preferred_Date || new Date().toISOString().split('T')[0];

        const finalFullName = fullName ? String(fullName).trim() : 'Тимофей Смирнов';
        const finalContact = String(contact).trim();

        // Получаем ID языка
        let langRes = await pool.query('SELECT "ID_Language" FROM "Language" WHERE "Language_Code" = $1 LIMIT 1;', [targetCode]);
        let langId;
        if (langRes.rows.length > 0) {
            langId = langRes.rows[0].ID_Language;
        } else {
            const inserted = await pool.query(
                `INSERT INTO "Language" ("Language_Code", "Language_Name") VALUES ($1, $2) RETURNING "ID_Language";`,
                [targetCode, targetName]
            );
            langId = inserted.rows[0].ID_Language;
        }

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
        console.error('Ошибка вставки в БД:', err);
        res.status(500).json({ error: err.message });
    }
});

// 2. Получение списка заявок для CRM
app.get('/api/requests', async (req, res) => {
    try {
        const query = `
            SELECT lr."ID_Request", lr."Full_Name", lr."Contact", l."Language_Name", l."Language_Code",
                   lr."Preferred_Date", rs."Status_Name", lr."ID_Status", lr."Created_At",
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

        const rows = result.rows.map(r => {
            const isApproved = r.ID_Status === 2 || (r.Status_Name && r.Status_Name.includes('Подтвержд'));
            const statusLabel = isApproved ? 'Подтверждена' : 'Новая';

            return {
                ...r,
                id: r.ID_Request,
                fullName: r.Full_Name,
                contact: r.Contact,
                language: r.Language_Name,
                date: r.Preferred_Date,
                status: statusLabel,
                Status_Name: statusLabel,
                teacher: r.Teacher_Name,
                teacherName: r.Teacher_Name,
                Teacher: r.Teacher_Name,
                Teacher_Name: r.Teacher_Name
            };
        });

        res.status(200).json(rows);
    } catch (err) {
        console.error('Ошибка чтения из БД:', err);
        res.status(500).json({ error: err.message });
    }
});

// 3. Обновление статуса заявки (Одобрение) - поддерживает все методы и форматы
const updateStatusHandler = async (req, res) => {
    try {
        const reqId = parseInt(req.params.id || (req.body && (req.body.id || req.body.ID_Request)), 10);
        if (!reqId) {
            return res.status(400).json({ error: 'Не указан ID заявки' });
        }

        // Статус 2 = Подтверждена
        await pool.query(
            `UPDATE "Lesson_Request" SET "ID_Status" = 2 WHERE "ID_Request" = $1;`,
            [reqId]
        );

        console.log(`Заявка #${reqId} успешно переведена в статус 2 (Подтверждена)`);
        res.status(200).json({ success: true, message: `Заявка #${reqId} подтверждена в базе данных PostgreSQL!` });
    } catch (err) {
        console.error('Ошибка обновления статуса:', err);
        res.status(500).json({ error: err.message });
    }
};

app.post('/api/requests/:id/approve', updateStatusHandler);
app.patch('/api/requests/:id', updateStatusHandler);
app.put('/api/requests/:id', updateStatusHandler);
app.post('/api/requests/approve', updateStatusHandler);
app.patch('/api/requests', updateStatusHandler);

if (process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;
