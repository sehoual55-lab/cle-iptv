/**
 * ============================================================
 *  CLÉ IPTV — Réception des commandes dans Google Sheets
 * ------------------------------------------------------------
 *  Ce script reçoit les commandes envoyées depuis cle-iptv.store,
 *  ajoute une ligne dans votre feuille et vous prévient par e-mail.
 *
 *  INSTALLATION : voir GOOGLE-SHEET.txt
 * ============================================================
 */

/* ---------- RÉGLAGES ---------- */

// Identifiant de votre feuille (déjà rempli)
var SHEET_ID = '1kj3RZMrc2ArSKqVzNoQ9Dl5ClwyRoaArFohTrBneqMA';

// Nom de l'onglet qui reçoit les commandes (celui avec vos 9 colonnes)
var SHEET_NAME = 'Sheet1';   // ou 'Feuille 1' si votre interface est en français
                             // (si le nom ne correspond pas, le 1er onglet est utilisé)

// Adresse qui reçoit l'alerte à chaque nouvelle commande
var NOTIFY_EMAIL = 'xyz905391@gmail.com';

// Envoyer aussi un accusé de réception au client ? (true / false)
var SEND_CLIENT_RECEIPT = true;

// Mot de passe partagé avec le site. Il doit être IDENTIQUE à la valeur
// ORDER_TOKEN dans assets/app.js. Changez-le une fois, des deux côtés.
var TOKEN = 'cle-iptv-2026';

// Votre numéro, affiché dans l'e-mail envoyé au client
var PHONE = '+33 6 12 34 56 78';

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

    // Ordre des colonnes : Date | Nom | Email | Téléphone | Formule |
    //                      Prix (€) | Connexions | Paiement | Statut
    sheet.appendRow([
      new Date(),
      data.nom      || '',
      data.email    || '',
      data.telephone|| '',
      data.formule  || '',
      Number(data.prix) || 0,
      Number(data.connexions) || 1,
      data.paiement || '',
      'Nouvelle'
    ]);

    notifyOwner(data);
    if (SEND_CLIENT_RECEIPT) { sendClientReceipt(data); }

    return json({ ok: true });

  } catch (err) {
    // La commande est tout de même tracée pour ne rien perdre
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

/* ---------- E-MAILS ---------- */

function notifyOwner(d) {
  var sujet = 'Nouvelle commande — ' + (d.formule || '') + ' — ' + (d.prix || '') + ' €';
  var corps =
    'Nouvelle commande reçue sur cle-iptv.store\n\n' +
    'Nom          : ' + (d.nom || '') + '\n' +
    'E-mail       : ' + (d.email || '') + '\n' +
    'Téléphone    : ' + (d.telephone || '') + '\n' +
    'Formule      : ' + (d.formule || '') + '\n' +
    'Connexions   : ' + (d.connexions || '') + '\n' +
    'Prix         : ' + (d.prix || '') + ' €\n' +
    'Paiement     : ' + (d.paiement || '') + '\n\n' +
    'Feuille : https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/edit';

  MailApp.sendEmail(NOTIFY_EMAIL, sujet, corps);
}

function sendClientReceipt(d) {
  if (!d.email) { return; }
  var sujet = 'Votre commande Clé IPTV a bien été reçue';
  var corps =
    'Bonjour ' + (d.nom || '') + ',\n\n' +
    'Nous avons bien reçu votre commande. Un conseiller vous contacte dans\n' +
    'les prochaines minutes pour finaliser le paiement et vous transmettre\n' +
    'vos identifiants de connexion.\n\n' +
    'Récapitulatif\n' +
    '-------------\n' +
    'Formule    : ' + (d.formule || '') + '\n' +
    'Connexions : ' + (d.connexions || '') + '\n' +
    'Total      : ' + (d.prix || '') + ' €\n' +
    'Paiement   : ' + (d.paiement || '') + '\n\n' +
    'Une question ? Appelez-nous au ' + PHONE + ', 24h/24.\n\n' +
    'À très vite,\n' +
    "L'équipe Clé IPTV\n" +
    'https://cle-iptv.store';

  MailApp.sendEmail(d.email, sujet, corps);
}

/* ---------- OUTILS ---------- */

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Lancez cette fonction une fois depuis l'éditeur (bouton « Exécuter »)
 * pour vérifier que tout fonctionne : une ligne de test doit apparaître
 * dans la feuille et un e-mail doit vous être envoyé.
 */
function testerLeScript() {
  var faux = {
    postData: {
      contents: JSON.stringify({
        token: TOKEN,
        nom: 'Test Dupont',
        email: NOTIFY_EMAIL,
        telephone: '+33 6 00 00 00 00',
        formule: 'Gold — 15 mois (+3 offerts)',
        prix: 49.99,
        connexions: 1,
        paiement: 'Carte bancaire'
      })
    }
  };
  Logger.log(doPost(faux).getContent());
}
