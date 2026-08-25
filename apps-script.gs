/**
 * ============================================================
 *  CLÉ IPTV — Réception des commandes dans Google Sheets
 * ------------------------------------------------------------
 *  Reçoit les commandes de cle-iptv.store, ajoute une ligne dans
 *  la feuille et envoie une alerte e-mail avec bouton WhatsApp.
 *
 *  INSTALLATION : voir GOOGLE-SHEET.txt
 * ============================================================
 */

/* ---------- RÉGLAGES ---------- */

// Identifiant de votre feuille (déjà rempli)
var SHEET_ID = '1kj3RZMrc2ArSKqVzNoQ9Dl5ClwyRoaArFohTrBneqMA';

// Nom de l'onglet qui reçoit les commandes
var SHEET_NAME = 'Sheet1';   // ou 'Feuille 1' si votre interface est en français
                             // (si le nom ne correspond pas, le 1er onglet est utilisé)

// Adresse qui reçoit l'alerte à chaque nouvelle commande
var NOTIFY_EMAIL = 'xyz905391@gmail.com';

// Envoyer aussi un accusé de réception au client ? (true / false)
var SEND_CLIENT_RECEIPT = true;

// Mot de passe partagé avec le site. Identique à ORDER_TOKEN dans assets/app.js.
var TOKEN = 'cle-iptv-2026';

// Votre numéro affiché dans les e-mails
var PHONE = '+33 6 12 34 56 78';

// Nom affiché comme expéditeur des e-mails
var BRAND = 'Clé IPTV';

/* ---------- RÉCEPTION DES COMMANDES ---------- */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    if (data.token !== TOKEN) {
      return json({ ok: false, error: 'token' });
    }

    var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
    }

    // Colonnes : Date | Nom | Email | Téléphone | Formule |
    //            Prix (€) | Connexions | Paiement | Statut
    sheet.appendRow([
      new Date(),
      data.nom       || '',
      data.email     || '',
      data.telephone || '',
      data.formule   || '',
      Number(data.prix) || 0,
      Number(data.connexions) || 1,
      data.paiement  || '',
      'Nouvelle'
    ]);

    notifyOwner(data);
    if (SEND_CLIENT_RECEIPT) { sendClientReceipt(data); }

    return json({ ok: true });

  } catch (err) {
    try {
      SpreadsheetApp.openById(SHEET_ID).getSheets()[0]
        .appendRow([new Date(), 'ERREUR', String(err), e && e.postData ? e.postData.contents : '']);
    } catch (ignored) {}
    return json({ ok: false, error: String(err) });
  }
}

/* Permet de vérifier depuis un navigateur que le script répond bien */
function doGet() {
  return json({ ok: true, message: 'Clé IPTV — service de commande actif' });
}

/* ---------- E-MAIL D'ALERTE (vous) ---------- */

function notifyOwner(d) {
  var prix   = formatPrix(d.prix);
  var sujet  = '🛒 Nouvelle commande — ' + shortPlan(d.formule) + ' (' + prix + ')';
  var wa     = whatsappLink(d);
  var mailto = 'mailto:' + (d.email || '');

  var rows =
    row('Formule',    d.formule) +
    row('Prix',       '<span style="color:#0E8E90;font-weight:700;">' + prix + '</span>') +
    row('Connexions', d.connexions) +
    row('Nom',        d.nom) +
    row('Téléphone',  d.telephone) +
    row('E-mail',     '<a href="' + mailto + '" style="color:#2457E6;">' + esc(d.email) + '</a>') +
    row('Paiement',   d.paiement) +
    row('Date',       Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy à HH:mm'));

  var html =
  '<div style="background:#F4F8FB;padding:26px 12px;font-family:Arial,Helvetica,sans-serif;">' +
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #DCE7EF;border-radius:14px;">' +
      '<tr><td style="padding:26px 28px 6px;">' +
        '<div style="font-size:21px;font-weight:bold;color:#0B1F33;letter-spacing:-.3px;">' +
          '🛒 Nouvelle commande <span style="color:#18C6C8;">' + BRAND + '</span>' +
        '</div>' +
        '<div style="font-size:13px;color:#587086;padding-top:5px;">Reçue via le formulaire du site cle-iptv.store</div>' +
      '</td></tr>' +

      '<tr><td style="padding:18px 28px 4px;">' +
        '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" ' +
               'style="border:1px solid #DCE7EF;border-radius:10px;border-collapse:separate;overflow:hidden;font-size:14px;">' +
          rows +
        '</table>' +
      '</td></tr>' +

      '<tr><td style="padding:20px 28px 6px;">' +
        btn(wa, 'Contacter le client sur WhatsApp', '#25D366', '#ffffff') +
      '</td></tr>' +
      '<tr><td style="padding:0 28px 24px;">' +
        btn('tel:+' + waNumber(d), 'Appeler', '#2457E6', '#ffffff', true) +
        btn(mailto, 'Répondre par e-mail', '#EEF4F9', '#0B1F33', true) +
        btn('https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/edit', 'Ouvrir la feuille', '#EEF4F9', '#0B1F33', true) +
      '</td></tr>' +

      '<tr><td style="padding:0 28px 26px;font-size:12px;color:#8FA6B8;line-height:1.6;">' +
        'Pensez à mettre à jour la colonne « Statut » dans la feuille une fois la commande traitée.' +
      '</td></tr>' +
    '</table>' +
  '</div>';

  var texte =
    'Nouvelle commande — ' + BRAND + '\n\n' +
    'Formule    : ' + (d.formule || '') + '\n' +
    'Prix       : ' + prix + '\n' +
    'Connexions : ' + (d.connexions || '') + '\n' +
    'Nom        : ' + (d.nom || '') + '\n' +
    'Téléphone  : ' + (d.telephone || '') + '\n' +
    'E-mail     : ' + (d.email || '') + '\n' +
    'Paiement   : ' + (d.paiement || '') + '\n\n' +
    'WhatsApp : ' + wa + '\n' +
    'Feuille  : https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/edit';

  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: sujet,
    body: texte,
    htmlBody: html,
    name: BRAND,
    replyTo: d.email || NOTIFY_EMAIL
  });
}

/* ---------- E-MAIL AU CLIENT ---------- */

function sendClientReceipt(d) {
  if (!d.email) { return; }

  var prix = formatPrix(d.prix);
  var rows =
    row('Formule',    d.formule) +
    row('Connexions', d.connexions) +
    row('Total',      '<span style="color:#0E8E90;font-weight:700;">' + prix + '</span>') +
    row('Paiement',   d.paiement);

  var html =
  '<div style="background:#F4F8FB;padding:26px 12px;font-family:Arial,Helvetica,sans-serif;">' +
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #DCE7EF;border-radius:14px;">' +
      '<tr><td style="padding:26px 28px 6px;">' +
        '<div style="font-size:21px;font-weight:bold;color:#0B1F33;letter-spacing:-.3px;">' +
          'Merci ' + esc(firstName(d.nom)) + ' 👋' +
        '</div>' +
        '<div style="font-size:14px;color:#3C566C;padding-top:10px;line-height:1.7;">' +
          'Votre commande a bien été reçue. Un conseiller vous contacte dans les prochaines ' +
          'minutes pour finaliser le paiement et vous transmettre vos identifiants de connexion.' +
        '</div>' +
      '</td></tr>' +
      '<tr><td style="padding:18px 28px 4px;">' +
        '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" ' +
               'style="border:1px solid #DCE7EF;border-radius:10px;border-collapse:separate;overflow:hidden;font-size:14px;">' +
          rows +
        '</table>' +
      '</td></tr>' +
      '<tr><td style="padding:20px 28px 24px;">' +
        btn('tel:' + PHONE.replace(/\s/g, ''), 'Nous appeler — ' + PHONE, '#18C6C8', '#06212B') +
      '</td></tr>' +
      '<tr><td style="padding:0 28px 26px;font-size:12px;color:#8FA6B8;line-height:1.6;">' +
        'Support disponible 24h/24 et 7j/7 · <a href="https://cle-iptv.store" style="color:#2457E6;">cle-iptv.store</a>' +
      '</td></tr>' +
    '</table>' +
  '</div>';

  var texte =
    'Bonjour ' + (d.nom || '') + ',\n\n' +
    'Votre commande a bien été reçue. Un conseiller vous contacte dans les\n' +
    'prochaines minutes pour finaliser le paiement et vous transmettre vos\n' +
    'identifiants.\n\n' +
    'Formule    : ' + (d.formule || '') + '\n' +
    'Connexions : ' + (d.connexions || '') + '\n' +
    'Total      : ' + prix + '\n' +
    'Paiement   : ' + (d.paiement || '') + '\n\n' +
    'Une question ? Appelez-nous au ' + PHONE + ', 24h/24.\n\n' +
    "L'équipe " + BRAND + '\n' +
    'https://cle-iptv.store';

  MailApp.sendEmail({
    to: d.email,
    subject: 'Votre commande ' + BRAND + ' a bien été reçue',
    body: texte,
    htmlBody: html,
    name: BRAND,
    replyTo: NOTIFY_EMAIL
  });
}

/* ---------- OUTILS ---------- */

function row(label, value) {
  return '<tr>' +
    '<td style="padding:11px 14px;border-bottom:1px solid #ECF2F7;background:#F8FBFD;color:#587086;width:38%;">' + label + '</td>' +
    '<td style="padding:11px 14px;border-bottom:1px solid #ECF2F7;color:#0B1F33;font-weight:bold;">' + (value === undefined || value === null || value === '' ? '—' : value) + '</td>' +
  '</tr>';
}

function btn(href, label, bg, color, small) {
  if (!href) { return ''; }
  var pad = small ? '10px 16px' : '14px 22px';
  var fs  = small ? '13px' : '15px';
  return '<a href="' + href + '" style="display:inline-block;margin:0 8px 8px 0;padding:' + pad +
         ';background:' + bg + ';color:' + color + ';font-size:' + fs +
         ';font-weight:bold;text-decoration:none;border-radius:9px;">' + label + '</a>';
}

/** Numéro au format international, sans + ni espaces, pour wa.me */
function waNumber(d) {
  var indic = digits(d.indicatif || '');
  var local = digits(d.numero || '');
  if (!indic) {
    // Anciennes commandes : tout est dans « telephone »
    return digits(d.telephone || '');
  }
  local = local.replace(/^0+/, '');   // un 0 local ne s'utilise pas à l'international
  return indic + local;
}

function whatsappLink(d) {
  var num = waNumber(d);
  var msg = 'Bonjour ' + (d.nom || '') + ', merci pour votre commande ' +
            (d.formule || '') + ' chez ' + BRAND + '. Je vous accompagne pour finaliser le paiement.';
  return 'https://wa.me/' + num + '?text=' + encodeURIComponent(msg);
}

function digits(v) { return String(v || '').replace(/[^0-9]/g, ''); }

function formatPrix(p) {
  var n = Number(p) || 0;
  return n.toFixed(2).replace('.', ',') + ' €';
}

function shortPlan(f) {
  return String(f || '').split('—')[0].trim() || 'Commande';
}

function firstName(n) {
  return String(n || '').trim().split(' ')[0] || '';
}

function esc(t) {
  return String(t == null ? '' : t)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Lancez cette fonction depuis l'éditeur (bouton « Exécuter ») pour
 * vérifier que tout fonctionne : une ligne de test doit apparaître
 * dans la feuille et deux e-mails doivent vous être envoyés.
 */
function testerLeScript() {
  var faux = {
    postData: {
      contents: JSON.stringify({
        token: TOKEN,
        nom: 'Clemente La Castellana',
        email: NOTIFY_EMAIL,
        indicatif: '+33',
        numero: '612345678',
        telephone: '+33 612345678',
        formule: 'Gold — 15 mois (+3 offerts)',
        prix: 134.97,
        connexions: 3,
        paiement: 'Carte bancaire'
      })
    }
  };
  Logger.log(doPost(faux).getContent());
}
