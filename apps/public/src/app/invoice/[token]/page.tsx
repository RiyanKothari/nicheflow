import { notFound } from 'next/navigation';

export default function PublicInvoice({ params }: { params: { token: string } }) {
  const token = params.token;
  
  if (!token) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#F5F5F4] text-[#1C1917] font-sans py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl shadow-black/5 overflow-hidden border border-black/5">
          {/* Header */}
          <div className="px-8 py-10 md:px-12 md:py-12 bg-[#1C1917] text-[#FEF3C7] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-3xl font-bold font-serif mb-2">Invoice</h1>
              <p className="text-[#FEF3C7]/60">#{token.substring(0, 8).toUpperCase()}</p>
            </div>
            <div className="text-left md:text-right">
              <p className="font-bold text-xl mb-1">Business Name</p>
              <p className="text-[#FEF3C7]/60 text-sm">contact@business.com</p>
            </div>
          </div>

          {/* Body */}
          <div className="p-8 md:p-12">
            <div className="flex flex-col sm:flex-row justify-between mb-12 gap-8">
              <div>
                <p className="text-sm text-[#1C1917]/50 font-semibold uppercase tracking-wider mb-2">Billed To</p>
                <p className="font-bold text-lg">Client Name</p>
                <p className="text-[#1C1917]/70">client@email.com</p>
              </div>
              <div className="sm:text-right">
                <p className="text-sm text-[#1C1917]/50 font-semibold uppercase tracking-wider mb-2">Date Issued</p>
                <p className="font-medium text-lg">Oct 24, 2026</p>
              </div>
            </div>

            {/* Line Items */}
            <div className="mb-12">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-[#1C1917]/10">
                    <th className="pb-4 font-semibold text-[#1C1917]/60 uppercase tracking-wider text-sm">Description</th>
                    <th className="pb-4 font-semibold text-[#1C1917]/60 uppercase tracking-wider text-sm text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1C1917]/5">
                  <tr>
                    <td className="py-4">
                      <p className="font-bold">Premium Consultation</p>
                      <p className="text-sm text-[#1C1917]/60">1 hour initial assessment</p>
                    </td>
                    <td className="py-4 text-right font-medium">₹ 2,000</td>
                  </tr>
                  <tr>
                    <td className="py-4">
                      <p className="font-bold">Follow-up Session</p>
                      <p className="text-sm text-[#1C1917]/60">30 min review</p>
                    </td>
                    <td className="py-4 text-right font-medium">₹ 1,000</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div className="flex justify-end mb-12">
              <div className="w-full sm:w-1/2">
                <div className="flex justify-between py-3 border-b border-[#1C1917]/10">
                  <span className="text-[#1C1917]/60">Subtotal</span>
                  <span className="font-medium">₹ 3,000</span>
                </div>
                <div className="flex justify-between py-3 border-b border-[#1C1917]/10">
                  <span className="text-[#1C1917]/60">Tax (18%)</span>
                  <span className="font-medium">₹ 540</span>
                </div>
                <div className="flex justify-between py-4 text-xl font-bold font-serif text-[#F97316]">
                  <span>Total Due</span>
                  <span>₹ 3,540</span>
                </div>
              </div>
            </div>

            {/* Action */}
            <div className="flex justify-center">
              <button className="bg-[#F97316] text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-[#F97316]/90 transition-all shadow-xl shadow-[#F97316]/20 hover:-translate-y-1 w-full sm:w-auto">
                Pay Securely via Razorpay
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
