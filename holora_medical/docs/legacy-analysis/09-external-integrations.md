# 09 - External integrations

| Integration | Mục đích | Called from | Config | Failure handling |
|---|---|---|---|---|
| Google OAuth | Login/register bằng Google ID token | `auth.controller.js` `googleAuth` | `GOOGLE_CLIENT_ID` | trả 400/401/500 tùy missing config/token/DB |
| SMTP/Nodemailer | Email utility và appointment reminders | `email.util.js`, `appointmentReminder.job.js`, doctor invite flow | SMTP env vars trong `.env` | lỗi bubble/log tùy caller |
| FastAPI image service | Medical image preprocessing | `ai.service.js` | `IMAGE_PROCESSING_URL`, `INTERNAL_API_KEY` | cập nhật request status failed khi catch |
| Local filesystem | Upload attachments và input ảnh cho AI | `upload.controller.js`, `consultation.controller.js`, `ai.service.js` | `backend/public/uploads`, Docker volume | thiếu file sẽ throw AI integration error |
| Jitsi frontend SDK | Video consultation UI | frontend dependency | frontend env/config | backend route support chưa rõ |
| Payment gateway | Chưa có thật. Payment subscription hiện là simulated token confirmation | `subscription.controller.js` | none | app-level status checks |

Không thấy SMS, S3, Redis, message broker, hoặc real webhook callback route.

