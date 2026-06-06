# 11 – Licences

## Vue d'ensemble

`SoftwareLicense` représente les licences d'utilisation associées aux logiciels. Elle peut être affectée à des entités, des ordinateurs ou des utilisateurs.

---

## Lister les licences

```http
GET glpi.localhost/glpi/apirest.php/SoftwareLicense
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

---

## Lire une licence

```http
GET glpi.localhost/glpi/apirest.php/SoftwareLicense/<id>
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

### Réponse (extrait)

```json
{
  "id": 7,
  "name": "Office 2021 - Pack 20",
  "softwares_id": 10,
  "softwareversions_id_buy": 25,
  "softwareversions_id_use": 25,
  "entities_id": 1,
  "number": 20,
  "serial": "XXXXX-XXXXX-XXXXX",
  "softwarelicensetypes_id": 1,
  "expire": "2026-12-31",
  "is_valid": 1,
  "date_mod": "2024-01-01 00:00:00"
}
```

### Champs importants

| Champ | Description |
|-------|-------------|
| `number` | Nombre de postes autorisés (-1 = illimité) |
| `serial` | Clé de licence |
| `expire` | Date d'expiration |
| `softwarelicensetypes_id` | Type (OEM, Retail, Volume, etc.) |

---

## Créer une licence

```http
POST glpi.localhost/glpi/apirest.php/SoftwareLicense
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "name": "Acrobat Pro - 5 postes",
    "softwares_id": 12,
    "softwareversions_id_use": 30,
    "entities_id": 1,
    "number": 5,
    "serial": "ACRO-XXXX-YYYY",
    "expire": "2025-12-31",
    "softwarelicensetypes_id": 2
  }
}
```

---

## Modifier une licence

```http
PUT glpi.localhost/glpi/apirest.php/SoftwareLicense/<id>
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "number": 10,
    "expire": "2027-12-31"
  }
}
```

---

## Supprimer une licence

```http
DELETE glpi.localhost/glpi/apirest.php/SoftwareLicense/<id>
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

---

## Affectation d'une licence à un ordinateur

```http
POST glpi.localhost/glpi/apirest.php/Item_SoftwareLicense
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "softwarelicenses_id": 7,
    "items_id": 15,
    "itemtype": "Computer"
  }
}
```

---

## Licences affectées à un ordinateur

```http
GET glpi.localhost/glpi/apirest.php/Computer/<id>/Item_SoftwareLicense
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

---

## Types de licences

```http
GET glpi.localhost/glpi/apirest.php/SoftwareLicenseType
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

---

## Suivi de conformité

Pour vérifier la conformité, comparez `number` (sièges achetés) au nombre d'entrées `Item_SoftwareLicense` associées à cette licence.

```http
GET glpi.localhost/glpi/apirest.php/Item_SoftwareLicense?searchText[softwarelicenses_id]=7
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```
