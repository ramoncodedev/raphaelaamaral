/* Raphaela Amaral — interações. Sem dependências.
   Reveal, split de títulos, faixas do hero, scrub de texto, cursor, magnéticos,
   método pinado (odômetro), cartas 3D, galeria parallax, trilho horizontal,
   arco que expande, prévia ao passar o mouse, carrossel, rodapé em cortina. */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fino = matchMedia('(hover:hover)').matches;

  /* ---------- Split de palavras ---------- */
  function splitPalavras(el, classe) {
    let n = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((filho) => {
        if (filho.nodeType === 3) {
          const frag = document.createDocumentFragment();
          filho.textContent.split(/(\s+)/).forEach((parte) => {
            if (!parte) return;
            if (/^\s+$/.test(parte)) { frag.appendChild(document.createTextNode(' ')); return; }
            if (classe === 'pal') {
              const s = document.createElement('span');
              s.className = 'pal'; s.textContent = parte;
              frag.appendChild(s);
            } else {
              const w = document.createElement('span'); w.className = 'w';
              const i = document.createElement('span'); i.className = 'w-in';
              i.style.setProperty('--n', n++); i.textContent = parte;
              w.appendChild(i); frag.appendChild(w);
            }
          });
          filho.replaceWith(frag);
        } else if (filho.nodeType === 1) walk(filho);
      });
    };
    walk(el);
  }
  $$('[data-split]').forEach((el) => { el.setAttribute('aria-label', el.textContent.trim()); splitPalavras(el, 'w'); });
  const scrubs = $$('[data-scrub]').map((el) => { splitPalavras(el, 'pal'); return { el, pals: $$('.pal', el) }; });

  /* ---------- Faixas do hero ---------- */
  const faixas = $('.hero-faixas');
  const imgHero = $('.hero-foto .so-leitor');
  if (faixas && imgHero) {
    const topos = [16, 6, 0, 0, 0, 8, 20];
    const bases = [22, 10, 0, 0, 6, 14, 28];
    for (let i = 0; i < 7; i++) {
      const f = document.createElement('div');
      f.className = 'hero-faixa';
      f.style.cssText = `--i:${i};--topo:${topos[i]}%;--base:${bases[i]}%`;
      const im = document.createElement('img');
      im.className = 'hero-faixa-img'; im.src = imgHero.getAttribute('src'); im.alt = ''; im.decoding = 'async';
      f.appendChild(im); faixas.appendChild(f);
    }
  }

  /* ---------- Entrada ---------- */
  const nav = $('#nav'), hero = $('.hero');
  const entrar = () => {
    nav.classList.add('is-in');
    hero.classList.add('is-in');
    $('.hero-titulo').classList.add('is-in');
    $$('.hero-numeros li').forEach((li, i) => li.style.setProperty('--i', i));
    contar();
  };
  const arranque = () => requestAnimationFrame(() => setTimeout(entrar, 120));
  if (document.fonts && document.fonts.ready) Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]).then(arranque);
  else arranque();

  function contar() {
    $$('[data-count]').forEach((el) => {
      const alvo = +el.dataset.count;
      if (reduz) { el.textContent = alvo; return; }
      const t0 = performance.now() + 900, dur = 1500;
      const passo = (t) => {
        const p = clamp((t - t0) / dur);
        el.textContent = Math.round(alvo * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(passo);
      };
      requestAnimationFrame(passo);
    });
  }

  /* ---------- Reveal ---------- */
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
  $$('[data-rev], [data-split]:not(.hero-titulo)').forEach((el) => io.observe(el));

  /* Pares: a seção anterior fica presa e a próxima sobe por cima (como na referência) */
  const pares = [['#sinais', '#metodo'], ['#pilares', '#trajetoria'], ['#para-quem', '#objetivo']]
    .map(([a, b]) => [$(a), $(b)]).filter(([a, b]) => a && b && a.nextElementSibling === b);
  pares.forEach(([prev, next]) => {
    const par = document.createElement('div'); par.className = 'par';
    prev.before(par); par.append(prev, next);
    prev.classList.add('par-prev'); next.classList.add('par-next', 'corte-topo');
  });
  function medirPares() {
    pares.forEach(([prev]) => prev.style.setProperty('--par-top', `${innerHeight - prev.offsetHeight}px`));
  }

  /* ---------- Citações do hero ---------- */
  const cits = $$('.citacoes blockquote'), tracos = $$('.hero-traços i');
  let ci = 0;
  if (cits.length > 1 && !reduz) {
    setInterval(() => {
      cits[ci].classList.remove('is-on'); tracos[ci] && tracos[ci].classList.remove('is-on');
      ci = (ci + 1) % cits.length;
      cits[ci].classList.add('is-on'); tracos[ci] && tracos[ci].classList.add('is-on');
    }, 5200);
  }

  /* ---------- Parallax do mouse (hero) ---------- */
  const foto = $('.hero-foto');
  if (foto && fino && !reduz) {
    hero.addEventListener('mousemove', (e) => {
      const r = hero.getBoundingClientRect();
      foto.style.setProperty('--px', ((e.clientX - r.left) / r.width - .5) * 2);
      foto.style.setProperty('--py', ((e.clientY - r.top) / r.height - .5) * 2);
    });
  }

  /* ---------- Magnéticos ---------- */
  if (fino && !reduz) {
    $$('[data-mag]').forEach((b) => {
      b.addEventListener('mousemove', (e) => {
        const r = b.getBoundingClientRect();
        b.style.setProperty('--mx', `${(e.clientX - r.left - r.width / 2) * .18}px`);
        b.style.setProperty('--my', `${(e.clientY - r.top - r.height / 2) * .28}px`);
      });
      b.addEventListener('mouseleave', () => { b.style.setProperty('--mx', '0px'); b.style.setProperty('--my', '0px'); });
    });
  }

  /* ---------- Cursor (anel com lerp) ---------- */
  const cursor = $('.cursor');
  let cx = innerWidth / 2, cy = innerHeight / 2, tx = cx, ty = cy;
  if (cursor && fino) {
    addEventListener('mousemove', (e) => { tx = e.clientX; ty = e.clientY; cursor.classList.add('is-on'); });
    document.addEventListener('mouseleave', () => cursor.classList.remove('is-on'));
    document.addEventListener('mouseover', (e) => {
      cursor.classList.toggle('is-link', !!e.target.closest('a, button, summary, .flip, [data-cursor]'));
    });
  }

  /* ---------- Menu móvel ---------- */
  const burger = $('.nav-burger');
  const fechar = () => { nav.classList.remove('is-aberto'); burger.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; };
  burger.addEventListener('click', () => {
    const aberto = nav.classList.toggle('is-aberto');
    burger.setAttribute('aria-expanded', aberto); document.body.style.overflow = aberto ? 'hidden' : '';
  });
  $$('.gaveta-links a').forEach((a) => a.addEventListener('click', fechar));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') fechar(); });

  /* ---------- FAQ ---------- */
  const dets = $$('.faq details');
  dets.forEach((d) => d.addEventListener('toggle', () => { if (d.open) dets.forEach((o) => { if (o !== d) o.open = false; }); }));

  /* ---------- Pilares: toque vira a carta ---------- */
  const flips = $$('.flip');
  if (!fino) flips.forEach((f) => f.addEventListener('click', () => {
    const v = f.classList.contains('is-virado');
    flips.forEach((o) => o.classList.remove('is-virado'));
    if (!v) f.classList.add('is-virado');
  }));
  flips.forEach((f) => f.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); f.classList.toggle('is-virado'); } }));

  /* ---------- Para quem: prévia que segue o mouse ---------- */
  const previa = $('.previa'), previaImg = previa && $('img', previa);
  let px = 0, py = 0, ptx = 0, pty = 0;
  if (previa && fino) {
    $$('.quem-lista li').forEach((li) => {
      li.addEventListener('mouseenter', () => { previaImg.src = li.dataset.img; previa.classList.add('is-on'); });
      li.addEventListener('mouseleave', () => previa.classList.remove('is-on'));
    });
    addEventListener('mousemove', (e) => { ptx = e.clientX + 24; pty = e.clientY - 90; });
  }

  /* ---------- Depoimentos (carrossel) ---------- */
  const dq = $$('.depo-q'), barras = $$('.depo-barras i b'), dcont = $('#depo-cont');
  let di = 0, dt0 = performance.now();
  const DUR = 7000;
  function dep(i) {
    di = (i + dq.length) % dq.length; dt0 = performance.now();
    dq.forEach((q, k) => q.classList.toggle('is-on', k === di));
    barras.forEach((b, k) => b.style.setProperty('--w', k < di ? 1 : 0));
    if (dcont) dcont.textContent = `${String(di + 1).padStart(2, '0')} / ${String(dq.length).padStart(2, '0')}`;
  }
  if (dq.length) {
    dep(0);
    $$('[data-dep]').forEach((b) => b.addEventListener('click', () => dep(di + +b.dataset.dep)));
  }
  const depoSec = $('#palavras');
  let depoVisivel = false;
  if (depoSec) new IntersectionObserver((es) => { depoVisivel = es[0].isIntersecting; if (depoVisivel) dt0 = performance.now(); }).observe(depoSec);

  /* ---------- Rodapé em cortina ---------- */
  const rodape = $('#rodape'), principal = $('#conteudo');
  function cortina() {
    const h = rodape.offsetHeight;
    const ok = innerWidth > 720 && innerHeight > h + 40;
    rodape.classList.toggle('is-cortina', ok);
    principal.style.marginBottom = ok ? `${h}px` : '';
  }
  $('#ano').textContent = new Date().getFullYear();

  /* ---------- Elementos do scroll ---------- */
  const pct = $('#lateral-pct');
  const flutuantes = $$('[data-float]');
  const galCols = $$('.gal-col[data-vel]');

  // Método
  const mTrilho = $('.metodo-trilho');
  const mFases = $$('.fase-b'), mImgs = $$('.fase-img'), mCard = $('.fase-card');
  const odoCols = $$('.odo-col > div'), mProg = $('.fase-prog'), chipC = $('#fase-cont'), chipN = $('#fase-nome');
  const nomesFase = mFases.map((f) => ($('h3', f) ? $('h3', f).textContent : '').trim().toUpperCase());
  let faseAtual = -1;
  function setFase(i) {
    if (i === faseAtual) return;
    faseAtual = i;
    mFases.forEach((f, k) => f.classList.toggle('is-on', k === i));
    mImgs.forEach((f, k) => f.classList.toggle('is-on', k === i));
    odoCols.forEach((c) => c.style.setProperty('--i', i));
    if (chipC) chipC.textContent = `${String(i + 1).padStart(2, '0')} / ${String(mFases.length).padStart(2, '0')}`;
    if (chipN) chipN.textContent = nomesFase[i] || '';
    if (mCard) mCard.style.setProperty('--rot', `${[1.4, -1.2, 1, -.8][i % 4]}deg`);
  }

  // Dentro (horizontal)
  const dTrilho = $('.dentro-trilho'), dPalco = $('.dentro-palco'), dCards = $('.dentro-cards');
  const dCols = $$('.cont-col'), dProg = $('.dentro-prog');
  const nCards = $$('.cd').length;
  let dDist = 0, dIdx = -1;
  function medirDentro() {
    if (!dTrilho) return;
    if (innerWidth <= 720) { dTrilho.style.height = ''; dCards.style.transform = ''; dDist = 0; return; }
    dDist = Math.max(0, dCards.scrollWidth - innerWidth + 0);
    dTrilho.style.height = `${dDist + innerHeight * 1.1}px`;
  }

  // Mentora
  const mentTrilho = $('.mentor-trilho'), mentPalco = $('.mentor-palco');
  const mentFoto = $('.mentor-foto'), mentSobre = $('.mentor-sobre');

  const pin = (el) => {
    const r = el.getBoundingClientRect();
    return clamp(-r.top / Math.max(1, r.height - innerHeight));
  };

  /* ---------- Loop ---------- */
  let ticking = false;
  function atualizar() {
    ticking = false;
    const vh = innerHeight, vw = innerWidth, y = scrollY;
    nav.classList.toggle('is-pego', y > 40);

    const max = document.documentElement.scrollHeight - vh;
    if (pct) pct.textContent = String(Math.round(clamp(y / Math.max(1, max)) * 100)).padStart(2, '0');

    // scrub de palavras
    scrubs.forEach(({ el, pals }) => {
      const r = el.getBoundingClientRect();
      const p = clamp((vh * .85 - r.top) / (r.height + vh * .3));
      const ate = Math.round(p * pals.length * 1.1);
      pals.forEach((w, i) => w.classList.toggle('is-on', i < ate));
    });

    // método
    if (mTrilho && vw > 1060) {
      const p = pin(mTrilho);
      setFase(Math.min(mFases.length - 1, Math.floor(p * mFases.length)));
      if (mProg) mProg.style.setProperty('--fp', p.toFixed(3));
    } else if (mTrilho) {
      const p = pin(mTrilho);
      setFase(Math.min(mFases.length - 1, Math.floor(p * mFases.length)));
      if (mProg) mProg.style.setProperty('--fp', p.toFixed(3));
    }

    // galeria parallax
    if (vw > 720) galCols.forEach((c) => {
      const r = c.parentElement.getBoundingClientRect();
      c.style.setProperty('--gy', `${(r.top + r.height / 2 - vh / 2) * -parseFloat(c.dataset.vel) * 2}px`);
    });

    // dentro
    if (dTrilho && vw > 720) {
      const prog = clamp(-dTrilho.getBoundingClientRect().top / Math.max(1, dDist));
      dCards.style.transform = `translate3d(${-prog * dDist}px,0,0)`;
      if (dProg) dProg.style.setProperty('--dp', prog.toFixed(3));
      const idx = Math.min(nCards - 1, Math.round(prog * (nCards - 1)));
      if (idx !== dIdx) { dIdx = idx; dCols.forEach((c) => c.style.setProperty('--i', idx)); }
    }

    // mentora (arco que expande)
    if (mentTrilho) {
      const p = pin(mentTrilho);
      const mobile = vw <= 720;
      const w0 = mobile ? vw * .46 : Math.min(330, vw * .21), h0 = w0 * 1.18;
      const mx = mobile ? 12 : 40, my = mobile ? 12 : 28;
      const wf = vw - mx * 2, hf = vh - my * 2;
      const e = clamp((p - .1) / .5);
      const ee = 1 - Math.pow(1 - e, 3);
      const w = lerp(w0, wf, ee), h = lerp(h0, hf, ee);
      mentFoto.style.width = `${w}px`;
      mentFoto.style.height = `${h}px`;
      mentFoto.style.borderRadius = `${lerp(w0 / 2, 22, clamp(ee * 1.4))}px ${lerp(w0 / 2, 22, clamp(ee * 1.4))}px 22px 22px`;
      mentPalco.style.setProperty('--offx', `${w / 2 + 24}px`);
      mentPalco.style.setProperty('--offy', `${h / 2 + 6}px`);
      mentPalco.style.setProperty('--no', (1 - clamp(ee * 1.6)).toFixed(3));
      mentPalco.style.setProperty('--esc', clamp((p - .35) / .35).toFixed(3));
      const so = clamp((p - .62) / .25);
      mentPalco.style.setProperty('--so', so.toFixed(3));
      mentSobre.classList.toggle('is-on', so > .6);
    }


    // flutuantes
    flutuantes.forEach((f) => {
      const r = f.getBoundingClientRect();
      f.style.setProperty('--fy', `${(r.top + r.height / 2 - vh / 2) * -parseFloat(f.dataset.float)}px`);
    });
  }
  const pedir = () => { if (!ticking) { ticking = true; requestAnimationFrame(atualizar); } };
  addEventListener('scroll', pedir, { passive: true });
  addEventListener('resize', () => { cortina(); medirDentro(); medirPares(); pedir(); });
  addEventListener('load', () => { cortina(); medirDentro(); medirPares(); atualizar(); });

  /* ---------- rAF contínuo (cursor, prévia, carrossel) ---------- */
  function quadro(t) {
    if (cursor && fino) {
      cx = lerp(cx, tx, .2); cy = lerp(cy, ty, .2);
      cursor.style.transform = `translate3d(${cx}px,${cy}px,0)`;
    }
    if (previa && fino) {
      px = lerp(px, ptx, .14); py = lerp(py, pty, .14);
      previa.style.transform = `translate3d(${px}px,${py}px,0)`;
    }
    if (dq.length && depoVisivel && !reduz) {
      const p = clamp((t - dt0) / DUR);
      if (barras[di]) barras[di].style.setProperty('--w', p.toFixed(3));
      if (p >= 1) dep(di + 1);
    }
    requestAnimationFrame(quadro);
  }
  requestAnimationFrame(quadro);

  setFase(0);
  cortina(); medirDentro(); medirPares(); atualizar();
})();
