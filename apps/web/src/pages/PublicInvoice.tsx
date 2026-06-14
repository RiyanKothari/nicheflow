import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Loader2, MessageSquare, ExternalLink } from "lucide-react";

type Invoice = {
  id: number; clientName: string | null; clientPhone?: string | null;
  clientEmail?: string | null; clientAddress?: string | null;
  invoiceNumber: string; status: string;
  items: { description: string; quantity: number; unitPrice: number }[];
  subtotal: number; tax: number; discount: number; discountType: string;
  total: number; issuedAt: string; dueDate: string | null; paidAt: string | null;
  payments: any[]; notes: string | null; createdAt: string;
  business: { name: string; phone?: string; email?: string; address?: string; city?: string } | null;
};

function formatINR(n: number) {
  return `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

export function PublicInvoice() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    fetch(`/api/invoices/public/${id}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setInvoice)
      .catch(() => setError("Invoice not found or link is invalid."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-bold text-gray-900 mb-2">Invoice Not Found</p>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  const discountAmt = invoice.discountType === "percent"
    ? (invoice.subtotal * invoice.discount) / 100
    : invoice.discount;

  const isOverdue = invoice.dueDate && new Date(invoice.dueDate) < new Date() && invoice.status !== "paid";
  const phone = invoice.business?.phone?.replace(/\D/g, "") || "";

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Status banner */}
        {invoice.status === "paid" && (
          <div className="mb-4 bg-teal-500 text-white text-center py-2.5 rounded-xl text-sm font-bold tracking-wide">
            ✓ PAYMENT RECEIVED — Thank you!
          </div>
        )}
        {(isOverdue || invoice.status === "overdue") && (
          <div className="mb-4 bg-red-500 text-white text-center py-2.5 rounded-xl text-sm font-bold tracking-wide">
            ⚠ This invoice is overdue. Please contact us.
          </div>
        )}

        {/* Invoice card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-8 space-y-8">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-black text-gray-900">{invoice.business?.name || "Invoice"}</h1>
                {invoice.business?.address && <p className="text-sm text-gray-500 mt-0.5">{invoice.business.address}{invoice.business.city ? `, ${invoice.business.city}` : ""}</p>}
                {invoice.business?.phone && <p className="text-sm text-gray-500">{invoice.business.phone}</p>}
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-gray-200">INVOICE</p>
                <p className="text-lg font-mono text-gray-600 mt-1">{invoice.invoiceNumber}</p>
              </div>
            </div>

            {/* Client + Dates */}
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Bill To</p>
                <p className="font-bold text-gray-900">{invoice.clientName || "—"}</p>
                {invoice.clientPhone && <p className="text-sm text-gray-500">{invoice.clientPhone}</p>}
                {invoice.clientEmail && <p className="text-sm text-gray-500">{invoice.clientEmail}</p>}
              </div>
              <div className="text-right space-y-2">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Issue Date</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(invoice.issuedAt)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Due Date</p>
                  <p className={`text-sm font-medium ${isOverdue ? "text-red-500 font-bold" : "text-gray-900"}`}>{formatDate(invoice.dueDate)}</p>
                </div>
              </div>
            </div>

            {/* Line items */}
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Description</th>
                  <th className="text-center pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wide w-16">Qty</th>
                  <th className="text-right pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wide w-28">Unit Price</th>
                  <th className="text-right pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wide w-28">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(invoice.items || []).map((item, i) => (
                  <tr key={i}>
                    <td className="py-3 text-sm text-gray-800">{item.description}</td>
                    <td className="py-3 text-sm text-center text-gray-600">{item.quantity}</td>
                    <td className="py-3 text-sm text-right text-gray-600">{formatINR(item.unitPrice)}</td>
                    <td className="py-3 text-sm text-right font-medium text-gray-900">{formatINR((item.quantity || 0) * (item.unitPrice || 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span><span>{formatINR(invoice.subtotal)}</span>
                </div>
                {discountAmt > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span><span>-{formatINR(discountAmt)}</span>
                  </div>
                )}
                {invoice.tax > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>GST</span><span>{formatINR(invoice.tax)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-xl text-gray-900 border-t-2 border-gray-200 pt-3">
                  <span>Total</span><span>{formatINR(invoice.total)}</span>
                </div>
              </div>
            </div>

            {invoice.notes && (
              <div className="border-t border-gray-100 pt-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Notes</p>
                <p className="text-sm text-gray-600 leading-relaxed">{invoice.notes}</p>
              </div>
            )}

            {/* Contact + Footer */}
            <div className="border-t border-gray-100 pt-5 space-y-3">
              {invoice.business?.phone && (
                <a href={`https://wa.me/${invoice.business.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors">
                  <MessageSquare className="w-5 h-5" /> Contact via WhatsApp
                </a>
              )}
              <p className="text-xs text-gray-300 text-center">Powered by NicheFlow</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
