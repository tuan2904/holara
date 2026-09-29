#!/usr/bin/env bash
# The legacy VPS deployment path is retired. See README.md for local Compose.
printf '%s\n' 'VPS deployment is retired. Use the local Docker Compose instructions in README.md.' >&2
exit 1

set -Eeuo pipefail

trap 'echo "[ERROR] Deploy failed at line ${LINENO}." >&2' ERR

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$APP_DIR/docker/docker-compose.yml"
ENV_FILE="$APP_DIR/docker/.env"
APP_NAME="holora_medical"

FRONTEND_PORT="${FRONTEND_PORT:-80}"
LARAVEL_BACKEND_PORT="${LARAVEL_BACKEND_PORT:-5002}"
PHPMYADMIN_PORT="${PHPMYADMIN_PORT:-8080}"
MYSQL_PORT="${MYSQL_PORT:-3307}"
MYSQL_DATABASE="${MYSQL_DATABASE:-holora_medical}"
MYSQL_USER="${MYSQL_USER:-holora_app}"
PUBLIC_PROTOCOL="${PUBLIC_PROTOCOL:-http}"
PUBLIC_HOST="${PUBLIC_HOST:-}"
GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID:-}"
MYSQL_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:-}"
MYSQL_PASSWORD="${MYSQL_PASSWORD:-}"
JWT_SECRET="${JWT_SECRET:-}"
INSTALL_DOCKER=1

log() {
  printf '\n\033[1;34m==> %s\033[0m\n' "$*"
}

warn() {
  printf '\033[1;33m[WARN]\033[0m %s\n' "$*"
}

fail() {
  printf '\033[1;31m[ERROR]\033[0m %s\n' "$*" >&2
  exit 1
}

usage() {
  cat <<EOF
Usage: ./deploy.sh [options]

Deploy Holora Medical lên Ubuntu 24.04 / DigitalOcean bằng Docker Compose.

Options:
  --host <domain-or-ip>           Domain hoặc IP public của droplet
  --protocol <http|https>         Mặc định: http
  --google-client-id <id>         Google OAuth client id cho frontend
  --mysql-root-password <pass>    Mật khẩu root MySQL
  --db-password <pass>            Mật khẩu user ứng dụng MySQL
  --db-user <user>                Mặc định: holora_app
  --db-name <name>                Mặc định: holora_medical
  --jwt-secret <secret>           JWT secret cho Laravel
  --frontend-port <port>          Mặc định: 80
  --laravel-backend-port <port>   Mặc định: 5002
  --phpmyadmin-port <port>        Mặc định: 8080
  --mysql-port <port>             Mặc định: 3307 (bind local only)
  --skip-install                  Bỏ qua bước cài Docker / Compose
  -h, --help                      Hiển thị hướng dẫn

Ví dụ:
  chmod +x deploy.sh
  ./deploy.sh --host 203.0.113.10 --google-client-id YOUR_GOOGLE_CLIENT_ID
EOF
}

random_secret() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex 24
  else
    tr -dc 'A-Za-z0-9' </dev/urandom | head -c 48
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --host|--domain|--ip)
      PUBLIC_HOST="$2"
      shift 2
      ;;
    --protocol)
      PUBLIC_PROTOCOL="$2"
      shift 2
      ;;
    --google-client-id)
      GOOGLE_CLIENT_ID="$2"
      shift 2
      ;;
    --mysql-root-password)
      MYSQL_ROOT_PASSWORD="$2"
      shift 2
      ;;
    --db-password)
      MYSQL_PASSWORD="$2"
      shift 2
      ;;
    --db-user)
      MYSQL_USER="$2"
      shift 2
      ;;
    --db-name)
      MYSQL_DATABASE="$2"
      shift 2
      ;;
    --jwt-secret)
      JWT_SECRET="$2"
      shift 2
      ;;
    --frontend-port)
      FRONTEND_PORT="$2"
      shift 2
      ;;
    --laravel-backend-port)
      LARAVEL_BACKEND_PORT="$2"
      shift 2
      ;;
    --phpmyadmin-port)
      PHPMYADMIN_PORT="$2"
      shift 2
      ;;
    --mysql-port)
      MYSQL_PORT="$2"
      shift 2
      ;;
    --skip-install)
      INSTALL_DOCKER=0
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      fail "Unknown option: $1"
      ;;
  esac
done

[[ -f "$COMPOSE_FILE" ]] || fail "Không tìm thấy $COMPOSE_FILE"

if [[ -z "$PUBLIC_HOST" ]]; then
  if command -v curl >/dev/null 2>&1; then
    PUBLIC_HOST="$(curl -fsSL https://api.ipify.org || true)"
  fi
  if [[ -z "$PUBLIC_HOST" ]]; then
    PUBLIC_HOST="$(hostname -I 2>/dev/null | awk '{print $1}')"
  fi
fi

PUBLIC_HOST="${PUBLIC_HOST#http://}"
PUBLIC_HOST="${PUBLIC_HOST#https://}"
PUBLIC_HOST="${PUBLIC_HOST%%/*}"

[[ -n "$PUBLIC_HOST" ]] || fail "Không thể tự nhận diện IP public. Hãy truyền --host <domain-or-ip>."
[[ "$PUBLIC_PROTOCOL" == "http" || "$PUBLIC_PROTOCOL" == "https" ]] || fail "--protocol chỉ chấp nhận http hoặc https"

MYSQL_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:-$(random_secret)}"
MYSQL_PASSWORD="${MYSQL_PASSWORD:-$(random_secret)}"
JWT_SECRET="${JWT_SECRET:-$(random_secret)}"

CORS_ORIGIN="${CORS_ORIGIN:-${PUBLIC_PROTOCOL}://${PUBLIC_HOST}}"
VITE_API_URL="${VITE_API_URL:-${PUBLIC_PROTOCOL}://${PUBLIC_HOST}:${LARAVEL_BACKEND_PORT}}"
DOCTOR_INVITE_REDIRECT_URL="${DOCTOR_INVITE_REDIRECT_URL:-${CORS_ORIGIN}/doctor/invite-setup}"

SUDO=""
if [[ ${EUID} -ne 0 ]]; then
  SUDO="sudo"
fi

compose() {
  ${SUDO} docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

install_docker() {
  if command -v docker >/dev/null 2>&1 && ${SUDO} docker compose version >/dev/null 2>&1; then
    log "Docker và Docker Compose đã có sẵn."
    ${SUDO} systemctl enable --now docker >/dev/null 2>&1 || true
    return
  fi

  log "Cài Docker Engine + Docker Compose plugin"
  ${SUDO} apt-get update
  ${SUDO} apt-get install -y ca-certificates curl gnupg ufw
  ${SUDO} install -m 0755 -d /etc/apt/keyrings
  ${SUDO} curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  ${SUDO} chmod a+r /etc/apt/keyrings/docker.asc

  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo \"${UBUNTU_CODENAME:-$VERSION_CODENAME}\") stable" | \
    ${SUDO} tee /etc/apt/sources.list.d/docker.list >/dev/null

  ${SUDO} apt-get update
  ${SUDO} apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  ${SUDO} systemctl enable --now docker
  ${SUDO} usermod -aG docker "${SUDO_USER:-$USER}" || true
}

configure_firewall() {
  if ! command -v ufw >/dev/null 2>&1; then
    return
  fi

  log "Mở firewall cho Frontend / Laravel / phpMyAdmin"
  ${SUDO} ufw allow OpenSSH >/dev/null 2>&1 || true
  ${SUDO} ufw allow "${FRONTEND_PORT}/tcp" >/dev/null 2>&1 || true
  ${SUDO} ufw allow "${LARAVEL_BACKEND_PORT}/tcp" >/dev/null 2>&1 || true
  ${SUDO} ufw allow "${PHPMYADMIN_PORT}/tcp" >/dev/null 2>&1 || true
  ${SUDO} ufw --force enable >/dev/null 2>&1 || true
}

write_env_file() {
  log "Tạo file cấu hình $ENV_FILE"
  mkdir -p "$(dirname "$ENV_FILE")"

  cat >"$ENV_FILE" <<EOF
COMPOSE_PROJECT_NAME=${APP_NAME}
PUBLIC_HOST=${PUBLIC_HOST}
PUBLIC_PROTOCOL=${PUBLIC_PROTOCOL}
FRONTEND_PORT=${FRONTEND_PORT}
LARAVEL_BACKEND_PORT=${LARAVEL_BACKEND_PORT}
PHPMYADMIN_PORT=${PHPMYADMIN_PORT}
MYSQL_PORT=${MYSQL_PORT}
MYSQL_DATABASE=${MYSQL_DATABASE}
MYSQL_USER=${MYSQL_USER}
MYSQL_PASSWORD=${MYSQL_PASSWORD}
MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
JWT_SECRET=${JWT_SECRET}
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
CORS_ORIGIN=${CORS_ORIGIN}
VITE_API_URL=${VITE_API_URL}
DOCTOR_INVITE_REDIRECT_URL=${DOCTOR_INVITE_REDIRECT_URL}
EOF

  chmod 600 "$ENV_FILE" 2>/dev/null || true
}

wait_for_mysql() {
  log "Chờ MySQL khởi động"
  for attempt in $(seq 1 60); do
    if compose exec -T mysql mysqladmin ping -h 127.0.0.1 -uroot "-p${MYSQL_ROOT_PASSWORD}" --silent >/dev/null 2>&1; then
      echo "MySQL is ready."
      return 0
    fi
    sleep 5
  done

  compose logs mysql | tail -n 100 || true
  fail "MySQL không sẵn sàng sau 5 phút."
}

wait_for_http() {
  local url="$1"
  local name="$2"

  for attempt in $(seq 1 30); do
    if curl -fsSL "$url" >/dev/null 2>&1; then
      echo "$name OK: $url"
      return 0
    fi
    sleep 3
  done

  warn "$name chưa phản hồi tại $url"
  return 1
}

deploy_stack() {
  log "Build và chạy toàn bộ services"
  compose up -d --build
}

show_summary() {
  local frontend_url="${PUBLIC_PROTOCOL}://${PUBLIC_HOST}"
  local laravel_url="${PUBLIC_PROTOCOL}://${PUBLIC_HOST}:${LARAVEL_BACKEND_PORT}"
  local phpmyadmin_url="${PUBLIC_PROTOCOL}://${PUBLIC_HOST}:${PHPMYADMIN_PORT}"

  cat <<EOF

============================================================
✅ Deploy hoàn tất
============================================================
Frontend   : ${frontend_url}
Laravel    : ${laravel_url}
phpMyAdmin : ${phpmyadmin_url}
MySQL      : 127.0.0.1:${MYSQL_PORT} (bind local only)

Thông tin cấu hình đã lưu tại:
  ${ENV_FILE}

Lệnh hữu ích:
  ${SUDO} docker compose --env-file ${ENV_FILE} -f ${COMPOSE_FILE} ps
  ${SUDO} docker compose --env-file ${ENV_FILE} -f ${COMPOSE_FILE} logs -f laravel-backend
  ${SUDO} docker compose --env-file ${ENV_FILE} -f ${COMPOSE_FILE} restart
============================================================
EOF
}

main() {
  if [[ "$INSTALL_DOCKER" -eq 1 ]]; then
    install_docker
  fi

  write_env_file
  configure_firewall
  deploy_stack
  wait_for_mysql

  wait_for_http "http://127.0.0.1:${LARAVEL_BACKEND_PORT}/internal/health" "Laravel"
  wait_for_http "http://127.0.0.1:${FRONTEND_PORT}/" "Frontend"
  wait_for_http "http://127.0.0.1:${PHPMYADMIN_PORT}/" "phpMyAdmin"

  compose ps
  show_summary
}

main "$@"
