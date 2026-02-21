import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    // 1. Recebe os dados da Lastlink
    const payload = await req.json()
    console.log("Webhook Lastlink recebido:", JSON.stringify(payload))

    // 2. Inicia o Cliente Admin do Supabase
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 3. Extrai o Email do Cliente e o Evento da Lastlink
    // A Lastlink envia o email geralmente em payload.data.customer.email
    const email = payload?.data?.customer?.email || payload?.customer_email || payload?.email;
    const eventType = payload?.event || payload?.status || '';
    const planName = payload?.data?.subscription?.plan?.name || payload?.data?.plan_name || '';

    if (!email) {
      return new Response(JSON.stringify({ error: "Email não encontrado no payload" }), { status: 400 })
    }

    // 4. Se o pagamento foi APROVADO ou RENOVADO
    const isApproved = eventType.includes('approved') || eventType.includes('paid') || eventType.includes('renewed');

    if (isApproved) {
      // Descobre quantos dias liberar com base no nome do plano
      let daysToAdd = 90; // Padrão: Trimestral
      const nameLower = planName.toLowerCase();
      
      if (nameLower.includes('semestral')) daysToAdd = 180;
      if (nameLower.includes('anual') || nameLower.includes('vip')) daysToAdd = 365;

      const validUntilDate = new Date();
      validUntilDate.setDate(validUntilDate.getDate() + daysToAdd);

      // Atualiza o perfil do usuário para PRO
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ 
          is_pro: true, 
          valid_until: validUntilDate.toISOString() 
        })
        .eq('email', email)

      if (error) throw error;

      console.log(`✅ PRO ATIVADO: ${email} por ${daysToAdd} dias.`);
      return new Response(JSON.stringify({ success: true, message: `PRO ativado para ${email}` }), { status: 200 })
    }

    // 5. Se a assinatura foi CANCELADA, REEMBOLSADA ou CHARGEBACK
    const isCanceled = eventType.includes('canceled') || eventType.includes('refunded') || eventType.includes('chargeback');

    if (isCanceled) {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ 
          is_pro: false, 
          valid_until: null 
        })
        .eq('email', email)

      if (error) throw error;

      console.log(`❌ PRO REMOVIDO: ${email} cancelou ou pediu reembolso.`);
      return new Response(JSON.stringify({ success: true, message: `PRO removido de ${email}` }), { status: 200 })
    }

    // Se for outro evento qualquer da Lastlink (ex: boleto gerado), apenas ignora.
    return new Response(JSON.stringify({ success: true, message: "Evento ignorado" }), { status: 200 })

  } catch (error: any) {
    console.error("Erro no Webhook da Lastlink:", error.message)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})