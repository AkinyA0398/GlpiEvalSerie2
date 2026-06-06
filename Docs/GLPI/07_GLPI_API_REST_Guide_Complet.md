# API REST GLPI

## Architecture

```text
Client
 ↓
API REST
 ↓
GLPI
 ↓
MariaDB
```

---

# Authentification

## Init Session

POST

```http
glpi.localhost/glpi/apirest.php/initSession
```

---

# Session

GET

```http
glpi.localhost/glpi/apirest.php/getFullSession
```

---

# Fin Session

GET

```http
glpi.localhost/glpi/apirest.php/killSession
```

---

# CRUD générique

```http
GET
POST
PUT
DELETE
```

---

# Objets courants

## Tickets

```http
glpi.localhost/glpi/apirest.php/Ticket
```

## Utilisateurs

```http
glpi.localhost/glpi/apirest.php/User
```

## Ordinateurs

```http
glpi.localhost/glpi/apirest.php/Computer
```

## Entités

```http
glpi.localhost/glpi/apirest.php/Entity
```

## Groupes

```http
glpi.localhost/glpi/apirest.php/Group
```

## Logiciels

```http
glpi.localhost/glpi/apirest.php/Software
```

## Contrats

```http
glpi.localhost/glpi/apirest.php/Contract
```

## Fournisseurs

```http
glpi.localhost/glpi/apirest.php/Supplier
```

---

# Recherche

```http
glpi.localhost/glpi/apirest.php/search/Ticket
```

---

# Pagination

```http
?range=0-50
```

---

# Bonnes pratiques

* Toujours utiliser HTTPS
* Limiter les droits API
* Journaliser les appels

