# 17 – Recherche

## Vue d'ensemble

L'endpoint `/search/<itemtype>` offre une recherche avancée multi-critères, équivalente à la recherche de l'interface GLPI.

---

## Syntaxe générale

```http
GET glpi.localhost/glpi/apirest.php/search/<itemtype>?criteria[0][field]=<n>&criteria[0][searchtype]=<type>&criteria[0][value]=<valeur>
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

---

## Paramètres principaux

| Paramètre | Description |
|-----------|-------------|
| `criteria` | Tableau de critères de filtrage |
| `metacriteria` | Critères sur des itemtypes liés |
| `sort` | Numéro du champ de tri |
| `order` | `ASC` ou `DESC` |
| `range` | Ex: `0-49` |
| `forcedisplay` | Tableau des IDs de champs à retourner |
| `rawdata` | `true` = données brutes sans traduction |
| `withindexes` | `true` = inclut les IDs dans les résultats |

---

## Types de recherche (searchtype)

| Valeur | Opérateur |
|--------|-----------|
| `contains` | Contient |
| `notcontains` | Ne contient pas |
| `equals` | Égal à |
| `notequals` | Différent de |
| `lessthan` | Inférieur à |
| `morethan` | Supérieur à |
| `under` | Sous (hiérarchie) |
| `notunder` | Pas sous (hiérarchie) |

---

## Exemples pratiques

### Tickets ouverts assignés à un technicien

```http
GET glpi.localhost/glpi/apirest.php/search/Ticket
  ?criteria[0][field]=12&criteria[0][searchtype]=equals&criteria[0][value]=2
  &criteria[1][link]=AND&criteria[1][field]=5&criteria[1][searchtype]=equals&criteria[1][value]=7
  &range=0-49
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

> field 12 = statut, field 5 = technicien assigné

### Ordinateurs d'un utilisateur

```http
GET glpi.localhost/glpi/apirest.php/search/Computer
  ?criteria[0][field]=70&criteria[0][searchtype]=equals&criteria[0][value]=5
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

### Licences expirant dans 90 jours

```http
GET glpi.localhost/glpi/apirest.php/search/SoftwareLicense
  ?criteria[0][field]=11&criteria[0][searchtype]=lessthan&criteria[0][value]=+90DAY
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

### Équipements réseau par entité

```http
GET glpi.localhost/glpi/apirest.php/search/NetworkEquipment
  ?criteria[0][field]=80&criteria[0][searchtype]=under&criteria[0][value]=2
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

---

## Choisir les champs retournés

```http
GET glpi.localhost/glpi/apirest.php/search/Computer
  ?forcedisplay[0]=1
  &forcedisplay[1]=4
  &forcedisplay[2]=23
  &forcedisplay[3]=31
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

> Les IDs de champs sont disponibles via `/listSearchOptions/<itemtype>` (voir section 18).

---

## Critères liés (metacriteria)

Recherche de tickets contenant un ordinateur d'une entité donnée :

```http
GET glpi.localhost/glpi/apirest.php/search/Ticket
  ?metacriteria[0][link]=AND
  &metacriteria[0][itemtype]=Computer
  &metacriteria[0][field]=80
  &metacriteria[0][searchtype]=equals
  &metacriteria[0][value]=1
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

---

## Réponse type

```json
{
  "totalcount": 247,
  "count": 50,
  "sort": 1,
  "order": "ASC",
  "data": [
    {
      "1": "PC-BUREAU-001",
      "4": "SN20240101",
      "23": "Salle serveur",
      "31": "En service"
    }
  ],
  "content-range": "0-49/247"
}
```

---

## Opérateurs logiques entre critères

| Valeur `link` | Description |
|--------------|-------------|
| `AND` | ET logique |
| `OR` | OU logique |
| `AND NOT` | ET NON |
| `OR NOT` | OU NON |

---

## Pagination

```http
GET glpi.localhost/glpi/apirest.php/search/Ticket?range=50-99
```

L'en-tête de réponse `Content-Range` indique le total : `Content-Range: 50-99/247`.
