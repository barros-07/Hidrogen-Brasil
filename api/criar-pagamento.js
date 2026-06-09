import { MercadoPagoConfig, Preference } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN
});

export default async function handler(req, res) {
  try {

    const { produto } = req.body;

    const preference = new Preference(client);

    const response = await preference.create({
      body: {
        items: [
          {
            title: produto.nome,
            quantity: produto.quantidade || 1,
            unit_price: Number(produto.preco)
          }
        ]
      }
    });

    return res.status(200).json({
      checkout: response.init_point
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      erro: error.message
    });

  }
}