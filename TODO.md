# TODO - Mise à jour Réouverture (modes 1..4)

- [ ] 1) Corriger le calcul actuel côté Réouverture dans `src/components/TicketsListKanban.jsx` (mode 1..4 à implémenter).
- [ ] 2) Ajouter/brancher une UI (affichage non fonctionnel) dans la boîte dialogue Réouverture pour sélectionner Mode 1/2/3/4.
- [ ] 3) Implémenter l’import CSV (afficher mais non fonctionnel) dans `src/components/CsvMouvement.jsx` pour sélectionner le mode d’import (1..4) et calculer la réouverture selon le mode.
- [ ] 4) Mettre à jour le recalcul en déplacement Kanban (réouverture) pour utiliser uniquement `superCost` comme source touchée.
- [ ] 5) Gérer le cas demandé : `superCost` peut être 0 lors du déplacement vers “Terminé”.
- [ ] 6) Valider via un run local / tests (lint/build) pour s’assurer que tout compile.

