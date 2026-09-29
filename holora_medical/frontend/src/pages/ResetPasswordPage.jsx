import React, { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { resetPasswordApi } from "../services/authService";

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError("Token không hợp lệ hoặc bị thiếu trên URL.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Hai mật khẩu gõ lại không khớp nhau!");
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await resetPasswordApi({ token, new_password: newPassword });
      setMessage(res.message);
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi đổi mật khẩu mới.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center bg-[#FFF5F5] px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-[#E06666]">Đổi Mật Khẩu</h1>
          <p className="mt-2 text-sm text-gray-500">
            Hãy chắc chắn nhập mật khẩu mới đủ mạnh.
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

        {message ? (
          <div className="text-center">
            <p className="text-gray-600 mb-4">Đang tự động đưa bạn về trang đăng nhập...</p>
            <Link to="/login" className="font-semibold text-[#E06666] hover:underline">
              Về Đăng Nhập Ngay
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium">Mật khẩu mới</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="********"
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#E06666] focus:ring-2 focus:ring-[#F7CACA]"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Xác nhận mật khẩu</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="********"
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#E06666] focus:ring-2 focus:ring-[#F7CACA]"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full rounded-xl bg-[#E06666] py-3 font-semibold text-white transition hover:bg-[#d85a5a] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Đang xử lý..." : "Cập nhật mật khẩu"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
