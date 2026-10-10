-- Tài khoản demo để test các role. Chạy qua docker/seed-demo-accounts.sh,
-- script sẽ thay __PASSWORD_HASH__ bằng bcrypt hash sinh từ PHP.
-- Chạy lại nhiều lần được: không tạo trùng, chỉ đặt lại mật khẩu.

SET NAMES utf8mb4;
START TRANSACTION;

-- 1. Users
INSERT IGNORE INTO users (full_name, username, email, password_hash, auth_provider, phone, status, email_verified_at) VALUES
  ('Demo Admin',        'demo_admin',   'admin@medecode.test',   '__PASSWORD_HASH__', 'local', '0900000001', 'active', NOW()),
  ('Demo Chủ phòng khám', 'demo_owner', 'owner@medecode.test',   '__PASSWORD_HASH__', 'local', '0900000002', 'active', NOW()),
  ('BS. Demo Bác sĩ',   'demo_doctor',  'doctor@medecode.test',  '__PASSWORD_HASH__', 'local', '0900000003', 'active', NOW()),
  ('Demo Bệnh nhân',    'demo_patient', 'patient@medecode.test', '__PASSWORD_HASH__', 'local', '0900000004', 'active', NOW());

UPDATE users SET password_hash = '__PASSWORD_HASH__', status = 'active', deleted_at = NULL
WHERE email IN ('admin@medecode.test', 'owner@medecode.test', 'doctor@medecode.test', 'patient@medecode.test');

SELECT id INTO @admin_id   FROM users WHERE email = 'admin@medecode.test';
SELECT id INTO @owner_id   FROM users WHERE email = 'owner@medecode.test';
SELECT id INTO @doctor_uid FROM users WHERE email = 'doctor@medecode.test';
SELECT id INTO @patient_id FROM users WHERE email = 'patient@medecode.test';

-- 2. Roles
INSERT IGNORE INTO user_role (user_id, role_id)
SELECT @admin_id, id FROM role WHERE code = 'super_admin'
UNION ALL SELECT @owner_id, id FROM role WHERE code = 'clinic_owner'
UNION ALL SELECT @doctor_uid, id FROM role WHERE code = 'doctor'
UNION ALL SELECT @patient_id, id FROM role WHERE code = 'patient';

-- 3. Chủ phòng khám: gói MeDecode Free (giống lúc đăng ký provider) + 1 chi nhánh
INSERT INTO provider_subscription (plan_id, scope_type, scope_id, owner_user_id, status, starts_at, auto_renew)
SELECT p.id, 'account', @owner_id, @owner_id, 'active', NOW(), 0
FROM subscription_plan p
WHERE p.code = 'HOLORA_FREE'
  AND NOT EXISTS (SELECT 1 FROM provider_subscription ps
                  WHERE ps.scope_type = 'account' AND ps.scope_id = @owner_id AND ps.deleted_at IS NULL);

INSERT IGNORE INTO branch (name, code, owner_user_id, phone, email, address, city, description, status) VALUES
  ('Phòng khám Demo Quận 1', 'DEMO_BR0001', @owner_id, '0281234567', 'branch@medecode.test',
   '1 Nguyễn Huệ, Quận 1', 'TP. Hồ Chí Minh', 'Chi nhánh dữ liệu giả lập để test', 'active');
SELECT id INTO @branch_id FROM branch WHERE code = 'DEMO_BR0001';

-- 4. Bác sĩ: hồ sơ doctor, gắn vào chi nhánh, lịch làm việc 14 ngày tới
INSERT IGNORE INTO doctor (user_id, created_by_user_id, specialty_id, doctor_code, full_name, phone, email,
                           license_number, qualification, experience_years, consultation_fee, bio, status)
SELECT @doctor_uid, @owner_id, s.id, 'DEMO_DT0001', 'BS. Demo Bác sĩ', '0900000003', 'doctor@medecode.test',
       'DEMO-LIC-0001', 'Bác sĩ Đa khoa', 5, 200000, 'Hồ sơ bác sĩ giả lập để test', 'active'
FROM specialty s WHERE s.code = 'INTERNAL_MEDICINE';
SELECT id INTO @doctor_id FROM doctor WHERE doctor_code = 'DEMO_DT0001';

INSERT IGNORE INTO doctor_branch (doctor_id, branch_id) VALUES (@doctor_id, @branch_id);

INSERT INTO doctor_schedule (doctor_id, work_date, start_time, end_time, slot_duration, status)
WITH RECURSIVE days AS (
  SELECT CURDATE() AS d
  UNION ALL SELECT d + INTERVAL 1 DAY FROM days WHERE d < CURDATE() + INTERVAL 13 DAY
)
SELECT @doctor_id, d, '08:00:00', '17:00:00', 30, 'active'
FROM days
WHERE NOT EXISTS (SELECT 1 FROM doctor_schedule ds WHERE ds.doctor_id = @doctor_id AND ds.work_date = days.d);

-- 5. Bệnh nhân: hồ sơ patient (giống lúc đăng ký thường)
INSERT INTO patient (user_id, patient_code, full_name, phone, email, gender, status)
SELECT @patient_id, CONCAT('PAT', LPAD(@patient_id, 6, '0')), 'Demo Bệnh nhân', '0900000004', 'patient@medecode.test', 'other', 'active'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM patient WHERE user_id = @patient_id);

COMMIT;

-- Kết quả
SELECT u.email, GROUP_CONCAT(r.code) AS roles
FROM users u JOIN user_role ur ON ur.user_id = u.id JOIN role r ON r.id = ur.role_id
WHERE u.email LIKE '%@medecode.test'
GROUP BY u.email ORDER BY u.email;
