# External integrations

| Integration | Existing contract | Laravel parity target |
|---|---|---|
| Google OAuth | `POST /auth/google`; Google ID token verified with `GOOGLE_CLIENT_ID` | retain Google token verification and account creation behavior |
| SMTP | Nodemailer uses `SMTP_HOST/PORT/USER/PASS/FROM`; only appointment reminder directly calls `sendMail` in current source | Laravel mail transport only when porting reminder; doctor invite and password reset currently do not call SMTP |
| Image processing | `ai.service.js` calls `${IMAGE_PROCESSING_URL}/api/v1/preprocess` and retrieves jobs/results, uses `INTERNAL_API_KEY`; sends multipart image data | Laravel HTTP client with same headers, multipart fields, paths, timeout/error semantics; do not rewrite FastAPI |
| Local uploads | Multer writes `backend/public/uploads`; Express serves it at `/public` and AI subsequently reads files | initially retain a compatible local disk/volume and externally visible URLs; path mapping needs fixture verification |
| Payments | subscription confirmation is simulated/token-based, no real gateway/webhook found | retain simulated flow; do not invent gateway/callback |
| Video | frontend has Jitsi dependency and dump has video table, but no backend route/controller found | UNVERIFIED_BACKEND_FEATURE; do not infer backend contract |

Docker separates image upload/result volumes from backend upload volume. The FastAPI service has its own `holora_image_processing_db`; it is not the Laravel application database.
