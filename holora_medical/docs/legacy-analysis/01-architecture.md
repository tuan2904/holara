# 01 - Kiến trúc

## Kiến trúc runtime thực tế

```text
React/Vite client
  -> Axios API calls
  -> Express app (`backend/src/app.js`)
  -> Route module (`backend/src/routes/*.js`)
  -> Controller (`backend/src/controllers/*.js`)
  -> optional Service/Repository/Utils
  -> mysql2 raw SQL pool
  -> MySQL `holora_medical`

Luồng AI image:
Express AI controller
  -> `ai.service.js`
  -> HTTP multipart request
  -> FastAPI image-processing service
  -> OpenCV/Pillow processing
  -> image-processing DB tables + processed files
  -> Express lưu summary vào `ai_analysis_*`
```

## Shape của backend

Backend hiện thiên về route/controller. Service chỉ thấy rõ ở AI và recurring appointment; repository chỉ thấy ở recurring appointment creation. Phần lớn business logic, validation, ownership check, authorization phụ và SQL nằm trực tiếp trong controller.

Dẫn chứng:

- Mount route cấp app: `backend/src/app.js`.
- MySQL pool raw query: `backend/src/config/db.js`.
- Role middleware: `backend/src/middleware/role.middleware.js`.
- Controllers chứa SQL trực tiếp: `appointment.controller.js`, `auth.controller.js`, `consultation.controller.js`, `subscription.controller.js`, `prescription.controller.js`.

## Cross-cutting concerns

- Rate limiting: global limiter và auth limiter trong `app.js`.
- Error handling: có global `errorHandler`, nhưng đa số controller tự trả response lỗi inline.
- Audit: `logAudit` ghi audit record; mức độ sử dụng chưa đồng nhất giữa các feature.
- Static files: backend serve `/public` từ `backend/public`.

