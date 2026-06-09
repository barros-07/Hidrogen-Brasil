// ═══════════════════════════════════════
// NÚMERO WHATSAPP
// ═══════════════════════════════════════
const WPP = '5519995287194';

// ═══════════════════════════════════════
// PRODUTOS — Checkout Mercado Pago
// ═══════════════════════════════════════
console.log('script.js carregado');
const produtos = {
  'comprar-h1':           { nome: 'Maçarico H1',                                          preco: 2699 },
  'comprar-h1r':          { nome: 'Maçarico H1R',                                         preco: 4699 },
  'comprar-agulhas':      { nome: 'Agulhas (5 unidades)',                                  preco: 100  },
  'comprar-eletrolitos':  { nome: 'Eletrólitos (10 unidades)',                             preco: 120  },
  'comprar-borbulhador':  { nome: 'Borbulhador',                                           preco: 120  },
  'comprar-reservatorio': { nome: 'Reservatório',                                          preco: 120  },
  'comprar-mangueira':    { nome: 'Mangueira Completa',                                    preco: 150  },
  'comprar-kit1':         { nome: 'Kit 1 — Borbulhador + Reservatório + Mangueira',        preco: 350  },
  'comprar-kit2':         { nome: 'Kit 2 — 5 Agulhas + 10 Eletrólitos',                   preco: 200  },
  'comprar-kit3':         { nome: 'Kit 3 — Borbulhador + Reservatório + Mangueira + 5 Agulhas + 10 Eletrólitos', preco: 500 },
};

Object.entries(produtos).forEach(([id, produto]) => {
  const botao = document.getElementById(id);
  console.log('botão encontrado para checkout:', id, !!botao);
  if (!botao) return;

  botao.addEventListener('click', async (e) => {
    e.preventDefault();

    try {
      const resposta = await fetch('/api/criar-pagamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ produto: { ...produto, quantidade: 1 } })
      });

      const dados = await resposta.json();

      if (dados.checkout) {
        window.location.href = dados.checkout;
      } else {
        console.error(dados);
        alert('Erro ao gerar pagamento. Tente pelo WhatsApp.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao conectar. Tente pelo WhatsApp.');
    }
  });
});

// ═══════════════════════════════════════
// WHATSAPP — Mensagens por produto
// ═══════════════════════════════════════
const wppTextos = {
  'wpp-h1':           'Olá! Tenho interesse no Maçarico H1 (R$2.699,00). Meu CEP é: ',
  'wpp-h1r':          'Olá! Tenho interesse no Maçarico H1R (R$4.699,00). Meu CEP é: ',
  'wpp-agulhas':      'Olá! Quero pedir Agulhas (5 unidades) por R$100,00. Meu CEP é: ',
  'wpp-eletrolitos':  'Olá! Quero pedir Eletrólitos (10 unidades) por R$120,00. Meu CEP é: ',
  'wpp-borbulhador':  'Olá! Quero pedir um Borbulhador por R$120,00. Meu CEP é: ',
  'wpp-reservatorio': 'Olá! Quero pedir um Reservatório por R$120,00. Meu CEP é: ',
  'wpp-mangueira':    'Olá! Quero pedir a Mangueira Completa por R$150,00. Meu CEP é: ',
  'wpp-kit1':         'Olá! Quero pedir o Kit 1 (Borbulhador + Reservatório + Mangueira) por R$350,00. Meu CEP é: ',
  'wpp-kit2':         'Olá! Quero pedir o Kit 2 (5 Agulhas + 10 Eletrólitos) por R$200,00. Meu CEP é: ',
  'wpp-kit3':         'Olá! Quero pedir o Kit 3 completo por R$500,00. Meu CEP é: ',
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