# 14 - Checklist migration

- [x] Đã inventory routes
- [x] Đã inventory APIs
- [x] Đã xác định business features
- [x] Đã xác định business rules cho các core flow
- [x] Đã hiểu DB schema ở mức bảng/quan hệ
- [x] Đã xác định state transitions cho các entity chính
- [x] Đã hiểu authentication
- [x] Đã hiểu authorization ở mức role-code
- [x] Đã xác định background jobs
- [x] Đã xác định external integrations
- [x] Đã xác định transaction boundaries cho các flow quan trọng
- [x] Đã search cache behavior
- [x] Đã xác định file handling
- [x] Đã search raw SQL
- [x] Đã search external HTTP calls
- [x] Đã search queue/event usage
- [x] Đã search TODO/FIXME
- [ ] Verify production DB schema với live DB
- [ ] Resolve mismatch `scheduled_at` vs `start_time/end_time` của appointment
- [ ] Verify yêu cầu payment gateway
- [ ] Verify email provider/reset-password behavior trên production
- [ ] Quyết định idempotency cho reminder
- [ ] Verify product intent về permission-code enforcement
- [ ] Verify tables và retention policy của image-processing service

## Tóm tắt

ANALYSIS STATUS: ĐỦ LÀM DISCOVERY BASELINE, CHƯA ĐỦ LÀM IMPLEMENTATION SPEC.

MODULES: đã xác định 22 module trải trên backend, frontend API services và image-processing.

FEATURES: đã inventory hơn 25 nhóm feature.

APIS: route inventory đã được gom theo module trong `05-api-inventory.md`.

DB TABLES: 35 bảng từ `holora_medical.sql`, cộng thêm migration `emr_record`.

BACKGROUND JOBS: appointment reminder script và AI async flow chạy trong process.

EXTERNAL INTEGRATIONS: Google OAuth, SMTP/Nodemailer, FastAPI image-processing, local disk upload, Jitsi frontend dependency.

BUSINESS RULES: core rules đã được trích xuất trong `10-business-rules.md`.

MIGRATION RISKS: các high-risk item nằm trong `12-migration-risks.md`.

UNKNOWN ITEMS: production schema, payment/email flow thật, scheduler registration, permission intent, và migration conflict.

FINAL VERDICT: NOT_READY_FOR_LARAVEL_MIGRATION.
