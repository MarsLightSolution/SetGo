import { useTranslation } from "react-i18next"

export default function RefundPolicy() {
  const { t } = useTranslation()
  const sections = t("refundPolicy.sections", { returnObjects: true })

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <div className="bg-gradient-to-br from-green-700 to-green-500 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-4xl font-bold mb-4">{t("refundPolicy.heroTitle")}</h1>
          <p className="text-green-100 text-lg max-w-2xl mx-auto">
            {t("refundPolicy.heroSubtitle")}
          </p>
        </div>
      </div>

      {/* Sections */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-5">
        {Array.isArray(sections) && sections.map((s) => (
          <div
            key={s.number}
            className={`rounded-2xl border shadow-sm p-7 ${
              s.highlight
                ? "bg-green-50 border-green-200"
                : "bg-white border-gray-100"
            }`}
          >
            <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-3">
              <span className={`w-7 h-7 text-white text-xs font-bold rounded-lg flex items-center justify-center shrink-0 ${
                s.highlight ? "bg-green-700" : "bg-green-600"
              }`}>
                {s.number}
              </span>
              {s.title}
              {s.highlight && (
                <span className="ml-1 text-xs font-semibold text-green-700 bg-green-100 border border-green-200 px-2 py-0.5 rounded-full">
                  {t("refundPolicy.buyerProtectionBadge")}
                </span>
              )}
            </h2>
            <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line pl-10">
              {s.body}
            </div>
          </div>
        ))}

        <p className="text-center text-xs text-gray-400 pb-4">
          {t("refundPolicy.lastUpdated")}
        </p>
      </div>
    </div>
  )
}
