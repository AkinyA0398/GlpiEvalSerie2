# Documentation API GLPI

Bienvenue dans la documentation complète de l'API REST GLPI.

## Structure

| Fichier | Contenu |
|--------|---------|
| [01_Authentification.md](01_Authentification.md) | Init session, tokens, kill session |
| [02_Tickets.md](02_Tickets.md) | Création, lecture, mise à jour, suivi des tickets |
| [03_Utilisateurs.md](03_Utilisateurs.md) | Gestion des utilisateurs |
| [04_Ordinateurs.md](04_Ordinateurs.md) | Inventaire des ordinateurs |
| [05_Entites.md](05_Entites.md) | Gestion des entités |
| [06_Groupes.md](06_Groupes.md) | Gestion des groupes |
| [07_Profils.md](07_Profils.md) | Profils et droits |
| [08_Imprimantes.md](08_Imprimantes.md) | Inventaire des imprimantes |
| [09_Moniteurs.md](09_Moniteurs.md) | Inventaire des moniteurs |
| [10_Logiciels.md](10_Logiciels.md) | Gestion des logiciels |
| [11_Licences.md](11_Licences.md) | Gestion des licences |
| [12_Equipements_Reseau.md](12_Equipements_Reseau.md) | Équipements réseau |
| [13_Fournisseurs.md](13_Fournisseurs.md) | Gestion des fournisseurs |
| [14_Contrats.md](14_Contrats.md) | Gestion des contrats |
| [15_Documents.md](15_Documents.md) | Gestion des documents |
| [16_Base_Connaissances.md](16_Base_Connaissances.md) | Base de connaissances (FAQ) |
| [17_Recherche.md](17_Recherche.md) | Recherche avancée |
| [18_Exploration_API.md](18_Exploration_API.md) | Exploration et introspection de l'API |

## Prérequis

- GLPI ≥ 9.1
- API REST activée dans **Configuration → Générale → API**
- URL de base : `https://<votre-glpi>/apirest.php`

## Authentification rapide

```http
POST glpi.localhost/glpi/apirest.php/initSession
Authorization: user_token <APP_TOKEN>
App-Token: <APP_TOKEN>
```

## Conventions

- Tous les exemples utilisent `curl`.
- `SESSION_TOKEN` est obtenu via `/initSession`.
- `APP_TOKEN` est défini dans la configuration GLPI.
- Les réponses sont en JSON.

## Codes HTTP courants

| Code | Signification |
|------|--------------|
| 200 | Succès |
| 201 | Ressource créée |
| 400 | Requête invalide |
| 401 | Non authentifié |
| 403 | Accès refusé |
| 404 | Ressource introuvable |
| 500 | Erreur serveur |
