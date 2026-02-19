import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

serve(async (req) => {
  try {
    const payload = await req.json()
    console.log("🔥 PAYLOAD KIWIFY RECEBIDO:", JSON.stringify(payload))

    const email = payload?.Customer?.email || payload?.email
    const orderStatus = payload?.order_status 
    const subStatus = payload?.Subscription?.status
    
    // Pega as informações do plano que a Kiwify envia
    const planFrequency = payload?.Subscription?.plan?.frequency || ''
    const planName = payload?.Subscription?.plan?.name || payload?.product_name || ''
    const nameLower = planName.toLowerCase()

    if (!email) {
      console.error("❌ ERRO: E-mail não encontrado no webhook.")
      return new Response("Email não encontrado", { status: 400 })
    }

    console.log(`✅ Processando cliente: ${email} | Pedido: ${orderStatus} | Assinatura: ${subStatus}`)

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

    let isPro = false;
    
    if (orderStatus === 'paid' || subStatus === 'active') {
        isPro = true;
    } else if (orderStatus === 'refunded' || orderStatus === 'chargedback' || subStatus === 'canceled') {
        isPro = false;
    } else {
        console.log(`⚠️ Status intermediário. Ignorando.`)
        return new Response("Ignorado", { status: 200 })
    }

    if (isPro) {
      const validUntil = new Date()
      
      // MÁGICA DOS PLANOS: Soma o tempo exato com base no nome do plano ou frequência
      if (planFrequency === 'yearly' || nameLower.includes('anual')) {
          validUntil.setFullYear(validUntil.getFullYear() + 1)
      } else if (planFrequency === 'semiannually' || planFrequency === 'semiannual' || nameLower.includes('semestral')) {
          validUntil.setMonth(validUntil.getMonth() + 6)
      } else if (planFrequency === 'quarterly' || nameLower.includes('trimestral')) {
          validUntil.setMonth(validUntil.getMonth() + 3)
      } else if (planFrequency === 'monthly' || nameLower.includes('mensal')) {
          validUntil.setMonth(validUntil.getMonth() + 1)
      } else {
          // Fallback de segurança (se a Kiwify não mandar nada, libera 3 meses por padrão)
          validUntil.setMonth(validUntil.getMonth() + 3) 
      }

      console.log(`🔄 Liberando PRO via Ponte SQL para: ${email} até ${validUntil.toISOString()}`)
      
      const { error } = await supabaseAdmin.rpc('update_pro_status_by_email', {
        p_email: email,
        p_status: 'active',
        p_valid_until: validUntil.toISOString()
      })

      if (error) throw error
      console.log(`✅ Sucesso! Usuário atualizado para PRO.`)

    } else {
      console.log(`🔄 Rebaixando para FREE (Estorno/Cancelamento)...`)
      
      const { error } = await supabaseAdmin.rpc('update_pro_status_by_email', {
        p_email: email,
        p_status: 'free',
        p_valid_until: null
      })
      
      if (error) throw error
    }

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" }, status: 200 })

  } catch (err) {
    console.error("❌ ERRO NA FUNÇÃO:", err.message)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})