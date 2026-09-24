// 2. Отправка новой заявки с формы с автоматическим сопоставлением ID_Language
app.post('/api/requests', async (req, res) => {
  const { full_name, contact, language_id, preferred_date, notes } = req.body;
  if (!full_name || !contact || !language_id || !preferred_date) {
    return res.status(400).json({ error: 'Все поля обязательны для заполнения' });
  }

  try {
    // 1. Определяем, какой язык выбран (английский или китайский)
    const isZh = String(language_id).includes('2') || String(language_id).toUpperCase().includes('ZH');
    const targetCode = isZh ? 'ZH' : 'EN';
    const targetName = isZh ? 'Китайский язык' : 'Английский язык';

    // 2. Гарантируем, что язык есть в таблице Language, и получаем его реальный ID_Language
    let langRes = await pool.query(
      `SELECT "ID_Language" FROM "Language" WHERE "Language_Code" = $1 OR "Language_Name" ILIKE $2 LIMIT 1;`,
      [targetCode, `%${targetName.split(' ')[0]}%`]
    );

    let actualLangId;
    if (langRes.rows.length > 0) {
      actualLangId = langRes.rows[0].ID_Language;
    } else {
      const insertLang = await pool.query(
        `INSERT INTO "Language" ("Language_Code", "Language_Name") VALUES ($1, $2) RETURNING "ID_Language";`,
        [targetCode, targetName]
      );
      actualLangId = insertLang.rows[0].ID_Language;
    }

    // 3. Гарантируем наличие базового статуса "Новая" (ID_Status = 1)
    await pool.query(
      `INSERT INTO "Request_Status" ("ID_Status", "Status_Name") VALUES (1, 'Новая') ON CONFLICT DO NOTHING;`
    );

    // 4. Вставляем заявку с гарантированно существующим внешним ключом
    const query = `
      INSERT INTO "Lesson_Request" 
        ("Full_Name", "Contact", "ID_Language", "Preferred_Date", "ID_Status") 
      VALUES ($1, $2, $3, $4, 1) RETURNING *;
    `;
    const values = [full_name, contact, actualLangId, preferred_date];
    const result = await pool.query(query, values);

    res.status(201).json({ success: true, request: result.rows[0] });
  } catch (err) {
    console.error('Ошибка сохранения заявки:', err.message);
    res.status(500).json({ error: err.message || 'Ошибка сервера при сохранении заявки' });
  }
});
