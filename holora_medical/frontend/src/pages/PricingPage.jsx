import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

const getPlans = (t) => [
  {
    code: "HOLORA_FREE",
    name: "Holora Free",
    priceLabel: t("pricing.free") || "Miễn phí",
    badge: null,
    description: t("pricing.freeDesc") || "Phù hợp cho phòng khám vừa khởi đầu",
    features: [
      { text: t("pricing.feature.branchLimit", { count: 3 }) || "Tối đa 3 chi nhánh", included: true },
      { text: t("pricing.feature.doctorLimit", { count: 3 }) || "Tối đa 3 bác sĩ / chi nhánh", included: true },
      { text: t("pricing.feature.appointments") || "Quản lý lịch hẹn", included: true },
      { text: t("pricing.feature.patientRecords") || "Hồ sơ bệnh nhân", included: true },
      { text: t("pricing.feature.basicTelehealth") || "Tư vấn trực tuyến cơ bản", included: true },
      { text: t("pricing.feature.unlimitedBranches") || "Chi nhánh không giới hạn", included: false },
      { text: t("pricing.feature.unlimitedDoctors") || "Bác sĩ không giới hạn", included: false },
    ],
    cta: t("pricing.cta.free") || "Đăng ký miễn phí",
    ctaVariant: "outline",
  },
  {
    code: "HOLORA_PLUS",
    name: "Holora Plus",
    priceLabel: "299.000 ₫",
    priceSuffix: t("pricing.perMonth") || "/ tháng",
    badge: t("pricing.popular") || "Phổ biến nhất",
    description: t("pricing.plusDesc") || "Dành cho chuỗi phòng khám muốn mở rộng không giới hạn",
    features: [
      { text: t("pricing.feature.unlimitedBranches") || "Chi nhánh không giới hạn", included: true },
      { text: t("pricing.feature.unlimitedDoctors") || "Bác sĩ không giới hạn", included: true },
      { text: t("pricing.feature.appointments") || "Quản lý lịch hẹn", included: true },
      { text: t("pricing.feature.patientRecords") || "Hồ sơ bệnh nhân", included: true },
      { text: t("pricing.feature.advancedTelehealth") || "Tư vấn trực tuyến nâng cao", included: true },
      { text: t("pricing.feature.analytics") || "Báo cáo & phân tích chi tiết", included: true },
      { text: t("pricing.feature.prioritySupport") || "Hỗ trợ ưu tiên 24/7", included: true },
    ],
    cta: t("pricing.cta.plus") || "Nâng cấp ngay",
    ctaVariant: "primary",
  },
];

const FAQS = [
  {
    question: "Tôi có thể nâng cấp bất kỳ lúc nào không?",
    answer:
      "Có. Bạn có thể nâng cấp từ Holora Free lên Holora Plus ngay trong trang quản lý tài khoản, không cần thao tác phức tạp.",
  },
  {
    question: "Dữ liệu của tôi có bị mất khi hết hạn gói Plus không?",
    answer:
      "Không. Dữ liệu luôn được giữ nguyên. Khi hết hạn, tài khoản sẽ tự động trở về giới hạn của gói Free. Các mục vượt giới hạn vẫn hiển thị nhưng không thể thêm mới.",
  },
  {
    question: "Phương thức thanh toán nào được hỗ trợ?",
    answer:
      "Hiện tại chúng tôi hỗ trợ chuyển khoản ngân hàng và ví điện tử. Hóa đơn sẽ được gửi qua email sau mỗi kỳ thanh toán.",
  },
];

const FeatureIcon = ({ included }) => (
  <span
    className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
      included
        ? "bg-emerald-500 text-white"
        : "bg-gray-200 text-gray-500 dark:bg-slate-700 dark:text-slate-400"
    }`}
  >
    {included ? "✓" : "–"}
  </span>
);

const PricingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const isVi = i18n.language === "vi";
  const plans = getPlans(t);

  const handleCta = (plan) => {
    if (plan.code === "HOLORA_FREE") {
      if (user) {
        navigate("/clinic-owner");
      } else {
        navigate("/register?type=provider");
      }
      return;
    }

    if (user) {
      navigate("/clinic-owner/subscription");
    } else {
      navigate("/register?type=provider");
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-140px)] overflow-hidden bg-white text-gray-900 dark:bg-[#0F141F] dark:text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-180px] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#E06666]/10 blur-3xl dark:bg-[#E06666]/12" />
        <div className="absolute bottom-[-120px] left-[-120px] h-[240px] w-[240px] rounded-full bg-[#F8C2C2]/30 blur-3xl dark:bg-[#402633]/35" />
        <div className="absolute bottom-[-100px] right-[-100px] h-[260px] w-[260px] rounded-full bg-[#FFDCD6]/30 blur-3xl dark:bg-[#28374E]/30" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center rounded-full border border-[#E06666]/25 bg-[#FFF5F5] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#C14D4D] dark:border-[#E06666]/35 dark:bg-[#2B1F28] dark:text-[#F3A3A3]">
            {t("pricing.title") || "Holora Pricing"}
          </p>

          <h1 className="mt-7 text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl dark:text-slate-100">
            {t("pricing.heroTitle") || "Simple, transparent pricing"}
          </h1>

          <p className="mt-4 text-base leading-7 text-gray-600 sm:text-lg dark:text-slate-400">
            {t("pricing.heroDesc") || "Start free, upgrade when you need to scale. No clutter, no unnecessary pricing tiers."}
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-5 lg:grid-cols-2">
          {plans.map((plan) => {
            const isFeatured = plan.code === "HOLORA_PLUS";

            return (
              <section
                key={plan.code}
                className={`relative flex min-h-[620px] flex-col rounded-[30px] border p-7 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg sm:p-8 ${
                  isFeatured
                    ? "border-[#E06666]/25 bg-[#FFF8F7] dark:border-[#E06666]/30 dark:bg-[#161E2B]"
                    : "border-gray-200 bg-white dark:border-slate-700 dark:bg-[#141B29]"
                }`}
              >
                {plan.badge && (
                  <div className="absolute right-6 top-6 rounded-full bg-[#E06666] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white shadow-sm">
                    {plan.badge}
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-[#C14D4D] dark:text-[#F29A9A]">
                    {plan.name}
                  </p>
                  <h2 className="mt-4 text-4xl font-semibold tracking-tight text-gray-900 dark:text-slate-100">
                    {plan.priceLabel}
                    {plan.priceSuffix && (
                      <span className="ml-2 text-base font-medium text-gray-500 dark:text-slate-400">
                        {plan.priceSuffix}
                      </span>
                    )}
                  </h2>
                  <p className="mt-3 max-w-md text-sm leading-6 text-gray-600 dark:text-slate-400">
                    {plan.description}
                  </p>
                </div>

                <div className="my-8 h-px bg-gray-200 dark:bg-slate-700" />

                <ul className="flex flex-1 flex-col gap-4">
                  {plan.features.map((feature) => (
                    <li key={feature.text} className="flex items-start gap-3 text-sm leading-6 text-gray-700 dark:text-slate-300">
                      <FeatureIcon included={feature.included} />
                      <span className={feature.included ? "" : "text-gray-400 dark:text-slate-500"}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => handleCta(plan)}
                  className={`mt-8 w-full rounded-2xl px-4 py-3.5 text-sm font-semibold transition ${
                    plan.ctaVariant === "primary"
                      ? "bg-[#E06666] text-white hover:bg-[#D55555]"
                      : "border border-gray-300 bg-white text-gray-800 hover:border-[#E06666]/40 hover:text-[#E06666] dark:border-slate-600 dark:bg-[#0F141F] dark:text-slate-100 dark:hover:border-[#E06666]/50 dark:hover:text-[#F29A9A]"
                  }`}
                >
                  {plan.cta}
                </button>
              </section>
            );
          })}
        </div>

        <div className="mx-auto mt-12 max-w-5xl rounded-[28px] border border-gray-200 bg-white p-7 shadow-sm dark:border-slate-700 dark:bg-[#141B29] sm:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-slate-100">
                {isVi ? "Câu hỏi thường gặp" : "Frequently asked questions"}
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-slate-400">
                {isVi
                  ? "Những điều quan trọng trước khi bạn chọn gói phù hợp cho phòng khám của mình."
                  : "The important details before choosing the right plan for your clinic."}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4">
            {FAQS.map((item) => (
              <article
                key={item.question}
                className="rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 dark:border-slate-700 dark:bg-[#0F141F]"
              >
                <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                  {item.question}
                </h4>
                <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-slate-400">
                  {item.answer}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
