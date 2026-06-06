# SQL pour Administrateur GLPI

## Tables importantes

### Utilisateurs

```sql
glpi_users
```

### Tickets

```sql
glpi_tickets
```

### Ordinateurs

```sql
glpi_computers
```

### Entités

```sql
glpi_entities
```

---

# Requêtes utiles

## Nombre de tickets

```sql
SELECT COUNT(*)
FROM glpi_tickets;
```

---

## Tickets ouverts

```sql
SELECT *
FROM glpi_tickets
WHERE status <> 6;
```

---

## Utilisateurs

```sql
SELECT *
FROM glpi_users;
```

---

## Ordinateurs

```sql
SELECT *
FROM glpi_computers;
```

---

# Sauvegarde

```bash
mysqldump -u root -p glpi > glpi.sql
```

---

# Restauration

```bash
mysql -u root -p glpi < glpi.sql
```

---

# Optimisation

Analyser :

```sql
EXPLAIN
SELECT *
FROM glpi_tickets;
```

---

# Index

Créer :

```sql
CREATE INDEX idx_ticket_status
ON glpi_tickets(status);
```

