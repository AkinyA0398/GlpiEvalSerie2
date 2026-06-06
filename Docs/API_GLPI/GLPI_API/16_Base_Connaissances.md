# 16 – Base de Connaissances

## Vue d'ensemble

L'itemtype `KnowbaseItem` représente les articles de la base de connaissances GLPI (FAQ, procédures, guides).

---

## Lister les articles

```http
GET glpi.localhost/glpi/apirest.php/KnowbaseItem
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

Avec recherche textuelle :

```http
GET glpi.localhost/glpi/apirest.php/KnowbaseItem?searchText[name]=mot+de+passe
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

---

## Lire un article

```http
GET glpi.localhost/glpi/apirest.php/KnowbaseItem/<id>
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

### Réponse

```json
{
  "id": 18,
  "name": "Comment réinitialiser son mot de passe",
  "answer": "<p>Pour réinitialiser votre mot de passe, rendez-vous sur...</p>",
  "is_faq": 1,
  "view": 142,
  "begin_date": null,
  "end_date": null,
  "users_id": 3,
  "date_mod": "2024-02-01 10:00:00",
  "date_creation": "2023-06-15 09:00:00"
}
```

### Champs importants

| Champ | Description |
|-------|-------------|
| `is_faq` | 1 = visible dans la FAQ publique |
| `view` | Nombre de consultations |
| `answer` | Contenu HTML de l'article |

---

## Créer un article

```http
POST glpi.localhost/glpi/apirest.php/KnowbaseItem
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "name": "Procédure de remplacement d'un écran",
    "answer": "<h2>Matériel nécessaire</h2><p>1 écran de remplacement, câble HDMI.</p><h2>Étapes</h2><ol><li>Éteindre le poste.</li><li>Déconnecter l'écran défectueux.</li></ol>",
    "is_faq": 0,
    "entities_id": 1,
    "is_recursive": 1
  }
}
```

---

## Modifier un article

```http
PUT glpi.localhost/glpi/apirest.php/KnowbaseItem/<id>
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "name": "Procédure de remplacement d'un écran (MAJ 2024)",
    "is_faq": 1
  }
}
```

---

## Supprimer un article

```http
DELETE glpi.localhost/glpi/apirest.php/KnowbaseItem/<id>
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

---

## Catégories de la base de connaissances

```http
GET glpi.localhost/glpi/apirest.php/KnowbaseItemCategory
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

```http
POST glpi.localhost/glpi/apirest.php/KnowbaseItemCategory
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "name": "Matériel",
    "knowbaseitemcategories_id": 0,
    "comment": "Articles liés au matériel informatique"
  }
}
```

### Associer un article à une catégorie

```http
POST glpi.localhost/glpi/apirest.php/KnowbaseItem_KnowbaseItemCategory
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "knowbaseitems_id": 18,
    "knowbaseitemcategories_id": 3
  }
}
```

---

## Lier un article à un ticket

```http
POST glpi.localhost/glpi/apirest.php/KnowbaseItem_Item
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "knowbaseitems_id": 18,
    "items_id": 42,
    "itemtype": "Ticket"
  }
}
```

---

## Articles d'un ticket

```http
GET glpi.localhost/glpi/apirest.php/Ticket/<id>/KnowbaseItem_Item
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

---

## Visibilité des articles

Les articles peuvent être restreints par entité. Les articles avec `is_faq = 1` sont visibles dans l'interface simplifiée des utilisateurs finaux.
