# 13 - Mapping legacy sang Laravel

Chỉ là mapping khái niệm. Chưa bắt đầu Laravel implementation.

| Current | Laravel target |
|---|---|
| `backend/src/app.js` route mounting | `routes/api.php` và route groups |
| Express route files | Laravel route groups theo module |
| Controllers chứa raw SQL | Controllers + Services/Actions; di chuyển raw SQL từ từ |
| `mysql2` pool | Laravel DB facade/Eloquent ở nơi an toàn |
| `auth.middleware.js` | Sanctum/JWT middleware hoặc custom guard tùy token strategy |
| `role.middleware.js` | Laravel middleware/policies dùng role codes |
| Provider entitlement middleware | Laravel middleware/policies/service |
| `logAudit` utility | Audit service/model observer/event listener |
| Multer uploads | Laravel filesystem disk, vẫn phải bảo toàn nhu cầu local path cho AI |
| AI Promise async | Laravel queued Job, giữ response 202 |
| Reminder script | Laravel Scheduler + queued Mail |
| `sendMail` nodemailer | Laravel Mail |
| `payment_order` simulated confirm | Laravel payment service; gateway webhook nếu product xác nhận |
| SQL migration scripts/dump | Laravel migrations sau khi chốt schema baseline |
| React frontend | Có thể giữ app Vite riêng gọi Laravel API |
| FastAPI image service | Giữ external microservice hoặc thay sau |

Recommended migration sequence:

1. Freeze và verify DB schema baseline từ production dump.
2. Port auth/token model và role-code authorization trước.
3. Port CRUD modules, giữ raw DB query ở nơi behavior chưa rõ.
4. Port appointment/consultation/prescription flows kèm tests cho state transitions.
5. Chuyển async AI/reminders sang Laravel queue/scheduler sau khi bảo toàn API contract.
6. Quyết định payment gateway/callback design trước khi port subscription payment.

