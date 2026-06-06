# 14 – Contrats

## Vue d'ensemble

L'itemtype `Contract` gère les contrats (maintenance, support, location, etc.) associés aux fournisseurs et aux matériels.

---

## Lister les contrats

```http
GET glpi.localhost/glpi/apirest.php/Contract
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

---

## Lire un contrat

```http
GET glpi.localhost/glpi/apirest.php/Contract/<id>
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

### Réponse (extrait)

```json
{
  "id": 6,
  "name": "Maintenance serveurs 2024",
  "num": "CTR-2024-006",
  "suppliers_id": 4,
  "entities_id": 1,
  "contracttypes_id": 1,
  "begin_date": "2024-01-01",
  "duration": 12,
  "notice": 60,
  "periodicity": 12,
  "billing": 12,
  "cost": 3600.00,
  "renewal": 1,
  "comment": "Contrat annuel renouvelable",
  "is_deleted": 0
}
```

### Champs clés

| Champ | Description |
|-------|-------------|
| `duration` | Durée en mois |
| `notice` | Préavis en jours |
| `renewal` | 0=Manuel, 1=Tacite reconduction |
| `periodicity` | Périodicité de facturation (mois) |

---

## Créer un contrat

```http
POST glpi.localhost/glpi/apirest.php/Contract
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "name": "Support imprimantes 2025",
    "num": "CTR-2025-001",
    "suppliers_id": 4,
    "entities_id": 1,
    "contracttypes_id": 2,
    "begin_date": "2025-01-01",
    "duration": 12,
    "notice": 30,
    "cost": 1200.00,
    "renewal": 1
  }
}
```

---

## Modifier un contrat

```http
PUT glpi.localhost/glpi/apirest.php/Contract/<id>
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "cost": 1500.00,
    "comment": "Avenant signé le 2025-06-01"
  }
}
```

---

## Supprimer un contrat

```http
DELETE glpi.localhost/glpi/apirest.php/Contract/<id>
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

---

## Types de contrats

```http
GET glpi.localhost/glpi/apirest.php/ContractType
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

---

## Matériels associés à un contrat

```http
GET glpi.localhost/glpi/apirest.php/Contract/<id>/Contract_Item
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

### Lier un matériel

```http
POST glpi.localhost/glpi/apirest.php/Contract_Item
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "contracts_id": 6,
    "items_id": 15,
    "itemtype": "Computer"
  }
}
```

---

## Coûts d'un contrat

```http
GET glpi.localhost/glpi/apirest.php/ContractCost?searchText[contracts_id]=6
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

### Ajouter un coût

```http
POST glpi.localhost/glpi/apirest.php/ContractCost
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "contracts_id": 6,
    "name": "Renouvellement 2025",
    "cost": 3800.00,
    "begin_date": "2025-01-01",
    "end_date": "2025-12-31",
    "entities_id": 1
  }
}
```

---

## Alertes d'échéance

GLPI envoie automatiquement des alertes avant l'expiration des contrats selon la configuration `notice`. Ces alertes sont configurables dans **Configuration → Notifications**.
