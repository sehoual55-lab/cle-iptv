/* ============================================================
   CLÉ IPTV — script commun à toutes les pages
   Chaque bloc vérifie la présence de ses éléments : le fichier
   fonctionne donc à l'identique sur une page qui ne contient
   ni tarifs, ni catalogue, ni formulaire de commande.
   ============================================================ */
(function () {
  "use strict";

  var $  = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* Les animations d'apparition ne s'activent que si le JS tourne. */
  document.documentElement.classList.add('js');

  /* ---------------------------------------------------------
     Header : ombre au défilement, menu mobile, lien actif
     --------------------------------------------------------- */
  (function () {
    var header = $('#header');
    if (header) {
      var onScroll = function () {
        header.classList.toggle('scrolled', window.scrollY > 20);
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    var burger = $('#burger'), mobileNav = $('#mobileNav');
    if (burger && mobileNav) {
      burger.addEventListener('click', function () {
        var open = mobileNav.classList.toggle('open');
        burger.classList.toggle('open', open);
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      $$('a', mobileNav).forEach(function (a) {
        a.addEventListener('click', function () {
          mobileNav.classList.remove('open');
          burger.classList.remove('open');
          burger.setAttribute('aria-expanded', 'false');
        });
      });
    }

    var here = location.pathname.split('/').pop() || 'index.html';
    $$('.main-nav a, .mobile-nav a').forEach(function (a) {
      var raw  = a.getAttribute('href') || '';
      if (raw.indexOf('#') !== -1) { return; }   /* les liens vers une ancre ne sont pas « la page » */
      var href = raw.split('#')[0];
      if (href && href === here) {
        a.classList.add('is-active');
        a.setAttribute('aria-current', 'page');
      }
    });
  })();

  /* ---------------------------------------------------------
     Accordéons (FAQ et guide d'installation)
     --------------------------------------------------------- */
  function accordion(itemSel, btnSel, panelSel) {
    $$(itemSel).forEach(function (item) {
      var btn = $(btnSel, item), panel = $(panelSel, item);
      if (!btn || !panel) { return; }
      btn.addEventListener('click', function () {
        var wasOpen = item.classList.contains('open');
        $$(itemSel + '.open').forEach(function (o) {
          o.classList.remove('open');
          var p = $(panelSel, o);
          if (p) { p.style.maxHeight = null; }
        });
        if (!wasOpen) {
          item.classList.add('open');
          panel.style.maxHeight = panel.scrollHeight + 'px';
        }
      });
    });
  }
  accordion('.faq-item', '.faq-q', '.faq-a');
  accordion('.guide-item', '.guide-q', '.guide-a');

  /* ---------------------------------------------------------
     Apparition au défilement
     --------------------------------------------------------- */
  (function () {
    var reveals = $$('.reveal');
    if (!reveals.length) { return; }
    var showAll = function () { reveals.forEach(function (el) { el.classList.add('visible'); }); };
    if (!('IntersectionObserver' in window)) { showAll(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0, rootMargin: '0px 0px -60px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
    window.addEventListener('load', function () { setTimeout(showAll, 2500); });
  })();

  /* ---------------------------------------------------------
     Catalogue TMDB (carrousel + maquettes)
     ⚠ Cette clé est visible par tous les visiteurs. Utilisez une
     clé dédiée à ce site, ou relayez l'appel par un script côté
     serveur qui garde la clé privée.
     --------------------------------------------------------- */
  (function () {
    var TMDB_KEY      = 'eb88f8554c5c594b1b82a59672ee98f4';
    var TMDB_IMG      = 'https://image.tmdb.org/t/p/w500';
    var TMDB_BACKDROP = 'https://image.tmdb.org/t/p/w780';
    var TMDB_THUMB    = 'https://image.tmdb.org/t/p/w185';
    var TMDB_COUNT    = 11;

    var vodRow   = $('#vodRow');
    var vodError = $('#vodError');
    var vodRetry = $('#vodRetry');
    var hasMock  = $('#appHero') || $('#appTiles') || $('#tvFeature') || $('#tvRow');
    if (!vodRow && !hasMock) { return; }

    function url(kind) {
      return 'https://api.themoviedb.org/3/discover/' + kind +
             '?api_key=' + TMDB_KEY +
             '&language=fr-FR&region=FR&sort_by=popularity.desc' +
             '&include_adult=false&vote_count.gte=200&page=1';
    }
    function esc(t) {
      return String(t == null ? '' : t)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    function posterHtml(it) {
      var title = it.title || it.name || '';
      var date  = it.release_date || it.first_air_date || '';
      var year  = date ? date.slice(0, 4) : '';
      return '<div class="vod-poster">' +
               '<img src="' + TMDB_IMG + it.poster_path + '" alt="' + esc(title) + '" loading="lazy" width="500" height="750">' +
               '<div class="vod-cap"><b>' + esc(title) + '</b>' +
                 (year ? '<small>' + esc(year) + '</small>' : '') +
               '</div></div>';
    }
    function fillMockups(items) {
      var backs   = items.filter(function (it) { return it.backdrop_path; });
      var posters = items.filter(function (it) { return it.poster_path; });

      function setBackdrop(el, it) {
        if (!el || !it || $('img', el)) { return; }
        var img = new Image();
        img.alt = '';
        img.src = TMDB_BACKDROP + it.backdrop_path;
        el.insertBefore(img, el.firstChild);
      }
      function fillBoxes(box, sel, list, base) {
        if (!box) { return; }
        $$(sel, box).forEach(function (cell, i) {
          var it = list[i];
          if (!it || $('img', cell)) { return; }
          var img = new Image();
          img.alt = '';
          img.src = base + it.poster_path;
          cell.insertBefore(img, cell.firstChild);
        });
      }
      setBackdrop($('#appHero'), backs[0]);
      fillBoxes($('#appTiles'), '.tile', posters.slice(1, 5), TMDB_THUMB);
      setBackdrop($('#tvFeature'), backs[1] || backs[0]);
      fillBoxes($('#tvRow'), '.thumb', posters.slice(5, 10), TMDB_THUMB);
    }
    function fetchKind(kind) {
      return fetch(url(kind))
        .then(function (r) { if (!r.ok) { throw new Error('HTTP ' + r.status); } return r.json(); })
        .then(function (d) {
          return (d.results || []).filter(function (it) { return it.poster_path; }).slice(0, TMDB_COUNT);
        })
        .catch(function () { return []; });
    }
    function load() {
      if (vodError) { vodError.hidden = true; }
      Promise.all([fetchKind('movie'), fetchKind('tv')]).then(function (res) {
        var films = res[0], series = res[1];
        if (!films.length && !series.length) {
          if (vodRow) { vodRow.style.display = 'none'; }
          if (vodError) { vodError.hidden = false; }
          return;
        }
        if (vodRow) {
          var mixed = [], n = Math.max(films.length, series.length);
          for (var i = 0; i < n; i++) {
            if (films[i])  { mixed.push(films[i]); }
            if (series[i]) { mixed.push(series[i]); }
          }
          vodRow.style.display = '';
          var html = mixed.map(posterHtml).join('');
          $('.vod-track', vodRow).innerHTML = html + html;   /* dupliqué : boucle sans coupure */
        }
        if (films.length) { fillMockups(films); }
      });
    }
    if (vodRetry) { vodRetry.addEventListener('click', load); }
    load();
  })();

  /* ---------------------------------------------------------
     Tarifs : sélecteur de connexions simultanées
     --------------------------------------------------------- */
  var planTotal, eur;
  (function () {
    var grid = $('.pricing-grid');
    var plans = $$('.plan');
    if (!grid || !plans.length) { return; }

    var MAX_CONN = 5;                                   /* connexions maximum */
    var DISCOUNT = parseFloat(grid.getAttribute('data-discount')) || 0.15;

    eur = function (n) { return n.toFixed(2).replace('.', ','); };
    planTotal = function (plan) {
      var base  = parseFloat(plan.getAttribute('data-base'));
      var count = parseInt(plan.getAttribute('data-count') || '1', 10);
      return base * (1 + (count - 1) * (1 - DISCOUNT));  /* 1re connexion plein tarif */
    };

    function refresh(plan) {
      var count  = parseInt(plan.getAttribute('data-count') || '1', 10);
      var months = parseInt(plan.getAttribute('data-months'), 10);
      var total  = planTotal(plan);
      $('.js-total', plan).textContent = eur(total);
      $('.js-count', plan).textContent = count;
      $('.js-label', plan).textContent = count > 1 ? 'connexions simultanées' : 'connexion';
      var note = $('.js-permonth', plan);
      note.textContent = (months === 1 && count === 1)
        ? 'Facturé une fois · sans engagement'
        : 'Soit ' + eur(total / months) + ' € par mois';
      $('.js-minus', plan).disabled = count <= 1;
      $('.js-plus',  plan).disabled = count >= MAX_CONN;
    }

    plans.forEach(function (plan) {
      plan.setAttribute('data-count', '1');
      $('.js-minus', plan).addEventListener('click', function () {
        var c = parseInt(plan.getAttribute('data-count'), 10);
        if (c > 1) { plan.setAttribute('data-count', c - 1); refresh(plan); }
      });
      $('.js-plus', plan).addEventListener('click', function () {
        var c = parseInt(plan.getAttribute('data-count'), 10);
        if (c < MAX_CONN) { plan.setAttribute('data-count', c + 1); refresh(plan); }
      });
      refresh(plan);
    });
  })();

  /* ---------------------------------------------------------
     Modale de commande
     --------------------------------------------------------- */
  (function () {
    var modal = $('#orderModal');
    if (!modal) { return; }

    var form      = $('#modalForm');
    var success   = $('#modalSuccess');
    var sumPlan   = $('#sumPlan');
    var sumConn   = $('#sumConn');
    var sumPrice  = $('#sumPrice');
    var selectedPay = 'Carte bancaire';

    function open(plan, conn, price) {
      sumPlan.textContent  = plan;
      sumConn.textContent  = conn;
      sumPrice.textContent = price;
      form.style.display = 'block';
      success.classList.remove('show');
      modal.classList.add('open');
      document.body.classList.add('no-scroll');
    }
    function close() {
      modal.classList.remove('open');
      document.body.classList.remove('no-scroll');
      $('#orderForm').reset();
      $$('.field.error').forEach(function (f) { f.classList.remove('error'); });
      var box = $('.consent'), err = $('#consentErr');
      if (box) { box.classList.remove('error'); }
      if (err) { err.classList.remove('show'); }
    }

    $$('.js-order').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var plan  = btn.closest('.plan');
        if (!plan || !planTotal) { return; }
        var count = parseInt(plan.getAttribute('data-count'), 10);
        var label = count > 1 ? count + ' connexions simultanées' : '1 connexion simultanée';
        open(plan.getAttribute('data-plan'), label, eur(planTotal(plan)) + ' €');
      });
    });

    $('#modalClose').addEventListener('click', close);
    $('#successClose').addEventListener('click', close);
    modal.addEventListener('click', function (e) { if (e.target === modal) { close(); } });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('open')) { close(); }
    });

    $$('.pay-opt').forEach(function (opt) {
      opt.addEventListener('click', function () {
        $$('.pay-opt').forEach(function (o) { o.classList.remove('selected'); });
        opt.classList.add('selected');
        selectedPay = opt.getAttribute('data-pay');
      });
    });

    function setError(id, hasError) {
      $('#' + id).closest('.field').classList.toggle('error', hasError);
    }
    ['fullname', 'email', 'phone'].forEach(function (id) {
      var el = $('#' + id);
      el.addEventListener('input', function () { el.closest('.field').classList.remove('error'); });
    });
    $('#consent').addEventListener('change', function () {
      if (this.checked) {
        this.closest('.consent').classList.remove('error');
        $('#consentErr').classList.remove('show');
      }
    });

    $('#submitOrder').addEventListener('click', function () {
      var ok = true;
      var fullname = $('#fullname').value.trim();
      var email    = $('#email').value.trim();
      var phone    = $('#phone').value.trim();

      var nameOk = fullname.length >= 3 && fullname.indexOf(' ') > 0;
      setError('fullname', !nameOk); if (!nameOk) { ok = false; }

      var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
      setError('email', !emailOk); if (!emailOk) { ok = false; }

      var phoneOk = phone.replace(/[^0-9]/g, '').length >= 6;
      setError('phone', !phoneOk); if (!phoneOk) { ok = false; }

      /* Consentement CGV + renonciation expresse au droit de rétractation */
      var consent = $('#consent');
      consent.closest('.consent').classList.toggle('error', !consent.checked);
      $('#consentErr').classList.toggle('show', !consent.checked);
      if (!consent.checked) { ok = false; }

      if (!ok) {
        var first = $('.field.error input') || (!consent.checked ? consent : null);
        if (first) { first.focus(); }
        return;
      }

      /* Branchez ici votre back-end, un envoi d'e-mail ou un lien WhatsApp. Exemple :
         var msg = 'Commande Clé IPTV%0A' + sumPlan.textContent + '%0A' + sumConn.textContent +
                   '%0ATotal : ' + sumPrice.textContent + '%0A' + fullname + '%0A' + email +
                   '%0A' + $('#dialcode').value + ' ' + phone + '%0APaiement : ' + selectedPay;
         window.location.href = 'https://wa.me/16615413954?text=' + msg;                        */

      form.style.display = 'none';
      success.classList.add('show');
      $('#modalBox').scrollIntoView({ block: 'nearest' });
    });
  })();

  /* ---------------------------------------------------------
     Année du footer et ancres internes
     --------------------------------------------------------- */
  var year = $('#year');
  if (year) { year.textContent = new Date().getFullYear(); }

  $$('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href');
      if (id === '#' || id.length < 2) { return; }
      var target = document.querySelector(id);
      if (!target) { return; }
      e.preventDefault();
      var header = $('#header');
      var offset = (header ? header.offsetHeight : 0) + 12;
      window.scrollTo({ top: target.getBoundingClientRect().top + window.pageYOffset - offset, behavior: 'smooth' });
    });
  });
})();

/* ============================================================
   WIDGET WHATSAPP — bouton flottant + mini fenêtre de chat
   Injecté automatiquement sur toutes les pages.
   ============================================================ */
(function () {
  var WA_NUMBER  = '16615413954';                 /* numéro WhatsApp (format international, sans +) */
  var WA_NAME    = 'Clé IPTV';
  var WA_STATUS  = 'En ligne · réponse en quelques minutes';
  var WA_GREET   = 'Bonjour 👋<br>Une question sur nos abonnements ou besoin d\'aide pour l\'installation ? Écrivez-nous, on vous répond tout de suite.';
  var WA_DEFAULT = 'Bonjour, je viens du site Clé IPTV et je souhaite plus d\'informations.';
  var WA_TEASER  = 'Besoin d\'aide ? Écrivez-nous sur WhatsApp.';

  if (document.querySelector('.wa-widget')) { return; }

  var ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';
  var SEND = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>';

  var now = new Date();
  var hh  = ('0' + now.getHours()).slice(-2) + ':' + ('0' + now.getMinutes()).slice(-2);
  var initials = WA_NAME.replace(/[^A-Za-zÀ-ÿ ]/g, '').split(' ').slice(0, 2)
                   .map(function (w) { return w.charAt(0); }).join('').toUpperCase();

  var wrap = document.createElement('div');
  wrap.className = 'wa-widget';
  wrap.innerHTML =
    '<div class="wa-panel" role="dialog" aria-label="Discuter sur WhatsApp avec ' + WA_NAME + '" aria-hidden="true">' +
      '<div class="wa-head">' +
        '<span class="wa-avatar">' + initials + '</span>' +
        '<span class="wa-head-txt"><strong>' + WA_NAME + '</strong><span>' + WA_STATUS + '</span></span>' +
        '<button type="button" class="wa-close" aria-label="Fermer la discussion">&times;</button>' +
      '</div>' +
      '<div class="wa-body"><div class="wa-bubble">' + WA_GREET + '<span class="wa-time">' + hh + '</span></div></div>' +
      '<form class="wa-foot">' +
        '<input type="text" class="wa-input" placeholder="Écrivez votre message…" aria-label="Votre message">' +
        '<button type="submit" class="wa-send" aria-label="Envoyer sur WhatsApp">' + SEND + '</button>' +
      '</form>' +
    '</div>' +
    '<div class="wa-teaser"><button type="button" class="wa-teaser-close" aria-label="Masquer">&times;</button>' + WA_TEASER + '</div>' +
    '<button type="button" class="wa-launcher" aria-label="Ouvrir la discussion WhatsApp" aria-expanded="false">' +
      ICON + '<span class="wa-label">WhatsApp</span><span class="wa-dot"></span>' +
    '</button>';
  document.body.appendChild(wrap);

  var panel    = wrap.querySelector('.wa-panel');
  var launcher = wrap.querySelector('.wa-launcher');
  var teaser   = wrap.querySelector('.wa-teaser');
  var input    = wrap.querySelector('.wa-input');
  var form     = wrap.querySelector('.wa-foot');

  function hideTeaser() {
    teaser.classList.remove('show');
    try { sessionStorage.setItem('waTeaser', '1'); } catch (e) {}
  }
  function open() {
    wrap.classList.add('is-open');
    launcher.setAttribute('aria-expanded', 'true');
    panel.setAttribute('aria-hidden', 'false');
    hideTeaser();
    setTimeout(function () { input.focus(); }, 260);
  }
  function close() {
    wrap.classList.remove('is-open');
    launcher.setAttribute('aria-expanded', 'false');
    panel.setAttribute('aria-hidden', 'true');
  }

  launcher.addEventListener('click', function () {
    if (wrap.classList.contains('is-open')) { close(); } else { open(); }
  });
  wrap.querySelector('.wa-close').addEventListener('click', close);
  wrap.querySelector('.wa-teaser-close').addEventListener('click', function (e) {
    e.stopPropagation(); hideTeaser();
  });
  teaser.addEventListener('click', open);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && wrap.classList.contains('is-open')) { close(); }
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var msg = (input.value || '').trim() || WA_DEFAULT;
    window.open('https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');
    input.value = '';
    close();
  });

  var seen = false;
  try { seen = sessionStorage.getItem('waTeaser') === '1'; } catch (e) {}
  if (!seen) {
    setTimeout(function () {
      if (!wrap.classList.contains('is-open')) { teaser.classList.add('show'); }
    }, 4000);
  }
})();
