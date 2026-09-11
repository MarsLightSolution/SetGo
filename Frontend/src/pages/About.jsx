import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ShieldCheck, MapPin, FileText, Users } from "lucide-react"

export default function About() {
  const { t } = useTranslation()

  const features = [
    { icon: ShieldCheck, title: t("about.featureBuyerProtectionTitle"), desc: t("about.featureBuyerProtectionDesc") },
    { icon: Users, title: t("about.featureForEveryoneTitle"), desc: t("about.featureForEveryoneDesc") },
    { icon: FileText, title: t("about.featureWideCategoriesTitle"), desc: t("about.featureWideCategoriesDesc") },
  ]

  const bottomLinks = [
    { to: "/privacy-policy", label: t("footer.privacyPolicy") },
    { to: "/refund-policy", label: t("footer.refundPolicy") },
    { to: "/contact", label: t("about.contactUsLabel") },
  ]

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <div className="bg-gradient-to-br from-green-700 to-green-500 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-4xl font-bold mb-4">{t("about.heroTitle")}</h1>
          <p className="text-green-100 text-lg max-w-2xl mx-auto">
            {t("about.heroSubtitle")}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">

        {/* What is SatGo */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-green-700" />
            </span>
            {t("about.whatIsTitle")}
          </h2>
          <p className="text-gray-600 leading-relaxed">
            {t("about.whatIsP1")}
          </p>
          <p className="text-gray-600 leading-relaxed mt-4">
            {t("about.whatIsP2")}
          </p>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Icon className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-500">{desc}</p>
            </div>
          ))}
        </div>

        {/* Administration */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-4 h-4 text-green-700" />
            </span>
            {t("about.administrationTitle")}
          </h2>
          <p className="text-gray-600 leading-relaxed mb-5">
            {t("about.administrationDesc")}
          </p>
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 space-y-3 text-sm">
            <div className="flex flex-col sm:flex-row sm:gap-6 gap-1">
              <span className="font-semibold text-gray-700 sm:w-52 shrink-0">{t("company.nameLabel")}</span>
              <span className="text-gray-600">{t("company.name")}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:gap-6 gap-1">
              <span className="font-semibold text-gray-700 sm:w-52 shrink-0">{t("company.taxIdLabel")}</span>
              <span className="text-gray-600">{t("company.taxId")}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:gap-6 gap-1">
              <span className="font-semibold text-gray-700 sm:w-52 shrink-0">{t("company.addressLabel")}</span>
              <span className="text-gray-600 whitespace-pre-line">{t("company.address")}</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-5">
            {t("about.ipRightsNote")}
          </p>
        </div>

        {/* Bottom links */}
        <div className="flex flex-wrap gap-3 justify-center pb-4">
          {bottomLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="px-5 py-2 rounded-full border border-green-600 text-green-700 text-sm font-medium hover:bg-green-600 hover:text-white transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>

      </div>
    </div>
  )
}
