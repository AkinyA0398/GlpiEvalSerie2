# 02 – Tickets

## Vue d'ensemble

Les tickets sont le cœur du helpdesk GLPI. L'API permet de créer, lire, mettre à jour, fermer des tickets, et de gérer leurs éléments associés (suivis, tâches, solutions, acteurs).

---

## Lister les tickets

```http
GET glpi.localhost/glpi/apirest.php/Ticket
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

### Paramètres de pagination

| Paramètre | Description | Défaut |
|-----------|-------------|--------|
| `range` | Plage ex: `0-49` | `0-49` |
| `sort` | Champ de tri ex: `id` | `id` |
| `order` | `ASC` ou `DESC` | `ASC` |

```http
GET glpi.localhost/glpi/apirest.php/Ticket?range=0-9&sort=date_mod&order=DESC
```

---

## Lire un ticket

```http
GET glpi.localhost/glpi/apirest.php/Ticket/<id>
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

### Réponse (extrait)

```json
{
  "id": 42,
  "name": "Problème réseau",
  "content": "Impossible d'accéder à Internet depuis le bureau 12.",
  "status": 2,
  "priority": 3,
  "urgency": 2,
  "impact": 2,
  "date": "2024-01-15 09:30:00",
  "date_mod": "2024-01-15 10:00:00",
  "entities_id": 1,
  "users_id_recipient": 5,
  "type": 1
}
```

### Statuts courants

| Valeur | Libellé |
|--------|---------|
| 1 | Nouveau |
| 2 | En cours (attribué) |
| 3 | En cours (planifié) |
| 4 | En attente |
| 5 | Résolu |
| 6 | Clos |

### Types

| Valeur | Libellé |
|--------|---------|
| 1 | Incident |
| 2 | Demande |

---

## Créer un ticket

```http
POST glpi.localhost/glpi/apirest.php/Ticket
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "name": "Écran noir au démarrage",
    "content": "L'ordinateur démarre mais l'écran reste noir.",
    "status": 1,
    "type": 1,
    "priority": 3,
    "urgency": 3,
    "impact": 3,
    "entities_id": 1,
    "_users_id_requester": 12
  }
}
```

### Réponse

```json
{
  "id": 103,
  "message": "Item successfully added: Ticket 103"
}
```

---

## Modifier un ticket

```http
PUT glpi.localhost/glpi/apirest.php/Ticket/<id>
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "status": 4,
    "priority": 5
  }
}
```

---

## Supprimer un ticket

```http
DELETE glpi.localhost/glpi/apirest.php/Ticket/<id>
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

Avec purge (suppression définitive) :

```http
DELETE glpi.localhost/glpi/apirest.php/Ticket/<id>?purge=1
```

---

## Suivis (ITILFollowup)

### Lister les suivis d'un ticket

```http
GET glpi.localhost/glpi/apirest.php/Ticket/<id>/ITILFollowup
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

### Ajouter un suivi

```http
POST glpi.localhost/glpi/apirest.php/ITILFollowup
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "items_id": 42,
    "itemtype": "Ticket",
    "content": "Prise en charge en cours, investigation réseau.",
    "is_private": 0
  }
}
```

---

## Tâches (TicketTask)

### Ajouter une tâche

```http
POST glpi.localhost/glpi/apirest.php/TicketTask
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "tickets_id": 42,
    "content": "Redémarrer le switch du couloir B.",
    "state": 1,
    "users_id_tech": 7,
    "actiontime": 1800
  }
}
```

---

## Solution (ITILSolution)

### Ajouter une solution

```http
POST glpi.localhost/glpi/apirest.php/ITILSolution
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "items_id": 42,
    "itemtype": "Ticket",
    "content": "Remplacement du câble réseau défectueux.",
    "solutiontypes_id": 1
  }
}
```

---

## Acteurs (demandeurs, techniciens, groupes)

### Ajouter un technicien

```http
POST glpi.localhost/glpi/apirest.php/Ticket_User
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "tickets_id": 42,
    "users_id": 7,
    "type": 2
  }
}
```

> Types : `1` = Demandeur, `2` = Technicien, `3` = Observateur

### Ajouter un groupe technicien

```http
POST glpi.localhost/glpi/apirest.php/Group_Ticket
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "tickets_id": 42,
    "groups_id": 3,
    "type": 2
  }
}
```

---

## Lier un matériel à un ticket

```http
POST glpi.localhost/glpi/apirest.php/Item_Ticket
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "tickets_id": 42,
    "itemtype": "Computer",
    "items_id": 15
  }
}
```
