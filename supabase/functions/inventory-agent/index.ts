// supabase/functions/inventory-agent/index.ts
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

async function dailyCheck(supabase: ReturnType<typeof createClient>) {
  // Low stock alerts
  const { data: lowStock } = await supabase
    .from('inventory_items')
    .select('*, workspaces(name, agent_autonomy)')
    .filter('current_stock', 'lte', 'reorder_threshold')
    .eq('is_active', true)

  for (const item of lowStock || []) {
    await supabase.from('notifications').insert({
      workspace_id: item.workspace_id,
      type: 'low_stock',
      title: `Low stock: ${item.name}`,
      body: `Only ${item.current_stock} ${item.unit} remaining (threshold: ${item.reorder_threshold}).${item.supplier_name ? ` Supplier: ${item.supplier_name}` : ''}`,
      action_url: `/inventory/${item.id}`
    })
  }

  // Expiry alerts (within 5 days)
  const fiveDaysFromNow = new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]
  const { data: expiring } = await supabase
    .from('inventory_items')
    .select('*')
    .lte('expiry_date', fiveDaysFromNow)
    .gte('expiry_date', new Date().toISOString().split('T')[0])
    .eq('is_active', true)
    .gt('current_stock', 0)

  for (const item of expiring || []) {
    const daysLeft = Math.ceil(
      (new Date(item.expiry_date).getTime() - Date.now()) / 86400000
    )
    await supabase.from('notifications').insert({
      workspace_id: item.workspace_id,
      type: 'expiry_alert',
      title: `⚠️ ${item.name} expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
      body: `${item.current_stock} ${item.unit} of ${item.name} will expire on ${item.expiry_date}. Consider using or discounting.`,
      action_url: `/inventory/${item.id}`
    })
  }
}

Deno.serve(async (req) => {
  const body = await req.json()
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  if (body.job === 'daily_check') await dailyCheck(supabase)
  return new Response(JSON.stringify({ ok: true }))
})
