# Documentation Technique : API Flask (`app.py`)

## 1. Vue d'ensemble
L'API est développée en **Python** avec le framework **Flask** et utilise **SQLite** (`test.db`) comme base de données. Elle gère la configuration des statuts et le calcul/suivi des coûts liés aux tickets (qui peuvent provenir de GLPI ou d'une autre application cliente). Le package `flask_cors` est utilisé pour gérer les requêtes Cross-Origin (CORS) avec le front-end React.

## 2. Base de données (SQLite)
Le script initialise automatiquement la base de données SQLite `test.db` avec deux tables si elles n'existent pas :

- **`status`** : Stocke les statuts personnalisés avec traduction (Nouveau, En cours, Résolu) et couleur.
  - `id` (INTEGER PRIMARY KEY) : ID du statut (forcé pour correspondre à GLPI, ex: 1, 2, 6).
  - `couleur` (TEXT) : Code couleur hexadécimal.
  - `name_fr` (TEXT), `name_en` (TEXT), `name_mg` (TEXT) : Traductions du statut.
- **`costItem`** : Enregistre les coûts associés à des items ou tickets spécifiques.
  - `id` (INTEGER PRIMARY KEY)
  - `item_id` (TEXT)
  - `cost` (INT)
  - `prix` (INT)
  - `id_ticket` (INT)

## 3. Endpoints (Routes API)

### 3.1 Gestion des Statuts

- **`GET /status`**
  - **Description** : Récupère la liste des statuts configurés, traduits selon la langue demandée.
  - **Paramètre URL** : `lang` (optionnel, par défaut `fr`). Valeurs : `fr`, `en`, `mg`.
  - **Retour** : JSON avec `id`, `couleur` et `name`.

- **`POST /status`**
  - **Description** : Ajoute un nouveau statut.
  - **Payload** : JSON avec `couleur`, `name_fr`, `name_en`, `name_mg`.

- **`PUT /status/<int:status_id>`**
  - **Description** : Met à jour un statut existant.
  - **Payload** : JSON avec les champs à modifier (`couleur`, `name_fr`, `name_en`, `name_mg`). Les champs non fournis conservent leur valeur actuelle.

### 3.2 Gestion des Coûts (`costItem`)

- **`POST /cost`**
  - **Description** : Ajoute un coût (cost) sur un ticket.
  - **Payload** : `item_id`, `cost`, `ticket_id`.

- **`POST /costPrix`**
  - **Description** : Ajoute un prix (prix) de vente ou autre sur un ticket.
  - **Payload** : `item_id`, `cost` (mappé sur `prix` en base), `ticket_id`.

- **`GET /cost`**
  - **Description** : Récupère la somme des coûts et prix regroupés par `item_id`.
  - **Retour** : JSON avec `item_id`, `cost` (somme) et `prix` (somme).

- **`DELETE /cost/<int:ticket_id>`**
  - **Description** : Supprime toutes les entrées de coût associées à un `id_ticket` spécifique.

- **`GET /costLast`**
  - **Description** : Récupère le coût pour un type d'item et un ID de ticket spécifiques.
  - **Paramètres URL** : `itemtype` et `id_ticket`.
  - **Retour** : Liste des coûts (JSON).

- **`GET /costAll`**
  - **Description** : Récupère toutes les entrées de coût sans aggrégation.
  - **Retour** : JSON avec `item_id`, `cost`, `id_ticket`, `prix`.

## 4. Exécution
Pour lancer le serveur en mode développement :
```bash
python3 app.py
```
Le serveur tourne par défaut sur `http://localhost:5000`.
