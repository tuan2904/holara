import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { acceptDoctorInviteApi } from "../services/authService";

const DoctorInviteSetupPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("Missing invite token.");
      return;
    }

    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password confirmation does not match.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await acceptDoctorInviteApi({ token, password });
      setSuccess(res?.message || "Account setup completed. Please login.");

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to complete account setup.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] bg-[#FFF5F5] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-[#E06666] text-center">Doctor Account Setup</h1>
        <p className="text-sm text-gray-500 text-center mt-2">
          Set your password for first-time login
        </p>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm font-medium mb-1">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-[#E06666] focus:ring-2 focus:ring-[#F7CACA]"
              placeholder="Minimum 6 characters"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-[#E06666] focus:ring-2 focus:ring-[#F7CACA]"
              placeholder="Re-enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-[#E06666] text-white py-2.5 font-semibold hover:bg-[#D55555] transition disabled:opacity-70"
          >
            {submitting ? "Setting up..." : "Complete Setup"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DoctorInviteSetupPage;
