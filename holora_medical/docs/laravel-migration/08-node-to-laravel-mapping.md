# Node-to-Laravel mapping

| Node concern | Initial Laravel equivalent | Compatibility constraint |
|---|---|---|
| `server.js`/`app.js` | `public/index.php`, `routes/api.php`, module route files | retain path prefixes and ordering |
| Express controllers/raw mysql2 | controllers + small services; `DB` facade/Query Builder/raw SQL first | no premature Eloquent/schema redesign; retain raw SQL where joins/null/default behavior is sensitive |
| JWT middleware | custom HS256 JWT guard | same claims, statuses and errors |
| role/provider middleware | Laravel middleware + policy/service | query role codes and preserve entitlement scope behavior |
| Multer/local public path | configured local filesystem disk | retain multipart field and public URL/path behavior |
| `logAudit` | audit action/service | plural `audit_logs`, fire-and-forget timing NEED_VERIFY |
| AI Promise | compatibility action first; queued job only after approved semantics | return 202 and state transitions unchanged; do not silently add retry/recovery |
| reminder script | scheduled command + mail job | only after cadence/idempotency decision |
| Nodemailer | Laravel Mail | same SMTP configuration |
| Medical code utility | compatibility service | preserve prefixes, lookup and collision behavior |
| Provider middleware | middleware plus entitlement/ownership service | preserve scope order, trials, limits and bypass roles |
| Doctor invite | controller/action with token hash lookup | preserve 404/410 and current no-SMTP behavior |
| Video | no mapping | **UNVERIFIED_BACKEND_FEATURE**; no source route/controller |

The initial implementation should use compatibility adapters and database reads, not broad model generation. Each migrated route needs Node-versus-Laravel fixtures including status, JSON, relevant headers, DB effects and side effects.
