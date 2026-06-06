# 04 – Ordinateurs

## Vue d'ensemble

L'itemtype `Computer` représente les postes de travail, serveurs, laptops dans l'inventaire GLPI.

---

## Lister les ordinateurs

```http
GET glpi.localhost/glpi/apirest.php/Computer
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

Avec pagination :

```http
GET glpi.localhost/glpi/apirest.php/Computer?range=0-19&sort=name&order=ASC
```

---

## Lire un ordinateur

```http
GET glpi.localhost/glpi/apirest.php/Computer/<id>
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

### Réponse (extrait)

```json
{
  "id": 15,
  "name": "PC-BUREAU-012",
  "serial": "SN20240115",
  "otherserial": "INV-2024-015",
  "entities_id": 1,
  "locations_id": 4,
  "computertypes_id": 1,
  "operatingsystems_id": 3,
  "users_id": 5,
  "groups_id": 2,
  "states_id": 1,
  "is_deleted": 0,
  "date_mod": "2024-04-01 10:00:00"
}
```

---

## Créer un ordinateur

```http
POST glpi.localhost/glpi/apirest.php/Computer
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "name": "PC-COMPTA-007",
    "serial": "SN20240507",
    "otherserial": "INV-2024-107",
    "entities_id": 1,
    "locations_id": 5,
    "computertypes_id": 1,
    "users_id": 12,
    "states_id": 1
  }
}
```

---

## Modifier un ordinateur

```http
PUT glpi.localhost/glpi/apirest.php/Computer/<id>
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "users_id": 8,
    "locations_id": 6,
    "states_id": 3
  }
}
```

---

## Supprimer un ordinateur

```http
DELETE glpi.localhost/glpi/apirest.php/Computer/<id>
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

---

## Composants liés

### Processeurs

```http
GET glpi.localhost/glpi/apirest.php/Computer/<id>/Item_DeviceProcessor
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

### Mémoire RAM

```http
GET glpi.localhost/glpi/apirest.php/Computer/<id>/Item_DeviceMemory
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

### Disques durs

```http
GET glpi.localhost/glpi/apirest.php/Computer/<id>/Item_DeviceHardDrive
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

### Interfaces réseau

```http
GET glpi.localhost/glpi/apirest.php/Computer/<id>/NetworkPort
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

---

## Logiciels installés

```http
GET glpi.localhost/glpi/apirest.php/Computer/<id>/Item_SoftwareVersion
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

---

## Disques / Volumes

```http
GET glpi.localhost/glpi/apirest.php/Computer/<id>/ComputerDisk
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

---

## Associer un moniteur

```http
POST glpi.localhost/glpi/apirest.php/Computer_Item
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "computers_id": 15,
    "itemtype": "Monitor",
    "items_id": 8
  }
}
```

---

## Tickets liés

```http
GET glpi.localhost/glpi/apirest.php/Computer/<id>/Item_Ticket
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

---

## Import massif (tableau)

```http
POST glpi.localhost/glpi/apirest.php/Computer
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

[
  { "input": { "name": "PC-RH-001", "serial": "SN001", "entities_id": 1 } },
  { "input": { "name": "PC-RH-002", "serial": "SN002", "entities_id": 1 } }
]
```
