# Clé IPTV — site statique

Site vitrine francophone pour l'abonnement IPTV **Clé IPTV**. HTML / CSS / JS
purs, sans build, sans dépendance : les fichiers du dépôt sont exactement ceux
qui sont mis en ligne.

---

## Contenu du dépôt

| Chemin | Rôle |
|---|---|
| `index.html` | Page d'accueil (hero, tarifs, FAQ, formulaire de commande) |
| `catalogue.html`, `appareils.html`, `fonctionnement.html`, `faq.html`, `blog.html`, `contact.html` | Pages principales |
| `debit-internet-iptv-4k.html`, `erreurs-iptv-smart-tv.html`, `nombre-connexions-simultanees.html` | Articles SEO |
| `mentions-legales.html`, `confidentialite.html`, `conditions-generales.html` | Pages légales |
| `assets/style.css` | Design system complet (« Bleu nuit & Turquoise ») + widget WhatsApp |
| `assets/app.js` | Menu mobile, calculateur de tarifs, modale de commande, widget WhatsApp |
| `.htaccess` | Config Apache/cPanel : URL sans `.html`, compression, cache, redirections |
| `sitemap.xml`, `robots.txt` | SEO |
| `LISEZMOI.txt` | Notes de mise en ligne (hébergement, à compléter avant lancement) |

---

## Contact — 100 % WhatsApp

Le site ne contient **aucun lien d'appel téléphonique**. Tous les points de
contact (en-tête, pied de page, boutons CTA, page contact, pages légales)
pointent vers WhatsApp :

```
https://wa.me/16615413954?text=<message pré-rempli>
```

### Changer le numéro

1. Remplacer `16615413954` partout dans les `.html` **et** dans `assets/app.js` :

   ```bash
   grep -rl '16615413954' . | xargs sed -i '' 's/16615413954/NOUVEAU_NUMERO/g'   # macOS
   ```

2. Remplacer aussi le numéro affiché `+1 661-541-3954` (en-tête, pied de page,
   page contact, mentions légales).

---

## Widget WhatsApp

Le widget de discussion est **auto-injecté** par `assets/app.js` sur toutes les
pages : aucun script externe, aucune balise à ajouter dans le HTML. Une nouvelle
page qui charge `assets/app.js` l'affiche automatiquement.

Réglages en haut du bloc `WIDGET WHATSAPP` dans `assets/app.js` :

| Constante | Rôle |
|---|---|
| `WA_NUMBER` | Numéro WhatsApp, format international sans `+` |
| `WA_NAME` | Nom affiché dans l'en-tête du widget |
| `WA_STATUS` | Ligne de statut (« En ligne · réponse en quelques minutes ») |
| `WA_GREET` | Message d'accueil dans la bulle (HTML autorisé) |
| `WA_DEFAULT` | Message pré-rempli si le visiteur n'écrit rien |
| `WA_TEASER` | Bulle d'accroche affichée après 4 secondes |

Les styles correspondants sont en fin de `assets/style.css`, section
`WHATSAPP — icônes et widget de discussion`.

---

## Mise en ligne

### Hébergement cPanel (Namecheap / Spaceship)

1. Uploader **tout le contenu du dépôt** dans `public_html/`.
2. Vérifier que `.htaccess` est bien présent (fichier caché).
3. Purger le cache Cloudflare (Caching → Configuration → Purge Everything).

### Vercel / Netlify / GitHub Pages

Le site est statique : aucune commande de build, dossier de sortie = racine du
dépôt. `vercel.json` fournit déjà les URL sans `.html` pour Vercel.

> `.htaccess` n'est lu que par Apache — il est ignoré par Vercel, Netlify et
> GitHub Pages.

---

## Cache navigateur

Le CSS et le JS sont appelés avec `?v=3` dans les 13 fichiers HTML. **Après
chaque modification de `assets/style.css` ou `assets/app.js`, incrémenter ce
numéro** dans toutes les pages, sinon les visiteurs gardent l'ancienne version :

```bash
grep -rl 'v=3' *.html | xargs sed -i '' 's/?v=3/?v=4/g'   # macOS
```

---

## À compléter avant la mise en ligne

Voir `LISEZMOI.txt`. Les champs restants sont marqués `<span class="todo">` dans
les pages légales (raison sociale, SIRET, adresse e-mail, directeur de la
publication).
