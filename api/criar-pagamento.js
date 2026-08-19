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
    const { produto } = req.body || {};

    if (!produto || !produto.nome || !produto.preco) {
      return res.status(400).json({ erro: "Dados do produto inválidos." });
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
      }
    });

    return res.status(200).json({ checkout: response?.init_point || null });

  } catch (error) {
    const detalhe = error?.response?.data || error?.cause || null;
    console.error("Erro ao criar preferência:", detalhe || error);
    return res.status(500).json({
      erro: error?.message || "Erro interno ao criar checkout.",
      detalhes: detalhe
    });
  }
}