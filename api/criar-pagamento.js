import mercadopago from "mercadopago";

mercadopago.configurations.setAccessToken(process.env.MERCADO_PAGO_ACCESS_TOKEN);

export default async function handler(req, res) {
  try {
    const { produto } = req.body;

    const preference = {
      items: [
        {
          title: produto.nome,
          quantity: produto.quantidade || 1,
          unit_price: Number(produto.preco),
          currency_id: "BRL"
        }
      ],
      back_urls: {
        success: "https://seusite.com/sucesso",
        failure: "https://seusite.com/falha",
        pending: "https://seusite.com/pendente"
      },
      auto_return: "approved"
    };

    const response = await mercadopago.preferences.create(preference);

    return res.status(200).json({ checkout: response.body.init_point });
  } catch (error) {
    console.error("Erro Mercado Pago:", error);
    return res.status(500).json({ error: "Erro ao criar pagamento" });
  }
}