// supabase/functions/seo-agent/index.ts
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

Deno.serve(async (req) => {
  const { page_id } = await req.json()
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') })

  const { data: page } = await supabase
    .from('public_pages')
    .select('*, workspaces(name, business_type, address)')
    .eq('id', page_id)
    .single()

  if (!page) return new Response('Not found', { status: 404 })

  const workspace = page.workspaces as Record<string, unknown>
  const city = (workspace.address as Record<string, unknown>)?.city || 'India'

  const response = await anthropic.messages.create({
    model: 'claude-3-5-haiku-latest',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `Generate SEO metadata for this business page:
Business: ${workspace.name}
Type: ${workspace.business_type}
City: ${city}
Page title: ${page.title}
Tagline: ${page.tagline || ''}

Return JSON only:
{
  "meta_title": "max 60 chars, include business name + city",
  "meta_description": "max 155 chars, include key services + location",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}`
    }]
  })

  try {
    const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const seo = JSON.parse(text.replace(/```json\n?|\n?```/g, ''))
    await supabase.from('public_pages').update({
      meta_title: seo.meta_title,
      meta_description: seo.meta_description
    }).eq('id', page_id)
  } catch {}

  return new Response(JSON.stringify({ ok: true }))
})
