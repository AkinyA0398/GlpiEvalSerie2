# TODO - Prix initial + nouveau prix (Kanban → SQLite → /costs)

## Étape 1 — Analyser & préparer
- [x] Lire `FrontOfficeKanban.jsx`, `TicketsCosts.jsx`, `MyApi/app.py`.
- [x] Confirmer mapping: prix d’origine = somme des lignes GLPI TicketCost (fixed+material+time), nouveau prix = champ Kanban “Coût final”.

## Étape 2 — Backend SQLite & APIs
- [ ] Modifier `MyApi/app.py`:
  - [ ] Ajouter colonnes si besoin: `origin_price`, `added_price`, `total_price`, (et garder `cost_value` si nécessaire).
  - [ ] Mettre à jour `POST /ticket-costs/new-price` pour:
    - [ ] calculer `origin_price` depuis GLPI TicketCost (via GLPI API) OU depuis une table existante,
    - [ ] additionner avec `added_price` (payload costValue),
    - [ ] insérer lignes SQLite avec `origin_price`, `added_price`, `total_price`.
  - [ ] Mettre à jour `GET /ticket-costs/recap` pour renvoyer `origin_price`, `added_price`, `total_price` (sans calcul front).

## Étape 3 — Kanban
- [ ] Modifier `src/components/FrontOfficeKanban.jsx` pour appeler le backend `POST /ticket-costs/new-price` avec `ticketId` + valeur “Coût final” au moment du changement de statut.

## Étape 4 — Front /costs
- [ ] Modifier `src/components/TicketsCosts.jsx` pour afficher les champs `origin_price`, `added_price`, `total_price` venant du backend.

## Étape 5 — Tests
- [ ] Lancer backend + front.
- [ ] Tester un ticket: vérifier que SQLite contient origin+added=total.
- [ ] Vérifier `/costs` (liste + récapitulatif) sans calcul côté front.

