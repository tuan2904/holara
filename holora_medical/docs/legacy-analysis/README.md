# Mục lục phân tích legacy

TRẠNG THÁI PHÂN TÍCH: ĐÃ CÓ BASELINE PHỤC VỤ KHẢO SÁT MIGRATION, CHƯA ĐỦ ĐỂ IMPLEMENT. Source đã được rà trực tiếp trong `backend`, `frontend`, `image-processing`, SQL dump, migration, Docker và file deploy. Không sửa source code ứng dụng.

Bắt đầu đọc từ đây:

1. `00-project-overview.md` - stack, runtime, config, deployment.
2. `01-architecture.md` - luồng request thực tế và sơ đồ component.
3. `02-module-inventory.md` - module business/infrastructure/shared.
4. `03-feature-inventory.md` - danh sách feature trace từ routes/controllers/services.
5. `04-feature-flows.md` - flow end-to-end của các feature quan trọng.
6. `05-api-inventory.md` - API inventory theo module.
7. `06-database.md` - bảng, quan hệ, constraint, rủi ro schema.
8. `07-authentication-authorization.md` - JWT, refresh token, role, bảo vệ route.
9. `08-background-jobs.md` - cron/script và xử lý async.
10. `09-external-integrations.md` - Google OAuth, email, image service, file storage.
11. `10-business-rules.md` - business rule trích xuất kèm source evidence.
12. `11-state-transitions.md` - state transition cần bảo toàn.
13. `12-migration-risks.md` - rủi ro khi migration sang Laravel.
14. `13-laravel-mapping.md` - mapping khái niệm, chưa implementation.
15. `14-migration-checklist.md` - checklist readiness và unknowns.

Kết luận cuối: NOT_READY_FOR_LARAVEL_MIGRATION.

Lý do: các module lõi đã được nhận diện, nhưng vẫn cần verify một số behavior trước khi implement: flow email production, callback payment gateway, schema DB thực tế so với các migration lẫn lộn, lịch chạy reminder, ownership/schema của image-service DB, các transaction boundary còn thiếu, và ý đồ role/permission ngoài middleware kiểm tra role-code.
