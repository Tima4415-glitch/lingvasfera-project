const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Получаем строку подключения
let rawConn = process.env.DATABASE_POSTGRES_URL || 
              process.env.DATABASE_URL || 
              process.env.POSTGRES_URL || 
              'postgresql://postgres:postgres@localhost:5432/language_school';

// Отрезаем ?sslmode=require и любые GET-параметры, мешающие настройке SSL
const cleanConn = rawConn.split('?')[0];

const isLocal = cleanConn.includes('localhost') || cleanConn.includes('127.0.0.1');

const pool = new Pool({
    connectionString: cleanConn,
    ssl: isLocal ? false : { rejectUnauthorized: false }
});

// Роут создания новой заявки
app.post('/api/requests', async (req, res) => {
    try {
        const { fullName, contact, languageId, preferredDate } = req.body;
        
        const langId = languageId ? parseInt(languageId, 10) : 1;
        const targetDate = preferredDate || new Date().toISOString().split('T')[0];

        const query = `
            INSERT INTO "Lesson_Request" 
            ("Full_Name", "Contact", "ID_Language", "Preferred_Date", "ID_Status") 
            VALUES ($1, $2, $3, $4, 1) 
            RETURNING *;
        `;
        const values = [fullName, contact, langId, targetDate];
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
