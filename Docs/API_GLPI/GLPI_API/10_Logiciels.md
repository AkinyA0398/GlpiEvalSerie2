# 10 – Logiciels

## Vue d'ensemble

GLPI distingue le **logiciel** (`Software`) de sa **version** (`SoftwareVersion`) et de la **licence** (`SoftwareLicense`). L'installation sur un poste est représentée par `Item_SoftwareVersion`.

---

## Lister les logiciels

```http
GET glpi.localhost/glpi/apirest.php/Software
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

---

## Lire un logiciel

```http
GET glpi.localhost/glpi/apirest.php/Software/<id>
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

### Réponse

```json
{
  "id": 10,
  "name": "Microsoft Office",
  "comment": "Suite bureautique",
  "entities_id": 1,
  "softwares_id": 0,
  "softwarecategories_id": 2,
  "is_valid": 1,
  "date_mod": "2024-01-01 00:00:00"
}
```

---

## Créer un logiciel

```http
POST glpi.localhost/glpi/apirest.php/Software
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "name": "Adobe Acrobat Pro",
    "entities_id": 1,
    "softwarecategories_id": 3,
    "comment": "Éditeur PDF"
  }
}
```

---

## Versions d'un logiciel

### Lister

```http
GET glpi.localhost/glpi/apirest.php/SoftwareVersion?searchText[softwares_id]=10
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

### Créer une version

```http
POST glpi.localhost/glpi/apirest.php/SoftwareVersion
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "softwares_id": 10,
    "name": "2021",
    "arch": "x86_64",
    "operatingsystems_id": 3,
    "states_id": 1
  }
}
```

---

## Installations (Item_SoftwareVersion)

### Lister les postes avec un logiciel

```http
GET glpi.localhost/glpi/apirest.php/Item_SoftwareVersion?searchText[softwareversions_id]=25
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

### Logiciels d'un ordinateur

```http
GET glpi.localhost/glpi/apirest.php/Computer/<id>/Item_SoftwareVersion
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

### Enregistrer une installation

```http
POST glpi.localhost/glpi/apirest.php/Item_SoftwareVersion
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "items_id": 15,
    "itemtype": "Computer",
    "softwareversions_id": 25
  }
}
```

### Supprimer une installation

```http
DELETE glpi.localhost/glpi/apirest.php/Item_SoftwareVersion/<id>
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

---

## Catégories de logiciels

```http
GET glpi.localhost/glpi/apirest.php/SoftwareCategory
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

```http
POST glpi.localhost/glpi/apirest.php/SoftwareCategory
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "name": "Sécurité",
    "comment": "Antivirus, pare-feu, etc."
  }
}
```
