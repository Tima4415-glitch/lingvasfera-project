CREATE TABLE IF NOT EXISTS "Role" (
    "ID_Role" SERIAL PRIMARY KEY,
    "Role_Name" VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS "Language" (
    "ID_Language" SERIAL PRIMARY KEY,
    "Language_Code" VARCHAR(5) NOT NULL UNIQUE,
    "Language_Name" VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS "User" (
    "ID_User" SERIAL PRIMARY KEY,
    "ID_Role" INT NOT NULL REFERENCES "Role"("ID_Role") ON DELETE RESTRICT,
    "Full_Name" VARCHAR(150) NOT NULL,
    "Login" VARCHAR(50) NOT NULL UNIQUE,
    "Password" VARCHAR(255) NOT NULL,
    "Contact" VARCHAR(100) NOT NULL,
    "Created_At" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Request_Status" (
    "ID_Status" SERIAL PRIMARY KEY,
    "Status_Name" VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS "Lesson_Request" (
    "ID_Request" SERIAL PRIMARY KEY,
    "Full_Name" VARCHAR(150) NOT NULL,
    "Contact" VARCHAR(100) NOT NULL,
    "ID_Language" INT NOT NULL REFERENCES "Language"("ID_Language") ON DELETE RESTRICT,
    "Preferred_Date" DATE NOT NULL,
    "ID_Status" INT NOT NULL DEFAULT 1 REFERENCES "Request_Status"("ID_Status"),
    "Assigned_Teacher_ID" INT REFERENCES "User"("ID_User") ON DELETE SET NULL,
    "Created_At" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "Role" ("Role_Name") VALUES ('Пользователь'), ('Преподаватель'), ('Администратор') ON CONFLICT DO NOTHING;
INSERT INTO "Language" ("Language_Code", "Language_Name") VALUES ('EN', 'Английский язык'), ('ZH', 'Китайский язык') ON CONFLICT DO NOTHING;
INSERT INTO "Request_Status" ("Status_Name") VALUES ('Новая'), ('В обработке'), ('Подтверждена') ON CONFLICT DO NOTHING;