import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { JitsiMeeting } from "@jitsi/react-sdk";
import { appointmentService } from "../services/appointmentService";
import { useAuth } from "../context/AuthContext";
import ConfirmModal from "../components/ConfirmModal";

const VideoConsultationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const data = await appointmentService.getAppointmentById(id);
        setAppointment(data);
      } catch (err) {
        setError(
          err.response?.data?.message || "Không thể tải thông tin phòng khám"
        );
      } finally {
        setLoading(false);
      }
    };
    fetchAppointment();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-900 text-white">
        <div className="text-xl">Đang kết nối phòng khám...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="mb-4 text-3xl font-bold text-red-500">Opps!</div>
          <div className="text-lg">{error}</div>
          <button
            onClick={() => navigate(-1)}
            className="mt-6 rounded-lg bg-blue-600 px-6 py-2 hover:bg-blue-700"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  if (!appointment) return null;

  // Sử dụng app code làm tên phòng để đảm bảo tính duy nhất
  const roomName = `HoloraMedical_${appointment.appointment_code}`;

  return (
    <div className="relative h-screen w-full bg-gray-950">
      {/* Nút thoát */}
      <button
        onClick={() => setLeaveModalOpen(true)}
        className="absolute left-4 top-4 z-50 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-red-700"
      >
        Lùi lại & Thoát
      </button>

      {/* Jitsi Meeting Iframe */}
      <JitsiMeeting
        domain="meet.jit.si"
        roomName={roomName}
        configOverwrite={{
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          prejoinPageEnabled: true, // Cho phép trang chỉnh cam/mic trước khi vào
        }}
        interfaceConfigOverwrite={{
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
        }}
        userInfo={{
          displayName: user?.full_name || "Khách",
          email: user?.email || "",
        }}
        onApiReady={(_externalApi) => {
          // Gắn listener nếu cần
        }}
        getIFrameRef={(iframeRef) => {
          iframeRef.style.height = "100%";
          iframeRef.style.width = "100%";
        }}
      />

      <ConfirmModal
        isOpen={leaveModalOpen}
        title="Bạn có chắc chắn muốn rời phòng khám?"
        description="Phiên tư vấn video sẽ bị gián đoạn nếu bạn rời khỏi màn hình này ngay bây giờ."
        badgeLabel="Video Consultation"
        tone="danger"
        confirmLabel="Rời phòng khám"
        cancelLabel="Ở lại"
        closeLabel="Đóng"
        onConfirm={() => {
          setLeaveModalOpen(false);
          navigate(-1);
        }}
        onClose={() => setLeaveModalOpen(false)}
      />
    </div>
  );
};

export default VideoConsultationPage;
