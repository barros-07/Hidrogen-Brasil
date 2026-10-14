// ═══════════════════════════════════════
// NÚMERO WHATSAPP
// ═══════════════════════════════════════
const WPP = '5519995287194';

// ═══════════════════════════════════════
// PRODUTOS — Checkout Mercado Pago
// ═══════════════════════════════════════
console.log('script.js carregado');
// ═══════════════════════════════════════
// NO EVENT DELEGATION NEEDED — CSS handles pointer-events
// ═══════════════════════════════════════
const produtos = {
  'comprar-h1':           { nome: 'Maçarico H1',                                          preco: 3299 },
  'comprar-h1r':          { nome: 'Maçarico H1R',                                         preco: 5299 },
  'comprar-agulhas':      { nome: 'Agulhas (5 unidades)',                                  preco: 120  },
  'comprar-eletrolitos':  { nome: 'Eletrólitos (10 unidades)',                             preco: 150  },
  'comprar-borbulhador':  { nome: 'Borbulhador',                                           preco: 150  },
  'comprar-reservatorio': { nome: 'Reservatório',                                          preco: 150  },
  'comprar-mangueira':    { nome: 'Mangueira Completa',                                    preco: 200  },
  'comprar-tampa-reservatorio': { nome: 'Tampa do reservatório',                           preco: 30   },
  'comprar-kit1':         { nome: 'Kit 02 — Estrutural (Borbulhador + Reservatório + Mangueira)', preco: 400 },
  'comprar-kit2':         { nome: 'Kit 01 — Reposição (5 Agulhas + 10 Eletrólitos)',       preco: 250  },
  'comprar-kit3':         { nome: 'Kit 03 — Completo (Borbulhador + Reservatório + Mangueira + 5 Agulhas + 10 Eletrólitos)', preco: 550 },
};

// ═══════════════════════════════════════
// CHECKOUT DIRETO
// ═══════════════════════════════════════
async function iniciarCheckout(produto, comprador) {
  try {
    const resposta = await fetch('/api/criar-pagamento', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        produto: { ...produto, quantidade: 1 },
        comprador
      })
    });

    const dados = await resposta.json();

    if (resposta.ok && dados.checkout) {
      window.location.href = dados.checkout;
    } else {
      throw new Error(dados.erro || 'Erro ao gerar pagamento. Tente pelo WhatsApp.');
    }
  } catch (error) {
    console.error('Erro ao conectar ao checkout:', error);
    throw error instanceof Error && error.message
      ? error
      : new Error('Erro ao conectar. Tente novamente ou fale pelo WhatsApp.');
  }
}

const checkoutDialog = document.getElementById('checkoutAddressDialog');
const checkoutForm = document.getElementById('checkoutAddressForm');
const checkoutError = document.getElementById('checkoutAddressError');
const checkoutSubmit = document.getElementById('checkoutAddressSubmit');
const checkoutCep = checkoutForm.elements.cep;
const checkoutPreview = document.getElementById('checkoutAddressPreview');
const manualAddress = document.getElementById('checkoutManualAddress');
const manualAddressFields = ['rua', 'cidade', 'estado'].map((name) => checkoutForm.elements[name]);
let produtoSelecionado = null;
let botaoCheckoutSelecionado = null;
let cepConsultado = '';
let enderecoCep = null;

function definirEnderecoManual(ativo) {
  manualAddress.hidden = !ativo;
  manualAddress.open = ativo;
  manualAddressFields.forEach((field) => {
    field.disabled = !ativo;
    field.required = ativo;
  });
}

function limparEnderecoCep() {
  cepConsultado = '';
  enderecoCep = null;
  checkoutPreview.hidden = true;
  checkoutPreview.textContent = '';
  definirEnderecoManual(false);
  manualAddressFields.forEach((field) => { field.value = ''; });
}

async function consultarCep() {
  const cep = checkoutCep.value.replace(/\D/g, '');
  if (!/^\d{8}$/.test(cep)) {
    checkoutPreview.textContent = 'Digite um CEP válido com 8 números.';
    checkoutPreview.hidden = false;
    limparEnderecoCep();
    return false;
  }
  if (cep === cepConsultado && enderecoCep) return true;

  checkoutPreview.textContent = 'Buscando endereço pelo CEP...';
  checkoutPreview.hidden = false;
  try {
    const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    if (!resposta.ok) throw new Error(`ViaCEP respondeu com HTTP ${resposta.status}.`);

    const endereco = await resposta.json();
    if (endereco.erro) throw new Error('CEP não encontrado.');

    cepConsultado = cep;
    enderecoCep = {
      rua: endereco.logradouro || '',
      cidade: endereco.localidade || '',
      estado: (endereco.uf || '').toUpperCase(),
    };

    if (!enderecoCep.rua) {
      checkoutPreview.textContent = 'CEP localizado. Informe a rua para completar o endereço.';
      definirEnderecoManual(true);
    } else {
      const bairro = endereco.bairro ? `, ${endereco.bairro}` : '';
      checkoutPreview.textContent = `${enderecoCep.rua}${bairro} — ${enderecoCep.cidade}/${enderecoCep.estado}`;
      checkoutPreview.hidden = false;
      definirEnderecoManual(false);
    }
    return true;
  } catch (error) {
    console.error('Não foi possível consultar o CEP:', error);
    cepConsultado = cep;
    enderecoCep = null;
    checkoutPreview.textContent = 'Não conseguimos localizar esse CEP automaticamente. Preencha rua, cidade e estado.';
    checkoutPreview.hidden = false;
    definirEnderecoManual(true);
    return false;
  }
}

checkoutCep.addEventListener('input', (event) => {
  const input = event.currentTarget;
  const digits = input.value.replace(/\D/g, '').slice(0, 8);
  input.value = digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
  limparEnderecoCep();
});

checkoutCep.addEventListener('blur', consultarCep);

checkoutForm.elements.estado.addEventListener('input', (event) => {
  event.currentTarget.value = event.currentTarget.value.toUpperCase().slice(0, 2);
});

checkoutForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!produtoSelecionado || !botaoCheckoutSelecionado) return;

  checkoutError.hidden = true;
  checkoutSubmit.disabled = true;
  checkoutSubmit.textContent = 'Preparando pagamento...';
  botaoCheckoutSelecionado.disabled = true;

  if (checkoutCep.value.replace(/\D/g, '') !== cepConsultado) {
    const encontrado = await consultarCep();
    if (!encontrado) {
      checkoutSubmit.disabled = false;
      checkoutSubmit.textContent = 'Continuar para pagamento';
      botaoCheckoutSelecionado.disabled = false;
      return;
    }
  }

  const dados = new FormData(checkoutForm);
  const comprador = {
    cep: checkoutCep.value.replace(/\D/g, ''),
    rua: String(dados.get('rua') || enderecoCep?.rua || '').trim(),
    numero: String(dados.get('numero') || '').trim(),
    complemento: String(dados.get('complemento') || '').trim(),
    cidade: String(dados.get('cidade') || enderecoCep?.cidade || '').trim(),
    estado: String(dados.get('estado') || enderecoCep?.estado || '').trim(),
  };

  if (!comprador.rua || !comprador.cidade || !comprador.estado) {
    checkoutError.textContent = 'Confira o endereço de entrega antes de continuar.';
    checkoutError.hidden = false;
    checkoutSubmit.disabled = false;
    checkoutSubmit.textContent = 'Continuar para pagamento';
    botaoCheckoutSelecionado.disabled = false;
    return;
  }

  try {
    await iniciarCheckout(produtoSelecionado, comprador);
  } catch (error) {
    checkoutError.textContent = error.message;
    checkoutError.hidden = false;
    checkoutSubmit.disabled = false;
    checkoutSubmit.textContent = 'Continuar para pagamento';
    botaoCheckoutSelecionado.disabled = false;
  }
});

function fecharCheckoutDialog() {
  checkoutDialog.close();
  produtoSelecionado = null;
  botaoCheckoutSelecionado = null;
  checkoutForm.reset();
  checkoutError.hidden = true;
  limparEnderecoCep();
}

document.getElementById('checkoutAddressClose').addEventListener('click', fecharCheckoutDialog);
document.getElementById('checkoutAddressCancel').addEventListener('click', fecharCheckoutDialog);
checkoutDialog.addEventListener('click', (event) => {
  if (event.target === checkoutDialog) fecharCheckoutDialog();
});

Object.entries(produtos).forEach(([id, produto]) => {
  const botao = document.getElementById(id);
  if (!botao) return;
  botao.addEventListener('click', (e) => {
    e.preventDefault();
    produtoSelecionado = produto;
    botaoCheckoutSelecionado = botao;
    checkoutForm.reset();
    limparEnderecoCep();
    checkoutError.hidden = true;
    checkoutSubmit.disabled = false;
    checkoutSubmit.textContent = 'Continuar para pagamento';
    checkoutDialog.showModal();
  });
});

// ═══════════════════════════════════════
// WHATSAPP — Mensagens por produto
// ═══════════════════════════════════════
const wppTextos = {
  'wpp-h1':           'Olá! Tenho interesse no Maçarico H1 (R$3.299,00). Meu CEP é: ',
  'wpp-h1r':          'Olá! Tenho interesse no Maçarico H1R (R$5.299,00). Meu CEP é: ',
  'wpp-agulhas':      'Olá! Quero pedir Agulhas (5 unidades) por R$120,00. Meu CEP é: ',
  'wpp-eletrolitos':  'Olá! Quero pedir Eletrólitos (10 unidades) por R$150,00. Meu CEP é: ',
  'wpp-borbulhador':  'Olá! Quero pedir um Borbulhador por R$150,00. Meu CEP é: ',
  'wpp-reservatorio': 'Olá! Quero pedir um Reservatório por R$150,00. Meu CEP é: ',
  'wpp-mangueira':    'Olá! Quero pedir a Mangueira Completa por R$200,00. Meu CEP é: ',
  'wpp-kit1':         'Olá! Quero pedir o Kit 02 Estrutural (Borbulhador + Reservatório + Mangueira) por R$400,00. Meu CEP é: ',
  'wpp-kit2':         'Olá! Quero pedir o Kit 01 de Reposição (5 Agulhas + 10 Eletrólitos) por R$250,00. Meu CEP é: ',
  'wpp-kit3':         'Olá! Quero pedir o Kit 03 Completo por R$550,00. Meu CEP é: ',
};

Object.entries(wppTextos).forEach(([id, texto]) => {
  const botao = document.getElementById(id);
  if (!botao) return;
  botao.addEventListener('click', (e) => {
    e.preventDefault();
    window.open(`https://wa.me/${WPP}?text=${encodeURIComponent(texto)}`, '_blank');
  });
});

// ═══════════════════════════════════════
// NAVBAR scroll effect
// ═══════════════════════════════════════
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 40);
});

// ═══════════════════════════════════════
// MOBILE MENU
// ═══════════════════════════════════════
function toggleMenu() {
  const menu = document.getElementById('mobileMenu');
  menu.classList.toggle('open');
  document.body.style.overflow = menu.classList.contains('open') ? 'hidden' : '';
}

// ═══════════════════════════════════════
// FAQ ACCORDION
// ═══════════════════════════════════════
window.toggleFaq = function(el) {
  const item = el.parentElement;
  const answer = item.querySelector('.faq-answer');
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(i => {
    i.classList.remove('open');
    i.querySelector('.faq-answer').style.maxHeight = '0';
  });
  if (!isOpen) {
    item.classList.add('open');
    answer.style.maxHeight = answer.scrollHeight + 'px';
  }
};

// ═══════════════════════════════════════
// LEAD FORM → WhatsApp
// ═══════════════════════════════════════
function submitLead(e) {
  e.preventDefault();
  const form = e.target;
  const name = form.querySelector('input[type="text"]').value;
  const phone = form.querySelector('input[type="tel"]').value;
  const cep = form.querySelectorAll('input')[2].value;
  const product = form.querySelector('select').value;
  const msg = encodeURIComponent(`Olá! Meu nome é ${name}, WhatsApp: ${phone}. CEP: ${cep || 'não informado'}. Interesse: ${product}`);
  window.open(`https://wa.me/${WPP}?text=${msg}`, '_blank');
}

// ═══════════════════════════════════════
// CONTACT FORM → WhatsApp
// ═══════════════════════════════════════
function submitContact(e) {
  e.preventDefault();
  const form = e.target;
  const name = form.querySelector('input[type="text"]').value;
  const phone = form.querySelector('input[type="tel"]').value;
  const msg = form.querySelector('textarea').value;
  const text = encodeURIComponent(`Olá! Me chamo ${name} (${phone}). ${msg}`);
  window.open(`https://wa.me/${WPP}?text=${text}`, '_blank');
}

// ═══════════════════════════════════════
// ANIMATE ON SCROLL
// ═══════════════════════════════════════
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.opacity = '1';
      e.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.product-card, .kit-card, .benefit-card, .testimonial-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(24px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  observer.observe(el);
});

// ═══════════════════════════════════════
// CAROUSEL
// ═══════════════════════════════════════
(function() {
  var state = {};
  function init(id, total) {
    state[id] = { cur: 0, total: total };
  }
  init('h1', 3);
  init('h1r', 2);

  window.carMove = function(id, dir) {
    var s = state[id];
    s.cur = (s.cur + dir + s.total) % s.total;
    render(id);
  };

  window.carGo = function(id, idx) {
    state[id].cur = idx;
    render(id);
  };

  function render(id) {
    var s = state[id];
    var track = document.getElementById('car-' + id + '-track');
    if (track) track.style.transform = 'translateX(-' + (s.cur * 100) + '%)';
    var dots = document.querySelectorAll('#car-' + id + '-dots .prod-carousel-dot');
    dots.forEach(function(d, i) { d.classList.toggle('active', i === s.cur); });
  }
})();
// ═══════════════════════════════════════
// STATUS PÓS-PAGAMENTO
// ═══════════════════════════════════════
;(function() {
  const params = new URLSearchParams(window.location.search);
  const status = params.get('status');
  if (!status) return;

  const mensagens = {
    sucesso: { texto: '✅ Pagamento aprovado! Em breve entraremos em contato para combinar a entrega.', cor: 'var(--c-green)' },
    falha:   { texto: '❌ Pagamento não aprovado. Tente novamente ou fale conosco pelo WhatsApp.', cor: '#ff6b6b' },
    pendente:{ texto: '⏳ Pagamento pendente. Assim que confirmado, entraremos em contato.', cor: 'var(--c-gold)' },
  };

  const m = mensagens[status];
  if (!m) return;

  const banner = document.createElement('div');
  banner.style.cssText = `
    position: fixed;
    top: 90px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--c-navy-mid);
    border: 1px solid ${m.cor};
    color: var(--c-white);
    padding: 16px 28px;
    border-radius: var(--radius);
    font-size: 15px;
    font-family: var(--font-body);
    box-shadow: 0 4px 30px rgba(0,0,0,0.4);
    z-index: 3000;
    max-width: 500px;
    width: 90%;
    text-align: center;
  `;
  banner.textContent = m.texto;

  document.body.appendChild(banner);

  // remove após 6 segundos
  setTimeout(() => banner.remove(), 6000);

  // limpa o ?status= da URL sem recarregar
  window.history.replaceState({}, '', window.location.pathname);
})();
