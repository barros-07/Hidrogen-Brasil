import {
  InvalidWebhookSignatureError,
  MercadoPagoConfig,
  Payment,
  WebhookSignatureValidator,
} from "mercadopago";

function getValue(value) {
  return Array.isArray(value) ? value[0] : value;
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
    const payerAddress = payment.payer?.address || payment.additional_info?.payer?.address || {};
    const receiverAddress = payment.additional_info?.shipments?.receiver_address || {};

    console.info("Pagamento consultado após notificação do Mercado Pago.", {
      evento: req.body?.action || "payment.updated",
      paymentId: payment.id || paymentId,
      status: payment.status || "desconhecido",
      statusDetail: payment.status_detail || null,
      liveMode: payment.live_mode ?? null,
      externalReference: payment.external_reference || null,
      enderecoEntrega: {
        cep: receiverAddress.zip_code || payerAddress.zip_code || null,
        rua: receiverAddress.street_name || payerAddress.street_name || null,
        numero: receiverAddress.street_number || payerAddress.street_number || null,
        complemento: receiverAddress.apartment || null,
        cidade: receiverAddress.city_name || null,
        estado: receiverAddress.state_name || null,
      },
    });

    return res.status(200).json({ recebido: true });
  } catch (error) {
    console.error("Erro ao consultar pagamento notificado pelo Mercado Pago.", {
      paymentId,
      erro: error?.message || "Erro desconhecido",
    });
    return res.status(500).json({ erro: "Não foi possível consultar o pagamento." });
  }
}
