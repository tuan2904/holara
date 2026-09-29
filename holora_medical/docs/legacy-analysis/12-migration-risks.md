# 12 - Rủi ro migration

| Risk | Level | Current behavior | Source | Vì sao quan trọng |
|---|---|---|---|---|
| Business logic nằm trong raw SQL ở controllers | HIGH | validation, joins, role/ownership checks, status changes embedded trong controller | nhiều controller | Migration sang Laravel dễ miss implicit rules |
| Thiếu transaction ở multi-step writes | HIGH | auth register, prescription create/update, booking, subscription confirm ghi nhiều bảng không transaction | controllers | Thêm hoặc bỏ transaction đều có thể đổi behavior |
| Inconsistency schema appointment | HIGH | booking dùng `appointment_date/start_time/end_time`; reminder/cancellation dùng `scheduled_at` | appointment controller/job | Phải verify schema/behavior prod thật |
| Race condition khi booking | HIGH | SELECT overlap trước INSERT, không lock | appointment controller | Concurrent booking có thể double-book nếu không xử lý rõ |
| AI async không durable | HIGH | xử lý tiếp sau 202 bằng Promise trong process | ai controller | Nên chuyển queue job nhưng vẫn bảo toàn API contract |
| Payment là simulated | HIGH | không có gateway/webhook thật; confirm do client gọi | subscription controller | Laravel payment design cần product decision |
| Permission tables chưa enforce | MEDIUM | role middleware dùng role codes, không dùng permission codes | role middleware | Không nên overbuild permission nếu chưa verify |
| Hai audit tables | MEDIUM | tồn tại `audit_log` và `audit_logs` | SQL dump | Cần chọn canonical table |
| Assumption local file storage | MEDIUM | uploaded file path được mở lại từ disk cho AI | upload/AI service | Storage abstraction có thể làm gãy AI lookup |
| Reminder thiếu idempotency | MEDIUM | không có marker đã gửi reminder | reminder job | Scheduler có thể gửi email trùng |
| Provider entitlement logic ẩn trong middleware | MEDIUM | trial/free subscription checks trong provider middleware | provider.middleware.js | Cần map kỹ sang Laravel middleware/policies |
| Migration scripts conflict với dump | MEDIUM | table names và FK references khác nhau | migrations/sql, scripts/db | Cần schema baseline trước Laravel migrations |
| Reset email in console | LOW/HIGH tùy prod | reset link được in console, chưa gửi email thật | auth controller | Gap về security/UX nếu chạy production |

