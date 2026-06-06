# 09 – Moniteurs

## Vue d'ensemble

L'itemtype `Monitor` gère l'inventaire des écrans et moniteurs.

---

## Lister les moniteurs

```http
GET glpi.localhost/glpi/apirest.php/Monitor
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

---

## Lire un moniteur

```http
GET glpi.localhost/glpi/apirest.php/Monitor/<id>
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

### Réponse (extrait)

```json
{
  "id": 22,
  "name": "ECRAN-BUREAU-012",
  "serial": "SNM20240112",
  "otherserial": "INV-MON-022",
  "entities_id": 1,
  "locations_id": 4,
  "monitortypes_id": 1,
  "monitormodels_id": 5,
  "users_id": 5,
  "states_id": 1,
  "size": "24",
  "have_micro": 0,
  "have_speaker": 0,
  "have_subd": 0,
  "have_bnc": 0,
  "have_dvi": 1,
  "have_hdmi": 1,
  "have_displayport": 1,
  "is_deleted": 0
}
```

### Connectiques disponibles

| Champ | Description |
|-------|-------------|
| `have_hdmi` | Port HDMI |
| `have_dvi` | Port DVI |
| `have_displayport` | DisplayPort |
| `have_subd` | VGA (Sub-D 15) |
| `have_bnc` | BNC |
| `have_micro` | Microphone intégré |
| `have_speaker` | Haut-parleurs intégrés |

---

## Créer un moniteur

```http
POST glpi.localhost/glpi/apirest.php/Monitor
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "name": "ECRAN-COMPTA-007",
    "serial": "SNM20240507",
    "entities_id": 1,
    "locations_id": 5,
    "size": "27",
    "have_hdmi": 1,
    "have_displayport": 1,
    "states_id": 1,
    "users_id": 12
  }
}
```

---

## Modifier un moniteur

```http
PUT glpi.localhost/glpi/apirest.php/Monitor/<id>
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "users_id": 9,
    "locations_id": 7
  }
}
```

---

## Supprimer un moniteur

```http
DELETE glpi.localhost/glpi/apirest.php/Monitor/<id>
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

---

## Associer à un ordinateur

```http
POST glpi.localhost/glpi/apirest.php/Computer_Item
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "computers_id": 15,
    "itemtype": "Monitor",
    "items_id": 22
  }
}
```

---

## Tickets liés

```http
GET glpi.localhost/glpi/apirest.php/Monitor/<id>/Item_Ticket
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```
