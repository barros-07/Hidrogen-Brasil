import { MercadoPagoConfig, Preference } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN
});

export default async function handler(req, res) {
  try {
    const { produto } = req.body || {};

    if (!produto || !produto.nome || !produto.preco) {
      return res.status(400).json({
        erro: "Dados do produto inválidos."
      });
    }

    const preference = new Preference(client);

    const response = await preference.create({
      body: {
        items: [
          {
            title: produto.nome,
            quantity: Number(produto.quantidade || 1),
            unit_price: Number(produto.preco)
          }
        ]
      }
    });

    return res.status(200).json({
      checkout: response?.body?.init_point || null
    });
  } catch (error) {
    console.error("Erro ao criar preferência:", error);
    return res.status(500).json({
      erro: error?.message || "Erro interno ao criar checkout."
    });
  }
}