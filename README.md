# Portfolio de Koffi Moahiet Ange Laurette

Site statique (HTML, CSS, JS vanilla) déployé sur Vercel depuis la branche `main`.
Direction éditoriale et sobre : Instrument Serif pour les titres, Geist pour le texte, un seul accent doré,
thèmes clair et sombre (préférence système, avec bascule mémorisée).

## Tester en local

```bash
python -m http.server 5173
```

Puis ouvrir `http://localhost:5173`.

## Structure

- `index.html` : contenu et sections (accueil, à propos, projets, confiance, distinctions, coulisses, parcours, stack, références, contact).
- `styles.css` : jetons de couleur dans `:root` (clair et sombre), grille à 12 colonnes, composants et section « Motion ».
- `script.js` : thème, menu mobile, apparitions au défilement, titres révélés mot à mot, parallaxe légère, filtres de projets, copie de l'adresse, heure d'Abidjan.
- `assets/` : photos, captures d'écran, logos et le CV (`assets/CV-Moahiet-Ange-Laurette-KOFFI.pdf`).

## Motion

Les animations reposent sur trois gestes : le texte monte depuis un masque, les images se découvrent de bas en haut,
les filets se tracent de gauche à droite. Le changement de thème et les filtres utilisent l'API View Transitions
quand le navigateur la propose. Tout est désactivé lorsque le système demande de réduire les animations.
