# SQLite3 - Niveau Intermédiaire

## Contraintes
```sql
CREATE TABLE cours(
 id INTEGER PRIMARY KEY,
 nom TEXT NOT NULL,
 code TEXT UNIQUE
);
```

## Jointures
```sql
SELECT * FROM etudiants e
INNER JOIN inscriptions i ON e.id=i.etudiant_id;
```
