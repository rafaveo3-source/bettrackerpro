import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    const payload = await req.json()
    console.log("Webhook Lastlink recebido:", JSON.stringify(payload))

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const eventType = payload?.Event || payload?.event || payload?.status || '';
    
    // BUSCA BLINDADA DE E-MAIL (Mapeando TODAS as possibilidades da Lastlink)
    const email = payload?.Customer?.Email || 
                  payload?.Customer?.email || 
                  payload?.customer?.email || 
                  payload?.Data?.Customer?.Email || 
                  payload?.data?.customer?.email || 
                  payload?.email || 
                  payload?.customer_email;
    
    // BUSCA BLINDADA DO NOME DO PLANO
    const planName = payload?.Subscription?.Plan?.Name || 
                     payload?.Subscription?.plan?.name ||
                     payload?.subscription?.plan?.name || 
                     payload?.Data?.Subscription?.Plan?.Name || 
                     payload?.plan_name || 
                     '';

    if (!email) {
      // Se ainda assim não achar, ele vai cuspir o arquivo inteiro no log para vermos o formato exato
      console.error("Email não encontrado! Estrutura recebida:", JSON.stringify(payload));
      return new Response(JSON.stringify({ error: "Email não encontrado" }), { status: 400 })
    }

    const eventTypeLower = String(eventType).toLowerCase();
    
    // VERIFICA SE FOI APROVADO
    const isApproved = eventTypeLower.includes('approved') || 
                       eventTypeLower.includes('paid') || 
                       eventTypeLower.includes('renewed') || 
                       eventTypeLower.includes('created') || 
                       eventTypeLower.includes('active');

    if (isApproved) {
      let daysToAdd = 90; // Padrão: Trimestral
      const nameLower = String(planName).toLowerCase();
      
      if (nameLower.includes('semestral')) daysToAdd = 180;
      if (nameLower.includes('anual') || nameLower.includes('vip')) daysToAdd = 365;

      const validUntilDate = new Date();
      validUntilDate.setDate(validUntilDate.getDate() + daysToAdd);

      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ 
          is_pro: true, 
          valid_until: validUntilDate.toISOString() 
        })
        .eq('email', String(email).toLowerCase().trim())

      if (error) throw error;

      console.log(`✅ PRO ATIVADO: ${email} por ${daysToAdd} dias. (Plano: ${planName})`);
      return new Response(JSON.stringify({ success: true, message: `PRO ativado para ${email}` }), { status: 200 })
    }

    // VERIFICA SE FOI CANCELADO/ESTORNADO
    const isCanceled = eventTypeLower.includes('canceled') || 
                       eventTypeLower.includes('refunded') || 
                       eventTypeLower.includes('chargeback') || 
                       eventTypeLower.includes('expired');

    if (isCanceled) {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ 
          is_pro: false, 
          valid_until: null 
        })
        .eq('email', String(email).toLowerCase().trim())

      if (error) throw error;

      console.log(`❌ PRO REMOVIDO: ${email} cancelou ou pediu reembolso.`);
      return new Response(JSON.stringify({ success: true, message: `PRO removido de ${email}` }), { status: 200 })
    }

    return new Response(JSON.stringify({ success: true, message: `Evento ignorado: ${eventType}` }), { status: 200 })

  } catch (error: any) {
    console.error("Erro no Webhook da Lastlink:", error.message)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})