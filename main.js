/* Rodrigo Barbosa — interações. Tudo aqui é progressivo: sem JS a página continua inteira. */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var desktop = window.matchMedia('(min-width: 960px)');
  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var WA = 'https://wa.me/5575981105474?text=';

  var nav = $('#nav');
  var panel = $('.stage-panel');

  /* ---------- menu no celular ---------- */
  var toggle = $('.nav-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.textContent = open ? 'Fechar' : 'Menu';
    });
    $$('.nav-links a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.textContent = 'Menu';
      });
    });
  }

  /* ---------- palco: no computador as peças marcadas mudam para a metade fixa ---------- */
  var pieces = $$('[data-stage]').map(function (el) {
    var mark = document.createComment('stage:' + el.getAttribute('data-stage'));
    el.parentNode.insertBefore(mark, el);
    return { el: el, mark: mark, name: el.getAttribute('data-stage'), layer: null };
  });

  function toStage() {
    pieces.forEach(function (p) {
      if (!p.layer) {
        p.layer = document.createElement('div');
        p.layer.className = 'layer';
        p.layer.setAttribute('data-layer', p.name);
        panel.appendChild(p.layer);
      }
      p.layer.appendChild(p.el);
    });
  }
  function toColumn() {
    pieces.forEach(function (p) {
      p.mark.parentNode.insertBefore(p.el, p.mark.nextSibling);
    });
  }
  function showLayer(name) {
    $$('.layer', panel).forEach(function (l) {
      l.classList.toggle('is-on', l.getAttribute('data-layer') === name);
    });
  }

  var layerWatch = null;
  function watchLayers() {
    if (layerWatch) { layerWatch.disconnect(); layerWatch = null; }
    if (!desktop.matches || reduce || !('IntersectionObserver' in window)) { showLayer('hero'); return; }
    var secs = $$('[data-stage-for]');
    layerWatch = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) showLayer(e.target.getAttribute('data-stage-for'));
      });
    }, { rootMargin: '-45% 0px -54% 0px', threshold: 0 });
    secs.forEach(function (s) { layerWatch.observe(s); });
  }

  function layout() {
    if (desktop.matches && !reduce) toStage(); else toColumn();
    watchLayers();
    if (hasGsap) window.ScrollTrigger.refresh();
  }
  layout();
  if (desktop.addEventListener) desktop.addEventListener('change', layout);
  else if (desktop.addListener) desktop.addListener(layout);

  /* ---------- barra: azul na primeira tela, clara depois ---------- */
  var hero = $('.hero');
  if (hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      nav.classList.toggle('is-paper', !entries[0].isIntersecting);
    }, { rootMargin: '-64px 0px 0px 0px', threshold: 0 }).observe(hero);
  }
  /* no contato e no rodape a barra sai de cena: o menu grande do rodape assume */
  var splitEl = $('.split');
  if (splitEl && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      nav.classList.toggle('is-away', !entries[0].isIntersecting);
    }, { rootMargin: '0px 0px -90% 0px', threshold: 0 }).observe(splitEl);
  }

  /* link ativo */
  var links = $$('.nav-links a');
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) {
          a.classList.toggle('is-here', a.getAttribute('href') === '#' + e.target.id);
        });
      });
    }, { rootMargin: '-40% 0px -59% 0px', threshold: 0 });
    $$('.read section[id]').forEach(function (s) { spy.observe(s); });
  }

  /* ---------- sinais: a parte viva ---------- */
  var form = $('#sinais-form');
  var count = $('#mapa-count');
  var send = $('#sinais-send');
  var sendLabel = $('#sinais-send-label');
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }
  function updateMapa(changed) {
    var checked = $$('input:checked', form);
    var doms = {};
    checked.forEach(function (i) { doms[i.getAttribute('data-dom')] = true; });
    $$('.mapa-list li').forEach(function (li) {
      var on = !!doms[li.getAttribute('data-dom')];
      var was = li.classList.contains('is-lit');
      li.classList.toggle('is-lit', on);
      if (on && !was && hasGsap && !reduce) {
        window.gsap.fromTo(li, { x: -10 }, { x: 0, duration: 0.6, ease: 'power3.out' });
      }
    });
    var nd = Object.keys(doms).length;
    count.textContent = checked.length
      ? plural(checked.length, 'sinal marcado', 'sinais marcados') + ', ' + plural(nd, 'função em foco', 'funções em foco') + '.'
      : 'Nenhum sinal marcado ainda.';
    var msg = 'Olá, Rodrigo. Gostaria de agendar uma avaliação neuropsicológica.';
    if (checked.length) {
      msg = 'Olá, Rodrigo. Marquei estes sinais no seu site e gostaria de conversar sobre uma avaliação:\n' +
        checked.map(function (i) { return '• ' + i.value; }).join('\n');
      sendLabel.textContent = 'Enviar meus sinais pelo WhatsApp';
    } else {
      sendLabel.textContent = 'Conversar sobre esses sinais';
    }
    send.href = WA + encodeURIComponent(msg);
  }
  if (form) {
    form.addEventListener('change', updateMapa);
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    updateMapa();
  }

  /* ---------- laudo: abas ---------- */
  var tabs = $$('.tabs button');
  function pickTab(btn) {
    tabs.forEach(function (b) { b.setAttribute('aria-selected', b === btn ? 'true' : 'false'); });
    var name = btn.getAttribute('data-tab');
    $$('.doc-block').forEach(function (bl) {
      bl.classList.toggle('is-on', bl.getAttribute('data-block') === name);
    });
  }
  tabs.forEach(function (b, i) {
    b.addEventListener('click', function () { pickTab(b); });
    b.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      n.focus(); pickTab(n);
    });
  });
  $$('.doc-block').forEach(function (bl) {
    bl.addEventListener('click', function () {
      var t = tabs.filter(function (b) { return b.getAttribute('data-tab') === bl.getAttribute('data-block'); })[0];
      if (t) pickTab(t);
    });
  });

  /* ---------- dúvidas: uma aberta por vez ---------- */
  var qs = $$('.qa details');
  qs.forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (!d.open) return;
      qs.forEach(function (o) { if (o !== d) o.open = false; });
      if (hasGsap && !reduce) {
        window.gsap.fromTo($('p', d), { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' });
      }
    });
  });

  /* ---------- movimento ---------- */
  if (!hasGsap || reduce) return;
  var gsap = window.gsap;
  var ST = window.ScrollTrigger;
  gsap.registerPlugin(ST);

  /* abertura: a logo dele se desenha, o nome aparece, a luz abre a pagina */
  var seen = false;
  try { seen = sessionStorage.getItem('rb-open') === '1'; sessionStorage.setItem('rb-open', '1'); } catch (err) { /* sem armazenamento */ }
  var opener = document.createElement('div');
  opener.className = 'opener';
  opener.innerHTML = '<svg class="logo-mark" viewBox="0 0 670 696" aria-hidden="true">' +
    '<path d="M104 680C50 642 15 584 15 512V100a85 85 0 0 1 85-85h302a157 157 0 0 1 157 157c0 62-30 108-78 138" fill="none" stroke="currentColor" stroke-width="30" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M15 327h466a174 174 0 0 1 174 174c0 78-48 142-116 166-18 6-32 2-44-10L190 340" fill="none" stroke="currentColor" stroke-width="30" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
    '<p class="logo-name">RODRIGO BARBOSA</p>' +
    '<p class="logo-tag">PSICÓLOGO CLÍNICO E NEUROPSICÓLOGO | CRP 03/25741</p>';
  document.body.appendChild(opener);
  var strokes = $$('path', opener);
  strokes.forEach(function (p) {
    var len = 2200;
    try { len = p.getTotalLength(); } catch (err) { /* mantem o valor padrao */ }
    p.style.strokeDasharray = len;
    p.style.strokeDashoffset = len;
  });
  var logoParts = $$('svg, p', opener);
  var hole = { r: 0 };
  function cut() {
    var m = 'radial-gradient(circle at 50% 50%, transparent ' + hole.r + 'vmax, #000 ' + (hole.r + 0.4) + 'vmax)'; /* taste-skill-ignore: mascara da abertura, nao e preenchimento */
    opener.style.webkitMaskImage = m;
    opener.style.maskImage = m;
  }

  var heroImg = $('.layer[data-layer="hero"] img');
  var intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
  if (seen) { opener.remove(); intro.progress(1); }
  intro
    .to(strokes[0], { strokeDashoffset: 0, duration: 0.42, ease: 'power2.inOut' }, 0)
    .to(strokes[1], { strokeDashoffset: 0, duration: 0.42, ease: 'power2.inOut' }, 0.12)
    .from('.opener .logo-name', { opacity: 0, x: -24, duration: 0.42 }, 0.24)
    .from('.opener .logo-tag', { opacity: 0, x: -16, duration: 0.4 }, 0.34)
    .to(logoParts, { opacity: 0, y: -10, duration: 0.3, ease: 'power2.in', stagger: 0.03 }, 0.66)
    .to(hole, { r: 80, duration: 0.42, ease: 'power2.in', onUpdate: cut }, 0.7)
    .from(heroImg, { scale: 1.1, duration: 1.6, ease: 'power2.out' }, 0.7)
    .from('.hero-title', { y: 26, duration: 0.6 }, 0.86)
    .from('.hero-sub, .hero-act, .hero-proof', { y: 22, opacity: 0, duration: 0.6, stagger: 0.07 }, 0.9)
    .from('.wordmark', { yPercent: 30, duration: 0.7 }, 0.88)
    .from('.nav-mark, .nav-links a, .nav-toggle, .nav-ig', { y: -10, opacity: 0, duration: 0.45, stagger: 0.04 }, 0.94)
    .add(function () { opener.remove(); }, 1.14);

  /* assinatura: o nome pesa e encolhe quando a primeira tela sai */
  gsap.to('.wordmark', {
    scale: 0.93, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });
  /* a foto do palco respira com a rolagem */
  gsap.to(heroImg, {
    yPercent: -3, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });

  /* o slogan: as letras entram deslizando da esquerda para a direita conforme a rolagem */
  var slide = $('.slide-text');
  if (slide) {
    var full = slide.textContent;
    slide.setAttribute('aria-label', full);
    slide.innerHTML = full.split(' ').map(function (w) {
      return '<span class="w" aria-hidden="true">' + w.split('').map(function (ch) {
        return '<span class="ch">' + ch + '</span>';
      }).join('') + '</span>';
    }).join(' ');
    var chars = $$('.ch', slide);
    gsap.fromTo(chars,
      { x: -22, opacity: 0.12 },
      { x: 0, opacity: 1, ease: 'power2.out', stagger: 0.035, duration: 0.6,
        scrollTrigger: {
          trigger: desktop.matches ? '.intro' : '.quote-card',
          start: desktop.matches ? 'top 85%' : 'top 75%',
          end: desktop.matches ? 'top 15%' : 'center 45%',
          scrub: 0.6
        } });
    gsap.fromTo(['.quote-mark', '.quote-by'], { x: -40, opacity: 0.2 }, { x: 0, opacity: 1, ease: 'none',
      scrollTrigger: {
        trigger: desktop.matches ? '.intro' : '.quote-card',
        start: desktop.matches ? 'top 85%' : 'top 75%',
        end: desktop.matches ? 'top 40%' : 'top 35%',
        scrub: 0.6
      } });
  }

  /* a luz acende */
  var mm = gsap.matchMedia();
  mm.add('(min-width: 960px)', function () {
    $$('.layer .plate img').forEach(function (img) {
      gsap.fromTo(img, { scale: 1.08 }, { scale: 1, ease: 'none',
        scrollTrigger: { trigger: img.closest('.layer') ? $('[data-stage-for="' + img.closest('.layer').getAttribute('data-layer') + '"]') : img, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  });

  /* entradas: cada parte da seção sobe em sequência, uma vez */
  var groups = [
    ['.intro', '.h, .narrow p, .h-sm, .pairs li'],
    ['.sinais', '.h, .lede, legend, .row, .note, .btn'],
    ['.etapas', '.h, .lede, .slip'],
    ['.laudo', '.h, .lede, .tabs button, .body, .cell'],
    ['.provas', '.h, .lede, .faq-act > *'],
    ['.terapia', '.h, .lede, .names li'],
    ['.sobre', '.h, .letter p, .h-sm, .pairs li, .body'],
    ['.faq', '.h, .facts li, details, .faq-act > *'],
    ['.contact', '.h, .rows-big p, .contact-photo, .tile'],
    ['.foot', '.foot-mark, .foot-menu nav a, .foot-soc, .legal']
  ];
  groups.forEach(function (g) {
    var root = $(g[0]);
    if (!root) return;
    var items = $$(g[1], root).filter(function (el) { return !el.closest('.layer'); });
    if (!items.length) return;
    /* o estado escondido so entra quando a peca esta chegando: o que esta longe fica visivel */
    items.forEach(function (el) {
      ST.create({
        trigger: el, start: 'top 112%', once: true,
        onEnter: function () {
          if (el.getBoundingClientRect().top > window.innerHeight * 0.9) {
            gsap.set(el, { opacity: 0, y: 24 });
            el._armed = true;
          }
        }
      });
    });
    ST.batch(items, {
      start: 'top 94%',
      once: true,
      onEnter: function (batch) {
        var armed = batch.filter(function (el) { return el._armed; });
        if (armed.length) gsap.to(armed, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.06, overwrite: true });
      }
    });
  });

  /* fotos fora do palco */
  gsap.fromTo('.contact-photo img', { scale: 1.12 }, { scale: 1, ease: 'none',
    scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.fromTo('.foot-photo img', { scale: 1.14 }, { scale: 1, ease: 'none',
    scrollTrigger: { trigger: '.foot', start: 'top bottom', end: 'bottom bottom', scrub: true } });

  window.addEventListener('load', function () { ST.refresh(); });
})();
