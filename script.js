 // Navbar scroll effect
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 40);
});
 
// Mobile menu
function toggleMenu() {
  document.getElementById('mobileMenu').classList.toggle('open');
  document.body.style.overflow = document.getElementById('mobileMenu').classList.contains('open') ? 'hidden' : '';
}
 
// FAQ accordion
window.toggleFaq = function(el) {
  const item = el.parentElement;
  const answer = item.querySelector('.faq-answer');
  const isOpen = item.classList.contains('open');
  // Fecha todos
  document.querySelectorAll('.faq-item.open').forEach(i => {
    i.classList.remove('open');
    i.querySelector('.faq-answer').style.maxHeight = '0';
  });
  // Abre o clicado se estava fechado
  if (!isOpen) {
    item.classList.add('open');
    answer.style.maxHeight = answer.scrollHeight + 'px';
  }
}
 
// Lead form → WhatsApp
function submitLead(e) {
  e.preventDefault();
  const form = e.target;
  const name = form.querySelector('input[type="text"]').value;
  const phone = form.querySelector('input[type="tel"]').value;
  const cep = form.querySelectorAll('input')[2].value;
  const product = form.querySelector('select').value;
  const msg = encodeURIComponent(`Olá! Meu nome é ${name}, WhatsApp: ${phone}. CEP: ${cep || 'não informado'}. Interesse: ${product}`);
  window.open(`https://wa.me/5500000000000?text=${msg}`, '_blank');
}
 
// Contact form → WhatsApp
function submitContact(e) {
  e.preventDefault();
  const form = e.target;
  const name = form.querySelector('input[type="text"]').value;
  const phone = form.querySelector('input[type="tel"]').value;
  const msg = form.querySelector('textarea').value;
  const text = encodeURIComponent(`Olá! Me chamo ${name} (${phone}). ${msg}`);
  window.open(`https://wa.me/5500000000000?text=${text}`, '_blank');
}
 
// Animate elements on scroll
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
 
// Carousel
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
