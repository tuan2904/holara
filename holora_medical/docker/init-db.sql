-- 1. Tạo Database cho Backend chính
CREATE DATABASE IF NOT EXISTS holora_medical;

-- 2. Tạo Database cho AI Image Processing
CREATE DATABASE IF NOT EXISTS holora_image_processing_db;

-- 3. Cấp quyền cho user 'holora_app' trên cả 2 database
GRANT ALL PRIVILEGES ON holora_medical.* TO 'holora_app'@'%';
GRANT ALL PRIVILEGES ON holora_image_processing_db.* TO 'holora_app'@'%';

FLUSH PRIVILEGES;
