import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

serve(async (req) => {
  try {
    // 1. Receber os dados enviados pela Kiwify
    const payload = await req.json()
    console.log("Kiwify Webhook Payload recebido!")

    // 2. Extrair E-mail do cliente e o Status do Pedido
    // A Kiwify manda os dados do cliente dentro do objeto "Customer"
    const email = payload?.Customer?.email
    const status = payload?.order_status // 'paid', 'refunded', 'chargedback'

    if (!email) {
      return new Response("Email não encontrado no payload", { status: 400 })
    }

    // 3. Conectar ao banco de dados usando a Service Role (Admin)
    // Isso garante permissão para alterar o perfil do usuário
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

    // 4. Lógica de Atualização no Banco de Dados
    if (status === 'paid') {
      
      // Pagamento Aprovado -> Vira PRO (Ativo por 1 ano como exemplo de margem segura, ajuste se quiser mensal)
      const validUntil = new Date()
      validUntil.setFullYear(validUntil.getFullYear() + 1)

      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ 
          subscription_status: 'active',
          valid_until: validUntil.toISOString()
        })
        .eq('email', email) // Acha o usuário pelo e-mail de compra da Kiwify

      if (error) throw error
      console.log(`✅ Acesso PRO liberado com sucesso para: ${email}`)

    } else if (status === 'refunded' || status === 'chargedback') {
      
      // Reembolso/Chargeback -> Vira FREE novamente
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ 
          subscription_status: 'free',
          valid_until: null
        })
        .eq('email', email)

      if (error) throw error
      console.log(`❌ Acesso PRO revogado para: ${email}`)
      
    } else {
       console.log(`Status ignorado: ${status}`)
    }

    // 5. Retornar SUCESSO para a Kiwify parar de enviar a notificação
    return new Response(JSON.stringify({ success: true, message: "Processado" }), { 
        headers: { "Content-Type": "application/json" },
        status: 200 
    })

  } catch (err) {
    console.error("Erro interno no Webhook:", err.message)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})