import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Mail, Phone, MapPin } from "lucide-react"

const SUPPORT_EMAIL = "info@satgo.az"
const SUPPORT_PHONE = "+994 50 545 86 52"

// Section bodies are plain text with a tiny bit of markdown: [label](/path) for
// internal links (rendered as <Link>) and [label](mailto:...) / [label](https://...)
// for external ones. Everything else renders as-is, including literal "•" bullets
// and blank-line paragraph breaks, via whitespace-pre-line - same convention as
// PrivacyPolicy/RefundPolicy/ListingRulesComplaints.
function renderWithLinks(text) {
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g
  const parts = []
  let lastIndex = 0
  let match
  let key = 0

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index))
    const [, label, href] = match
    if (href.startsWith("mailto:") || href.startsWith("http")) {
      parts.push(
        <a
          key={key++}
          href={href}
          target={href.startsWith("http") ? "_blank" : undefined}
          rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
          className="text-green-700 underline"
        >
          {label}
        </a>
      )
    } else {
      parts.push(
        <Link key={key++} to={href} className="text-green-700 underline">
          {label}
        </Link>
      )
    }
    lastIndex = regex.lastIndex
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return parts
}

export default function TermsOfUse() {
  const { t } = useTranslation()
  const sections = t("termsOfUse.sections", { returnObjects: true })

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <div className="bg-gradient-to-br from-green-700 to-green-500 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-4xl font-bold mb-4">{t("termsOfUse.heroTitle")}</h1>
          <p className="text-green-100 text-lg max-w-2xl mx-auto">
            {t("termsOfUse.heroSubtitle")}
          </p>
          <p className="text-green-100 text-sm mt-3">
            {t("termsOfUse.effectiveDateLabel")}: {t("termsOfUse.effectiveDate")}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-5">

        {Array.isArray(sections) && sections.map((s) => (
          <div key={s.number}>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
              <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-3">
                <span className="w-7 h-7 bg-green-600 text-white text-xs font-bold rounded-lg flex items-center justify-center shrink-0">
                  {s.number}
                </span>
                {s.title}
              </h2>
              <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line pl-10">
                {s.number === "1" && (
                  <p className="mb-4">
                    {t("termsOfUse.operatedByPrefix")}{" "}
                    <span className="font-medium text-gray-800">{t("company.name")}</span>
                    {", "}{t("company.taxIdLabel")} {t("company.taxId")}.
                  </p>
                )}
                {renderWithLinks(s.body)}
              </div>
            </div>

            {/* Operator contact block, directly under section 1 */}
            {s.number === "1" && (
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 mt-3 text-sm space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-green-700 mt-0.5 shrink-0" />
                  <span className="text-gray-600 whitespace-pre-line">{t("company.address")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-green-700 shrink-0" />
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="text-gray-600 hover:text-green-700">
                    {SUPPORT_EMAIL}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-green-700 shrink-0" />
                  <a href={`tel:${SUPPORT_PHONE.replace(/\s+/g, "")}`} className="text-gray-600 hover:text-green-700">
                    {SUPPORT_PHONE}
                  </a>
                </div>
              </div>
            )}
          </div>
        ))}

        <p className="text-center text-xs text-gray-400 pb-4">
          {t("termsOfUse.lastUpdated")}
        </p>
      </div>
    </div>
  )
}
