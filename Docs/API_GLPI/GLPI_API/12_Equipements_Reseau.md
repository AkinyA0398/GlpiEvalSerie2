# 12 – Équipements Réseau

## Vue d'ensemble

GLPI gère plusieurs types d'équipements réseau :

| Itemtype | Description |
|----------|-------------|
| `NetworkEquipment` | Switchs, routeurs, bornes Wi-Fi |
| `NetworkPort` | Ports réseau d'un équipement |
| `NetworkName` | Noms DNS associés |
| `IPAddress` | Adresses IP |
| `VLAN` | VLANs |

---

## NetworkEquipment – Équipements réseau

### Lister

```http
GET glpi.localhost/glpi/apirest.php/NetworkEquipment
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

### Lire

```http
GET glpi.localhost/glpi/apirest.php/NetworkEquipment/<id>
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

### Réponse (extrait)

```json
{
  "id": 5,
  "name": "SW-COEUR-01",
  "serial": "SWCISCO001",
  "entities_id": 1,
  "locations_id": 1,
  "networktypes_id": 2,
  "networkequipmentmodels_id": 3,
  "ram": 512,
  "states_id": 1,
  "users_id": 0,
  "groups_id": 4
}
```

### Créer

```http
POST glpi.localhost/glpi/apirest.php/NetworkEquipment
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "name": "SW-ACCUEIL-02",
    "serial": "SWCISCO002",
    "entities_id": 1,
    "locations_id": 2,
    "networktypes_id": 2,
    "states_id": 1
  }
}
```

---

## Ports réseau (NetworkPort)

### Lister les ports d'un équipement

```http
GET glpi.localhost/glpi/apirest.php/NetworkEquipment/<id>/NetworkPort
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

### Créer un port

```http
POST glpi.localhost/glpi/apirest.php/NetworkPort
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "items_id": 5,
    "itemtype": "NetworkEquipment",
    "name": "Gi0/1",
    "logical_number": 1,
    "instantiation_type": "NetworkPortEthernet",
    "speed": 1000,
    "mac": "AA:BB:CC:DD:EE:01"
  }
}
```

---

## Adresses IP

### Lire les IPs d'un port

```http
GET glpi.localhost/glpi/apirest.php/NetworkPort/<id>/NetworkName
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

### Ajouter une IP à un port

```http
POST glpi.localhost/glpi/apirest.php/IPAddress
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "items_id": <networkname_id>,
    "itemtype": "NetworkName",
    "name": "192.168.1.10",
    "version": 4
  }
}
```

---

## VLANs

### Lister les VLANs

```http
GET glpi.localhost/glpi/apirest.php/VLAN
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

### Créer un VLAN

```http
POST glpi.localhost/glpi/apirest.php/VLAN
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "name": "VLAN-COMPTA",
    "tag": 20,
    "comment": "VLAN comptabilité"
  }
}
```

### Associer un VLAN à un port

```http
POST glpi.localhost/glpi/apirest.php/NetworkPort_VLAN
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "networkports_id": <port_id>,
    "vlans_id": <vlan_id>,
    "tagged": 0
  }
}
```

---

## Connexion entre ports (NetworkPort_NetworkPort)

```http
POST glpi.localhost/glpi/apirest.php/NetworkPort_NetworkPort
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "networkports_id_1": 10,
    "networkports_id_2": 25
  }
}
```
