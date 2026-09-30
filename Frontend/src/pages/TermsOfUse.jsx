import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ShieldCheck, FileText, MessageSquare } from "lucide-react"

export default function TermsOfUse() {
  const { t } = useTranslation()

  const policyLinks = [
    { to: "/refund-policy", icon: FileText, label: t("footer.refundPolicy") },
    { to: "/privacy-policy", icon: ShieldCheck, label: t("footer.privacyPolicy") },
    { to: "/listing-rules", icon: ShieldCheck, label: t("footer.listingRules") },
    { to: "/contact", icon: MessageSquare, label: t("footer.contact") },
  ]

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <div className="bg-gradient-to-br from-green-700 to-green-500 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-4xl font-bold mb-4">{t("termsOfUse.heroTitle")}</h1>
          <p className="text-green-100 text-lg max-w-2xl mx-auto">
            {t("termsOfUse.heroSubtitle")}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
          <p className="text-sm text-gray-600 leading-relaxed">{t("termsOfUse.intro")}</p>
        </div>

        <div className="bg-green-50 rounded-2xl border border-green-200 p-7">
          <h2 className="text-base font-bold text-gray-900 mb-4">{t("termsOfUse.linksTitle")}</h2>
          <div className="flex flex-wrap gap-3">
            {policyLinks.map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-green-200 rounded-full text-sm font-medium text-green-700 hover:bg-green-600 hover:text-white hover:border-green-600 transition-colors"
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            ))}
          </div>
        </div>

        <p className="text-sm text-gray-500 text-center">{t("termsOfUse.closingNote")}</p>

        <p className="text-center text-xs text-gray-400 pb-4">
          {t("termsOfUse.lastUpdated")}
        </p>
      </div>
    </div>
  )
}
