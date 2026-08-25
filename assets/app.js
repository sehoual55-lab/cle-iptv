/* ============================================================
   CLÉ IPTV — script commun à toutes les pages
   Chaque bloc vérifie la présence de ses éléments : le fichier
   fonctionne donc à l'identique sur une page qui ne contient
   ni tarifs, ni catalogue, ni formulaire de commande.
   ============================================================ */
(function () {
  "use strict";

  /* ============================================================
     ENVOI DES COMMANDES VERS GOOGLE SHEETS
     ------------------------------------------------------------
     Collez ici l'adresse du script Google (« Web app URL »)
     obtenue à l'étape 5 de GOOGLE-SHEET.txt. Elle ressemble à :
     https://script.google.com/macros/s/AKfycb.../exec

     Tant que cette adresse est vide, le formulaire affiche
     simplement le message de confirmation sans rien enregistrer.
     ============================================================ */
  var ORDER_ENDPOINT = 'https://script.google.com/macros/s/AKfycbw5L3ncryKxH0fteMdHHBdcYL5earAnyzvdUg_atxu6Y14B2Hh9YWN89qejfkoo5KAj/exec';
  var ORDER_TOKEN    = 'cle-iptv-2026';   /* doit correspondre à TOKEN dans le script Google */
  var ORDER_PHONE    = '+33 6 12 34 56 78';

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

    /* Normalise « /appareils », « /appareils.html » et « appareils.html » */
    var norm = function (path) {
      return String(path || '')
        .split('#')[0].split('?')[0]
        .replace(/^.*\//, '')
        .replace(/\.html$/, '') || 'index';
    };
    var here = norm(location.pathname) === '' ? 'index' : norm(location.pathname);
    $$('.main-nav a, .mobile-nav a').forEach(function (a) {
      var raw = a.getAttribute('href') || '';
      if (raw.indexOf('#') !== -1) { return; }   /* les liens vers une ancre ne sont pas « la page » */
      if (norm(raw) === here) {
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

      var payload = {
        token:      ORDER_TOKEN,
        nom:        fullname,
        email:      email,
        telephone:  $('#dialcode').value + ' ' + phone,
        formule:    sumPlan.textContent,
        prix:       parseFloat(sumPrice.textContent.replace(/[^0-9,.-]/g, '').replace(',', '.')) || 0,
        connexions: parseInt(sumConn.textContent, 10) || 1,
        paiement:   selectedPay
      };
      sendOrder(payload);
    });
  })();

  /* ---------------------------------------------------------
     Envoi de la commande
     --------------------------------------------------------- */
  function sendOrder(payload) {
    var modal   = $('#orderModal');
    var form    = $('#modalForm');
    var success = $('#modalSuccess');
    var btn     = $('#submitOrder');
    var errBox  = $('#sendError');

    function showSuccess() {
      form.style.display = 'none';
      success.classList.add('show');
      $('#modalBox').scrollIntoView({ block: 'nearest' });
    }
    function showError() {
      btn.classList.remove('is-sending');
      btn.textContent = 'Réessayer';
      errBox.hidden = false;
      errBox.innerHTML = "L'envoi n'a pas abouti. Réessayez, ou appelez-nous directement au " +
                         '<a href="tel:' + ORDER_PHONE.replace(/\s/g, '') + '">' + ORDER_PHONE +
                         '</a> pour finaliser votre commande.';
    }

    /* Pas encore branché sur Google Sheets : on confirme sans enregistrer. */
    if (!ORDER_ENDPOINT) {
      showSuccess();
      return;
    }

    errBox.hidden = true;
    btn.classList.add('is-sending');
    btn.textContent = 'Envoi en cours…';

    /* Content-Type « text/plain » : évite la requête preflight que
       Google Apps Script ne sait pas traiter. */
    fetch(ORDER_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (res && res.ok) { showSuccess(); }
        else { showError(); }
      })
      .catch(function () {
        /* Certains navigateurs bloquent la lecture de la réponse de Google.
           On renvoie alors la commande en aveugle : elle arrive bien dans la
           feuille, mais nous ne pouvons pas lire la confirmation. */
        fetch(ORDER_ENDPOINT, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        })
          .then(showSuccess)
          .catch(showError);
      });
  }

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
