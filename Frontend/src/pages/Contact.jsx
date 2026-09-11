import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { MapPin, Mail, Phone, Clock, FileText, ShieldCheck } from "lucide-react"

const SUPPORT_PHONE = "+994 50 545 86 52"
const SUPPORT_PHONE_TEL = "+994505458652"
const SUPPORT_EMAIL = "info@satgo.az"

export default function Contact() {
  const { t } = useTranslation()

  const helpfulLinks = [
    { to: "/about", icon: ShieldCheck, label: t("contact.aboutLinkLabel") },
    { to: "/privacy-policy", icon: ShieldCheck, label: t("footer.privacyPolicy") },
    { to: "/refund-policy", icon: FileText, label: t("footer.refundPolicy") },
    { to: "/raise-query", icon: Mail, label: t("contact.submitQueryLabel") },
  ]

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <div className="bg-gradient-to-br from-green-700 to-green-500 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-4xl font-bold mb-4">{t("contact.heroTitle")}</h1>
          <p className="text-green-100 text-lg max-w-2xl mx-auto">
            {t("contact.heroSubtitle")}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">

        {/* Contact cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
            <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center mb-4">
              <Mail className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">{t("contact.emailSupportTitle")}</h3>
            <p className="text-sm text-gray-500 mb-3">
              {t("contact.emailSupportDesc")}
            </p>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-green-700 font-medium text-sm hover:underline"
            >
              {SUPPORT_EMAIL}
            </a>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
            <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center mb-4">
              <Phone className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">{t("contact.phoneTitle")}</h3>
            <p className="text-sm text-gray-500 mb-3">
              {t("contact.phoneDesc")}
            </p>
            <a
              href={`tel:${SUPPORT_PHONE_TEL}`}
              className="text-green-700 font-medium text-sm hover:underline"
            >
              {SUPPORT_PHONE}
            </a>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
            <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center mb-4">
              <MapPin className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">{t("contact.addressTitle")}</h3>
            <p className="text-sm text-gray-500 mb-3">
              {t("contact.addressDesc")}
            </p>
            <address className="text-sm text-gray-700 not-italic leading-relaxed whitespace-pre-line">
              {t("company.address")}
            </address>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
            <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center mb-4">
              <Clock className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">{t("contact.businessHoursTitle")}</h3>
            <p className="text-sm text-gray-500 mb-3">
              {t("contact.businessHoursDesc")}
            </p>
            <div className="text-sm text-gray-700 space-y-1">
              <p>{t("contact.hoursWeekday")}</p>
              <p>{t("contact.hoursSaturday")}</p>
              <p className="text-gray-400">{t("contact.hoursSunday")}</p>
            </div>
          </div>

        </div>

        {/* Company info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
          <h2 className="text-base font-bold text-gray-900 mb-4">{t("contact.companyInfoTitle")}</h2>
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 space-y-3 text-sm">
            <div className="flex flex-col sm:flex-row sm:gap-6 gap-1">
              <span className="font-semibold text-gray-700 sm:w-44 shrink-0">{t("company.nameLabel")}</span>
              <span className="text-gray-600">{t("company.name")}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:gap-6 gap-1">
              <span className="font-semibold text-gray-700 sm:w-44 shrink-0">{t("company.taxIdLabel")}</span>
              <span className="text-gray-600">{t("company.taxId")}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:gap-6 gap-1">
              <span className="font-semibold text-gray-700 sm:w-44 shrink-0">{t("company.jurisdictionLabel")}</span>
              <span className="text-gray-600">{t("company.jurisdiction")}</span>
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="bg-green-50 rounded-2xl border border-green-200 p-7">
          <h2 className="text-base font-bold text-gray-900 mb-4">{t("contact.helpfulLinksTitle")}</h2>
          <div className="flex flex-wrap gap-3">
            {helpfulLinks.map(({ to, icon: Icon, label }) => (
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

      </div>
    </div>
  )
}
