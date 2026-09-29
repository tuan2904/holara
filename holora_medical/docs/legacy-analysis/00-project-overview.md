# 00 - Tổng quan dự án

## Stack

| Hạng mục | Kết luận | Dẫn chứng |
|---|---|---|
| Backend language/framework | Node.js CommonJS + Express | `backend/package.json`, `backend/server.js`, `backend/src/app.js` |
| Backend framework version | Express `^5.2.1` | `backend/package.json` |
| DB driver | `mysql2` pool, dùng raw SQL | `backend/src/config/db.js`, controllers |
| ORM | Backend chính không dùng ORM | Controllers dùng `db.query`; chỉ image service dùng SQLAlchemy |
| Frontend | React 19 + Vite 8 | `frontend/package.json` |
| Image service | Python FastAPI + SQLAlchemy async + OpenCV | `image-processing/requirements.txt`, `image-processing/app/main.py` |
| Package manager | npm cho frontend/backend, pip cho image service | `package-lock.json`, `requirements.txt` |
| Database | MySQL 8.0 | `docker/docker-compose.yml`, `holora_medical.sql` |
| Cache | Không thấy application cache; `lru_cache` chỉ dùng cho settings của image service | `image-processing/app/config.py` |
| Queue/message broker | Không thấy Redis/Bull/RabbitMQ | search toàn project |
| Auth | JWT access token + refresh token lưu DB | `auth.controller.js`, `auth.middleware.js` |
| Authorization | middleware kiểm tra role-code + ownership check rải trong controller | `role.middleware.js`, controllers |
| File storage | local disk dưới `backend/public/uploads`; Docker volume | `upload.controller.js`, `docker/docker-compose.yml` |
| External services | Google OAuth, SMTP, FastAPI image processing | `auth.controller.js`, `email.util.js`, `ai.service.js` |
| Scheduler/jobs | standalone appointment reminder script, chưa thấy scheduler trong app | `backend/src/jobs/appointmentReminder.job.js`, `README-appointment-reminder.md` |
| Logging | `console.*`, audit tables qua `logAudit` | `audit.util.js`, controllers |
| Tests | chỉ thấy security smoke scripts | `backend/scripts/tests/security-smoke.js`, `image-processing/tests/security_smoke.py` |
| CI/CD | Không thấy CI config | scan `rg --files` |
| Deployment | Docker compose và `deploy.sh` | `docker/docker-compose.yml`, `deploy.sh` |

## Entry points

- Backend: `backend/server.js` load `backend/src/app.js`.
- Frontend: `frontend/src/main.jsx`.
- Image service: `image-processing/app/main.py`.
- Database bootstrap: `docker/init-db.sql`, `holora_medical.sql`, migration scripts trong `backend/scripts/db` và `backend/migrations/sql`.

## Environment và config

- Backend đọc `backend/.env` bằng `dotenv.config({ path: path.resolve(__dirname, "../.env") })`.
- Backend bắt buộc có `JWT_SECRET`, độ dài tối thiểu 32.
- Docker bắt buộc có `MYSQL_ROOT_PASSWORD`, `MYSQL_PASSWORD`, `JWT_SECRET`, `INTERNAL_API_KEY`.
- Image service đọc `INTERNAL_API_KEY`, DB settings, debug settings.

## Unknown quan trọng

- Node/Python runtime version không pin trong `package.json`; Dockerfile cần được xem là source of truth cho runtime.
- SMTP credentials và email provider thật phụ thuộc env.
- Production payment gateway chưa implement; payment subscription hiện là token-confirm simulated flow.

