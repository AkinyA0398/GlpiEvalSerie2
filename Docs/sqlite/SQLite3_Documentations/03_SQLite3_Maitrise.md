# SQLite3 - Niveau Maîtrise

## Transactions
```sql
BEGIN TRANSACTION;
COMMIT;
```

## Triggers
```sql
CREATE TRIGGER exemple
AFTER INSERT ON etudiants
BEGIN
 SELECT 1;
END;
```
