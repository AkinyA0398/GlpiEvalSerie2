# TODO - GLPI Admin (Tickets/Elements)

- [x] Modifier `server/index.js` : enrichir `GET /api/tickets` pour remplir `items` quand `includeItems=true` (avec limite N).
- [x] Modifier `src/pages/TicketsAdminPage.tsx` : demander `includeItems=true` lors du chargement de la page.

- [x] Vérifier : la table affiche maintenant le nombre d’éléments au lieu de `—`.

- [ ] (Optionnel) Vérifier filtres status/type restent cohérents avec le chargement enrichi.


