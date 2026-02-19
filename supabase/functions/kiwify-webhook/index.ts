import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

serve(async (req) => {
  try {
    const url = new URL(req.url)
    const token = url.searchParams.get('token')
    const secretToken = Deno.env.get('KIWIFY_WEBHOOK_TOKEN')

    // Se não tiver o token certo na URL, bloqueia o acesso na hora
    if (!token || token !== secretToken) {
        console.error("❌ TENTATIVA DE INVASÃO BLOQUEADA: Token inválido ou ausente.")
        return new Response("Unauthorized", { status: 401 })
    }

    const payload = await req.json()
    console.log("🔥 PAYLOAD KIWIFY RECEBIDO E AUTENTICADO!")

    const email = payload?.Customer?.email || payload?.email
    const orderStatus = payload?.order_status 
    const subStatus = payload?.Subscription?.status
    const planFrequency = payload?.Subscription?.plan?.frequency || ''
    const planName = payload?.Subscription?.plan?.name || payload?.product_name || ''
    const nameLower = planName.toLowerCase()

    if (!email) {
      return new Response("Email não encontrado", { status: 400 })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

    let isPro = false;
    
    if (orderStatus === 'paid' || subStatus === 'active') {
        isPro = true;
    } else if (orderStatus === 'refunded' || orderStatus === 'chargedback' || subStatus === 'canceled') {
        isPro = false;
    } else {
        return new Response("Ignorado", { status: 200 })
    }

    if (isPro) {
      const validUntil = new Date()
      
      if (planFrequency === 'yearly' || nameLower.includes('anual')) {
          validUntil.setFullYear(validUntil.getFullYear() + 1)
      } else if (planFrequency === 'semiannually' || planFrequency === 'semiannual' || nameLower.includes('semestral')) {
          validUntil.setMonth(validUntil.getMonth() + 6)
      } else if (planFrequency === 'quarterly' || nameLower.includes('trimestral')) {
          validUntil.setMonth(validUntil.getMonth() + 3)
      } else if (planFrequency === 'monthly' || nameLower.includes('mensal')) {
          validUntil.setMonth(validUntil.getMonth() + 1)
      } else {
          validUntil.setMonth(validUntil.getMonth() + 3) 
      }
      
      const { error } = await supabaseAdmin.rpc('update_pro_status_by_email', {
        p_email: email,
        p_status: 'active',
        p_valid_until: validUntil.toISOString()
      })

      if (error) throw error

    } else {
      const { error } = await supabaseAdmin.rpc('update_pro_status_by_email', {
        p_email: email,
        p_status: 'free',
        p_valid_until: null
      })
      if (error) throw error
    }

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" }, status: 200 })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})