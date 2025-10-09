-- สคริปต์สำหรับสร้างฐานข้อมูลและผู้ใช้ใหม่
-- รันคำสั่งนี้ในฐานข้อมูล PostgreSQL ด้วยสิทธิ์ superuser

-- 1. สร้างผู้ใช้ใหม่
CREATE USER postgresql WITH PASSWORD 'Login123';

-- 2. สร้างฐานข้อมูลใหม่
CREATE DATABASE stocknrs;

-- 3. ให้สิทธิ์ผู้ใช้ postgresql เข้าถึงฐานข้อมูล stocknrs
GRANT ALL PRIVILEGES ON DATABASE stocknrs TO postgresql;

-- 4. เชื่อมต่อกับฐานข้อมูล stocknrs
\c stocknrs;

-- 5. ให้สิทธิ์ผู้ใช้ postgresql เข้าถึง schema public
GRANT ALL ON SCHEMA public TO postgresql;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgresql;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgresql;

-- 6. ตั้งค่า default privileges สำหรับตารางและ sequence ใหม่
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgresql;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgresql;

-- 7. ตรวจสอบการตั้งค่า
SELECT 
    usename as username,
    datname as database_name
FROM pg_user 
JOIN pg_database ON pg_user.usesysid = pg_database.datdba
WHERE usename = 'postgresql';

-- 8. แสดงรายการฐานข้อมูล
\l
