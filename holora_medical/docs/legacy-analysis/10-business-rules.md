# 10 - Business rules

| ID | Rule | Source/evidence |
|---|---|---|
| BR-AUTH-001 | Register `account_type=provider` map sang role `clinic_owner`; còn lại map sang `patient`. | `auth.controller.js` `register` |
| BR-AUTH-002 | Local login yêu cầu user active và bcrypt password đúng. | `auth.controller.js` `login` |
| BR-AUTH-003 | Google account không được đổi password qua endpoint local password. | `auth.controller.js` `changePassword` |
| BR-AUTH-004 | Refresh token reuse sẽ revoke mọi active session của user. | `auth.controller.js` `refreshToken` |
| BR-APPT-001 | Chỉ patient được book appointment. | `appointment.routes.js`, `appointment.controller.js` `bookAppointment` |
| BR-APPT-002 | Appointment bắt buộc có doctor, branch, date, start time và duration. | `appointment.controller.js` `_doBookAppointment` |
| BR-APPT-003 | Doctor phải được assign vào branch được chọn. | `appointment.controller.js` get slots và booking |
| BR-APPT-004 | Booking reject nếu overlap với appointment chưa cancelled/completed/no_show. | `appointment.controller.js` `_doBookAppointment` |
| BR-APPT-005 | Không cho cancel trong vòng 2 giờ trước giờ hẹn. | `appointment.controller.js` `updateAppointmentStatus` |
| BR-RECUR-001 | Recurring generated appointments default 6 tháng và tối đa 100 occurrences. | `recurringAppointment.service.js` |
| BR-CONSULT-001 | Consultation mới bắt buộc có chief complaint và symptoms. | `consultation.controller.js` `createConsultation` |
| BR-CONSULT-002 | Consultation creation tối đa 3 ảnh ban đầu. | `consultation.controller.js` `MAX_IMAGE_LIMIT` |
| BR-CONSULT-003 | Consultation response phải có content hoặc attachment và tối đa 5 attachments. | `consultation.controller.js` `addConsultationResponse` |
| BR-CONSULT-004 | Doctor response assign pending consultation cho doctor và chuyển status sang in_progress/completed. | `consultation.controller.js` `addConsultationResponse` |
| BR-CONSULT-005 | Chỉ consultation `completed` mới được reopen bởi doctor/admin. | `consultation.controller.js` `reopenConsultation` |
| BR-CONSULT-006 | Patient chỉ được xóa ảnh khi consultation còn pending và ảnh chưa gửi AI analysis. | `consultation.controller.js` `deleteConsultationImage` |
| BR-AI-001 | Patient chỉ thấy AI result khi doctor share. | `ai.controller.js` `getAIAnalysisForConsultation` |
| BR-AI-002 | AI review status phải thuộc `pending_review`, `approved`, `approved_watch`, `not_standard`, `revoked`. | `ai.controller.js` `reviewAIResult` |
| BR-AI-003 | Chỉ `approved` và `approved_watch` mới được share với patient. | `ai.controller.js` `reviewAIResult` |
| BR-RX-001 | Prescription bắt buộc có patient và ít nhất một medication có tên không rỗng. | `prescription.controller.js` `createPrescription` |
| BR-RX-002 | Chỉ owner doctor được update/issue/cancel prescription. | `prescription.controller.js` |
| BR-RX-003 | Prescription chỉ được update và issue khi đang `draft`. | `prescription.controller.js` |
| BR-SUB-001 | Free subscription plan không được tạo payment order. | `subscription.controller.js` `createPayment` |
| BR-SUB-002 | Payment order token hết hạn sau 15 phút. | `subscription.controller.js` `createPayment`, `confirmPayment` |
| BR-SUB-003 | Account-level subscription không có end date khi activate. | `subscription.controller.js` |
| BR-PAY-001 | Appointment mock payment chỉ được thực hiện bởi owning patient và chỉ một lần. | `payment.controller.js` |

