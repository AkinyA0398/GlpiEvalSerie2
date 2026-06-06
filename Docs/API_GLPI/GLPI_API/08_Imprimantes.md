# 08 – Imprimantes

## Vue d'ensemble

L'itemtype `Printer` gère l'inventaire des imprimantes et périphériques d'impression.

---

## Lister les imprimantes

```http
GET glpi.localhost/glpi/apirest.php/Printer
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

---

## Lire une imprimante

```http
GET glpi.localhost/glpi/apirest.php/Printer/<id>
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

### Réponse (extrait)

```json
{
  "id": 8,
  "name": "IMP-ACCUEIL-01",
  "serial": "SHP20240101",
  "otherserial": "INV-IMP-001",
  "entities_id": 1,
  "locations_id": 2,
  "printertypes_id": 1,
  "users_id": 0,
  "groups_id": 2,
  "states_id": 1,
  "have_usb": 0,
  "have_ethernet": 1,
  "have_wifi": 1,
  "memory_size": 256,
  "is_deleted": 0
}
```

---

## Créer une imprimante

```http
POST glpi.localhost/glpi/apirest.php/Printer
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "name": "IMP-RH-02",
    "serial": "SHP20240202",
    "entities_id": 1,
    "locations_id": 3,
    "have_ethernet": 1,
    "have_wifi": 0,
    "states_id": 1
  }
}
```

---

## Modifier une imprimante

```http
PUT glpi.localhost/glpi/apirest.php/Printer/<id>
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "locations_id": 5,
    "states_id": 3
  }
}
```

---

## Supprimer une imprimante

```http
DELETE glpi.localhost/glpi/apirest.php/Printer/<id>
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

---

## Ports réseau d'une imprimante

```http
GET glpi.localhost/glpi/apirest.php/Printer/<id>/NetworkPort
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

---

## Tickets liés

```http
GET glpi.localhost/glpi/apirest.php/Printer/<id>/Item_Ticket
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

---

## Cartouches et consommables

### Lister les cartouches (Cartridge)

```http
GET glpi.localhost/glpi/apirest.php/Cartridge?searchText[printers_id]=8
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

### Ajouter une cartouche

```http
POST glpi.localhost/glpi/apirest.php/Cartridge
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "cartridgeitems_id": 2,
    "printers_id": 8,
    "date_use": "2024-04-15"
  }
}
```

---

## Connexion à un ordinateur

```http
POST glpi.localhost/glpi/apirest.php/Computer_Item
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "computers_id": 15,
    "itemtype": "Printer",
    "items_id": 8
  }
}
```
