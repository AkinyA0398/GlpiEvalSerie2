# SQLite3 Complet — Débutant à Professionnel

# Table des matières
1. Introduction à SQLite3
2. Installation et prise en main
3. Les bases du SQL
4. Modélisation des données
5. Requêtes CRUD
6. Fonctions d'agrégation
7. Jointures
8. Sous-requêtes
9. Vues
10. Index
11. Transactions
12. Triggers
13. Optimisation des performances
14. Sauvegarde et restauration
15. Sécurité
16. Projet complet de gestion scolaire
17. Exercices corrigés
18. Bonnes pratiques professionnelles

---

# 1. Introduction à SQLite3

SQLite est un système de gestion de bases de données relationnelles (SGBDR) léger, embarqué et sans serveur.

Avantages :
- Gratuit et open source
- Un seul fichier de base de données
- Très rapide
- Compatible Windows, Linux et macOS

---

# 2. Installation

```bash
sqlite3 ma_base.db
```

Afficher les tables :

```sql
.tables
```

Afficher le schéma :

```sql
.schema
```

Quitter :

```sql
.quit
```

---

# 3. Les bases du SQL

## Création d'une table

```sql
CREATE TABLE etudiants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    age INTEGER
);
```

## Insertion

```sql
INSERT INTO etudiants(nom, age)
VALUES ('Alice', 20);
```

## Lecture

```sql
SELECT * FROM etudiants;
```

## Mise à jour

```sql
UPDATE etudiants
SET age = 21
WHERE id = 1;
```

## Suppression

```sql
DELETE FROM etudiants
WHERE id = 1;
```

---

# 4. Modélisation des données

Exemple : Gestion scolaire

Tables :
- Etudiants
- Cours
- Inscriptions
- Notes

Relations :
- Un étudiant suit plusieurs cours
- Un cours possède plusieurs étudiants

---

# 5. CRUD Complet

CREATE

```sql
INSERT INTO etudiants(nom, age)
VALUES ('Jean', 22);
```

READ

```sql
SELECT * FROM etudiants;
```

UPDATE

```sql
UPDATE etudiants
SET age = 23
WHERE nom='Jean';
```

DELETE

```sql
DELETE FROM etudiants
WHERE nom='Jean';
```

---

# 6. Fonctions d'agrégation

```sql
SELECT COUNT(*) FROM etudiants;
```

```sql
SELECT AVG(age) FROM etudiants;
```

```sql
SELECT MAX(age) FROM etudiants;
```

```sql
SELECT MIN(age) FROM etudiants;
```

---

# 7. Jointures

```sql
SELECT e.nom, c.nom
FROM etudiants e
INNER JOIN inscriptions i
ON e.id=i.etudiant_id
INNER JOIN cours c
ON c.id=i.cours_id;
```

Types :
- INNER JOIN
- LEFT JOIN
- RIGHT JOIN (non supporté directement)
- CROSS JOIN

---

# 8. Sous-requêtes

```sql
SELECT nom
FROM etudiants
WHERE age >
(
    SELECT AVG(age)
    FROM etudiants
);
```

---

# 9. Vues

```sql
CREATE VIEW vue_etudiants AS
SELECT nom, age
FROM etudiants;
```

Utilisation :

```sql
SELECT * FROM vue_etudiants;
```

---

# 10. Index

```sql
CREATE INDEX idx_nom
ON etudiants(nom);
```

Vérification :

```sql
PRAGMA index_list('etudiants');
```

---

# 11. Transactions

```sql
BEGIN TRANSACTION;

UPDATE comptes
SET solde=solde-100
WHERE id=1;

UPDATE comptes
SET solde=solde+100
WHERE id=2;

COMMIT;
```

Annulation :

```sql
ROLLBACK;
```

---

# 12. Triggers

```sql
CREATE TABLE journal(
    action TEXT
);
```

```sql
CREATE TRIGGER log_insert
AFTER INSERT ON etudiants
BEGIN
    INSERT INTO journal(action)
    VALUES('Nouvel étudiant');
END;
```

---

# 13. Optimisation

Analyse :

```sql
EXPLAIN QUERY PLAN
SELECT *
FROM etudiants
WHERE nom='Alice';
```

Bonnes pratiques :
- Utiliser des index
- Éviter SELECT *
- Normaliser les données
- Analyser les plans d'exécution

---

# 14. Sauvegarde

```bash
sqlite3 production.db ".backup sauvegarde.db"
```

Restauration :

```bash
sqlite3 nouvelle.db ".restore sauvegarde.db"
```

---

# 15. Sécurité

- Utiliser les requêtes préparées
- Valider les entrées utilisateur
- Contrôler les permissions sur les fichiers
- Sauvegarder régulièrement

---

# 16. Projet Complet

Gestion scolaire

Tables :

```sql
CREATE TABLE etudiants(
    id INTEGER PRIMARY KEY,
    nom TEXT
);
```

```sql
CREATE TABLE cours(
    id INTEGER PRIMARY KEY,
    nom TEXT
);
```

```sql
CREATE TABLE inscriptions(
    etudiant_id INTEGER,
    cours_id INTEGER
);
```

Exemple de rapport :

```sql
SELECT e.nom, COUNT(*)
FROM etudiants e
JOIN inscriptions i
ON e.id=i.etudiant_id
GROUP BY e.nom;
```

---

# 17. Exercices Corrigés

Exercice 1 :
Lister les étudiants de plus de 20 ans.

Correction :

```sql
SELECT *
FROM etudiants
WHERE age > 20;
```

Exercice 2 :
Compter les étudiants.

```sql
SELECT COUNT(*)
FROM etudiants;
```

Exercice 3 :
Calculer l'âge moyen.

```sql
SELECT AVG(age)
FROM etudiants;
```

---

# 18. Compétences Professionnelles

À la fin de ce cours, l'étudiant doit maîtriser :

- Création de bases SQLite
- Modélisation relationnelle
- SQL avancé
- Jointures complexes
- Transactions
- Triggers
- Optimisation
- Sauvegarde
- Sécurité
- Développement d'applications utilisant SQLite

Fin du document.
