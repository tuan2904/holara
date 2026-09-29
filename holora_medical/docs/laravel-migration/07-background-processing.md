# Background processing contract

## CURRENT NODE BEHAVIOR

1. Appointment reminder is an independent executable Node script (`src/jobs/appointmentReminder.job.js`), not a registered Express scheduler: **NOT_REGISTERED_IN_APPLICATION**. An external cron/manual invocation must trigger it. It selects `confirmed` appointments with `scheduled_at` 2–24 hours ahead and sends SMTP mail sequentially to patients. There is no retry, queue, sent marker, idempotency key, transaction with mail, or duplicate prevention. A crash after a send can cause duplicate mail on the next invocation; a crash before later loop items leaves them unsent.
2. `POST /ai/analyze` inserts `ai_analysis_request(status=processing)`, returns `202`, then continues a Promise in the Node process. It calls FastAPI and marks the request completed/failed. This is asynchronous but not durable: no worker, retry policy, recovery scanner, lock, or idempotency key exists. A Node restart after 202 can lose the callback that writes Holora AI result. A duplicate request can create duplicate analysis requests. If `ai_analysis_result` insert fails, code logs and returns without changing the request from `processing`.
3. Recurring appointment children are generated synchronously during request processing.

FastAPI `/api/v1/preprocess` is **synchronous processing inside its HTTP request**: it persists a preprocessing job, runs OpenCV processing, persists result/status, then returns. It is not a FastAPI background job or queue.

## POTENTIAL LARAVEL DESIGN (not current contract)

Eventually map reminders to Scheduler plus queued mail and AI to a Job/Queue, retaining the immediate `202` AI response and existing database states. Do not enable those components until retry/idempotency policies are explicitly decided; they can otherwise change observable mail or processing behavior.

`NEED_VERIFY`: reminder query's use of `scheduled_at` conflicts with appointment booking fields, and no production cron cadence is defined.
