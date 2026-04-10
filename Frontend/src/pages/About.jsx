import { Link } from "react-router-dom"
import { ShieldCheck, MapPin, FileText, Users } from "lucide-react"

export default function About() {
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <div className="bg-gradient-to-br from-green-700 to-green-500 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-4xl font-bold mb-4">About SatGo</h1>
          <p className="text-green-100 text-lg max-w-2xl mx-auto">
            Azerbaijan's trusted online marketplace connecting buyers and sellers across the country.
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
            What is SatGo?
          </h2>
          <p className="text-gray-600 leading-relaxed">
            SatGo is an online marketplace platform in Azerbaijan that enables users to buy and sell
            a wide range of goods and services. Through the platform, users can list and purchase
            vehicles, real estate, electronics, household items, and other permitted categories.
          </p>
          <p className="text-gray-600 leading-relaxed mt-4">
            Both private individuals and registered businesses may create listings and complete
            transactions through the platform. SatGo provides a secure transaction environment,
            including buyer protection for online payments, where funds may be temporarily held
            until transaction confirmation.
          </p>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            {
              icon: ShieldCheck,
              title: "Buyer Protection",
              desc: "Funds are held securely until the buyer confirms receipt of their order.",
            },
            {
              icon: Users,
              title: "For Everyone",
              desc: "Private individuals and businesses alike can list and buy on SatGo.",
            },
            {
              icon: FileText,
              title: "Wide Categories",
              desc: "Vehicles, real estate, electronics, household items, and more.",
            },
          ].map(({ icon: Icon, title, desc }) => (
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
            Administration
          </h2>
          <p className="text-gray-600 leading-relaxed mb-5">
            The platform is operated in accordance with the laws of the Republic of Azerbaijan.
          </p>
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 space-y-3 text-sm">
            <div className="flex flex-col sm:flex-row sm:gap-6 gap-1">
              <span className="font-semibold text-gray-700 sm:w-52 shrink-0">Company Name</span>
              <span className="text-gray-600">SATGO</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:gap-6 gap-1">
              <span className="font-semibold text-gray-700 sm:w-52 shrink-0">Tax ID (VÖEN)</span>
              <span className="text-gray-600">1301881282</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:gap-6 gap-1">
              <span className="font-semibold text-gray-700 sm:w-52 shrink-0">Registered Address</span>
              <span className="text-gray-600">
                AZ1052, Baku, Narimanov District,<br />
                Building 13, m.M1, m2, Azerbaijan
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-5">
            All intellectual property rights related to the platform are exclusively owned by SATGO.
          </p>
        </div>

        {/* Bottom links */}
        <div className="flex flex-wrap gap-3 justify-center pb-4">
          {[
            { to: "/privacy-policy", label: "Privacy Policy" },
            { to: "/refund-policy",  label: "Refund Policy" },
            { to: "/contact",        label: "Contact Us" },
          ].map(({ to, label }) => (
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
