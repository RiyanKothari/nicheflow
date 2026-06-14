// supabase/functions/pdf-generator/index.ts
// Uses Browserless.io API to render invoice HTML to PDF

Deno.serve(async (req) => {
  const { invoice_id, workspace_id } = await req.json()
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, clients(*), invoice_items(*), workspaces(*)')
    .eq('id', invoice_id)
    .single()

  // Build HTML from template
  const html = renderInvoiceHTML(invoice)

  const token = Deno.env.get('BROWSERLESS_TOKEN')
  let pdfBuffer: ArrayBuffer

  if (!token) {
    console.log('[MOCK PDF] Missing Browserless token. Creating dummy PDF buffer.')
    pdfBuffer = new TextEncoder().encode('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/Resources <<\n/Font <<\n/F1 4 0 R\n>>\n>>\n/Contents 5 0 R\n>>\nendobj\n4 0 obj\n<<\n/Type /Font\n/Subtype /Type1\n/BaseFont /Helvetica\n>>\nendobj\n5 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 24 Tf\n100 700 Td\n(Mock PDF Generated!) Tj\nET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000214 00000 n\n0000000302 00000 n\ntrailer\n<<\n/Size 6\n/Root 1 0 R\n>>\nstartxref\n397\n%%EOF').buffer
  } else {
    const pdfResponse = await fetch('https://chrome.browserless.io/pdf', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        html,
        options: { format: 'A4', printBackground: true, margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' } }
      })
    })
    pdfBuffer = await pdfResponse.arrayBuffer()
  }

  // Upload to Supabase Storage
  const fileName = `invoices/${workspace_id}/${invoice_id}.pdf`
  const { data: uploaded } = await supabase.storage
    .from('invoice-pdfs')
    .upload(fileName, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true
    })

  const { data: { publicUrl } } = supabase.storage
    .from('invoice-pdfs')
    .getPublicUrl(fileName)

  await supabase.from('invoices').update({ pdf_url: publicUrl }).eq('id', invoice_id)

  return new Response(JSON.stringify({ pdf_url: publicUrl }), {
    headers: { 'Content-Type': 'application/json' }
  })
})

function renderInvoiceHTML(invoice: Record<string, unknown>): string {
  const workspace = invoice.workspaces as Record<string, unknown>
  const client = invoice.clients as Record<string, unknown>
  const items = invoice.invoice_items as Record<string, unknown>[]

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif; }
  body { color: #1C1917; background: white; }
  .header { background: #F97316; color: white; padding: 32px; display: flex; justify-content: space-between; }
  .header h1 { font-size: 28px; font-weight: 700; }
  .invoice-meta { padding: 32px; display: flex; justify-content: space-between; }
  .table { width: 100%; border-collapse: collapse; margin: 0 32px; width: calc(100% - 64px); }
  .table th { background: #FAFAF9; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #78716C; }
  .table td { padding: 12px; border-bottom: 1px solid #E7E5E4; }
  .totals { padding: 32px; display: flex; justify-content: flex-end; }
  .totals-box { width: 280px; }
  .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
  .total-row.grand { font-size: 18px; font-weight: 700; border-top: 2px solid #1C1917; margin-top: 8px; padding-top: 16px; }
  .footer { padding: 32px; text-align: center; color: #78716C; font-size: 12px; border-top: 1px solid #E7E5E4; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1>${workspace?.name}</h1>
      <p style="opacity:0.8;margin-top:4px">${workspace?.phone || ''}</p>
    </div>
    <div style="text-align:right">
      <h2>INVOICE</h2>
      <p>#${invoice.invoice_number}</p>
      <p>Date: ${invoice.issue_date}</p>
    </div>
  </div>
  <div class="invoice-meta">
    <div>
      <p style="font-size:12px;color:#78716C;margin-bottom:4px">BILL TO</p>
      <p style="font-weight:600">${client?.name}</p>
      <p>${client?.phone || ''}</p>
      <p>${client?.email || ''}</p>
    </div>
    <div style="text-align:right">
      <p style="font-size:12px;color:#78716C">Due Date</p>
      <p style="font-weight:600">${invoice.due_date}</p>
      <p style="margin-top:8px;padding:4px 12px;background:${invoice.status === 'paid' ? '#10B981' : '#F59E0B'};color:white;border-radius:999px;font-size:12px;display:inline-block">${String(invoice.status).toUpperCase()}</p>
    </div>
  </div>
  <table class="table">
    <thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
    <tbody>
      ${items?.map(item => `<tr><td>${item.description}</td><td>${item.quantity}</td><td>₹${item.unit_price}</td><td>₹${item.amount}</td></tr>`).join('')}
    </tbody>
  </table>
  <div class="totals">
    <div class="totals-box">
      <div class="total-row"><span>Subtotal</span><span>₹${invoice.subtotal}</span></div>
      <div class="total-row"><span>GST (${invoice.tax_rate}%)</span><span>₹${invoice.tax_amount}</span></div>
      ${invoice.discount_amount ? `<div class="total-row"><span>Discount</span><span>-₹${invoice.discount_amount}</span></div>` : ''}
      <div class="total-row grand"><span>Total</span><span>₹${invoice.total}</span></div>
    </div>
  </div>
  ${invoice.notes ? `<div style="padding: 0 32px 32px"><p style="color:#78716C;font-size:12px">Notes:</p><p>${invoice.notes}</p></div>` : ''}
  <div class="footer">
    <p>Thank you for your business! 🙏</p>
    ${workspace?.gst_number ? `<p>GST: ${workspace.gst_number}</p>` : ''}
  </div>
</body>
</html>`
}
