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
3. Na Vercel, abra o projeto em **Settings > Environment Variables** e configure `MERCADO_PAGO_ACCESS_TOKEN` e `MERCADO_PAGO_CHECKOUT_MODE` no ambiente do deploy que será usado. Use o Access Token de teste com `MERCADO_PAGO_CHECKOUT_MODE=sandbox` para testes; para vendas reais, use o Access Token de produção com `MERCADO_PAGO_CHECKOUT_MODE=production`. Preview e Production são ambientes de deploy separados, e uma alteração de variável exige um novo deploy.
4. Para testar como comprador, use um usuário de teste criado no painel do Mercado Pago e os cartões de teste indicados na documentação. Não use seu cartão real.

O endpoint usa `sandbox_init_point` quando a credencial de teste está ativa. Para testar localmente, instale as dependências dentro de `api`, defina a variável de ambiente e execute com a Vercel CLI (`vercel dev`), porque o site precisa chamar a função `/api/criar-pagamento`.

## Webhook de pagamentos Mercado Pago

O endpoint público `https://www.hidrogenbrasil.com.br/api/webhook-mercadopago` recebe notificações do tipo **Pagamentos**, valida a assinatura usando o segredo do webhook e consulta o pagamento na API do Mercado Pago. O status e detalhes básicos são registrados nos logs da função na Vercel. O projeto ainda não tem banco de dados, então esses logs não substituem um histórico persistente de pedidos. Consulte também a [documentação oficial de Webhooks](https://www.mercadopago.com.br/developers/pt/docs/checkout-api-payments/additional-content/your-integrations/notifications/webhooks).

Antes de abrir o checkout, o site solicita somente o CEP e o número da residência (complemento opcional). O endereço é preenchido pelo ViaCEP; se a busca não localizar uma rua, o comprador pode informar rua, cidade e estado manualmente. A documentação do Checkout Pro não garante a coleta automática do endereço de entrega, então o site envia o endereço de entrega na preferência. Nome e dados de pagamento são preenchidos no fluxo do Mercado Pago. Após a notificação, o webhook registra nos logs o endereço que a API retornar.

Para configurar:

1. Na aplicação correta do painel do Mercado Pago, abra **Webhooks** e configure a URL de teste e/ou a URL de produção, conforme o ambiente que será usado. Selecione o evento **Pagamentos**.
2. Copie o segredo de assinatura exibido na configuração do webhook.
3. Na Vercel, configure `MP_WEBHOOK_SECRET` com esse segredo e confirme que `MERCADO_PAGO_ACCESS_TOKEN` também está definido para o mesmo ambiente/conta do Mercado Pago. Não coloque nenhum dos valores no HTML ou no JavaScript do navegador.
4. Faça um novo deploy e use a opção de simulação de notificações do painel. Confira os logs da função `webhook-mercadopago` na Vercel para ver o status consultado.

Se o teste estiver sendo feito em Preview, configure os dois valores para Preview e use a URL pública desse deploy como URL de teste do webhook. Para Production, configure os valores de Production e use a URL de produção. O endpoint responde com erro se a assinatura não for válida ou se não conseguir consultar o pagamento, para que o Mercado Pago possa tentar entregar a notificação novamente.

---

## Autor

**Henrique Barros**
Henrique Barros
