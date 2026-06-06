# 06 – Groupes

## Vue d'ensemble

Les groupes permettent de regrouper des utilisateurs pour l'attribution de tickets, la gestion des droits et l'organisation des équipes.

---

## Lister les groupes

```http
GET glpi.localhost/glpi/apirest.php/Group
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

---

## Lire un groupe

```http
GET glpi.localhost/glpi/apirest.php/Group/<id>
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

### Réponse

```json
{
  "id": 3,
  "name": "Support Niveau 2",
  "completename": "Support Niveau 2",
  "comment": "Équipe réseau et infrastructure",
  "entities_id": 1,
  "is_requester": 0,
  "is_assign": 1,
  "is_notify": 1,
  "is_itemgroup": 0,
  "is_usergroup": 1
}
```

### Champs importants

| Champ | Description |
|-------|-------------|
| `is_requester` | Peut être demandeur d'un ticket |
| `is_assign` | Peut être technicien assigné |
| `is_notify` | Reçoit des notifications |
| `is_itemgroup` | Groupe de matériels |
| `is_usergroup` | Groupe d'utilisateurs |

---

## Créer un groupe

```http
POST glpi.localhost/glpi/apirest.php/Group
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "name": "Support Réseau",
    "comment": "Équipe réseau",
    "entities_id": 1,
    "is_assign": 1,
    "is_requester": 0,
    "is_usergroup": 1
  }
}
```

---

## Modifier un groupe

```http
PUT glpi.localhost/glpi/apirest.php/Group/<id>
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "comment": "Équipe réseau et sécurité"
  }
}
```

---

## Supprimer un groupe

```http
DELETE glpi.localhost/glpi/apirest.php/Group/<id>
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

---

## Membres d'un groupe

```http
GET glpi.localhost/glpi/apirest.php/Group/<id>/Group_User
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

### Ajouter un membre

```http
POST glpi.localhost/glpi/apirest.php/Group_User
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "groups_id": 3,
    "users_id": 7,
    "is_manager": 0,
    "is_userdelegate": 0
  }
}
```

### Retirer un membre

```http
DELETE glpi.localhost/glpi/apirest.php/Group_User/<id>
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

---

## Groupes d'un utilisateur

```http
GET glpi.localhost/glpi/apirest.php/User/<id>/Group_User
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```
