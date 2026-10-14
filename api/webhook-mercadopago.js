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

async function enviarNotificacaoPedido({ payment, paymentId, deliveryAddress }) {
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

  const texto = [
    "Pagamento aprovado no site Hidrogen Brasil.",
    "",
    `Produto: ${payment.description || "Não informado"}`,
    `Valor: ${payment.transaction_amount ?? "Não informado"} ${payment.currency_id || "BRL"}`,
    `Pagamento: ${paymentId}`,
    `Referência do pedido: ${payment.external_reference || "Não informada"}`,
    "",
    "Endereço de entrega:",
    ...(addressLines.length ? addressLines : ["Não retornado pelo Mercado Pago."]),
  ].join("\n");

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
      subject: `Pagamento aprovado: ${payment.description || `pedido ${paymentId}`}`,
      text: texto,
    }),
  });

  if (!resposta.ok) {
    const detalhe = await resposta.text();
    throw new Error(`Resend respondeu HTTP ${resposta.status}: ${detalhe}`);
  }
}

export default async function handler(req, res) {
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
      await enviarNotificacaoPedido({ payment, paymentId, deliveryAddress });
      console.info("Notificação de pagamento aprovado enviada por e-mail.", { paymentId });
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
