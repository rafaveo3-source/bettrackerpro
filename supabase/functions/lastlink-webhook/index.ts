import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

// 🧲 FUNÇÃO DE BUSCA BLINDADA DE E-MAIL (Busca em todas as camadas do JSON)
function extractEmail(obj: any): string | null {
  if (!obj || typeof obj !== 'object') return null;
  for (const [key, value] of Object.entries(obj)) {
    if (key.toLowerCase() === 'email' && typeof value === 'string' && value.includes('@')) {
      return value.trim().toLowerCase();
    }
    if (typeof value === 'object') {
      const found = extractEmail(value);
      if (found) return found;
    }
  }
  return null;
}

// 🧲 FUNÇÃO DE BUSCA BLINDADA DE PLANO
function extractPlanName(obj: any): string {
  if (obj?.Subscription?.Plan?.Name) return obj.Subscription.Plan.Name;
  if (obj?.Product?.Name) return obj.Product.Name;
  
  let found = '';
  const search = (o: any) => {
    if (!o || typeof o !== 'object') return;
    for (const [key, value] of Object.entries(o)) {
      if ((key.toLowerCase() === 'plan' || key.toLowerCase() === 'product') && typeof value === 'object') {
         if (value.Name) found = value.Name;
         else if (value.name) found = value.name;
      }
      if (typeof value === 'object' && !found) search(value);
    }
  };
  search(obj);
  return found || 'Plano Padrão';
}

serve(async (req) => {
  try {
    const payload = await req.json()
    console.log("🔥 Webhook Lastlink recebido! Evento:", payload?.Event || payload?.event || 'Desconhecido')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const eventType = payload?.Event || payload?.event || payload?.status || '';
    const email = extractEmail(payload);
    const planName = extractPlanName(payload);

    if (!email) {
      console.error("❌ E-mail não encontrado no payload! Estrutura completa:", JSON.stringify(payload));
      return new Response(JSON.stringify({ error: "E-mail não encontrado na requisição" }), { status: 400 })
    }

    const eventTypeLower = String(eventType).toLowerCase();
    
    // ==========================================
    // 🟢 LÓGICA DE APROVAÇÃO (CRIADO / PAGO / RENOVADO)
    // ==========================================
    const isApproved = eventTypeLower.includes('approved') || 
                       eventTypeLower.includes('paid') || 
                       eventTypeLower.includes('renewed') || 
                       eventTypeLower.includes('created') ||
                       eventTypeLower.includes('confirmed'); // <-- Capta 'Purchase_Order_Confirmed'

    if (isApproved) {
      let daysToAdd = 90; // Padrão: Trimestral
      const nameLower = String(planName).toLowerCase();
      
      if (nameLower.includes('semestral')) daysToAdd = 180;
      if (nameLower.includes('anual') || nameLower.includes('vip')) daysToAdd = 365;
      if (nameLower.includes('mensal')) daysToAdd = 30;

      const validUntilDate = new Date();
      validUntilDate.setDate(validUntilDate.getDate() + daysToAdd);

      console.log(`🔄 Liberando PRO para: ${email} até ${validUntilDate.toISOString()} (Plano detectado: ${planName})`)
      
      // ✅ USANDO A RPC ORIGINAL DO BANCO PARA GARANTIR FUNCIONAMENTO
      const { error } = await supabaseAdmin.rpc('update_pro_status_by_email', {
        p_email: email,
        p_status: 'active',
        p_valid_until: validUntilDate.toISOString()
      })

      if (error) throw error;

      console.log(`✅ Sucesso! Usuário atualizado para PRO.`);
      return new Response(JSON.stringify({ success: true, message: `PRO ativado para ${email}` }), { status: 200 })
    }

    // ==========================================
    // 🔴 LÓGICA DE ESTORNO E CHARGEBACK (REMOVER PRO IMEDIATAMENTE)
    // ==========================================
    const isEstorno = eventTypeLower.includes('refund') || 
                      eventTypeLower.includes('chargeback') ||
                      eventTypeLower.includes('reembolsad') || 
                      eventTypeLower.includes('estornad');

    if (isEstorno) {
      console.log(`🔄 Rebaixando para FREE (Estorno/Reembolso de ${email})...`)
      
      const { error } = await supabaseAdmin.rpc('update_pro_status_by_email', {
        p_email: email,
        p_status: 'free',
        p_valid_until: null
      })

      if (error) throw error;

      console.log(`❌ Sucesso! PRO REMOVIDO: ${email} cancelou e pediu reembolso.`);
      return new Response(JSON.stringify({ success: true, message: `PRO removido de ${email}` }), { status: 200 })
    }

    // ==========================================
    // ⚠️ LÓGICA DE CANCELAMENTO DE ASSINATURA E EXPIRAÇÃO
    // ==========================================
    const isCanceled = eventTypeLower.includes('canceled') || 
                       eventTypeLower.includes('cancelad') ||
                       eventTypeLower.includes('expired');

    if (isCanceled) {
       console.log(`⚠️ Assinatura cancelada ou expirada (${eventType}). O usuário ${email} manterá o acesso até a data de validade acabar naturalmente.`);
       return new Response(JSON.stringify({ success: true, message: `Cancelamento/Expiração ignorado. Acesso mantido.` }), { status: 200 })
    }

    // OUTROS EVENTOS DA LASTLINK (Ex: boleto impresso)
    console.log(`⚠️ Status secundário recebido (${eventType}). Nenhuma ação necessária.`);
    return new Response(JSON.stringify({ success: true, message: `Evento ignorado: ${eventType}` }), { status: 200 })

  } catch (error: any) {
    console.error("❌ ERRO FATAL NA FUNÇÃO:", error.message)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})