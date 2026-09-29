# 08 - Background jobs

## Appointment reminder

```text
External cron / manual command
  -> node backend/src/jobs/appointmentReminder.job.js
  -> SELECT confirmed appointments scheduled in next 2-24 hours
  -> sendMail to patient
```

Dẫn chứng: `backend/src/jobs/appointmentReminder.job.js`, `backend/README-appointment-reminder.md`.

Ghi chú quan trọng:

- Không thấy cron registration bên trong Node app.
- Không thấy retry table, queue, hoặc idempotency marker.
- Comment nói lấy appointment "haven't been reminded", nhưng query/write không có flag reminded.
- Query dùng `scheduled_at`; booking ghi `appointment_date`, `start_time`, `end_time`.

## AI async processing

```text
POST /ai/analyze
  -> insert ai_analysis_request(status=processing)
  -> respond 202
  -> Promise call to FastAPI service
  -> insert ai_analysis_result
  -> update request completed/failed
```

Đây là async-after-response chạy trong Express process, không phải durable queue. Nếu Node process exit sau response 202, processing có thể bị mất.

## Recurring appointment generation

Recurring appointment creation chạy synchronous trong request. Service generate child `appointment` rows tối đa 100 occurrence hoặc default 6 tháng.

## Laravel mapping concern

Map reminder sang Laravel Scheduler + queued Mail. Map AI processing sang Laravel Job/Queue có retry và idempotency. Cần bảo toàn API contract hiện tại là trả 202 ngay.

