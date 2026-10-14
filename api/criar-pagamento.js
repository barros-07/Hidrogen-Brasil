import { MercadoPagoConfig, Preference } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN
});

const BASE_URL = "https://www.hidrogenbrasil.com.br";
const IMG_URL  = `${BASE_URL}/imagem`;

const PRODUTOS = {
  'Agulhas (5 unidades)': {
    descricao: 'Kit com 5 agulhas de reposição para maçarico HidrogenBrasil.',
    imagem: `${IMG_URL}/agulha-extrafina.webp`,
  },
  'Eletrólitos (10 unidades)': {
    descricao: 'Kit com 10 eletrólitos para manutenção do gerador de hidrogênio.',
    imagem: `${IMG_URL}/eletrolitos.webp`,
  },
  'Borbulhador': {
    descricao: 'Borbulhador de reposição para gerador HidrogenBrasil.',
    imagem: `${IMG_URL}/borbulhador.webp`,
  },
  'Reservatório': {
    descricao: 'Reservatório de reposição para gerador HidrogenBrasil.',
    imagem: `${IMG_URL}/reservatório.webp`,
  },
  'Mangueira Completa': {
    descricao: 'Mangueira completa de reposição para maçarico HidrogenBrasil.',
    imagem: `${IMG_URL}/mangueira.webp`,
  },
  'Kit 1 — Borbulhador + Reservatório + Mangueira': {
    descricao: 'Kit 1 HidrogenBrasil: Borbulhador + Reservatório + Mangueira completa.',
    imagem: `${IMG_URL}/borbulhador.webp`,
  },
  'Kit 2 — 5 Agulhas + 10 Eletrólitos': {
    descricao: 'Kit 2 HidrogenBrasil: 5 Agulhas + 10 Eletrólitos.',
    imagem: `${IMG_URL}/agulha-extrafina.webp`,
  },
  'Kit 3 — Borbulhador + Reservatório + Mangueira + 5 Agulhas + 10 Eletrólitos': {
    descricao: 'Kit 3 HidrogenBrasil completo: Borbulhador + Reservatório + Mangueira + 5 Agulhas + 10 Eletrólitos.',
    imagem: `${IMG_URL}/borbulhador.webp`,
  },
  'Maçarico H1': {
    descricao: 'Maçarico HidrogenBrasil H1 — gerador de hidrogênio para uso profissional.',
    imagem: `${IMG_URL}/maçarico-na-estante-frontal.webp`,
  },
  'Maçarico H1R': {
    descricao: 'Maçarico HidrogenBrasil H1R — modelo avançado com maior capacidade.',
    imagem: `${IMG_URL}/maçarico-na-estante-na-diagonal.webp`,
  },
};

export default async function handler(req, res) {
  try {
    if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
      return res.status(500).json({ erro: "MERCADO_PAGO_ACCESS_TOKEN não configurado." });
    }

    const checkoutMode = process.env.MERCADO_PAGO_CHECKOUT_MODE;
    if (checkoutMode !== "sandbox" && checkoutMode !== "production") {
      return res.status(500).json({
        erro: "MERCADO_PAGO_CHECKOUT_MODE deve ser configurado como sandbox ou production."
      });
    }

    const { produto, comprador } = req.body || {};

    if (!produto || !produto.nome || !produto.preco) {
      return res.status(400).json({ erro: "Dados do produto inválidos." });
    }

    if (!comprador || typeof comprador !== "object" || Array.isArray(comprador)) {
      return res.status(400).json({ erro: "Informe o CEP e o endereço de entrega." });
    }

    const cep = typeof comprador.cep === "string" ? comprador.cep.replace(/\D/g, "") : "";
    const rua = typeof comprador.rua === "string" ? comprador.rua.trim() : "";
    const numero = typeof comprador.numero === "string" ? comprador.numero.trim() : "";
    const complemento = typeof comprador.complemento === "string" ? comprador.complemento.trim() : "";
    const cidade = typeof comprador.cidade === "string" ? comprador.cidade.trim() : "";
    const estado = typeof comprador.estado === "string" ? comprador.estado.trim().toUpperCase() : "";

    if (
      !/^\d{8}$/.test(cep) ||
      !rua || rua.length > 120 ||
      !numero || numero.length > 20 ||
      complemento.length > 80 ||
      !cidade || cidade.length > 80 ||
      !/^[A-Z]{2}$/.test(estado)
    ) {
      return res.status(400).json({ erro: "Confira os dados do comprador e o endereço de entrega." });
    }

    const extra = PRODUTOS[produto.nome] || {};

    const preference = new Preference(client);

    const response = await preference.create({
  body: {
    items: [
      {
        title: produto.nome,
        description: extra.descricao || produto.nome,
        picture_url: extra.imagem || null,
        quantity: Number(produto.quantidade || 1),
        unit_price: Number(produto.preco),
        currency_id: 'BRL',
      }
    ],
    back_urls: {
      success: `${BASE_URL}/?status=sucesso`,
      failure: `${BASE_URL}/?status=falha`,
      pending: `${BASE_URL}/?status=pendente`,
    },
    auto_return: 'approved',
    external_reference: `HB-${Date.now()}`,
    expires: true,
    expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    shipments: {
      receiver_address: {
        zip_code: cep,
        street_name: rua,
        street_number: numero,
        apartment: complemento,
        city_name: cidade,
        state_name: estado,
        country_name: "Brasil",
      }
    },
  }
});

    const checkout = checkoutMode === "sandbox"
      ? response?.sandbox_init_point
      : response?.init_point;

    if (!checkout) {
      return res.status(502).json({
        erro: `Mercado Pago não retornou o link de checkout do modo ${checkoutMode}.`
      });
    }

    return res.status(200).json({ checkout });

  } catch (error) {
    const detalhe = error?.response?.data || error?.cause || null;
    console.error("Erro ao criar preferência:", detalhe || error);
    return res.status(500).json({
      erro: error?.message || "Erro interno ao criar checkout.",
      detalhes: detalhe
    });
  }
}