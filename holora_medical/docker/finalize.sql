-- Chọn Database để thực thi
USE holora_medical;

-- 1. Thêm cột auth_provider nếu chưa có
-- Cột này dùng để phân biệt đăng nhập Google và Local
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'local' AFTER password_hash;

-- 2. Thêm cột google_id nếu chưa có (phòng trường hợp sau này bạn dùng Google Login)
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) DEFAULT NULL AFTER auth_provider;

-- Cập nhật lại quyền một lần nữa để chắc chắn
GRANT ALL PRIVILEGES ON holora_medical.* TO 'holora_app'@'%';
GRANT ALL PRIVILEGES ON holora_image_processing_db.* TO 'holora_app'@'%';

FLUSH PRIVILEGES;
