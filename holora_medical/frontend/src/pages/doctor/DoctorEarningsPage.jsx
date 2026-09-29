import { useEffect, useState } from "react";
import { earningsService } from "../../services/earningsService";
import { useTranslation } from "react-i18next";

const DoctorEarningsPage = () => {
  const { t } = useTranslation();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await earningsService.getDoctorEarningsHistory({ from, to });
        setHistory(data);
      } catch {
        setHistory([]);
      }
      setLoading(false);
    };
    fetchData();
  }, [from, to]);

  const total = history.reduce((sum, h) => sum + (h.amount || 0), 0);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">{t("doctor.earningsReport", { defaultValue: "Earnings Report" })}</h1>
      <div className="flex gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">{t("common.from", { defaultValue: "From" })}</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="input input-bordered" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t("common.to", { defaultValue: "To" })}</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="input input-bordered" />
        </div>
      </div>
      <div className="mb-4 font-semibold">
        {t("doctor.earningsTotal", { defaultValue: "Total Earnings" })}: <span className="text-cyan-600">{total.toLocaleString("vi-VN")} ₫</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border">
          <thead>
            <tr className="bg-slate-100">
              <th className="px-3 py-2 border">{t("common.date", { defaultValue: "Date" })}</th>
              <th className="px-3 py-2 border">{t("doctor.appointment", { defaultValue: "Appointment" })}</th>
              <th className="px-3 py-2 border">{t("doctor.amount", { defaultValue: "Amount" })}</th>
              <th className="px-3 py-2 border">{t("common.note", { defaultValue: "Note" })}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="text-center p-6">{t("common.loading", { defaultValue: "Loading..." })}</td></tr>
            ) : history.length === 0 ? (
              <tr><td colSpan={4} className="text-center p-6">{t("doctor.noEarnings", { defaultValue: "No earnings found" })}</td></tr>
            ) : history.map((h) => (
              <tr key={h.id}>
                <td className="px-3 py-2 border">{h.paid_at?.slice(0,10)}</td>
                <td className="px-3 py-2 border">{h.appointment_id}</td>
                <td className="px-3 py-2 border text-right">{h.amount?.toLocaleString("vi-VN")} ₫</td>
                <td className="px-3 py-2 border">{h.note || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DoctorEarningsPage;
