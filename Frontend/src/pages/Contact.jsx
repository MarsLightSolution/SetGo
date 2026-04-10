import { Link } from "react-router-dom"
import { MapPin, Mail, Phone, Clock, FileText, ShieldCheck } from "lucide-react"

export default function Contact() {
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <div className="bg-gradient-to-br from-green-700 to-green-500 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-green-100 text-lg max-w-2xl mx-auto">
            Have a question or need support? We're here to help.
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
            <h3 className="font-bold text-gray-900 mb-1">Email Support</h3>
            <p className="text-sm text-gray-500 mb-3">
              Send us a message for account, listing, or payment queries.
            </p>
            <a
              href="mailto:support@satgo.az"
              className="text-green-700 font-medium text-sm hover:underline"
            >
              support@satgo.az
            </a>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
            <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center mb-4">
              <Phone className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Phone</h3>
            <p className="text-sm text-gray-500 mb-3">
              Reach our team during business hours for urgent matters.
            </p>
            <a
              href="tel:+994000000000"
              className="text-green-700 font-medium text-sm hover:underline"
            >
              +994 00 000 00 00
            </a>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
            <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center mb-4">
              <MapPin className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Address</h3>
            <p className="text-sm text-gray-500 mb-3">
              Our registered office in Baku, Azerbaijan.
            </p>
            <address className="text-sm text-gray-700 not-italic leading-relaxed">
              AZ1052, Baku, Narimanov District,<br />
              Building 13, m.M1, m2,<br />
              Azerbaijan
            </address>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
            <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center mb-4">
              <Clock className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Business Hours</h3>
            <p className="text-sm text-gray-500 mb-3">
              Our support team is available during these hours.
            </p>
            <div className="text-sm text-gray-700 space-y-1">
              <p>Monday – Friday: 09:00 – 18:00</p>
              <p>Saturday: 10:00 – 15:00</p>
              <p className="text-gray-400">Sunday: Closed</p>
            </div>
          </div>

        </div>

        {/* Company info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
          <h2 className="text-base font-bold text-gray-900 mb-4">Company Information</h2>
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 space-y-3 text-sm">
            <div className="flex flex-col sm:flex-row sm:gap-6 gap-1">
              <span className="font-semibold text-gray-700 sm:w-44 shrink-0">Company Name</span>
              <span className="text-gray-600">SATGO</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:gap-6 gap-1">
              <span className="font-semibold text-gray-700 sm:w-44 shrink-0">Tax ID (VÖEN)</span>
              <span className="text-gray-600">1301881282</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:gap-6 gap-1">
              <span className="font-semibold text-gray-700 sm:w-44 shrink-0">Jurisdiction</span>
              <span className="text-gray-600">Republic of Azerbaijan</span>
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="bg-green-50 rounded-2xl border border-green-200 p-7">
          <h2 className="text-base font-bold text-gray-900 mb-4">Helpful Links</h2>
          <div className="flex flex-wrap gap-3">
            {[
              { to: "/about",          icon: ShieldCheck, label: "About SatGo" },
              { to: "/privacy-policy", icon: ShieldCheck, label: "Privacy Policy" },
              { to: "/refund-policy",  icon: FileText,    label: "Refund Policy" },
              { to: "/raise-query",    icon: Mail,        label: "Submit a Query" },
            ].map(({ to, icon: Icon, label }) => (
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
