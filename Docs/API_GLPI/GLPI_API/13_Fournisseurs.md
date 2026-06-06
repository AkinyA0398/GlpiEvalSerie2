# 13 – Fournisseurs

## Vue d'ensemble

L'itemtype `Supplier` représente les fournisseurs et prestataires associés aux contrats, matériels et tickets.

---

## Lister les fournisseurs

```http
GET glpi.localhost/glpi/apirest.php/Supplier
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

---

## Lire un fournisseur

```http
GET glpi.localhost/glpi/apirest.php/Supplier/<id>
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

### Réponse

```json
{
  "id": 4,
  "name": "Tech Solutions SAS",
  "phonenumber": "0123456789",
  "fax": "",
  "website": "https://techsolutions.exemple.fr",
  "email": "contact@techsolutions.exemple.fr",
  "address": "15 avenue des Technopoles",
  "postcode": "06560",
  "town": "Valbonne",
  "country": "France",
  "suppliertypes_id": 1,
  "comment": "Fournisseur matériel informatique",
  "entities_id": 0,
  "is_recursive": 1
}
```

---

## Créer un fournisseur

```http
POST glpi.localhost/glpi/apirest.php/Supplier
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "name": "Immo Office Pro",
    "phonenumber": "0456789012",
    "email": "info@immo-office.fr",
    "website": "https://immo-office.fr",
    "address": "3 rue des Imprimeurs",
    "postcode": "13001",
    "town": "Marseille",
    "country": "France",
    "suppliertypes_id": 2,
    "entities_id": 0,
    "is_recursive": 1
  }
}
```

---

## Modifier un fournisseur

```http
PUT glpi.localhost/glpi/apirest.php/Supplier/<id>
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "phonenumber": "0498765432",
    "comment": "Nouveau contact : M. Durand"
  }
}
```

---

## Supprimer un fournisseur

```http
DELETE glpi.localhost/glpi/apirest.php/Supplier/<id>
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

---

## Types de fournisseurs

```http
GET glpi.localhost/glpi/apirest.php/SupplierType
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

```http
POST glpi.localhost/glpi/apirest.php/SupplierType
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "name": "Éditeur logiciel"
  }
}
```

---

## Contacts d'un fournisseur

```http
GET glpi.localhost/glpi/apirest.php/Supplier/<id>/Contact_Supplier
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

### Associer un contact

```http
POST glpi.localhost/glpi/apirest.php/Contact_Supplier
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "suppliers_id": 4,
    "contacts_id": 9
  }
}
```

---

## Contrats d'un fournisseur

```http
GET glpi.localhost/glpi/apirest.php/Contract?searchText[suppliers_id]=4
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

---

## Tickets liés à un fournisseur

```http
GET glpi.localhost/glpi/apirest.php/Supplier/<id>/Supplier_Ticket
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```
