# 11 - State transitions

| Entity | Current state | Action | Next state | Condition/source |
|---|---|---|---|---|
| User | any | login | unchanged | phải `active`; `auth.controller.js` |
| Refresh token | active | refresh | old revoked, new active | token valid và chưa expired |
| Refresh token | revoked | refresh attempt | mọi active token của user bị revoked | reuse detection |
| Appointment | none | book | `scheduled` | patient booking |
| Appointment | scheduled/confirmed/etc | status update | request `status` | admin/doctor/owner route |
| Appointment | scheduled/confirmed/etc | cancel | `cancelled` | trước giờ hẹn hơn 2 giờ |
| Appointment payment | unpaid/null | mock pay | paid | owning patient, chưa paid |
| Recurring appointment | active | cancel child/all | child/all cancelled | recurring child controller |
| Consultation | none | create | pending | patient request |
| Consultation | pending | doctor response | in_progress | doctor responds, complete false |
| Consultation | pending/in_progress | doctor complete response | completed | doctor responds, complete true |
| Consultation | completed | reopen | in_progress | doctor/admin only |
| AI request | none | request analysis | processing | valid consultation image |
| AI request | processing | FastAPI success | completed | result inserted |
| AI request | processing | FastAPI failure | failed | error message saved |
| AI result | pending_review/other | doctor review | approved/approved_watch/not_standard/revoked | valid review status |
| AI result | approved/approved_watch | review | shared_with_patient=1 | patient visible |
| Prescription | none | create | draft | doctor và valid items |
| Prescription | draft | update | draft | owner doctor |
| Prescription | draft | issue | issued | owner doctor |
| Prescription | draft/issued | cancel | cancelled | owner doctor, chưa cancelled |
| Payment order | pending | confirm before expiry | paid | authenticated owner/token |
| Payment order | pending | confirm after expiry | expired | confirm marks expired |
| Provider subscription | missing/existing | activate/confirm payment | active | valid plan/scope |

Các status values cũng xuất hiện trong DB enum và cần được reproduce đúng trong Laravel migrations hoặc enum casts nếu có dùng.

