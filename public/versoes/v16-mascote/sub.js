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

  // Storage (bucket público) e insert via REST, mesmas rotas que o SDK usa no site React
  function upload(bucket, path, file) {
    return fetch(`${SUPA_URL}/storage/v1/object/${bucket}/${path}`, { method: 'POST', headers: { apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY, 'Content-Type': file.type || 'application/octet-stream', 'x-upsert': 'false', 'cache-control': '3600' }, body: file })
      .then(r => { if (!r.ok) throw new Error('upload ' + r.status); return `${SUPA_URL}/storage/v1/object/public/${bucket}/${path}`; });
  }
  function insert(table, row) {
    return fetch(`${SUPA_URL}/rest/v1/${table}`, { method: 'POST', headers: { apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(row) })
      .then(r => { if (!r.ok) throw new Error('insert ' + r.status); return r; });
  }

  /* Máscaras: telefone BR (aceita +55, 0 inicial, fixo de 8 ou celular de 9 dígitos), e-mail (minúsculas, sem espaços), site (sem protocolo/barra) */
  function phoneDigits(v) { let d = String(v || '').replace(/\D/g, ''); d = d.replace(/^0+/, ''); if (d.length > 11 && d.startsWith('55')) d = d.slice(2); return d.slice(0, 11); }
  function phoneFormat(d) { if (!d) return ''; if (d.length <= 2) return '(' + d; if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`; if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`; return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`; }
  function maskPhone(input) { if (!input) return; const f = () => { input.value = phoneFormat(phoneDigits(input.value)); }; input.addEventListener('input', f); input.addEventListener('paste', () => setTimeout(f, 0)); input.addEventListener('blur', f); }
  function maskEmail(input) { if (!input) return; input.addEventListener('input', () => { const v = input.value.replace(/\s+/g, '').toLowerCase(); if (v !== input.value) input.value = v; }); input.addEventListener('blur', () => { input.value = input.value.trim().toLowerCase(); }); }
  function cleanSite(v) { return String(v || '').trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/+$/, ''); }

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
    if (scrollY < 8 && t === 'light') t = 'hero'; // no topo absoluto o header fica transparente, como na home
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

  /* Formulário de candidatura (vaga ou banco de talentos). mount(container,{job,intro,okMsg}) */
  const TALENT_RE = /banco\s+de\s+talentos/i;
  const isTalentBank = j => TALENT_RE.test(j && j.title || '');
  const APPLY_MAX = 5 * 1024 * 1024, APPLY_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  function applyMarkup(o) {
    return `<form class="dform apply" novalidate>
      ${o.intro ? `<p class="apply-intro">${o.intro}</p>` : ''}
      <label>Nome completo<input name="name" required minlength="2" maxlength="120" placeholder="Maria Souza" autocomplete="name"><span class="err" data-for="name"></span></label>
      <label>E-mail<input name="email" type="email" required maxlength="255" placeholder="maria@email.com" autocomplete="email"><span class="err" data-for="email"></span></label>
      <label>WhatsApp<input name="phone" type="tel" maxlength="40" placeholder="(19) 99999-9999" autocomplete="tel-national" inputmode="numeric"></label>
      <label>LinkedIn<input name="linkedin" type="url" maxlength="300" placeholder="linkedin.com/in/seu-perfil" autocomplete="url"></label>
      ${o.area ? `<label>Área que você quer atuar<input name="area" maxlength="120" placeholder="Mídia paga, design, dados, conteúdo…"></label>` : ''}
      <div class="file-field">
        <span class="file-label">Currículo <small>PDF ou DOC, até 5 MB</small></span>
        <label class="drop"><input type="file" name="cv" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"><span class="drop-txt">Toque pra anexar ou arraste o arquivo aqui</span></label>
        <div class="file-chip" hidden><span class="file-name"></span><span class="file-size"></span><button type="button" class="file-x" aria-label="Remover arquivo">×</button></div>
        <span class="err" data-for="cv"></span>
      </div>
      <label><span>Mensagem <small>opcional</small></span><textarea name="message" rows="2" maxlength="2000" placeholder="${o.placeholder || 'Conta em duas linhas por que essa vaga faz sentido pra você.'}"></textarea></label>
      <button type="submit" class="cta-pill">${o.cta || 'Enviar candidatura'}</button>
      <span class="err" data-for="form" role="alert"></span>
    </form>
    <div class="dok" hidden><div class="big" aria-hidden="true">✓</div><h2 class="caps">${o.okTitle || 'Candidatura enviada'}</h2><p>${o.okMsg || 'Recebemos seu currículo. A gente responde em até 24h úteis pelo e-mail que você deixou.'}</p></div>`;
  }
  function mountApply(box, o) {
    box.innerHTML = applyMarkup(o);
    const f = box.querySelector('form'), cv = f.querySelector('input[name=cv]'), drop = f.querySelector('.drop'), chip = f.querySelector('.file-chip');
    const err = k => f.querySelector(`.err[data-for="${k}"]`);
    let file = null;
    const setFile = x => { err('cv').textContent = '';
      if (!x) { file = null; cv.value = ''; chip.hidden = true; drop.hidden = false; return; }
      if (!(APPLY_TYPES.includes(x.type) || /\.(pdf|docx?)$/i.test(x.name))) { err('cv').textContent = 'Formato inválido. Envie PDF ou DOC/DOCX.'; cv.value = ''; return; }
      if (x.size > APPLY_MAX) { err('cv').textContent = 'Arquivo muito grande. O máximo é 5 MB.'; cv.value = ''; return; }
      file = x; chip.querySelector('.file-name').textContent = x.name; chip.querySelector('.file-size').textContent = (x.size / 1024 / 1024).toFixed(2) + ' MB'; chip.hidden = false; drop.hidden = true; };
    maskPhone(f.querySelector('input[name=phone]')); maskEmail(f.querySelector('input[name=email]'));
    cv.addEventListener('change', () => setFile(cv.files[0]));
    chip.querySelector('.file-x').addEventListener('click', () => setFile(null));
    ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
    ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
    drop.addEventListener('drop', e => { const x = e.dataTransfer.files && e.dataTransfer.files[0]; if (x) setFile(x); });
    const check = i => { const bad = !i.checkValidity(); i.setAttribute('aria-invalid', bad); const m = err(i.name); if (m) m.textContent = bad ? (i.name === 'email' ? 'Informe um e-mail válido.' : 'Informe seu nome completo.') : ''; return !bad; };
    f.querySelectorAll('input[required]').forEach(i => { i.addEventListener('blur', () => { if (i.value) check(i); }); i.addEventListener('input', () => { if (i.getAttribute('aria-invalid') === 'true') check(i); }); });
    f.addEventListener('submit', async e => {
      e.preventDefault();
      const ef = err('form'); ef.textContent = '';
      const job = typeof o.job === 'function' ? o.job() : o.job;
      if (!job) { ef.textContent = o.noJobMsg || 'Não deu pra enviar agora. Tenta de novo em instantes.'; return; }
      const bad = [...f.querySelectorAll('input[required]')].filter(i => !check(i));
      if (!file) { err('cv').textContent = 'Anexe seu currículo (PDF ou DOC).'; bad.push(cv); }
      if (bad.length) { ef.textContent = bad.length === 1 ? 'Falta 1 item pra enviar.' : 'Faltam ' + bad.length + ' itens pra enviar.'; (bad[0] === cv ? drop : bad[0]).focus(); return; }
      const btn = f.querySelector('button[type=submit]'); btn.disabled = true; btn.textContent = 'Enviando…';
      try {
        const ext = (file.name.split('.').pop() || 'pdf').toLowerCase();
        const url = await upload('resumes', job.id + '/' + crypto.randomUUID() + '.' + ext, file);
        const d = new FormData(f), v = k => (d.get(k) || '').toString().trim();
        let li = v('linkedin'); if (li && !/^https?:\/\//i.test(li)) li = 'https://' + li;
        let msg = v('message'); if (v('area')) msg = '[Área: ' + v('area') + '] ' + msg;
        await insert('applications', { job_id: job.id, name: v('name'), email: v('email'), phone: v('phone') || null, linkedin: li || null, message: msg.trim() || null, resume_url: url });
        f.hidden = true; box.querySelector('.dok').hidden = false; if (o.onDone) o.onDone();
      } catch (e2) { ef.textContent = 'Não deu pra enviar agora. Tenta de novo em instantes.'; btn.disabled = false; btn.textContent = o.cta || 'Enviar candidatura'; }
    });
    return f;
  }

  window.G = { sb, lead, upload, insert, mountApply, isTalentBank, maskPhone, maskEmail, phoneDigits, cleanSite, esc, fmtDate, I, svg, share, reveal, reduce, navTheme };
})();
