/* Guará Media — V16 Mascote: base das páginas internas.
   Expõe window.G com: sb() (Supabase REST), esc(), fmtDate(), ícones, share() e reveal(). */
(function () {
  document.documentElement.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Supabase (mesmo projeto e mesma chave pública do site) */
  const SUPA_URL = 'https://cmbxrmtncrfhdcpbjxtx.supabase.co';
  const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtYnhybXRuY3JmaGRjcGJqeHR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0ODA1MjksImV4cCI6MjA5NTA1NjUyOX0.uzPevwziHY2ilNdP-ZnN6C9K7hq1Xs7u88_FTG3Awi8';
  function sb(path) {
    return fetch(SUPA_URL + '/rest/v1/' + path, { headers: { apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY } })
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); });
  }
  function lead(data) {
    return fetch(SUPA_URL + '/functions/v1/create-lead-card', { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY }, body: JSON.stringify(data) })
      .then(r => { if (!r.ok) throw new Error(r.status); return r; });
  }

  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const fmtDate = d => d ? new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
  const svg = (p, s = 16) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const I = {
    cal: svg('<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'),
    clock: svg('<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'),
    pin: svg('<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>'),
    brief: svg('<rect width="20" height="14" x="2" y="7" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>'),
    monitor: svg('<rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8M12 17v4"/>'),
    arrow: svg('<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>'),
    back: svg('<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>'),
    check: svg('<path d="M20 6 9 17l-5-5"/>', 14),
    share: svg('<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>'),
    search: svg('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>', 18),
    down: svg('<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>'),
  };

  /* NAV: menu mobile + cor conforme a seção atrás dela (data-theme="light|dark") */
  const nav = document.getElementById('nav'), toggle = document.getElementById('navToggle');
  if (toggle) {
    toggle.addEventListener('click', () => { const o = nav.classList.toggle('open'); toggle.setAttribute('aria-expanded', o); toggle.setAttribute('aria-label', o ? 'Fechar menu' : 'Abrir menu'); });
    document.querySelectorAll('#navLinks a').forEach(a => a.addEventListener('click', () => { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }));
  }
  function navTheme() {
    if (!nav) return;
    const y = nav.offsetHeight / 2; let t = 'light';
    for (const el of document.querySelectorAll('[data-theme]')) { const r = el.getBoundingClientRect(); if (r.top <= y && r.bottom >= y) t = el.dataset.theme; }
    nav.classList.toggle('on-light', t === 'light'); nav.classList.toggle('on-dark', t === 'dark');
  }
  let ticking = false;
  addEventListener('scroll', () => { if (ticking) return; ticking = true; requestAnimationFrame(() => { navTheme(); ticking = false; }); }, { passive: true });
  addEventListener('resize', navTheme);
  navTheme();

  /* Reveal ao entrar na tela (.rv) e abertura do hero */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .15, rootMargin: '0px 0px -6% 0px' });
  function reveal(root) { (root || document).querySelectorAll('.rv:not(.in)').forEach(n => io.observe(n)); }
  reveal();
  const hero = document.querySelector('.pg-hero');
  if (hero) requestAnimationFrame(() => hero.classList.add('in'));
  document.addEventListener('DOMContentLoaded', navTheme);

  /* Compartilhar (Web Share ou copiar link) */
  function share(btn, okEl) {
    if (!btn) return;
    btn.addEventListener('click', () => {
      const done = () => { if (!okEl) return; okEl.hidden = false; setTimeout(() => { okEl.hidden = true; }, 2500); };
      if (navigator.share) navigator.share({ title: document.title, url: location.href }).catch(() => {});
      else if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(done);
    });
  }

  window.G = { sb, lead, esc, fmtDate, I, svg, share, reveal, reduce, navTheme };
})();
