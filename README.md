# Portfolio — Koffi Moahiet Ange Laurette

Site statique (HTML, CSS, JS vanilla) prêt à déployer sur Vercel.
Thème obsidienne & or, typographie éditoriale (Fraunces + Manrope), mockups de téléphone en CSS,
animations au scroll, filtres de projets et micro-interactions, sans aucune dépendance.

## Tester en local

```bash
cd portfolio
python3 -m http.server 5173
```

Puis ouvrir `http://localhost:5173`.

## Déployer sur Vercel

1. Créer un nouveau projet Vercel.
2. Choisir ce dossier comme racine du projet : `portfolio`.
3. Laisser les réglages de build vides, car le site est statique.
4. Déployer.

## Structure

- `index.html` : contenu et sections (hero, à propos, projets, confiance, distinctions, coulisses, parcours, stack, références, contact).
- `styles.css` : design system (tokens dans `:root`), composants et responsive.
- `script.js` : preloader, navigation, révélations au scroll, compteurs, filtres, tilt, aperçu des distinctions, horloge d'Abidjan.
- `assets/` : photos, captures d'écran, logos, icônes et le CV (`assets/CV-Moahiet-Ange-Laurette-KOFFI.pdf`).
