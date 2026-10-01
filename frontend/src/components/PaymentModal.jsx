import { useState } from "react";
import subscriptionService from "../services/subscriptionService";

const PAYMENT_METHODS = [
  {
    id: "vnpay",
    label: "VNPAY",
    desc: "Thẻ ATM / VISA / MasterCard / QR Code",
    color: "#005BAC",
    bg: "#EBF4FF",
  },
  {
    id: "momo",
    label: "MoMo",
    desc: "Ví điện tử MoMo",
    color: "#A50064",
    bg: "#FFF0F9",
  },
  {
    id: "zalopay",
    label: "ZaloPay",
    desc: "Ví điện tử ZaloPay",
    color: "#007AFF",
    bg: "#EBF5FF",
  },
  {
    id: "bank_transfer",
    label: "Ngân hàng",
    desc: "Chuyển khoản ngân hàng nội địa",
    color: "#059669",
    bg: "#F0FDF4",
  },
];

// plan: { code, name, price_cents, currency }
// months: number (default 1)
// onSuccess: () => void  — called after successful payment + subscription activation
// onClose: () => void
const PaymentModal = ({ plan, months = 1, onSuccess, onClose }) => {
  const [step, setStep] = useState("summary"); // summary | method | processing | success | error
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  // price_cents stored as full VND (e.g. 299000 = 299,000 ₫)
  const totalVnd = plan.price_cents * months;
  const totalLabel = totalVnd.toLocaleString("vi-VN") + " ₫";

  const handlePay = async () => {
    if (!selectedMethod) return;
    setStep("processing");
    setErrorMsg("");

    try {
      // 1. Create payment order → get one-time token
      const orderRes = await subscriptionService.createPayment({
        plan_code: plan.code,
        scope_type: "account",
        months,
        payment_method: selectedMethod,
      });
      const { token } = orderRes.data;

      // 2. Simulate gateway redirect / processing delay
      await new Promise((r) => setTimeout(r, 2000));

      // 3. Confirm payment → activates subscription
      await subscriptionService.confirmPayment({ token });

      setStep("success");
    } catch (err) {
      setErrorMsg(
        err?.response?.data?.message || "Thanh toán thất bại. Vui lòng thử lại."
      );
      setStep("error");
    }
  };

  const handleOverlayClick = (e) => {
    if (step === "processing") return; // block dismiss while processing
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="pm-overlay" onClick={handleOverlayClick}>
      <div className="pm-modal" role="dialog" aria-modal="true">
        <p role="note" className="p-4 text-sm font-semibold text-amber-700 bg-amber-50">MÔ PHỎNG ĐỒ ÁN: Không kết nối cổng thanh toán, không thu tiền thật. Chỉ hoạt động khi máy chủ bật chế độ demo.</p>
        {/* ── Header ── */}
        <div className="pm-header">
          <span className="pm-header__title">
            {step === "summary"    && "Xác nhận đơn hàng"}
            {step === "method"     && "Chọn phương thức thanh toán"}
            {step === "processing" && "Đang xử lý..."}
            {step === "success"    && "Thanh toán thành công"}
            {step === "error"      && "Thanh toán thất bại"}
          </span>
          {step !== "processing" && (
            <button
              type="button"
              className="pm-header__close"
              onClick={onClose}
              aria-label="Đóng"
            >
              ×
            </button>
          )}
        </div>

        {/* ── Step: summary ── */}
        {step === "summary" && (
          <div className="pm-body">
            <div className="pm-order-summary">
              <div className="pm-order-row">
                <span>Gói dịch vụ</span>
                <strong>{plan.name}</strong>
              </div>
              <div className="pm-order-row">
                <span>Thời hạn</span>
                <strong>{months} tháng</strong>
              </div>
              <div className="pm-order-row pm-order-row--total">
                <span>Tổng thanh toán</span>
                <strong className="pm-total-price">{totalLabel}</strong>
              </div>
            </div>
            <p className="pm-note">
              Sau khi thanh toán, gói <b>{plan.name}</b> sẽ được kích hoạt ngay
              lập tức cho tài khoản của bạn và có hiệu lực trong {months} tháng.
            </p>
            <div className="pm-footer">
              <button type="button" className="pm-btn pm-btn--sec" onClick={onClose}>
                Hủy
              </button>
              <button
                type="button"
                className="pm-btn pm-btn--pri"
                onClick={() => setStep("method")}
              >
                Tiếp tục →
              </button>
            </div>
          </div>
        )}

        {/* ── Step: method selection ── */}
        {step === "method" && (
          <div className="pm-body">
            <div className="pm-methods">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`pm-method${selectedMethod === m.id ? " pm-method--sel" : ""}`}
                  style={
                    selectedMethod === m.id
                      ? { borderColor: m.color, background: m.bg }
                      : {}
                  }
                  onClick={() => setSelectedMethod(m.id)}
                >
                  <span
                    className="pm-method__logo"
                    style={{ background: m.color }}
                  >
                    {m.label}
                  </span>
                  <span className="pm-method__desc">{m.desc}</span>
                  {selectedMethod === m.id && (
                    <span className="pm-method__check">✓</span>
                  )}
                </button>
              ))}
            </div>
            <div className="pm-footer">
              <button
                type="button"
                className="pm-btn pm-btn--sec"
                onClick={() => setStep("summary")}
              >
                ← Quay lại
              </button>
              <button
                type="button"
                className="pm-btn pm-btn--pri"
                onClick={handlePay}
                disabled={!selectedMethod}
              >
                Thanh toán {totalLabel}
              </button>
            </div>
          </div>
        )}

        {/* ── Step: processing ── */}
        {step === "processing" && (
          <div className="pm-body pm-body--center">
            <div className="pm-spinner" aria-label="loading" />
            <p className="pm-proc-text">Đang mô phỏng xác nhận thanh toán...</p>
            <p className="pm-proc-sub">Vui lòng không đóng cửa sổ này</p>
          </div>
        )}

        {/* ── Step: success ── */}
        {step === "success" && (
          <div className="pm-body pm-body--center">
            <div className="pm-result-icon pm-result-icon--ok" aria-hidden="true">
              ✓
            </div>
            <h3 className="pm-result-title">Thanh toán thành công!</h3>
            <p className="pm-result-sub">
              Gói <b>{plan.name}</b> đã được kích hoạt
            </p>
            <button
              type="button"
              className="pm-btn pm-btn--pri pm-btn--full"
              onClick={onSuccess}
            >
              Hoàn tất
            </button>
          </div>
        )}

        {/* ── Step: error ── */}
        {step === "error" && (
          <div className="pm-body pm-body--center">
            <div className="pm-result-icon pm-result-icon--err" aria-hidden="true">
              ✕
            </div>
            <h3 className="pm-result-title">Thanh toán thất bại</h3>
            <p className="pm-result-sub">{errorMsg}</p>
            <div className="pm-footer pm-footer--center">
              <button
                type="button"
                className="pm-btn pm-btn--sec"
                onClick={onClose}
              >
                Hủy
              </button>
              <button
                type="button"
                className="pm-btn pm-btn--pri"
                onClick={() => {
                  setStep("method");
                  setErrorMsg("");
                }}
              >
                Thử lại
              </button>
            </div>
          </div>
        )}

        <style>{`
          .pm-overlay {
            position: fixed; inset: 0;
            background: rgba(0, 0, 0, 0.55);
            display: flex; align-items: center; justify-content: center;
            z-index: 9999; padding: 16px;
          }
          .pm-modal {
            background: #fff; border-radius: 20px;
            width: 100%; max-width: 440px;
            box-shadow: 0 24px 64px rgba(0, 0, 0, 0.22);
            overflow: hidden; animation: pm-slide-up .2s ease;
          }
          @keyframes pm-slide-up {
            from { opacity: 0; transform: translateY(20px); }
            to   { opacity: 1; transform: translateY(0); }
          }

          /* Header */
          .pm-header {
            display: flex; align-items: center; justify-content: space-between;
            padding: 20px 24px 16px;
            border-bottom: 1px solid #f1f5f9;
          }
          .pm-header__title { font-size: 17px; font-weight: 700; color: #1e293b; }
          .pm-header__close {
            background: none; border: none; cursor: pointer;
            font-size: 24px; color: #94a3b8; line-height: 1; padding: 0 4px;
            transition: color .15s;
          }
          .pm-header__close:hover { color: #475569; }

          /* Body */
          .pm-body { padding: 24px; }
          .pm-body--center {
            display: flex; flex-direction: column;
            align-items: center; text-align: center;
            gap: 14px; padding: 36px 24px;
          }

          /* Order summary */
          .pm-order-summary {
            background: #f8fafc; border-radius: 12px;
            padding: 16px; margin-bottom: 16px;
            display: flex; flex-direction: column; gap: 10px;
          }
          .pm-order-row {
            display: flex; justify-content: space-between;
            font-size: 14px; color: #374151;
          }
          .pm-order-row--total {
            padding-top: 12px; margin-top: 4px;
            border-top: 1px dashed #e2e8f0; font-size: 15px;
          }
          .pm-total-price { font-size: 21px; font-weight: 800; color: #4f46e5; }

          .pm-note {
            font-size: 13px; color: #64748b;
            margin: 0 0 20px; line-height: 1.6;
          }

          /* Payment methods */
          .pm-methods {
            display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px;
          }
          .pm-method {
            display: flex; align-items: center; gap: 12px;
            background: #f8fafc; border: 2px solid #e2e8f0;
            border-radius: 12px; padding: 12px 14px;
            cursor: pointer; transition: border-color .15s, background .15s;
            text-align: left; width: 100%;
          }
          .pm-method--sel { box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15); }
          .pm-method__logo {
            flex-shrink: 0; min-width: 76px; padding: 6px 8px;
            border-radius: 8px; font-size: 11px; font-weight: 800;
            text-align: center; letter-spacing: 0.4px; color: #fff;
          }
          .pm-method__desc { flex: 1; font-size: 13px; color: #374151; }
          .pm-method__check { color: #4f46e5; font-weight: 700; font-size: 18px; }

          /* Processing spinner */
          .pm-spinner {
            width: 52px; height: 52px;
            border: 4px solid #e2e8f0; border-top-color: #6366f1;
            border-radius: 50%; animation: pm-spin 0.85s linear infinite;
          }
          @keyframes pm-spin { to { transform: rotate(360deg); } }
          .pm-proc-text { font-size: 15px; font-weight: 600; color: #1e293b; margin: 4px 0 0; }
          .pm-proc-sub  { font-size: 13px; color: #94a3b8; margin: 0; }

          /* Result icons */
          .pm-result-icon {
            width: 68px; height: 68px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: 30px; font-weight: 700;
          }
          .pm-result-icon--ok  { background: #dcfce7; color: #15803d; }
          .pm-result-icon--err { background: #fee2e2; color: #b91c1c; }
          .pm-result-title { font-size: 18px; font-weight: 700; color: #1e293b; margin: 0; }
          .pm-result-sub   { font-size: 14px; color: #64748b; margin: 0; }

          /* Footer */
          .pm-footer { display: flex; gap: 10px; }
          .pm-footer--center { justify-content: center; }

          /* Buttons */
          .pm-btn {
            flex: 1; padding: 11px 0; border-radius: 10px;
            font-size: 14px; font-weight: 600; cursor: pointer;
            transition: opacity .15s, background .15s; border: none;
          }
          .pm-btn--full { width: 100%; flex: none; }
          .pm-btn--pri  {
            background: linear-gradient(90deg, #3b82f6, #6366f1);
            color: #fff;
          }
          .pm-btn--pri:hover    { opacity: 0.9; }
          .pm-btn--pri:disabled { opacity: 0.5; cursor: not-allowed; }
          .pm-btn--sec {
            background: #f1f5f9; color: #475569;
            border: 1.5px solid #e2e8f0;
          }
          .pm-btn--sec:hover { background: #e2e8f0; }
        `}</style>
      </div>
    </div>
  );
};

export default PaymentModal;
