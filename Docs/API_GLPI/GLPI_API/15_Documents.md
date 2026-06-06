# 15 – Documents

## Vue d'ensemble

L'itemtype `Document` permet de stocker et associer des fichiers (PDF, images, etc.) à n'importe quel objet GLPI.

---

## Lister les documents

```http
GET glpi.localhost/glpi/apirest.php/Document
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

---

## Lire un document

```http
GET glpi.localhost/glpi/apirest.php/Document/<id>
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

### Réponse

```json
{
  "id": 14,
  "name": "Bon de livraison imprimante",
  "filename": "bl_imprimante_2024.pdf",
  "mime": "application/pdf",
  "sha1sum": "abc123...",
  "entities_id": 1,
  "documentcategories_id": 2,
  "comment": "BL reçu le 2024-03-15",
  "date_mod": "2024-03-15 14:00:00",
  "link": ""
}
```

---

## Uploader un document

L'upload de fichier se fait en **multipart/form-data** :

```bash
curl -X POST "glpi.localhost/glpi/apirest.php/Document" \
  -H "Session-Token: <SESSION_TOKEN>" \
  -H "App-Token: <APP_TOKEN>" \
  -F "uploadManifest={\"input\":{\"name\":\"Bon de livraison\",\"entities_id\":1,\"documentcategories_id\":2}};type=application/json" \
  -F "filename[]=@/chemin/vers/fichier.pdf"
```

### Réponse

```json
{
  "id": 15,
  "message": "Item successfully added: Document 15",
  "upload_result": {
    "filename[0]": {
      "name": "fichier.pdf",
      "size": 102400,
      "type": "application/pdf"
    }
  }
}
```

---

## Créer un document (lien URL)

```http
POST glpi.localhost/glpi/apirest.php/Document
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "name": "Documentation constructeur",
    "link": "https://constructeur.exemple.com/doc.pdf",
    "entities_id": 1,
    "documentcategories_id": 1
  }
}
```

---

## Modifier un document

```http
PUT glpi.localhost/glpi/apirest.php/Document/<id>
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "name": "BL imprimante v2",
    "comment": "Version corrigée"
  }
}
```

---

## Supprimer un document

```http
DELETE glpi.localhost/glpi/apirest.php/Document/<id>
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

---

## Associer un document à un objet

```http
POST glpi.localhost/glpi/apirest.php/Document_Item
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "documents_id": 14,
    "items_id": 8,
    "itemtype": "Printer"
  }
}
```

### Types d'objets compatibles

Pratiquement tous les itemtypes GLPI acceptent des documents : `Computer`, `Printer`, `Monitor`, `Ticket`, `Contract`, `Supplier`, etc.

---

## Documents d'un ticket

```http
GET glpi.localhost/glpi/apirest.php/Ticket/<id>/Document_Item
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

---

## Catégories de documents

```http
GET glpi.localhost/glpi/apirest.php/DocumentCategory
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

```http
POST glpi.localhost/glpi/apirest.php/DocumentCategory
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "name": "Factures",
    "comment": "Documents de facturation"
  }
}
```

---

## Télécharger un fichier

```http
GET glpi.localhost/glpi/apirest.php/Document/<id>?alt=media
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

> Retourne le binaire du fichier avec le `Content-Type` approprié.
