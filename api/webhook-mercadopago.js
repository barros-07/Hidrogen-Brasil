import {
  InvalidWebhookSignatureError,
  MercadoPagoConfig,
  MerchantOrder,
  Payment,
  Preference,
  WebhookSignatureValidator,
} from "mercadopago";

function getValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function escaparHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  })[character]);
}

async function enviarNotificacaoPedido({ payment, paymentId, deliveryAddress, preferencePayer }) {
  const apiKey = process.env.RESEND_API_KEY;
  const destinatario = process.env.ORDER_NOTIFICATION_EMAIL;
  const remetente = process.env.ORDER_NOTIFICATION_FROM;

  if (!apiKey || !destinatario || !remetente) {
    throw new Error("Configure RESEND_API_KEY, ORDER_NOTIFICATION_EMAIL e ORDER_NOTIFICATION_FROM.");
  }

  const addressLines = [
    deliveryAddress.rua && deliveryAddress.numero
      ? `${deliveryAddress.rua}, ${deliveryAddress.numero}`
      : deliveryAddress.rua || deliveryAddress.numero,
    deliveryAddress.complemento,
    deliveryAddress.cidade && deliveryAddress.estado
      ? `${deliveryAddress.cidade}/${deliveryAddress.estado}`
      : deliveryAddress.cidade || deliveryAddress.estado,
    deliveryAddress.cep,
  ].filter(Boolean);
  const phoneNumber = [
    payment.payer?.phone?.area_code || preferencePayer.phone?.area_code,
    payment.payer?.phone?.number || preferencePayer.phone?.number,
  ].filter(Boolean).join(" ");
  const produto = payment.description || "Não informado";
  const currency = /^[A-Z]{3}$/.test(payment.currency_id || "") ? payment.currency_id : "BRL";
  const amount = Number(payment.transaction_amount);
  const valor = payment.transaction_amount == null || !Number.isFinite(amount)
    ? "Não informado"
    : new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(amount);
  const cliente = [payment.payer?.first_name, payment.payer?.last_name].filter(Boolean).join(" ") || "Não informado";
  const email = payment.payer?.email || "Não informado";
  const telefone = phoneNumber || "Não informado";
  const referencia = payment.external_reference || "Não informada";
  const endereco = addressLines.length ? addressLines : ["Não retornado pelo Mercado Pago."];

  const texto = [
    "NOVO PEDIDO APROVADO | HIDROGEN BRASIL",
    "",
    `Produto: ${produto}`,
    `Valor: ${valor}`,
    "",
    "DADOS DO PEDIDO",
    `Pagamento: ${paymentId}`,
    `Referência: ${referencia}`,
    "",
    "DADOS DO CLIENTE",
    `Cliente: ${cliente}`,
    `E-mail: ${email}`,
    `Telefone: ${telefone}`,
    "",
    "Endereço de entrega:",
    ...endereco,
  ].join("\n");

  const linhas = [
    ["Cliente", cliente],
    ["E-mail", email],
    ["Telefone / WhatsApp", telefone],
    ["Pagamento", paymentId],
    ["Referência do pedido", referencia],
    ["Endereço de entrega", endereco.join("\n")],
  ];
  const html = `<!doctype html>
<html lang="pt-BR">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
  <body style="margin:0;padding:24px 12px;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#183047;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Novo pedido aprovado na Hidrogen Brasil.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;">
      <tr>
        <td style="padding:28px 32px;background:#0d2137;color:#ffffff;">
          <div style="font-size:13px;letter-spacing:1.5px;text-transform:uppercase;color:#7dd3fc;">Hidrogen Brasil</div>
          <h1 style="margin:10px 0 0;font-size:24px;line-height:1.3;">Pagamento aprovado</h1>
          <p style="margin:8px 0 0;color:#dbeafe;font-size:14px;">Um novo pedido foi confirmado pelo Mercado Pago.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:28px 32px 12px;">
          <div style="font-size:12px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#64748b;">Produto</div>
          <div style="margin-top:7px;font-size:20px;font-weight:bold;color:#0d2137;">${escaparHtml(produto)}</div>
          <div style="margin-top:8px;font-size:24px;font-weight:bold;color:#087e8b;">${escaparHtml(valor)}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 32px 28px;">
          <div style="font-size:12px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#64748b;margin-bottom:8px;">Detalhes do pedido</div>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
            ${linhas.map(([rotulo, conteudo]) => `<tr>
              <td style="width:38%;padding:11px 8px 11px 0;border-bottom:1px solid #e2e8f0;vertical-align:top;font-size:13px;font-weight:bold;color:#475569;">${escaparHtml(rotulo)}</td>
              <td style="padding:11px 0;border-bottom:1px solid #e2e8f0;vertical-align:top;font-size:14px;line-height:1.55;color:#183047;overflow-wrap:anywhere;white-space:pre-line;">${escaparHtml(conteudo)}</td>
            </tr>`).join("")}
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 32px;background:#f8fafc;color:#64748b;font-size:12px;line-height:1.5;">
          Notificação automática de pedido do site Hidrogen Brasil.
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const resposta = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `mercadopago-payment-approved-${paymentId}`,
    },
    body: JSON.stringify({
      from: remetente,
      to: [destinatario],
      subject: `Pedido aprovado | ${produto}`,
      text: texto,
      html,
    }),
  });

  if (!resposta.ok) {
    const detalhe = await resposta.text();
    throw new Error(`Resend respondeu HTTP ${resposta.status}: ${detalhe}`);
  }
}

async function enviarConfirmacaoComprador({ payment, paymentId, email, descricaoProduto }) {
  const apiKey = process.env.RESEND_API_KEY;
  const remetente = process.env.ORDER_NOTIFICATION_FROM;
  if (!apiKey || !remetente || !email) {
    throw new Error("Não foi possível preparar o e-mail de confirmação do comprador.");
  }

  const texto = [
    "Seu pagamento foi aprovado. Obrigado por comprar na Hidrogen Brasil!",
    "",
    `Produto: ${payment.description || "Não informado"}`,
    descricaoProduto ? `Sobre o produto: ${descricaoProduto}` : null,
    `Valor: ${payment.transaction_amount ?? "Não informado"} ${payment.currency_id || "BRL"}`,
    `Pagamento: ${paymentId}`,
    "",
    "Em caso de dúvidas, fale com nosso atendimento pelo WhatsApp:",
    "https://wa.me/5519995287194",
  ].filter(Boolean).join("\n");

  const resposta = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `mercadopago-buyer-approved-${paymentId}`,
    },
    body: JSON.stringify({
      from: remetente,
      to: [email],
      subject: `Pedido aprovado: ${payment.description || `pedido ${paymentId}`}`,
      text: texto,
    }),
  });

  if (!resposta.ok) {
    const detalhe = await resposta.text();
    throw new Error(`Resend respondeu HTTP ${resposta.status} ao enviar ao comprador: ${detalhe}`);
  }
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).json({ ativo: true });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ erro: "Método não permitido." });
  }

  const secret = process.env.MP_WEBHOOK_SECRET;
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

  if (!secret || !accessToken) {
    console.error("Webhook do Mercado Pago não configurado: faltam credenciais.");
    return res.status(500).json({ erro: "Webhook não configurado." });
  }

  const eventType = getValue(req.query?.type) || req.body?.type;
  if (eventType !== "payment") {
    return res.status(200).json({ recebido: true, ignorado: true });
  }

  const paymentId = getValue(req.query?.["data.id"]);
  if (!paymentId) {
    return res.status(400).json({ erro: "Identificador do pagamento ausente." });
  }

  try {
    WebhookSignatureValidator.validate({
      xSignature: req.headers["x-signature"],
      xRequestId: req.headers["x-request-id"],
      dataId: paymentId,
      secret,
    });
  } catch (error) {
    if (error instanceof InvalidWebhookSignatureError) {
      console.warn("Assinatura inválida em webhook do Mercado Pago.", {
        motivo: error.reason,
        requestId: error.requestId,
      });
      return res.status(401).json({ erro: "Assinatura inválida." });
    }

    console.error("Erro ao validar assinatura do webhook do Mercado Pago.", error);
    return res.status(500).json({ erro: "Não foi possível validar a notificação." });
  }

  try {
    const client = new MercadoPagoConfig({ accessToken });
    const paymentClient = new Payment(client);
    const payment = await paymentClient.get({ id: paymentId });
    let preferenceAddress = {};
    let preferencePayer = {};
    let descricaoProduto = "";

    if (payment.order?.id) {
      try {
        const merchantOrderClient = new MerchantOrder(client);
        const merchantOrder = await merchantOrderClient.get({
          merchantOrderId: payment.order.id,
        });

        if (merchantOrder.preference_id) {
          const preferenceClient = new Preference(client);
          const preference = await preferenceClient.get({
            preferenceId: merchantOrder.preference_id,
          });
          preferenceAddress = preference.shipments?.receiver_address || {};
          preferencePayer = preference.payer || {};
          descricaoProduto = preference.items?.[0]?.description || "";
        } else {
          console.warn("Pedido Mercado Pago sem preferência associada.", {
            paymentId,
            merchantOrderId: payment.order.id,
          });
        }
      } catch (error) {
        console.warn("Não foi possível consultar o endereço da preferência do pagamento.", {
          paymentId,
          merchantOrderId: payment.order.id,
          erro: error?.message || "Erro desconhecido",
        });
      }
    }

    const payerAddress = payment.payer?.address || payment.additional_info?.payer?.address || {};
    const receiverAddress = payment.additional_info?.shipments?.receiver_address || {};
    const deliveryAddress = {
      cep: preferenceAddress.zip_code || receiverAddress.zip_code || payerAddress.zip_code || null,
      rua: preferenceAddress.street_name || receiverAddress.street_name || payerAddress.street_name || null,
      numero: preferenceAddress.street_number || receiverAddress.street_number || payerAddress.street_number || null,
      complemento: preferenceAddress.apartment || receiverAddress.apartment || null,
      cidade: preferenceAddress.city_name || receiverAddress.city_name || null,
      estado: preferenceAddress.state_name || receiverAddress.state_name || null,
    };

    console.info("Pagamento consultado após notificação do Mercado Pago.", {
      evento: req.body?.action || "payment.updated",
      paymentId: payment.id || paymentId,
      status: payment.status || "desconhecido",
      statusDetail: payment.status_detail || null,
      liveMode: payment.live_mode ?? null,
      externalReference: payment.external_reference || null,
      enderecoEntrega: deliveryAddress,
    });

    if (payment.status === "approved") {
      const emailComprador = payment.payer?.email || preferencePayer.email;
      await Promise.all([
        enviarConfirmacaoComprador({
          payment,
          paymentId,
          email: emailComprador,
          descricaoProduto,
        }),
        enviarNotificacaoPedido({ payment, paymentId, deliveryAddress, preferencePayer }),
      ]);
      console.info("E-mails de pagamento aprovado enviados.", { paymentId });
    }

    return res.status(200).json({ recebido: true });
  } catch (error) {
    console.error("Erro ao consultar pagamento notificado pelo Mercado Pago.", {
      paymentId,
      erro: error?.message || "Erro desconhecido",
    });
    return res.status(500).json({ erro: "Não foi possível consultar o pagamento." });
  }
}
