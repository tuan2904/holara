import React, { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPasswordApi } from "../services/authService";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const res = await forgotPasswordApi({ email });
      setMessage(res.message || "Kiểm tra Email để lấy đường link khôi phục mâtj khẩu (hoặc xem ở Terminal).");
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi gửi yêu cầu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center bg-[#FFF5F5] px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-[#E06666]">Lấy Lại Mật Khẩu</h1>
          <p className="mt-2 text-sm text-gray-500">
            Vui lòng nhập Email bạn đã dùng để đăng ký tài khoản.
          </p>
        </div>

        {message && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium">Email của bạn</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập email..."
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#E06666] focus:ring-2 focus:ring-[#F7CACA]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#E06666] py-3 font-semibold text-white transition hover:bg-[#d85a5a] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Đang xử lý..." : "Gửi Yêu Cầu"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Nhớ ra mật khẩu rồi?{" "}
          <Link to="/login" className="font-semibold text-[#E06666] hover:underline">
            Quay lại Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
