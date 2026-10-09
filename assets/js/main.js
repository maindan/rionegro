/* ==========================================================================
   Rio Negro Log — comportamento do site
   ========================================================================== */
(function () {
  'use strict';

  /* Ajuste aqui quando houver um servidor para receber os formulários.
     Com o endereço vazio, o formulário abre o WhatsApp com a mensagem pronta. */
  var CONFIG = {
    whatsapp: '5592993646820',
    endpointContato: '',
    endpointCadastro: ''
  };

  var doc = document.documentElement;
  var reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var guardar = function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} };
  var ler = function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } };
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var temIO = 'IntersectionObserver' in window;

  /* ---------- Tema claro / escuro ---------- */
  var metaCor = $('meta[name="theme-color"]');
  function aplicarTema(tema) {
    doc.setAttribute('data-theme', tema);
    if (metaCor) metaCor.setAttribute('content', tema === 'dark' ? '#12100E' : '#F7F4EF');
    $$('[data-tema]').forEach(function (b) {
      var escuro = tema === 'dark';
      b.setAttribute('aria-pressed', String(escuro));
      if (!b.classList.contains('chave')) {
        b.setAttribute('aria-label', escuro ? 'Mudar para o modo claro' : 'Mudar para o modo escuro');
        b.title = escuro ? 'Modo claro' : 'Modo escuro';
      }
    });
  }
  aplicarTema(doc.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
  $$('[data-tema]').forEach(function (b) {
    b.addEventListener('click', function () {
      var novo = doc.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      aplicarTema(novo);
      guardar('rnl-tema', novo);
    });
  });

  /* ---------- Cabeçalho ---------- */
  var topo = $('.topo');
  function aoRolar() { if (topo) topo.classList.toggle('rolou', window.scrollY > 8); }
  window.addEventListener('scroll', aoRolar, { passive: true });
  aoRolar();

  /* ---------- Menu móvel: abre em círculo a partir do botão ---------- */
  var hamb = $('.hamburguer'), gaveta = $('#gaveta');
  function menu(abrir) {
    if (!hamb || !gaveta) return;
    if (abrir) {
      var r = hamb.getBoundingClientRect();
      gaveta.style.setProperty('--mx', (r.left + r.width / 2) + 'px');
      gaveta.style.setProperty('--my', (r.top + r.height / 2) + 'px');
    }
    hamb.setAttribute('aria-expanded', String(abrir));
    gaveta.classList.toggle('aberta', abrir);
    gaveta.setAttribute('aria-hidden', String(!abrir));
    if ('inert' in gaveta) gaveta.inert = !abrir;
    document.body.classList.toggle('menu-aberto', abrir);
    if (abrir) setTimeout(function () { var f = $('.gaveta-fechar', gaveta); if (f) f.focus(); }, 300);
    else if (document.activeElement && gaveta.contains(document.activeElement)) hamb.focus();
  }
  if (hamb && gaveta) {
    menu(false);
    hamb.addEventListener('click', function () { menu(true); });
    $$('[data-fechar-menu]', gaveta).forEach(function (b) { b.addEventListener('click', function () { menu(false); }); });
    $$('nav a', gaveta).forEach(function (a) { a.addEventListener('click', function () { menu(false); }); });
    window.addEventListener('resize', function () { if (window.innerWidth > 920 && gaveta.classList.contains('aberta')) menu(false); });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    menu(false); zap(false); fecharLightbox();
  });

  /* ---------- Exibição ao rolar ---------- */
  $$('[data-comboio]').forEach(function (lista) {
    Array.prototype.forEach.call(lista.children, function (item, i) {
      if (!item.dataset.anim) item.dataset.anim = lista.dataset.comboio || 'comboio';
      item.style.setProperty('--i', Math.min(i, 6));
    });
  });
  var alvos = $$('[data-anim]');
  alvos.forEach(function (el) {
    el.addEventListener('animationend', function (e) { if (e.target === el && el.classList.contains('is-visible')) el.classList.add('anim-fim'); });
  });
  function mostrar(el) { el.classList.add('is-visible'); if (reduz) el.classList.add('anim-fim'); }
  if (reduz || !temIO) {
    alvos.forEach(mostrar);
  } else {
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        mostrar(e.target);
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    alvos.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Contadores ---------- */
  function contar(el) {
    var alvo = parseFloat(el.dataset.count), dec = parseInt(el.dataset.dec || '0', 10);
    var fmt = function (v) { return v.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec }); };
    if (reduz) { el.textContent = fmt(alvo); return; }
    var t0 = null, dur = 1400;
    (function passo(t) {
      if (t0 === null) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      el.textContent = fmt(alvo * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(passo);
    })(performance.now());
  }
  if (temIO) {
    var ioc = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { contar(e.target); ioc.unobserve(e.target); } });
    }, { threshold: 0.4 });
    $$('[data-count]').forEach(function (el) { ioc.observe(el); });
  }

  /* ---------- Painel de rotas: letras que giram até o destino ---------- */
  var LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÃÉÍÓ';
  function montarFlap(el) {
    var txt = el.dataset.flap.toUpperCase();
    el.setAttribute('aria-label', el.dataset.flap);
    el.innerHTML = txt.split('').map(function (c) {
      return c === ' ' ? '<i class="vazio" aria-hidden="true"> </i>' : '<i aria-hidden="true">' + c + '</i>';
    }).join('');
  }
  function girarFlap(el, atraso) {
    var celulas = $$('i:not(.vazio)', el);
    celulas.forEach(function (c, i) {
      var final = c.textContent, voltas = 6 + Math.floor(Math.random() * 8) + i;
      setTimeout(function () {
        (function passo(n) {
          c.textContent = n <= 0 ? final : LETRAS[Math.floor(Math.random() * LETRAS.length)];
          if (n > 0) setTimeout(function () { passo(n - 1); }, 45);
        })(voltas);
      }, atraso);
    });
  }
  var flaps = $$('[data-flap]');
  flaps.forEach(montarFlap);
  if (!reduz && temIO) {
    $$('.painel-rotas').forEach(function (p) {
      var iof = new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting) return;
        $$('[data-flap]', p).forEach(function (f, i) { girarFlap(f, i * 140); });
        iof.disconnect();
      }, { threshold: 0.3 });
      iof.observe(p);
    });
  }

  /* ---------- Carrossel no celular: indicador de posição ---------- */
  $$('[data-carrossel]').forEach(function (lista) {
    var pts = $('#' + lista.dataset.carrossel);
    if (!pts) return;
    var itens = Array.prototype.slice.call(lista.children);
    pts.innerHTML = itens.map(function () { return '<span></span>'; }).join('');
    var marcas = $$('span', pts);
    function atualizar() {
      var centro = lista.scrollLeft + lista.clientWidth / 2, melhor = 0, dist = Infinity;
      itens.forEach(function (it, i) {
        var d = Math.abs(it.offsetLeft + it.offsetWidth / 2 - centro);
        if (d < dist) { dist = d; melhor = i; }
      });
      marcas.forEach(function (m, i) { m.classList.toggle('ativo', i === melhor); });
    }
    lista.addEventListener('scroll', function () { requestAnimationFrame(atualizar); }, { passive: true });
    atualizar();
  });

  /* ---------- Paralaxe leve nas colagens ---------- */
  var plx = $$('[data-paralaxe]');
  if (plx.length && !reduz) {
    var ticking = false;
    var mover = function () {
      ticking = false;
      if (window.innerWidth < 720) { plx.forEach(function (el) { el.style.translate = ''; }); return; }
      var meio = window.innerHeight / 2;
      plx.forEach(function (el) {
        var r = el.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        var d = (r.top + r.height / 2 - meio) * parseFloat(el.dataset.paralaxe);
        el.style.translate = '0 ' + d.toFixed(1) + 'px';
      });
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(mover); } }, { passive: true });
    mover();
  }

  /* ---------- Banzeiro (ondulação no clique) ---------- */
  document.addEventListener('pointerdown', function (ev) {
    var btn = ev.target.closest && ev.target.closest('.btn');
    if (!btn || reduz || btn.disabled) return;
    var r = btn.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2.2;
    var o = document.createElement('span');
    o.className = 'banzeiro-onda';
    o.style.width = o.style.height = d + 'px';
    o.style.left = (ev.clientX - r.left - d / 2) + 'px';
    o.style.top = (ev.clientY - r.top - d / 2) + 'px';
    btn.appendChild(o);
    o.addEventListener('animationend', function () { o.remove(); });
  });

  /* ---------- Reflexos dourados nas aberturas ---------- */
  $$('canvas[data-rio]').forEach(function (cv) {
    var ctx = cv.getContext('2d'), W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), visivel = true;
    function medir() { W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    function desenhar(t) {
      ctx.clearRect(0, 0, W, H);
      var linhas = W < 640 ? 9 : 14, topoY = H * 0.5;
      for (var i = 0; i < linhas; i++) {
        var k = i / (linhas - 1), y = topoY + Math.pow(k, 1.6) * (H - topoY);
        var amp = 2 + k * 6, comp = 140 + k * 220, vel = 0.0015 + k * 0.0024;
        ctx.beginPath();
        for (var x = 0; x <= W; x += 8) {
          var yy = y + Math.sin(x / comp * Math.PI * 2 + t * vel + i) * amp;
          if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
        }
        var g = ctx.createLinearGradient(0, 0, W, 0), a = 0.05 + k * 0.15;
        g.addColorStop(0, 'rgba(224,165,75,0)');
        g.addColorStop(0.6, 'rgba(224,165,75,' + a + ')');
        g.addColorStop(0.8, 'rgba(224,165,75,' + (a * 1.6) + ')');
        g.addColorStop(1, 'rgba(224,165,75,0)');
        ctx.strokeStyle = g; ctx.lineWidth = 1 + k * 0.6; ctx.stroke();
      }
    }
    medir();
    window.addEventListener('resize', function () { medir(); if (reduz) desenhar(0); });
    if (reduz) { desenhar(0); return; }
    if (temIO) new IntersectionObserver(function (e) { visivel = e[0].isIntersecting; }).observe(cv);
    (function loop(t) { if (visivel) desenhar(t); requestAnimationFrame(loop); })(0);
  });

  /* ---------- Serviços: índice acompanha a rolagem ---------- */
  var indice = $('.indice');
  if (indice && temIO) {
    var links = $$('a', indice);
    var ios = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) {
          var ativo = a.getAttribute('href') === '#' + e.target.id;
          a.classList.toggle('ativo', ativo);
          if (ativo && a.scrollIntoView && window.innerWidth < 920) a.parentNode.scrollTo({ left: a.offsetLeft - 16, behavior: reduz ? 'auto' : 'smooth' });
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('.servico-linha').forEach(function (s) { ios.observe(s); });
  }

  /* ---------- WhatsApp flutuante ---------- */
  var zapBox = $('.zap-flutuante');
  function zap(abrir) {
    if (!zapBox) return;
    var b = $('.zap-botao', zapBox);
    zapBox.classList.toggle('aberto', abrir);
    b.setAttribute('aria-expanded', String(abrir));
    b.setAttribute('aria-label', abrir ? 'Fechar atendimento por WhatsApp' : 'Falar no WhatsApp');
    $('.zap-cartao', zapBox).setAttribute('aria-hidden', String(!abrir));
    if (abrir) { zapBox.classList.add('visto'); guardar('rnl-zap-visto', '1'); }
  }
  if (zapBox) {
    if (ler('rnl-zap-visto')) zapBox.classList.add('visto');
    $('.zap-botao', zapBox).addEventListener('click', function () { zap(!zapBox.classList.contains('aberto')); });
    document.addEventListener('click', function (e) { if (!zapBox.contains(e.target)) zap(false); });
  }

  /* ---------- Galeria ---------- */
  var lb = $('#lightbox');
  function fecharLightbox() { if (lb) lb.classList.remove('aberta'); }
  if (lb) {
    var lbImg = $('img', lb);
    $$('.galeria figure').forEach(function (f) {
      f.setAttribute('tabindex', '0');
      f.setAttribute('role', 'button');
      var abrir = function () {
        var img = $('img', f);
        lbImg.src = img.currentSrc || img.src; lbImg.alt = img.alt;
        lb.classList.add('aberta'); $('button', lb).focus();
      };
      f.addEventListener('click', abrir);
      f.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(); } });
    });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.closest('button')) fecharLightbox(); });
  }

  /* ---------- Formulários: máscaras e validação ---------- */
  var so = function (v) { return (v || '').replace(/\D/g, ''); };
  var mascaras = {
    telefone: function (v) {
      v = so(v).slice(0, 11);
      if (v.length > 10) return v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
      if (v.length > 6) return v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
      if (v.length > 2) return v.replace(/(\d{2})(\d{0,5})/, '($1) $2');
      return v;
    },
    cep: function (v) { v = so(v).slice(0, 8); return v.length > 5 ? v.slice(0, 5) + '-' + v.slice(5) : v; },
    documento: function (v) {
      v = so(v).slice(0, 14);
      if (v.length <= 11) return v.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      return v.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2');
    }
  };
  $$('[data-mascara]').forEach(function (inp) {
    inp.addEventListener('input', function () { inp.value = mascaras[inp.dataset.mascara](inp.value); });
  });

  function cpfValido(c) {
    c = so(c); if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
    for (var t = 9; t < 11; t++) {
      for (var d = 0, i = 0; i < t; i++) d += c[i] * (t + 1 - i);
      d = ((10 * d) % 11) % 10; if (+c[t] !== d) return false;
    }
    return true;
  }
  function cnpjValido(c) {
    c = so(c); if (c.length !== 14 || /^(\d)\1+$/.test(c)) return false;
    var calc = function (n) {
      var pesos = n === 12 ? [5,4,3,2,9,8,7,6,5,4,3,2] : [6,5,4,3,2,9,8,7,6,5,4,3,2], s = 0;
      for (var i = 0; i < n; i++) s += c[i] * pesos[i];
      var r = s % 11; return r < 2 ? 0 : 11 - r;
    };
    return calc(12) === +c[12] && calc(13) === +c[13];
  }
  function erroDe(c) {
    var v = c.value.trim();
    if (c.required && !v) return 'Preencha este campo.';
    if (v && c.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'Confira o e-mail. Exemplo: nome@empresa.com.br';
    if (v && c.dataset.mascara === 'telefone' && so(v).length < 10) return 'Informe o telefone com DDD.';
    if (v && c.dataset.mascara === 'cep' && so(v).length !== 8) return 'O CEP tem 8 números.';
    if (v && c.dataset.mascara === 'documento') {
      var n = so(v);
      if (n.length === 11 && !cpfValido(n)) return 'CPF inválido. Confira os números.';
      if (n.length === 14 && !cnpjValido(n)) return 'CNPJ inválido. Confira os números.';
      if (n.length !== 11 && n.length !== 14) return 'Informe um CPF (11 números) ou CNPJ (14 números).';
    }
    return '';
  }
  function marcar(campo, msg) {
    var box = campo.closest('.campo'); if (!box) return;
    var m = $('.msg', box);
    if (!m) { m = document.createElement('span'); m.className = 'msg'; m.setAttribute('aria-live', 'polite'); box.appendChild(m); }
    box.classList.toggle('erro', !!msg);
    m.textContent = msg || '';
    campo.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }
  function validar(form) {
    var primeiro = null;
    $$('input, select, textarea', form).forEach(function (c) {
      if (c.type === 'hidden' || c.type === 'radio' || c.disabled || c.closest('.extra:not(.aberto)')) return;
      var msg = erroDe(c);
      marcar(c, msg);
      if (msg && !primeiro) primeiro = c;
    });
    if (primeiro) primeiro.focus();
    return !primeiro;
  }
  $$('form.form').forEach(function (f) {
    f.addEventListener('input', function (e) { if (e.target.closest('.campo.erro')) marcar(e.target, ''); });
  });

  function retorno(form, tipo, texto) {
    var r = $('.retorno', form);
    r.className = 'retorno ' + tipo; r.textContent = texto; r.hidden = false;
  }
  function abrirWhatsApp(texto) {
    window.open('https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(texto), '_blank', 'noopener');
  }
  function enviar(endpoint, form) {
    return fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r; });
  }
  function rotulo(c) { var l = c.id && $('label[for="' + c.id + '"]'); return l ? l.textContent.replace('*', '').trim() : c.name; }
  function resumo(form) {
    return $$('input, select, textarea', form)
      .filter(function (c) { return c.name && c.value.trim() && c.type !== 'hidden' && c.type !== 'radio' && !c.closest('.extra:not(.aberto)'); })
      .map(function (c) { return rotulo(c) + ': ' + c.value.trim(); }).join('\n');
  }

  /* ---------- Contato ---------- */
  var fc = $('#form-contato');
  if (fc) {
    var extra = $('.extra', fc);
    var assunto = function () { var r = $('input[name="assunto"]:checked', fc); return r ? r.value : ''; };
    var modal = function () { var r = $('input[name="modal"]:checked', fc); return r ? r.value : ''; };
    function atualizarExtra() {
      var abre = assunto() === 'Orçamento';
      extra.classList.toggle('aberto', abre);
      extra.setAttribute('aria-hidden', String(!abre));
      if ('inert' in extra) extra.inert = !abre;
    }
    $$('input[name="assunto"]', fc).forEach(function (r) { r.addEventListener('change', atualizarExtra); });
    atualizarExtra();
    var troca = $('.troca', fc);
    if (troca) troca.addEventListener('click', function () {
      var o = $('#origem', fc), d = $('#destino', fc), t = o.value; o.value = d.value; d.value = t;
    });
    var msg = $('#mensagem', fc), cont = $('.contador', fc);
    if (msg && cont) {
      var max = parseInt(msg.getAttribute('maxlength'), 10);
      var atual = function () { cont.textContent = msg.value.length + ' / ' + max; };
      msg.addEventListener('input', atual); atual();
    }
    fc.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validar(fc)) return;
      var btn = $('button[type="submit"]', fc);
      btn.classList.add('enviando');
      setTimeout(function () { btn.classList.remove('enviando'); }, 1400);
      var cab = 'Assunto: ' + assunto() + (assunto() === 'Orçamento' && modal() ? '\nModal: ' + modal() : '');
      if (CONFIG.endpointContato) {
        btn.disabled = true;
        enviar(CONFIG.endpointContato, fc)
          .then(function () { fc.reset(); atualizarExtra(); retorno(fc, 'ok', 'Mensagem enviada. Respondemos em horário comercial.'); })
          .catch(function () { retorno(fc, 'erro', 'Não foi possível enviar agora. Tente de novo ou fale pelo WhatsApp.'); })
          .then(function () { btn.disabled = false; });
      } else {
        abrirWhatsApp('Olá, vim pelo site da Rio Negro Log.\n\n' + cab + '\n' + resumo(fc));
        retorno(fc, 'ok', 'Abrimos o WhatsApp com sua mensagem pronta. É só tocar em enviar.');
      }
    });
  }

  /* ---------- Cadastro de clientes ---------- */
  var fcad = $('#form-cadastro');
  if (fcad) {
    var uf = $('#uf', fcad), cidade = $('#cidade', fcad), cep = $('#cep', fcad), docu = $('#documento', fcad);
    var cidadeDesejada = '';
    var aviso = function (campo, txt) {
      var box = campo.closest('.campo'), s = $('.carregando', box);
      if (!s) { s = document.createElement('span'); s.className = 'carregando'; box.appendChild(s); }
      s.textContent = txt || ''; s.hidden = !txt;
    };

    /* Progresso: cada etapa conta os campos obrigatórios válidos */
    var blocos = $$('fieldset.bloco-form', fcad);
    var etapas = $$('.etapas li');
    function progresso() {
      var total = 0, ok = 0, atualMarcada = false;
      blocos.forEach(function (b, i) {
        var obrig = $$('[required]', b), feitos = obrig.filter(function (c) { return c.value.trim() && !erroDe(c); }).length;
        total += obrig.length; ok += feitos;
        var completa = feitos === obrig.length;
        if (etapas[i]) {
          etapas[i].classList.toggle('feita', completa);
          etapas[i].classList.toggle('atual', !completa && !atualMarcada);
          var st = $('span', etapas[i]);
          if (st) st.textContent = completa ? 'Concluída' : (feitos ? feitos + ' de ' + obrig.length + ' campos' : 'Pendente');
        }
        if (!completa) atualMarcada = true;
      });
      var p = total ? Math.round(ok / total * 100) : 0;
      $$('[data-prog-pct]').forEach(function (el) { el.textContent = p; });
      $$('.barra-prog i').forEach(function (el) { el.style.setProperty('--p', p + '%'); });
      var etapaAtual = blocos.findIndex(function (b) { return $$('[required]', b).some(function (c) { return !c.value.trim() || erroDe(c); }); });
      $$('[data-prog-etapa]').forEach(function (el) { el.textContent = etapaAtual === -1 ? 'Pronto para enviar' : 'Etapa ' + (etapaAtual + 1) + ' de ' + blocos.length + ' · ' + $('legend', blocos[etapaAtual]).textContent.replace(/^\s*\d+\s*/, ''); });
      if (etapas[blocos.length]) etapas[blocos.length].classList.toggle('atual', etapaAtual === -1);
    }
    fcad.addEventListener('input', progresso);
    fcad.addEventListener('change', progresso);
    progresso();

    function carregarCidades(sigla) {
      cidade.innerHTML = '<option value="">Carregando cidades…</option>';
      cidade.disabled = true;
      if (!sigla) { cidade.innerHTML = '<option value="">Selecione a UF primeiro</option>'; return; }
      fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados/' + sigla + '/municipios?orderBy=nome')
        .then(function (r) { return r.json(); })
        .then(function (lista) {
          cidade.innerHTML = '<option value="">Selecione a cidade</option>' + lista.map(function (m) { return '<option>' + m.nome + '</option>'; }).join('');
          cidade.disabled = false;
          if (cidadeDesejada) { cidade.value = cidadeDesejada; cidadeDesejada = ''; }
          progresso();
        })
        .catch(function () {
          var inp = document.createElement('input');
          inp.id = 'cidade'; inp.name = 'cidade'; inp.required = true; inp.autocomplete = 'address-level2';
          cidade.replaceWith(inp); cidade = inp;
        });
    }
    uf.addEventListener('change', function () { carregarCidades(uf.value); });

    cep.addEventListener('input', function () {
      var n = so(cep.value); if (n.length !== 8) return;
      aviso(cep, 'Buscando endereço…');
      fetch('https://viacep.com.br/ws/' + n + '/json/')
        .then(function (r) { return r.json(); })
        .then(function (d) {
          aviso(cep, '');
          if (d.erro) { marcar(cep, 'CEP não encontrado. Preencha o endereço manualmente.'); return; }
          if (d.logradouro) $('#endereco', fcad).value = d.logradouro;
          if (d.bairro) $('#bairro', fcad).value = d.bairro;
          if (d.uf) { cidadeDesejada = d.localidade; uf.value = d.uf; carregarCidades(d.uf); }
          $('#numero', fcad).focus();
          progresso();
        })
        .catch(function () { aviso(cep, ''); });
    });

    docu.addEventListener('blur', function () {
      var n = so(docu.value); if (n.length !== 14 || !cnpjValido(n)) return;
      aviso(docu, 'Consultando CNPJ…');
      fetch('https://brasilapi.com.br/api/cnpj/v1/' + n)
        .then(function (r) { if (!r.ok) throw 0; return r.json(); })
        .then(function (d) {
          aviso(docu, '');
          var set = function (id, v) { var c = $('#' + id, fcad); if (c && v && !c.value) c.value = v; };
          set('razao', d.razao_social);
          if (d.cep && !cep.value) cep.value = mascaras.cep(String(d.cep));
          set('endereco', [d.descricao_tipo_de_logradouro, d.logradouro].filter(Boolean).join(' '));
          set('numero', d.numero); set('bairro', d.bairro); set('complemento', d.complemento);
          set('email', (d.email || '').toLowerCase());
          if (d.ddd_telefone_1) set('fone1', mascaras.telefone(d.ddd_telefone_1));
          if (d.cnae_fiscal_descricao) set('segmento', d.cnae_fiscal_descricao);
          if (d.uf) { cidadeDesejada = (d.municipio || '').toLowerCase().replace(/(^|\s)\S/g, function (s) { return s.toUpperCase(); }); uf.value = d.uf; carregarCidades(d.uf); }
          progresso();
        })
        .catch(function () { aviso(docu, ''); });
    });

    fcad.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validar(fcad)) { retorno(fcad, 'erro', 'Revise os campos marcados em vermelho.'); return; }
      var btn = $('button[type="submit"]', fcad);
      if (CONFIG.endpointCadastro) {
        btn.disabled = true;
        enviar(CONFIG.endpointCadastro, fcad)
          .then(function () { window.location.href = 'obrigado.html'; })
          .catch(function () { btn.disabled = false; retorno(fcad, 'erro', 'Não foi possível enviar o cadastro agora. Tente de novo em alguns minutos ou fale pelo WhatsApp.'); });
      } else {
        abrirWhatsApp('Olá! Quero me cadastrar como cliente da Rio Negro Log.\n\n' + resumo(fcad));
        window.location.href = 'obrigado.html';
      }
    });
  }

  /* Ano no rodapé */
  $$('[data-ano]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
