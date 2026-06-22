# Documentation : Les Fondamentaux SQL

Cette documentation couvre les bases des requêtes SQL (SQLite, MySQL, PostgreSQL) indispensables pour gérer et interroger une base de données backend.

## 1. SELECT (Lecture de base)
Le mot-clé `SELECT` est utilisé pour lire des données d'une table.

```sql
-- Récupérer toutes les colonnes (*)
SELECT * FROM tickets;

-- Récupérer des colonnes spécifiques (optimisation de performance)
SELECT id, title, status FROM tickets;
```

## 2. WHERE (Filtrer les résultats)
Le mot-clé `WHERE` permet d'appliquer des conditions sur les lignes retournées.

```sql
-- Égalité simple
SELECT * FROM tickets WHERE status = 'En cours';

-- Opérateurs de comparaison : =, <, >, <=, >=, !=
SELECT * FROM tickets WHERE cost > 500;

-- IN : Vérifie si la valeur est dans une liste
SELECT * FROM tickets WHERE status IN ('Nouveau', 'En cours');

-- LIKE : Recherche de motif textuel (% remplace n'importe quelle suite de caractères)
-- Va trouver "Problème souris", "Problème écran", etc.
SELECT * FROM tickets WHERE title LIKE '%Problème%'; 

-- IS NULL / IS NOT NULL : Gère les valeurs vides ou manquantes
SELECT * FROM tickets WHERE resolved_date IS NULL;
```

## 3. Fonctions d'Aggrégation : COUNT, SUM, AVG
Ces fonctions effectuent un calcul sur un ensemble de résultats pour renvoyer une seule valeur.

```sql
-- COUNT : Compte le nombre total de lignes (combien de tickets au total)
SELECT COUNT(*) FROM tickets;

-- SUM : Fait la somme d'une colonne numérique (ex: coût total de tous les tickets)
SELECT SUM(cost) AS total_cost FROM tickets;

-- AVG : Calcule la moyenne (ex: coût moyen)
SELECT AVG(cost) AS average_cost FROM tickets WHERE status = 'Résolu';

-- MAX et MIN : Trouve la valeur la plus haute ou la plus basse
SELECT MAX(cost) AS max_cost, MIN(cost) AS min_cost FROM tickets;
```
*(Note : `AS` permet de donner un "alias" / nom plus lisible à la colonne de retour dans le JSON de l'API)*

## 4. GROUP BY et HAVING (Regroupements)
Essentiel pour faire des statistiques par catégorie.

```sql
-- Regroupe par 'status' et compte le nombre d'éléments dans chaque groupe
-- Retournera par exemple : ('Nouveau': 10), ('Résolu': 45)
SELECT status, COUNT(*) AS ticket_count 
FROM tickets 
GROUP BY status;

-- Somme des coûts pour chaque type de matériel (hardware_type)
SELECT hardware_type, SUM(cost) AS total_hardware_cost
FROM tickets
GROUP BY hardware_type;

-- HAVING : Comme le WHERE, mais s'applique APRES le GROUP BY
-- Affiche uniquement les types de matériel où le coût total dépasse 1000
SELECT hardware_type, SUM(cost) AS total_hardware_cost
FROM tickets
GROUP BY hardware_type
HAVING SUM(cost) > 1000;
```

## 5. ORDER BY et LIMIT (Trier et Limiter)
Utile pour la pagination et le tri.

```sql
-- Trie par date de création (DESC = Décroissant / plus récent d'abord, ASC = Croissant)
SELECT * FROM tickets 
ORDER BY creation_date DESC;

-- LIMIT : Ne récupère que X résultats (ex: les 5 tickets les plus chers)
SELECT * FROM tickets 
ORDER BY cost DESC 
LIMIT 5;
```

## 6. JOIN (Liaisons entre Tables)
Utilisé lorsque les données sont réparties sur plusieurs tables (ex: un ticket appartient à un utilisateur).

```sql
-- INNER JOIN : Ne garde que les tickets qui ONT un utilisateur ET les utilisateurs qui ONT un ticket.
SELECT tickets.id, tickets.title, users.name
FROM tickets
INNER JOIN users ON tickets.user_id = users.id;

-- LEFT JOIN : Garde TOUS les tickets. 
-- Si un ticket n'a pas d'utilisateur assigné (user_id est NULL), users.name sera NULL.
SELECT tickets.id, tickets.title, users.name
FROM tickets
LEFT JOIN users ON tickets.user_id = users.id;
```
