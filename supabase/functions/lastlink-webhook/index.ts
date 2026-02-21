import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    // 1. Recebe os dados
    const payload = await req.json()
    console.log("Webhook Lastlink recebido:", JSON.stringify(payload))

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Mapeamento preparado para as Letras Maiúsculas da Lastlink
    const eventType = payload?.Event || payload?.event || payload?.status || '';
    
    // Navegando pelos objetos Data -> Customer -> Email
    const dataObj = payload?.Data || payload?.data || {};
    const customerObj = dataObj?.Customer || dataObj?.customer || payload?.customer || {};
    const email = customerObj?.Email || customerObj?.email || payload?.email || payload?.customer_email;
    
    // Pegando o nome do plano (Trimestral, Semestral, Anual)
    const subObj = dataObj?.Subscription || dataObj?.subscription || {};
    const planObj = subObj?.Plan || subObj?.plan || {};
    const planName = planObj?.Name || planObj?.name || payload?.plan_name || '';

    if (!email) {
      console.error("Email não encontrado no payload!");
      return new Response(JSON.stringify({ error: "Email não encontrado" }), { status: 400 })
    }

    const eventTypeLower = String(eventType).toLowerCase();
    
    // 3. Lógica de Aprovação (Pagamento Aprovado ou Assinatura Criada/Renovada)
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

      console.log(`✅ PRO ATIVADO: ${email} por ${daysToAdd} dias. (Plano detectado: ${planName})`);
      return new Response(JSON.stringify({ success: true, message: `PRO ativado para ${email}` }), { status: 200 })
    }

    // 4. Lógica de Reembolso / Cancelamento
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

    // Se for outro evento qualquer (ex: boleto gerado), ignora
    return new Response(JSON.stringify({ success: true, message: `Evento ignorado: ${eventType}` }), { status: 200 })

  } catch (error: any) {
    console.error("Erro no Webhook da Lastlink:", error.message)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})