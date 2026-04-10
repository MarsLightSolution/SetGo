const sections = [
  {
    number: "1",
    title: "Platform Role",
    body: `SatGo acts solely as an intermediary platform between buyers and sellers. SatGo does not sell products and is not a party to sales transactions concluded between users.`,
  },
  {
    number: "2",
    title: "Private Sales",
    body: `For private sales conducted through the platform, SatGo does not issue refunds.\n\nAny refund agreements, cancellations, or disputes must be resolved directly between the buyer and the seller.`,
  },
  {
    number: "3",
    title: "Online Payments and Buyer Protection",
    highlight: true,
    body: `For transactions completed through online payment on the platform, buyer protection is provided.\n\nThe buyer's payment is temporarily held and released to the seller only after the buyer confirms receipt of the product.\n\nIf a dispute or unresolved issue arises before confirmation, the buyer and seller are expected to communicate directly through the platform in order to resolve the matter.\n\nDuring this period, the funds remain temporarily held until the matter is resolved between the parties.\n\nSatGo does not guarantee product quality, condition, authenticity, or delivery and is not responsible for fulfillment of transactions.`,
  },
  {
    number: "4",
    title: "Wallet and Deposited Funds",
    body: `SatGo may provide users with an internal wallet feature to deposit funds, make payments within the platform, and request withdrawals.\n\nFunds deposited into the user wallet are intended solely for use within the platform.\n\nThe SatGo wallet does not constitute a bank account, financial institution account, or payment account. Stored balances do not earn interest and are not insured.\n\nWithdrawal requests may be subject to identity verification, security checks, and fraud prevention procedures.`,
  },
  {
    number: "5",
    title: "Paid Platform Services",
    body: `Payments made for paid platform features, including listing promotions, visibility enhancements, boosts, or other activated services, are non-refundable once the service has been activated.`,
  },
]

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <div className="bg-gradient-to-br from-green-700 to-green-500 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-4xl font-bold mb-4">Refund Policy</h1>
          <p className="text-green-100 text-lg max-w-2xl mx-auto">
            Understand how refunds, cancellations, and buyer protection work on SatGo.
          </p>
        </div>
      </div>

      {/* Sections */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-5">
        {sections.map((s) => (
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
                  Buyer Protection
                </span>
              )}
            </h2>
            <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line pl-10">
              {s.body}
            </div>
          </div>
        ))}

        <p className="text-center text-xs text-gray-400 pb-4">
          Last updated: 2026 &mdash; SATGO, Tax ID (VÖEN) 1301881282
        </p>
      </div>
    </div>
  )
}
