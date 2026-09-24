# Checklist du site All Neat Cleaning Services

État au 23 septembre 2026. ✅ fait et vérifié · ⚠️ nécessite une info ou une action de l'entreprise · ➖ volontairement écarté.

Mesures Lighthouse (mobile, version compilée) : **avant** Accessibilité 93 · Bonnes pratiques 100 · SEO 92 · Agents IA 67 (5 échecs) → **après** 100 · 100 · 100 · 100 (62 contrôles réussis, 0 échec).

## 1. Conversion (obtenir des demandes de devis)
- ✅ Appel en un clic partout (en-tête, hero, FAQ, contact, pied de page) et barre d'actions mobile Appeler / SMS / Devis
- ✅ Formulaire de devis : validation en direct, messages d'erreur accessibles, focus sur le premier champ en erreur, anti-spam invisible (honeypot)
- ✅ Envoi sans backend : demande pré-remplie envoyée par SMS au numéro vérifié (fonctionne dès aujourd'hui, sans compte)
- ⚠️ Envoi par formulaire en ligne : créer un compte Formspree / Web3Forms (ou une fonction serverless) puis builder avec `VITE_QUOTE_ENDPOINT=…` ; l'upload de photos s'active alors automatiquement
- ⚠️ Horaires d'ouverture et délai de réponse : à fournir (non affichés, car non vérifiés)

## 2. Confiance
- ✅ Avis Google réels, verbatim, attribués, avec lien vers la source (aucune note ni nombre d'avis codé en dur)
- ✅ Faits vérifiés uniquement : entreprise d'un vétéran, service en espagnol, plus de 10 ans (selon les listings), devis gratuits
- ⚠️ Vraies photos de chantiers et d'avant/après : à fournir ; en attendant, illustrations générées par IA, étiquetées « AI illustration » et décrites comme telles dans le texte alternatif
- ⚠️ Assurance, licences, certifications : à fournir si elles existent (rien n'est affirmé)
- ⚠️ Adresse physique : les listings se contredisent, à confirmer (seule la ville est publiée)

## 3. Contenu et langues
- ✅ Site complet en anglais et en espagnol (bouton de langue, `?lang=es`, choix mémorisé, `lang` du document, titre et description traduits)
- ✅ Avis conservés en anglais d'origine avec une mention en espagnol et `lang="en"` pour les lecteurs d'écran
- ✅ 6 services, zone desservie, processus en 3 étapes, FAQ de 10 questions, section « À propos »
- ⚠️ Détail de ce qui est inclus dans chaque prestation : à fournir (pas inventé)

## 4. Identité visuelle et médias (générés en local, pipeline `ai-studio/projects/allneat_site`)
- ✅ Logo vectoriel : « A » Bricolage Grotesque + étincelle teal, cohérent avec l'intro 3D Blender
- ✅ Favicon SVG, favicon 32 px, icône Apple 180 px, icônes d'application 192/512 et maskable, manifeste web
- ✅ Image de partage Open Graph 1200×630 tirée de l'intro 3D
- ✅ 8 illustrations photoréalistes (Z-Image Turbo), sans personne ni texte, en WebP responsive (3 tailles chacune)
- ✅ Boucle vidéo du hero (LTX 2.5, 10 s aller-retour, 661 Ko en WebM), désactivée si « réduire les animations » ou « économie de données »

## 5. SEO local
- ✅ Données structurées valides : `LocalBusiness` (le type `HouseCleaningService` utilisé avant n'existe pas dans schema.org), `WebSite`, `FAQPage`, générées au build depuis le contenu du site
- ✅ `priceRange "$$"` retiré (non vérifié)
- ✅ `robots.txt`, `sitemap.xml` avec alternates `hreflang` en/es, balises `hreflang`, Open Graph et Twitter locaux
- ✅ `llms.txt` pour les agents IA (faits vérifiés uniquement)
- ⚠️ Nom de domaine : builder avec `SITE_URL=https://…` (le domaine `.example` est un espace réservé)
- ⚠️ Fiche Google Business Profile : lier le site, vérifier la cohérence nom / téléphone / ville

## 6. Accessibilité (WCAG 2.2 AA visé)
- ✅ Contraste du pied de page corrigé, liste « Why All Neat » rendue valide, nom accessible du logo aligné sur son texte
- ✅ Lien d'évitement, focus visible, menu mobile fermable avec Échap, section courante signalée (`aria-current`)
- ✅ Champs de formulaire reliés à leurs erreurs (`aria-invalid`, `aria-describedby`), zone d'alerte `role="alert"`
- ✅ Animations et vidéo coupées sous `prefers-reduced-motion`

## 7. Performance
- ✅ Plus aucune image hotlinkée depuis Unsplash : tout est servi localement en WebP responsive avec dimensions fixes (pas de décalage de mise en page)
- ✅ Image du hero préchargée en priorité, images hors écran en chargement différé, vidéo chargée seulement si autorisée
- ⚠️ Hébergement : activer la compression et un cache long sur `/assets` et `/media` (Netlify, Vercel, Cloudflare Pages)

## 8. Légal et confidentialité
- ✅ Page « Politique de confidentialité » (`#/privacy`) en anglais et en espagnol, liée depuis le formulaire et le pied de page
- ⚠️ Faire relire la politique par l'entreprise (marquée comme brouillon)
- ➖ Bannière cookies : inutile tant qu'il n'y a ni pistage ni cookies publicitaires

## 9. Technique
- ✅ Pages 404 (`#/…` inconnu) et confidentialité via un routage par ancre compatible avec tout hébergement statique
- ✅ Contenu `<noscript>` avec le téléphone
- ✅ Build TypeScript sans erreur, lint sans avertissement sur le site
- ⚠️ Mesure d'audience respectueuse de la vie privée (Plausible, Umami) : à décider
- ⚠️ Retirer la mention « concept en attente d'approbation » du pied de page une fois le site validé par l'entreprise

## Commandes
```bash
npm run dev                                   # développement
npm run build                                 # version de production (dist/)
SITE_URL=https://www.exemple.com VITE_QUOTE_ENDPOINT=https://formspree.io/f/xxxx npm run build
```
