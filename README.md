# Hidrogen

Projeto desenvolvido com foco na estruturação digital e valorização tecnológica da marca Hidrogen e de seus produtos à base de hidrogênio.

---

## Objetivo

Criar uma apresentação mais profissional da empresa, melhorando a identidade visual, organização digital e experiência de divulgação dos produtos.

---

## Funcionalidades

- Tratamento e aprimoramento de imagens dos produtos;
- Organização da vitrine digital;
- Estudo de integração com e-commerce;
- Desenvolvimento visual para divulgação comercial;
- Estruturação da presença digital da marca.

---

## Tecnologias e Ferramentas

- Edição de imagens com IA;
- Estratégias de marketing digital;
- Plataformas de e-commerce;
- Desenvolvimento visual e branding.

---

## Aplicação

O projeto busca fortalecer o posicionamento da Hidrogen no mercado, aumentando a percepção de valor dos produtos e melhorando a comunicação com clientes.

## Testar pagamentos com Mercado Pago

1. Crie uma aplicação em [Mercado Pago Developers](https://www.mercadopago.com.br/developers/panel/app) e abra a área **Credenciais de teste**.
2. Copie o **Access Token de teste**. Use somente essa credencial no ambiente de testes e nunca a publique no `script.js` ou no HTML.
3. Na Vercel, abra o projeto em **Settings > Environment Variables** e crie `MERCADO_PAGO_ACCESS_TOKEN` com o token de teste. Marque **Preview** e faça um novo deploy.
4. Para testar como comprador, use um usuário de teste criado no painel do Mercado Pago e os cartões de teste indicados na documentação. Não use seu cartão real.

O endpoint usa `sandbox_init_point` quando a credencial de teste está ativa. Para testar localmente, instale as dependências dentro de `api`, defina a variável de ambiente e execute com a Vercel CLI (`vercel dev`), porque o site precisa chamar a função `/api/criar-pagamento`.

---

## Autor

**Henrique Barros**
Henrique Barros
