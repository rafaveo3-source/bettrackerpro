import { createClient } from '@supabase/supabase-js';

// Conexão com privilégios de Administrador
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 
const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey!);

// 🧲 FUNÇÃO DE BUSCA BLINDADA DE E-MAIL
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

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    // 🔒 TRAVA DE SEGURANÇA
    const token = req.query.token;
    const SECURE_TOKEN = process.env.WEBHOOK_SECRET;

    if (token !== SECURE_TOKEN) {
        console.error("🚨 Tentativa de invasão bloqueada: Token inválido.");
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const payload = req.body;
        console.log("🔥 Webhook Lastlink na VERCEL recebido! Evento:", payload?.Event || payload?.event || 'Desconhecido');

        const eventType = payload?.Event || payload?.event || payload?.status || '';
        const email = extractEmail(payload);
        const planName = extractPlanName(payload);

        if (!email) {
            console.error("❌ E-mail não encontrado no payload!");
            return res.status(400).json({ error: "E-mail não encontrado" });
        }

        const eventTypeLower = String(eventType).toLowerCase();
        
        // 🟢 LÓGICA DE APROVAÇÃO
        const isApproved = eventTypeLower.includes('approved') || 
                           eventTypeLower.includes('paid') || 
                           eventTypeLower.includes('renewed') || 
                           eventTypeLower.includes('created') ||
                           eventTypeLower.includes('confirmed');

        if (isApproved) {
            let daysToAdd = 90; // Padrão: Trimestral
            const nameLower = String(planName).toLowerCase();
            
            if (nameLower.includes('semestral')) daysToAdd = 180;
            if (nameLower.includes('anual') || nameLower.includes('vip')) daysToAdd = 365;
            if (nameLower.includes('mensal')) daysToAdd = 30;

            const validUntilDate = new Date();
            validUntilDate.setDate(validUntilDate.getDate() + daysToAdd);

            console.log(`🔄 Liberando PRO para: ${email} até ${validUntilDate.toISOString()}`);
            
            const { error } = await supabaseAdmin.rpc('update_pro_status_by_email', {
                p_email: email,
                p_status: 'active',
                p_valid_until: validUntilDate.toISOString()
            });

            if (error) throw error;
            return res.status(200).json({ success: true, message: `PRO ativado para ${email}` });
        }

        // 🔴 LÓGICA DE ESTORNO E CHARGEBACK
        const isEstorno = eventTypeLower.includes('refund') || 
                          eventTypeLower.includes('chargeback') ||
                          eventTypeLower.includes('reembolsad') || 
                          eventTypeLower.includes('estornad');

        if (isEstorno) {
            console.log(`🔄 Rebaixando para FREE (Estorno/Reembolso de ${email})...`);
            const { error } = await supabaseAdmin.rpc('update_pro_status_by_email', {
                p_email: email,
                p_status: 'free',
                p_valid_until: null
            });
            if (error) throw error;
            return res.status(200).json({ success: true, message: `PRO removido de ${email}` });
        }

        // ⚠️ LÓGICA DE CANCELAMENTO
        const isCanceled = eventTypeLower.includes('canceled') || 
                           eventTypeLower.includes('cancelad') ||
                           eventTypeLower.includes('expired');

        if (isCanceled) {
           console.log(`⚠️ Assinatura cancelada (${eventType}). Acesso mantido até expirar.`);
           return res.status(200).json({ success: true, message: `Cancelamento ignorado.` });
        }

        console.log(`⚠️ Status ignorado: ${eventType}`);
        return res.status(200).json({ success: true, message: `Evento ignorado: ${eventType}` });

    } catch (error: any) {
        console.error("❌ ERRO FATAL:", error.message);
        return res.status(500).json({ error: error.message });
    }
}