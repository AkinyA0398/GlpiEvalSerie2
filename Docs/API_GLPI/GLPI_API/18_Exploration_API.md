# 18 – Exploration et Introspection de l'API

## Vue d'ensemble

Ces endpoints permettent de découvrir dynamiquement les itemtypes disponibles, leurs champs, et les options de recherche — utile pour la documentation automatique et les clients génériques.

---

## Lister tous les itemtypes disponibles

```http
GET glpi.localhost/glpi/apirest.php/listSearchOptions
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

---

## Options de recherche d'un itemtype

```http
GET glpi.localhost/glpi/apirest.php/listSearchOptions/<itemtype>
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

### Exemple : champs de Ticket

```http
GET glpi.localhost/glpi/apirest.php/listSearchOptions/Ticket
```

### Réponse (extrait)

```json
{
  "1": {
    "name": "Titre",
    "table": "glpi_tickets",
    "field": "name",
    "datatype": "itemlink",
    "searchtype": ["contains", "notcontains", "equals", "notequals"]
  },
  "12": {
    "name": "Statut",
    "table": "glpi_tickets",
    "field": "status",
    "datatype": "specific",
    "searchtype": ["equals", "notequals"]
  },
  "5": {
    "name": "Technicien",
    "table": "glpi_users",
    "field": "name",
    "datatype": "dropdown",
    "searchtype": ["equals", "notequals", "contains"]
  }
}
```

> Les clés numériques sont les IDs à utiliser dans `criteria[n][field]` et `forcedisplay`.

---

## Informations sur l'API

```http
GET glpi.localhost/glpi/apirest.php/
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

### Réponse

```json
{
  "friendly_name": "GLPI REST API",
  "glpi_version": "10.0.9",
  "api_version": "1.0",
  "login_url": "glpi.localhost/glpi/apirest.php/initSession",
  "logout_url": "glpi.localhost/glpi/apirest.php/killSession",
  "user_url": "glpi.localhost/glpi/apirest.php/User"
}
```

---

## Lister les endpoints disponibles (sans session)

```http
GET glpi.localhost/glpi/apirest.php/
App-Token: <APP_TOKEN>
```

---

## Champs d'un itemtype

Obtenir tous les champs d'un enregistrement avec leurs valeurs :

```http
GET glpi.localhost/glpi/apirest.php/<itemtype>/<id>?get_hateoas=true
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

Le paramètre `get_hateoas=true` retourne aussi les **liens HATEOAS** vers les sous-ressources.

### Exemple

```http
GET glpi.localhost/glpi/apirest.php/Computer/15?get_hateoas=true
```

```json
{
  "id": 15,
  "name": "PC-BUREAU-012",
  "links": [
    { "rel": "NetworkPort", "href": "glpi.localhost/glpi/apirest.php/Computer/15/NetworkPort" },
    { "rel": "Item_SoftwareVersion", "href": "glpi.localhost/glpi/apirest.php/Computer/15/Item_SoftwareVersion" },
    { "rel": "Document_Item", "href": "glpi.localhost/glpi/apirest.php/Computer/15/Document_Item" }
  ]
}
```

---

## Sous-ressources (relations)

Toutes les sous-ressources d'un objet sont accessibles via :

```http
GET glpi.localhost/glpi/apirest.php/<itemtype>/<id>/<SubItemtype>
```

Exemples :

```
GET glpi.localhost/glpi/apirest.php/Ticket/42/ITILFollowup
GET glpi.localhost/glpi/apirest.php/Ticket/42/TicketTask
GET glpi.localhost/glpi/apirest.php/Ticket/42/ITILSolution
GET glpi.localhost/glpi/apirest.php/Computer/15/NetworkPort
GET glpi.localhost/glpi/apirest.php/User/5/Group_User
```

---

## Formats de réponse

| Paramètre | Effet |
|-----------|-------|
| `expand_dropdowns=true` | Résout les IDs en libellés |
| `get_hateoas=true` | Ajoute les liens vers sous-ressources |
| `only_id=true` | Retourne uniquement les IDs |
| `with_infocoms=true` | Inclut les informations financières |
| `with_networkports=true` | Inclut les ports réseau |
| `with_softwares=true` | Inclut les logiciels (Computer uniquement) |

### Exemple combiné

```http
GET glpi.localhost/glpi/apirest.php/Computer/15?expand_dropdowns=true&with_softwares=true&with_networkports=true
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

---

## Opérations en masse

### Modifier plusieurs objets

```http
PUT glpi.localhost/glpi/apirest.php/Computer
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

[
  { "id": 15, "input": { "states_id": 3 } },
  { "id": 16, "input": { "states_id": 3 } },
  { "id": 17, "input": { "states_id": 3 } }
]
```

### Supprimer plusieurs objets

```http
DELETE glpi.localhost/glpi/apirest.php/Computer
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

[{ "id": 20 }, { "id": 21 }]
```

---

## Gestion des erreurs

| Code | Erreur type |
|------|-------------|
| 400 | `ERROR_JSON_PAYLOAD_INVALID` |
| 401 | `ERROR_SESSION_TOKEN_INVALID` |
| 403 | `ERROR_RIGHT_MISSING` |
| 404 | `ERROR_ITEM_NOT_FOUND` |
| 405 | `ERROR_NOT_ALLOWED_METHOD` |

### Exemple de réponse d'erreur

```json
[
  "ERROR_RIGHT_MISSING",
  "You don't have write rights on Tickets"
]
```

---

## Bonnes pratiques générales

1. **Toujours clore la session** avec `killSession` en fin de script.
2. **Paginer les résultats** : ne jamais supposer que tous les objets tiennent dans la réponse initiale.
3. **Utiliser `expand_dropdowns`** pour obtenir des libellés lisibles plutôt que des IDs.
4. **Traiter les erreurs** : vérifier le code HTTP avant d'utiliser la réponse.
5. **Limiter les champs** avec `forcedisplay` pour réduire la taille des réponses.
6. **Rate limiting** : GLPI ne limite pas par défaut mais votre infrastructure peut le faire.
