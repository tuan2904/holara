#!/usr/bin/env bash
# Tạo tài khoản demo (admin, chủ phòng khám, bác sĩ, bệnh nhân) trong stack Docker.
# Cách dùng (từ thư mục gốc repo):  bash docker/seed-demo-accounts.sh [mật_khẩu]
set -euo pipefail
cd "$(dirname "$0")/.."

PASSWORD="${1:-Demo@12345}"
DC=(docker compose --env-file docker/.env -f docker/docker-compose.yml)
MYSQL_USER=$(grep '^MYSQL_USER=' docker/.env | cut -d= -f2-)
MYSQL_PASSWORD=$(grep '^MYSQL_PASSWORD=' docker/.env | cut -d= -f2-)

HASH=$("${DC[@]}" exec -T -e SEED_PASSWORD="$PASSWORD" laravel-backend \
  php -r 'echo password_hash(getenv("SEED_PASSWORD"), PASSWORD_BCRYPT, ["cost" => 10]);')

sed "s|__PASSWORD_HASH__|$HASH|g" docker/seed-demo-accounts.sql \
  | "${DC[@]}" exec -T mysql mysql -u"${MYSQL_USER:-holora_app}" -p"$MYSQL_PASSWORD" \
      --default-character-set=utf8mb4 holora_medical

echo
echo "Đã tạo tài khoản demo, mật khẩu chung: $PASSWORD"
echo "  admin@medecode.test    (super_admin)"
echo "  owner@medecode.test    (clinic_owner, chi nhánh 'Phòng khám Demo Quận 1')"
echo "  doctor@medecode.test   (doctor, lịch 08:00-17:00 trong 14 ngày tới)"
echo "  patient@medecode.test  (patient)"
