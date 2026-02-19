import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

serve(async (req) => {
  try {
    // 🛡️ PROTEÇÃO CONTRA HACKERS
    const url = new URL(req.url)
    const token = url.searchParams.get('token')
    const secretToken = Deno.env.get('KIWIFY_WEBHOOK_TOKEN')

    if (!token || token !== secretToken) {
        console.error("❌ TENTATIVA DE INVASÃO BLOQUEADA: Token inválido.")
        return new Response("Unauthorized", { status: 401 })
    }

    const payload = await req.json()
    console.log("🔥 PAYLOAD KIWIFY RECEBIDO")

    const email = payload?.Customer?.email || payload?.email
    const orderStatus = payload?.order_status // Ex: 'paid', 'refunded', 'chargedback'
    const planFrequency = payload?.Subscription?.plan?.frequency || ''
    const planName = payload?.Subscription?.plan?.name || payload?.product_name || ''
    const nameLower = planName.toLowerCase()

    if (!email) {
      return new Response("Email não encontrado", { status: 400 })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

    // ==========================================
    // 🧠 LÓGICA INTELIGENTE DE LIBERAÇÃO E CORTE
    // ==========================================
    
    if (orderStatus === 'paid') {
      
      // ✅ PAGAMENTO APROVADO: Soma o tempo com base no plano
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
          validUntil.setMonth(validUntil.getMonth() + 3) // Fallback de segurança
      }

      console.log(`🔄 Liberando PRO para: ${email} até ${validUntil.toISOString()}`)
      
      const { error } = await supabaseAdmin.rpc('update_pro_status_by_email', {
        p_email: email,
        p_status: 'active',
        p_valid_until: validUntil.toISOString()
      })

      if (error) throw error
      console.log(`✅ Sucesso! Usuário atualizado para PRO.`)

    } 
    else if (orderStatus === 'refunded' || orderStatus === 'chargedback') {
      
      // ❌ ESTORNO OU FRAUDE: Corta o acesso imediatamente
      console.log(`🔄 Rebaixando para FREE (Estorno/Fraude de ${email})...`)
      
      const { error } = await supabaseAdmin.rpc('update_pro_status_by_email', {
        p_email: email,
        p_status: 'free',
        p_valid_until: null
      })
      
      if (error) throw error
      console.log(`✅ Sucesso! Usuário rebaixado.`)

    } 
    else {
      // ⚠️ IGNORAR CANCELAMENTOS DE RENOVAÇÃO E PIX EXPIRADO
      // O acesso do usuário vai expirar naturalmente na data de validade.
      console.log(`⚠️ Status secundário recebido (${orderStatus}). Nenhuma ação necessária, deixando a data expirar naturalmente.`)
    }

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" }, status: 200 })

  } catch (err) {
    console.error("❌ ERRO NA FUNÇÃO:", err.message)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})