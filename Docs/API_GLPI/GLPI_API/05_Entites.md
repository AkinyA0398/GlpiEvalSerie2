# 05 – Entités

## Vue d'ensemble

Les entités structurent hiérarchiquement l'organisation dans GLPI (société mère, filiales, sites, services…).

---

## Lister les entités

```http
GET glpi.localhost/glpi/apirest.php/Entity
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

---

## Lire une entité

```http
GET glpi.localhost/glpi/apirest.php/Entity/<id>
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

### Réponse (extrait)

```json
{
  "id": 2,
  "name": "Siège Social",
  "entities_id": 0,
  "completename": "Entité racine > Siège Social",
  "comment": "Bureau principal",
  "level": 1,
  "address": "10 rue de la Paix",
  "postcode": "75001",
  "town": "Paris",
  "country": "France",
  "email": "contact@exemple.fr",
  "phone": "0100000001"
}
```

---

## Créer une entité

```http
POST glpi.localhost/glpi/apirest.php/Entity
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "name": "Agence Lyon",
    "entities_id": 0,
    "address": "5 place Bellecour",
    "postcode": "69002",
    "town": "Lyon",
    "country": "France",
    "email": "lyon@exemple.fr"
  }
}
```

---

## Modifier une entité

```http
PUT glpi.localhost/glpi/apirest.php/Entity/<id>
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "phone": "0400000002",
    "comment": "Agence principale Sud"
  }
}
```

---

## Supprimer une entité

```http
DELETE glpi.localhost/glpi/apirest.php/Entity/<id>
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

> ⚠️ Une entité ne peut être supprimée que si elle ne contient plus d'éléments enfants.

---

## Sous-entités

```http
GET glpi.localhost/glpi/apirest.php/Entity?searchText[entities_id]=2
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

---

## Entités accessibles à l'utilisateur courant

```http
GET glpi.localhost/glpi/apirest.php/getMyEntities
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

---

## Changer l'entité active de la session

```http
POST glpi.localhost/glpi/apirest.php/changeActiveEntities
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "entities_id": 3,
  "is_recursive": true
}
```

---

## Règles d'affectation automatique

Les entités peuvent avoir des règles GLPI associées (non directement gérables via REST) qui affectent automatiquement les équipements ou tickets selon des critères.

---

## Paramètres avancés

| Champ | Description |
|-------|-------------|
| `entities_id` | ID de l'entité parente (0 = racine) |
| `level` | Profondeur dans la hiérarchie (auto-calculé) |
| `completename` | Nom complet avec chemin hiérarchique |
| `is_recursive` | Héritage récursif des sous-entités |
